<?php
/**
 * /api/criteria/*  dan  /api/ahp  — kriteria & matriks perbandingan berpasangan.
 *
 * Catatan penting:
 * Bobot kriteria TIDAK disimpan di basis data. Bobot selalu diturunkan dari
 * matriks perbandingan berpasangan lewat rata-rata geometrik (AHP autentik,
 * lihat PPT slide 5). Basis data hanya menyimpan matriksnya; perhitungan
 * bobot dilakukan oleh src/core/ahp.ts agar logika tetap satu sumber.
 *
 * Hak akses: baca = semua peran, tulis = admin saja.
 */

declare(strict_types=1);

/** @var array $segments */

$method   = Request::method();
$resource = $segments[0];
$id       = isset($segments[1]) && ctype_digit($segments[1]) ? (int) $segments[1] : null;

/** Kriteria + segitiga atas matriks, siap dikonsumsi frontend. */
function criteriaPayload(): array
{
    $criteria = Database::run('SELECT * FROM criteria ORDER BY position, id')->fetchAll();

    $pairs = Database::run(
        'SELECT r.code AS row_code, c.code AS col_code, a.value
           FROM ahp_comparisons a
           JOIN criteria r ON r.id = a.row_criteria_id
           JOIN criteria c ON c.id = a.col_criteria_id'
    )->fetchAll();

    $matrix = [];
    foreach ($pairs as $p) {
        $matrix[$p['row_code']][$p['col_code']] = (float) $p['value'];
    }

    return [
        'criteria' => array_map(fn($c) => [
            'id'       => (int) $c['id'],
            'code'     => $c['code'],
            'name'     => $c['name'],
            'unit'     => $c['unit'],
            'type'     => $c['type'],
            'minValue' => (float) $c['min_value'],
            'maxValue' => (float) $c['max_value'],
            'position' => (int) $c['position'],
        ], $criteria),
        // { C1: { C2: 1, C3: 5, ... }, ... } — hanya pasangan segitiga atas.
        'comparisons' => $matrix,
    ];
}

// ── GET /criteria — dibutuhkan semua peran untuk menghitung skor ──────
if ($resource === 'criteria' && $method === 'GET') {
    Auth::require();
    Response::json(criteriaPayload());
}

