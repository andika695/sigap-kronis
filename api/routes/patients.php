<?php
/**
 * /api/patients/*  — CRUD pasien, riwayat tindak lanjut.
 *
 * Hak akses (ditegakkan di server):
 *   kader  : lihat + tambah pasien
 *   dokter : lihat + catatan tindak lanjut + tandai ditindaklanjuti
 *   admin  : seluruhnya (termasuk ubah & hapus)
 */

declare(strict_types=1);

/** @var array $segments */

$method = Request::method();
$id     = isset($segments[1]) && ctype_digit($segments[1]) ? (int) $segments[1] : null;
$sub    = $segments[2] ?? '';

/** Ambil daftar kriteria terurut (dipakai untuk validasi & bentuk output). */
function criteriaList(): array
{
    return Database::run('SELECT * FROM criteria ORDER BY position, id')->fetchAll();
}

/** Satu pasien lengkap dengan nilai kriteria + riwayat tindak lanjut. */
function patientRow(array $p): array
{
    $values = Database::run(
        'SELECT c.code, pv.value
           FROM patient_values pv
           JOIN criteria c ON c.id = pv.criteria_id
          WHERE pv.patient_id = ?',
        [$p['id']]
    )->fetchAll();

    $map = [];
    foreach ($values as $v) {
        $map[$v['code']] = (float) $v['value'];
    }

    $fus = Database::run(
        'SELECT id, author, role, note, created_at
           FROM follow_ups WHERE patient_id = ? ORDER BY created_at ASC, id ASC',
        [$p['id']]
    )->fetchAll();

    return [
        'id'            => (int) $p['id'],
        'code'          => $p['code'],
        'name'          => $p['name'],
        'values'        => $map,
        'tindaklanjuti' => (bool) $p['tindaklanjuti'],
        'prevSaw'       => $p['prev_saw']    !== null ? (float) $p['prev_saw']    : null,
        'prevTopsis'    => $p['prev_topsis'] !== null ? (float) $p['prev_topsis'] : null,
        'followUps'     => array_map(fn($f) => [
            'id'     => (int) $f['id'],
            'author' => $f['author'],
            'role'   => $f['role'],
            'note'   => $f['note'],
            'date'   => $f['created_at'],
        ], $fus),
    ];
}

/**
 * Validasi payload nilai kriteria terhadap rentang min/max di tabel criteria.
 * Mengembalikan [criteria_id => value].
 */
function validateValues(array $criteria, mixed $input): array
{
    if (!is_array($input)) {
        Response::invalid(['values' => 'Nilai kriteria wajib dikirim sebagai objek.']);
    }

    $fields = [];
    $out    = [];

    foreach ($criteria as $c) {
        $code = $c['code'];
        $raw  = $input[$code] ?? null;

        if ($raw === null || $raw === '') {
            $fields[$code] = "{$c['name']} wajib diisi.";
            continue;
        }
        if (!is_numeric($raw)) {
            $fields[$code] = "{$c['name']} harus berupa angka.";
            continue;
        }

        $val = (float) $raw;
        $min = (float) $c['min_value'];
        $max = (float) $c['max_value'];

        if ($val < $min || $val > $max) {
            $unit = $c['unit'] !== '' ? " {$c['unit']}" : '';
            $fields[$code] = sprintf('%s: %s–%s%s', $c['name'], rtrim(rtrim(number_format($min, 2, '.', ''), '0'), '.'), rtrim(rtrim(number_format($max, 2, '.', ''), '0'), '.'), $unit);
            continue;
        }

        $out[(int) $c['id']] = $val;
    }

    if ($fields) {
        Response::invalid($fields);
    }
    return $out;
}

// ── GET /patients — semua peran boleh melihat ─────────────────────────
if ($method === 'GET' && $id === null) {
    Auth::require();
    $rows = Database::run('SELECT * FROM patients ORDER BY code')->fetchAll();
    Response::json(['patients' => array_map('patientRow', $rows)]);
}

// ── GET /patients/{id} ────────────────────────────────────────────────
if ($method === 'GET' && $id !== null) {
    Auth::require();
    $p = Database::run('SELECT * FROM patients WHERE id = ?', [$id])->fetch();
    if (!$p) Response::error('Pasien tidak ditemukan.', 404);
    Response::json(['patient' => patientRow($p)]);
}

