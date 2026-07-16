<?php
/**
 * Helper response JSON.
 */

declare(strict_types=1);

final class Response
{
    /** Kirim payload sukses lalu hentikan eksekusi. */
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(
            ['ok' => true, 'data' => $data],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        exit;
    }

    /** Kirim payload error lalu hentikan eksekusi. */
    public static function error(string $message, int $status = 400, array $extra = []): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(
            ['ok' => false, 'error' => $message] + $extra,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        exit;
    }

    /** Error validasi per-field, dipakai form di frontend. */
    public static function invalid(array $fields, string $message = 'Data yang dikirim tidak valid.'): never
    {
        self::error($message, 422, ['fields' => $fields]);
    }
}