// ── POST /criteria — tambah kriteria (admin) ──────────────────────────
if ($resource === 'criteria' && $method === 'POST' && $id === null) {
    Auth::requireRole('admin');

    $name = Request::str('name', 'Kriteria Baru');
    $unit = Request::str('unit');
    $type = Request::str('type', 'cost');
    $min  = Request::input('minValue', 0);
    $max  = Request::input('maxValue', 1000);

    $fields = [];
    if (mb_strlen($name) < 2)                      $fields['name'] = 'Nama kriteria minimal 2 karakter.';
    if (!in_array($type, ['cost', 'benefit'], true)) $fields['type'] = 'Tipe harus cost atau benefit.';
    if (!is_numeric($min) || !is_numeric($max))    $fields['minValue'] = 'Rentang nilai harus berupa angka.';
    elseif ((float) $min >= (float) $max)          $fields['minValue'] = 'Nilai minimum harus lebih kecil dari maksimum.';
    if ($fields) Response::invalid($fields);

    $pdo = Database::conn();
    $pdo->beginTransaction();
    try {
        $next = (int) $pdo->query(
            'SELECT COALESCE(MAX(CAST(SUBSTRING(code, 2) AS UNSIGNED)), 0) + 1 FROM criteria FOR UPDATE'
        )->fetchColumn();
        $code = 'C' . $next;
        $pos  = (int) $pdo->query('SELECT COALESCE(MAX(position), 0) + 1 FROM criteria')->fetchColumn();

        Database::run(
            'INSERT INTO criteria (code, name, unit, type, min_value, max_value, position)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$code, $name, $unit, $type, (float) $min, (float) $max, $pos]
        );
        $newId = (int) $pdo->lastInsertId();

        // Kriteria baru dibandingkan "sama penting" (1) dengan seluruh kriteria lain,
        // sehingga matriks tetap lengkap & konsisten sampai admin mengubahnya.
        $others = Database::run('SELECT id FROM criteria WHERE id <> ? ORDER BY position, id', [$newId])->fetchAll();
        foreach ($others as $o) {
            Database::run(
                'INSERT INTO ahp_comparisons (row_criteria_id, col_criteria_id, value) VALUES (?, ?, 1)',
                [(int) $o['id'], $newId]
            );
        }

        // Pasien lama belum punya nilai untuk kriteria ini — isi dengan minimum
        // agar matriks keputusan tidak berlubang (nilai 0 akan membagi nol di SAW).
        Database::run(
            'INSERT INTO patient_values (patient_id, criteria_id, value)
             SELECT p.id, ?, ? FROM patients p',
            [$newId, (float) $min]
        );

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    Response::json(criteriaPayload(), 201);
}

// ── PUT /criteria/{id} — ubah metadata (admin) ────────────────────────
if ($resource === 'criteria' && $method === 'PUT' && $id !== null) {
    Auth::requireRole('admin');

    $c = Database::run('SELECT * FROM criteria WHERE id = ?', [$id])->fetch();
    if (!$c) Response::error('Kriteria tidak ditemukan.', 404);

    $name = Request::str('name', $c['name']);
    $unit = Request::str('unit', $c['unit']);
    $type = Request::str('type', $c['type']);
    $min  = Request::input('minValue', $c['min_value']);
    $max  = Request::input('maxValue', $c['max_value']);

    $fields = [];
    if (mb_strlen($name) < 2)                        $fields['name'] = 'Nama kriteria minimal 2 karakter.';
    if (!in_array($type, ['cost', 'benefit'], true)) $fields['type'] = 'Tipe harus cost atau benefit.';
    if (!is_numeric($min) || !is_numeric($max))      $fields['minValue'] = 'Rentang nilai harus berupa angka.';
    elseif ((float) $min >= (float) $max)            $fields['minValue'] = 'Nilai minimum harus lebih kecil dari maksimum.';
    if ($fields) Response::invalid($fields);

    Database::run(
        'UPDATE criteria SET name = ?, unit = ?, type = ?, min_value = ?, max_value = ? WHERE id = ?',
        [$name, $unit, $type, (float) $min, (float) $max, $id]
    );

    Response::json(criteriaPayload());
}

// ── DELETE /criteria/{id} — hapus kriteria (admin) ────────────────────
if ($resource === 'criteria' && $method === 'DELETE' && $id !== null) {
    Auth::requireRole('admin');

    $c = Database::run('SELECT id FROM criteria WHERE id = ?', [$id])->fetch();
    if (!$c) Response::error('Kriteria tidak ditemukan.', 404);

    $count = (int) Database::run('SELECT COUNT(*) FROM criteria')->fetchColumn();
    if ($count <= 2) {
        Response::error('Minimal 2 kriteria harus tersisa untuk perhitungan AHP.', 422);
    }

    // ahp_comparisons & patient_values ikut terhapus lewat ON DELETE CASCADE.
    Database::run('DELETE FROM criteria WHERE id = ?', [$id]);
    Response::json(criteriaPayload());
}

// ── PUT /ahp — simpan satu sel segitiga atas (admin) ──────────────────
if ($resource === 'ahp' && $method === 'PUT') {
    Auth::requireRole('admin');

    $rowCode = Request::str('row');
    $colCode = Request::str('col');
    $value   = Request::input('value');

    if (!is_numeric($value) || (float) $value <= 0) {
        Response::invalid(['value' => 'Nilai perbandingan harus angka positif.']);
    }
    if ($rowCode === $colCode) {
        Response::error('Diagonal matriks selalu bernilai 1 dan tidak dapat diubah.', 422);
    }

    $row = Database::run('SELECT id, position FROM criteria WHERE code = ?', [$rowCode])->fetch();
    $col = Database::run('SELECT id, position FROM criteria WHERE code = ?', [$colCode])->fetch();
    if (!$row || !$col) {
        Response::error('Kriteria pada perbandingan tidak ditemukan.', 404);
    }

    // Hanya segitiga atas yang disimpan; segitiga bawah adalah resiprokal
    // yang dihitung saat matriks disusun ulang.
    if ((int) $row['position'] > (int) $col['position']) {
        [$row, $col] = [$col, $row];
        $value = 1 / (float) $value;
    }

    Database::run(
        'INSERT INTO ahp_comparisons (row_criteria_id, col_criteria_id, value) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)',
        [(int) $row['id'], (int) $col['id'], (float) $value]
    );

    Response::json(criteriaPayload());
}

Response::error("Metode {$method} tidak didukung untuk endpoint '{$resource}'.", 405);
