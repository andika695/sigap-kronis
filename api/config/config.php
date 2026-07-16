<?php
/**
 * Konfigurasi aplikasi SIGAP-Kronis.
 *
 * Nilai default cocok untuk XAMPP standar (root tanpa password).
 * Untuk mengubah tanpa menyentuh berkas ini, set environment variable
 * SIGAP_DB_HOST / SIGAP_DB_NAME / SIGAP_DB_USER / SIGAP_DB_PASS.
 */

declare(strict_types=1);

// Berkas ini dimuat dari beberapa tempat, jadi deklarasinya harus idempoten.
if (!function_exists('env')) {
    function env(string $key, ?string $default = null): ?string
    {
        // Di Apache/mod_php (Docker), variabel dari container tidak selalu
        // terbaca getenv() — tergantung PassEnv & variables_order. Karena itu
        // $_SERVER dan $_ENV ikut diperiksa sebagai cadangan.
        $val = getenv($key);
        if ($val === false || $val === '') {
            $val = $_SERVER[$key] ?? $_ENV[$key] ?? false;
        }
        return ($val === false || $val === '') ? $default : (string) $val;
    }
}

return [
    'db' => [
        'host'    => env('SIGAP_DB_HOST', 'localhost'),
        'port'    => env('SIGAP_DB_PORT', '3306'),
        'name'    => env('SIGAP_DB_NAME', 'sigap_kronis'),
        'user'    => env('SIGAP_DB_USER', 'root'),
        'pass'    => env('SIGAP_DB_PASS', ''),
        'charset' => 'utf8mb4',
    ],

    // Origin yang boleh memanggil API saat pengembangan (Vite dev server).
    'cors_origins' => [
        'http://localhost:8443',
        'http://127.0.0.1:8443',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    // Masa berlaku token reset password (detik).
    'reset_token_ttl' => 3600,

    // true  = token reset dikembalikan di response (mode demo/tanpa SMTP)
    // false = token hanya dikirim lewat email
    'reset_token_in_response' => true,
];