// ── POST /patients — kader & admin ────────────────────────────────────
if ($method === 'POST' && $id === null) {
    $user = Auth::requireRole('kader', 'admin');

    $name = Request::str('name');
    if (mb_strlen($name) < 2) {
        Response::invalid(['name' => 'Nama pasien wajib diisi.']);
    }

    $criteria = criteriaList();
    $values   = validateValues($criteria, Request::input('values'));

    $pdo = Database::conn();
    $pdo->beginTransaction();
    try {
        // FOR UPDATE mengunci baris agar dua input bersamaan tidak bentrok kode P0xx.
        $next = (int) $pdo->query(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(code, 2) AS UNSIGNED)), 0) + 1 FROM patients FOR UPDATE"
        )->fetchColumn();
        $code = 'P' . str_pad((string) $next, 3, '0', STR_PAD_LEFT);

        Database::run(
            'INSERT INTO patients (code, name, created_by) VALUES (?, ?, ?)',
            [$code, $name, $user['id']]
        );
        $pid = (int) $pdo->lastInsertId();

        foreach ($values as $cid => $val) {
            Database::run(
                'INSERT INTO patient_values (patient_id, criteria_id, value) VALUES (?, ?, ?)',
                [$pid, $cid, $val]
            );
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    $p = Database::run('SELECT * FROM patients WHERE id = ?', [$pid])->fetch();
    Response::json(['patient' => patientRow($p)], 201);
}

// ── PUT /patients/{id} — admin saja ───────────────────────────────────
if ($method === 'PUT' && $id !== null) {
    Auth::requireRole('admin');

    $p = Database::run('SELECT * FROM patients WHERE id = ?', [$id])->fetch();
    if (!$p) Response::error('Pasien tidak ditemukan.', 404);

    $name = Request::str('name');
    if (mb_strlen($name) < 2) {
        Response::invalid(['name' => 'Nama pasien wajib diisi.']);
    }

    $criteria = criteriaList();
    $values   = validateValues($criteria, Request::input('values'));

    // Skor sebelumnya disimpan agar indikator tren di Detail Pasien punya pembanding.
    $prevSaw    = Request::input('prevSaw');
    $prevTopsis = Request::input('prevTopsis');

    $pdo = Database::conn();
    $pdo->beginTransaction();
    try {
        Database::run(
            'UPDATE patients SET name = ?, prev_saw = ?, prev_topsis = ? WHERE id = ?',
            [
                $name,
                is_numeric($prevSaw)    ? (float) $prevSaw    : $p['prev_saw'],
                is_numeric($prevTopsis) ? (float) $prevTopsis : $p['prev_topsis'],
                $id,
            ]
        );

        foreach ($values as $cid => $val) {
            Database::run(
                'INSERT INTO patient_values (patient_id, criteria_id, value) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE value = VALUES(value)',
                [$id, $cid, $val]
            );
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    $p = Database::run('SELECT * FROM patients WHERE id = ?', [$id])->fetch();
    Response::json(['patient' => patientRow($p)]);
}

// ── PATCH /patients/{id}/tindaklanjuti — dokter & admin ───────────────
if ($method === 'PATCH' && $id !== null && $sub === 'tindaklanjuti') {
    Auth::requireRole('dokter', 'admin');

    $p = Database::run('SELECT * FROM patients WHERE id = ?', [$id])->fetch();
    if (!$p) Response::error('Pasien tidak ditemukan.', 404);

    $flag = (bool) Request::input('tindaklanjuti', !$p['tindaklanjuti']);
    Database::run('UPDATE patients SET tindaklanjuti = ? WHERE id = ?', [$flag ? 1 : 0, $id]);

    $p = Database::run('SELECT * FROM patients WHERE id = ?', [$id])->fetch();
    Response::json(['patient' => patientRow($p)]);
}

// ── POST /patients/{id}/followups — dokter & admin ────────────────────
if ($method === 'POST' && $id !== null && $sub === 'followups') {
    $user = Auth::requireRole('dokter', 'admin');

    $p = Database::run('SELECT id FROM patients WHERE id = ?', [$id])->fetch();
    if (!$p) Response::error('Pasien tidak ditemukan.', 404);

    $note = Request::str('note');
    if ($note === '') {
        Response::invalid(['note' => 'Catatan tindak lanjut tidak boleh kosong.']);
    }

    Database::run(
        'INSERT INTO follow_ups (patient_id, user_id, author, role, note) VALUES (?, ?, ?, ?, ?)',
        [$id, $user['id'], $user['name'], $user['role'], $note]
    );

    $p = Database::run('SELECT * FROM patients WHERE id = ?', [$id])->fetch();
    Response::json(['patient' => patientRow($p)], 201);
}

// ── DELETE /patients/{id} — admin saja ────────────────────────────────
if ($method === 'DELETE' && $id !== null) {
    Auth::requireRole('admin');

    $p = Database::run('SELECT id FROM patients WHERE id = ?', [$id])->fetch();
    if (!$p) Response::error('Pasien tidak ditemukan.', 404);

    // patient_values & follow_ups ikut terhapus lewat ON DELETE CASCADE.
    Database::run('DELETE FROM patients WHERE id = ?', [$id]);
    Response::json(['message' => 'Data pasien dihapus.']);
}

Response::error("Metode {$method} tidak didukung untuk endpoint pasien ini.", 405);
