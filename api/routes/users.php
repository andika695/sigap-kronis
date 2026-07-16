<?php
/**
 * /api/users/*  — kelola akun pengguna. Admin saja.
 */

declare(strict_types=1);

/** @var array $segments */

$method = Request::method();
$id     = isset($segments[1]) && ctype_digit($segments[1]) ? (int) $segments[1] : null;
$sub    = $segments[2] ?? '';

function userRow(array $u): array
{
    return [
        'id'       => (int) $u['id'],
        'code'     => $u['code'],
        'name'     => $u['name'],
        'username' => $u['username'],
        'email'    => $u['email'],
        'role'     => $u['role'],
        'active'   => (bool) $u['active'],
    ];
}

// ── GET /users ────────────────────────────────────────────────────────
if ($method === 'GET') {
    Auth::requireRole('admin');
    $rows = Database::run('SELECT * FROM users ORDER BY role, name')->fetchAll();
    Response::json(['users' => array_map('userRow', $rows)]);
}

// ── POST /users — tambah pengguna ─────────────────────────────────────
if ($method === 'POST' && $id === null) {
    Auth::requireRole('admin');

    $name     = Request::str('name');
    $username = strtolower(Request::str('username'));
    $email    = strtolower(Request::str('email'));
    $password = (string) Request::input('password', '');
    $role     = Request::str('role', 'kader');

    $fields = [];
    if (mb_strlen($name) < 3) {
        $fields['name'] = 'Nama lengkap minimal 3 karakter.';
    }
    if (!preg_match('/^[a-z0-9._]{4,60}$/', $username)) {
        $fields['username'] = 'Username 4-60 karakter, hanya huruf kecil, angka, titik, garis bawah.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $fields['email'] = 'Format email tidak valid.';
    }
    if (strlen($password) < 8) {
        $fields['password'] = 'Password minimal 8 karakter.';
    }
    if (!in_array($role, Auth::ROLES, true)) {
        $fields['role'] = 'Peran tidak dikenal.';
    }
    if ($fields) Response::invalid($fields);

    $dupe = Database::run(
        'SELECT username, email FROM users WHERE username = ? OR email = ?',
        [$username, $email]
    )->fetch();

    if ($dupe) {
        $f = [];
        if ($dupe['username'] === $username) $f['username'] = 'Username sudah terpakai.';
        if ($dupe['email'] === $email)       $f['email']    = 'Email sudah terdaftar.';
        Response::invalid($f, 'Akun sudah ada.');
    }

    $pdo = Database::conn();
    $pdo->beginTransaction();
    try {
        $next = (int) $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 FROM users FOR UPDATE')->fetchColumn();
        $code = 'U' . str_pad((string) $next, 3, '0', STR_PAD_LEFT);

        Database::run(
            'INSERT INTO users (code, name, username, email, password_hash, role, active)
             VALUES (?, ?, ?, ?, ?, ?, 1)',
            [$code, $name, $username, $email, password_hash($password, PASSWORD_BCRYPT), $role]
        );
        $newId = (int) $pdo->lastInsertId();
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    $u = Database::run('SELECT * FROM users WHERE id = ?', [$newId])->fetch();
    Response::json(['user' => userRow($u)], 201);
}

// ── PATCH /users/{id}/active — aktif / nonaktif ───────────────────────
if ($method === 'PATCH' && $id !== null && $sub === 'active') {
    $me = Auth::requireRole('admin');

    $u = Database::run('SELECT * FROM users WHERE id = ?', [$id])->fetch();
    if (!$u) Response::error('Pengguna tidak ditemukan.', 404);

    // Mencegah admin mengunci dirinya sendiri keluar dari sistem.
    if ((int) $u['id'] === $me['id']) {
        Response::error('Anda tidak dapat menonaktifkan akun Anda sendiri.', 422);
    }

    $flag = (bool) Request::input('active', !$u['active']);
    Database::run('UPDATE users SET active = ? WHERE id = ?', [$flag ? 1 : 0, $id]);

    $u = Database::run('SELECT * FROM users WHERE id = ?', [$id])->fetch();
    Response::json(['user' => userRow($u)]);
}

// ── DELETE /users/{id} ────────────────────────────────────────────────
if ($method === 'DELETE' && $id !== null) {
    $me = Auth::requireRole('admin');

    $u = Database::run('SELECT * FROM users WHERE id = ?', [$id])->fetch();
    if (!$u) Response::error('Pengguna tidak ditemukan.', 404);

    if ((int) $u['id'] === $me['id']) {
        Response::error('Anda tidak dapat menghapus akun Anda sendiri.', 422);
    }

    // Sistem harus selalu menyisakan minimal satu admin aktif.
    if ($u['role'] === 'admin') {
        $admins = (int) Database::run(
            "SELECT COUNT(*) FROM users WHERE role = 'admin' AND active = 1 AND id <> ?",
            [$id]
        )->fetchColumn();
        if ($admins === 0) {
            Response::error('Tidak dapat menghapus admin terakhir yang aktif.', 422);
        }
    }

    Database::run('DELETE FROM users WHERE id = ?', [$id]);
    Response::json(['message' => 'Pengguna dihapus.']);
}

Response::error("Metode {$method} tidak didukung untuk endpoint pengguna ini.", 405);
