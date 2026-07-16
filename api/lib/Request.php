<?php
/**
 * Pembaca request: body JSON, segmen path, dan validasi dasar.
 */

declare(strict_types=1);

final class Request
{
    private static ?array $body = null;

    /** Body JSON sebagai array. */
    public static function body(): array
    {
        if (self::$body !== null) {
            return self::$body;
        }

        $raw = file_get_contents('php://input') ?: '';
        if ($raw === '') {
            return self::$body = [];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            Response::error('Body request bukan JSON yang valid.', 400);
        }

        return self::$body = $decoded;
    }

    /** Ambil satu field dari body. */
    public static function input(string $key, mixed $default = null): mixed
    {
        return self::body()[$key] ?? $default;
    }

    /** Ambil string yang sudah di-trim. */
    public static function str(string $key, string $default = ''): string
    {
        $v = self::input($key, $default);
        return is_scalar($v) ? trim((string) $v) : $default;
    }

    public static function method(): string
    {
        return $_SERVER['REQUEST_METHOD'] ?? 'GET';
    }

    /**
     * Segmen path setelah /api.
     * Contoh: /SIGAP-Kronis/api/patients/12 -> ['patients', '12']
     */
    public static function segments(): array
    {
        $uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $path = urldecode($uri);

        $pos = strpos($path, '/api');
        if ($pos !== false) {
            $path = substr($path, $pos + 4);
        }

        $path = trim($path, '/');
        if ($path === '' || $path === 'index.php') {
            return [];
        }

        return array_values(array_filter(explode('/', $path), fn($s) => $s !== '' && $s !== 'index.php'));
    }
}
