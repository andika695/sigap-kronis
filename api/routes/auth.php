<?php
/**
 * /api/auth/*  — login, register, lupa & reset password, sesi.
 */

declare(strict_types=1);

/** @var array $segments */
/** @var array $config */

$action = $segments[1] ?? '';
$method = Request::method();

/** Bentuk user yang aman dikirim ke klien (tanpa hash password). */
function publicUser(array $u): array
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

switch ("$method $action") {

    // ── Siapa yang sedang login ────────────────────────────────────────
    case 'GET me': {
        $user = Auth::user();
        Response::json(['user' => $user ? publicUser($user) : null]);
    }

    // ── Masuk ──────────────────────────────────────────────────────────
    case 'POST login': {
        $username = Request::str('username');
        $password = (string) Request::input('password', '');

        $fields = [];
        if ($username === '') $fields['username'] = 'Username atau NIP wajib diisi.';
        if ($password === '') $fields['password'] = 'Password wajib diisi.';
        if ($fields) Response::invalid($fields);

        // Terima login lewat username maupun email.
        $stmt = Database::run(
            'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
            [$username, $username]
        );
        $user = $stmt->fetch();

        // Pesan sengaja disamakan agar tidak membocorkan username mana yang terdaftar.
        if (!$user || !password_verify($password, $user['password_hash'])) {
            Response::error('Username atau password salah.', 401);
        }

        if ((int) $user['active'] !== 1) {
            Response::error('Akun Anda dinonaktifkan. Hubungi admin Puskesmas.', 403);
        }

        Auth::login($user);
        Response::json(['user' => publicUser($user)]);
    }

    // ── Daftar ─────────────────────────────────────────────────────────
    case 'POST register': {
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

        // Admin tidak boleh didaftarkan lewat form publik — hanya admin lain
        // yang boleh membuat akun admin (lewat Panel Admin).
        if (!in_array($role, ['kader', 'dokter'], true)) {
            $fields['role'] = 'Peran harus Kader atau Dokter/Perawat.';
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
            // Kunci tabel agar dua pendaftaran bersamaan tidak menghasilkan code kembar.
            $next = (int) $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 FROM users FOR UPDATE')->fetchColumn();
            $code = 'U' . str_pad((string) $next, 3, '0', STR_PAD_LEFT);

            Database::run(
                'INSERT INTO users (code, name, username, email, password_hash, role, active)
                 VALUES (?, ?, ?, ?, ?, ?, 1)',
                [$code, $name, $username, $email, password_hash($password, PASSWORD_BCRYPT), $role]
            );
            $id = (int) $pdo->lastInsertId();
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        $user = Database::run('SELECT * FROM users WHERE id = ?', [$id])->fetch();
        Auth::login($user);
        Response::json(['user' => publicUser($user)], 201);
    }

    // ── Keluar ─────────────────────────────────────────────────────────
    case 'POST logout': {
        Auth::logout();
        Response::json(['message' => 'Anda telah keluar.']);
    }

    // ── Lupa password → terbitkan token ────────────────────────────────
    case 'POST forgot': {
        $email = strtolower(Request::str('email'));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::invalid(['email' => 'Format email tidak valid.']);
        }

        $user = Database::run('SELECT id, active FROM users WHERE email = ?', [$email])->fetch();

        // Selalu balas sukses — jangan bocorkan email mana yang terdaftar.
        $payload = ['message' => 'Jika email terdaftar, tautan reset telah dikirim.'];

        if ($user && (int) $user['active'] === 1) {
            $token = bin2hex(random_bytes(32));

            // Token lama milik user ini dibatalkan agar hanya satu yang berlaku.
            Database::run(
                'UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
                [$user['id']]
            );
            Database::run(
                'INSERT INTO password_resets (user_id, token_hash, expires_at)
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))',
                [$user['id'], hash('sha256', $token), $config['reset_token_ttl']]
            );

            // Tanpa SMTP, token dikembalikan langsung agar alur bisa didemokan.
            if ($config['reset_token_in_response']) {
                $payload['demo_token'] = $token;
                $payload['note']       = 'Mode demo: token ditampilkan karena SMTP belum dikonfigurasi.';
            }
        }

        Response::json($payload);
    }

    // ── Reset password dengan token ────────────────────────────────────
    case 'POST reset': {
        $token    = Request::str('token');
        $password = (string) Request::input('password', '');

        $fields = [];
        if ($token === '')          $fields['token']    = 'Token reset wajib diisi.';
        if (strlen($password) < 8)  $fields['password'] = 'Password minimal 8 karakter.';
        if ($fields) Response::invalid($fields);

        $row = Database::run(
            'SELECT id, user_id FROM password_resets
              WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
              LIMIT 1',
            [hash('sha256', $token)]
        )->fetch();

        if (!$row) {
            Response::error('Token reset tidak valid atau sudah kedaluwarsa.', 400);
        }

        $pdo = Database::conn();
        $pdo->beginTransaction();
        try {
            Database::run(
                'UPDATE users SET password_hash = ? WHERE id = ?',
                [password_hash($password, PASSWORD_BCRYPT), $row['user_id']]
            );
            Database::run('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [$row['id']]);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        Response::json(['message' => 'Password berhasil diperbarui. Silakan masuk dengan password baru.']);
    }

    default:
        Response::error("Endpoint auth '/{$action}' tidak dikenal untuk metode {$method}.", 404);
}
