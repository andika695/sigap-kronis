<?php
/**
 * Koneksi PDO tunggal (singleton).
 * Semua query di aplikasi ini WAJIB lewat prepared statement.
 */

declare(strict_types=1);

final class Database
{
    private static ?PDO $pdo = null;

    public static function conn(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $cfg = require __DIR__ . '/../config/config.php';
        $db  = $cfg['db'];

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $db['host'],
            $db['port'],
            $db['name'],
            $db['charset']
        );

        try {
            self::$pdo = new PDO($dsn, $db['user'], $db['pass'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_STRINGIFY_FETCHES  => false,
            ]);
        } catch (PDOException $e) {
            Response::error(
                'Tidak dapat terhubung ke basis data. Pastikan MySQL di XAMPP sudah berjalan '
                . 'dan skema sudah diimpor (database/schema.sql).',
                500,
                ['detail' => $e->getMessage()]
            );
        }

        return self::$pdo;
    }

    /** Jalankan query dengan parameter terikat. */
    public static function run(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::conn()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
}
