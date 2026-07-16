<?php
/**
 * Front controller API SIGAP-Kronis.
 *
 * Seluruh endpoint berada di bawah /SIGAP-Kronis/api/.
 * Otorisasi peran ditegakkan di sisi server (tidak bergantung pada UI).
 */

declare(strict_types=1);

require_once __DIR__ . '/lib/Response.php';
require_once __DIR__ . '/lib/Database.php';
require_once __DIR__ . '/lib/Auth.php';
require_once __DIR__ . '/lib/Request.php';

$config = require __DIR__ . '/config/config.php';

// ── CORS (hanya diperlukan saat frontend dijalankan dari Vite dev server) ──
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $config['cors_origins'], true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if (Request::method() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Kembalikan error tak terduga sebagai JSON, bukan halaman HTML PHP.
set_exception_handler(function (Throwable $e): void {
    error_log('[SIGAP] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    Response::error('Terjadi kesalahan internal pada server.', 500, ['detail' => $e->getMessage()]);
});

$segments = Request::segments();
$resource = $segments[0] ?? '';

switch ($resource) {
    case '':
        Response::json(['name' => 'SIGAP-Kronis API', 'version' => '1.0.0', 'status' => 'ok']);
        // no break — Response::json() keluar.

    case 'auth':
        require __DIR__ . '/routes/auth.php';
        break;

    case 'patients':
        require __DIR__ . '/routes/patients.php';
        break;

    case 'criteria':
    case 'ahp':
        require __DIR__ . '/routes/criteria.php';
        break;

    case 'users':
        require __DIR__ . '/routes/users.php';
        break;

    default:
        Response::error("Endpoint '/{$resource}' tidak dikenal.", 404);
}
