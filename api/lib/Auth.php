<?php
/**
 * Sesi & otorisasi berbasis peran.
 *
 * Memakai session cookie httpOnly — token tidak pernah menyentuh JavaScript,
 * sehingga aman dari pencurian lewat XSS.
 */

declare(strict_types=1);

final class Auth
{
    public const ROLES = ['kader', 'dokter', 'admin'];

    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_name('SIGAPSESS');
        session_start();
    }

    public static function login(array $user): void
    {
        self::start();
        session_regenerate_id(true);
        $_SESSION['uid'] = (int) $user['id'];
    }

    public static function logout(): void
    {
        self::start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
    }

    /** User yang sedang login, atau null. Akun nonaktif diperlakukan sebagai logout. */
    public static function user(): ?array
    {
        self::start();
        if (empty($_SESSION['uid'])) {
            return null;
        }

        $stmt = Database::run(
            'SELECT id, code, name, username, email, role, active FROM users WHERE id = ?',
            [$_SESSION['uid']]
        );
        $user = $stmt->fetch();

        if (!$user || (int) $user['active'] !== 1) {
            return null;
        }

        $user['id']     = (int) $user['id'];
        $user['active'] = (bool) $user['active'];
        return $user;
    }

    /** Wajib login. */
    public static function require(): array
    {
        $user = self::user();
        if ($user === null) {
            Response::error('Sesi tidak ditemukan atau telah berakhir. Silakan masuk kembali.', 401);
        }
        return $user;
    }

    /** Wajib login DAN punya salah satu peran. */
    public static function requireRole(string ...$roles): array
    {
        $user = self::require();
        if (!in_array($user['role'], $roles, true)) {
            Response::error('Peran Anda tidak memiliki akses ke tindakan ini.', 403);
        }
        return $user;
    }
}
