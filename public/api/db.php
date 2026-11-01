<?php
/**
 * Podar Pathways - Dedicated MySQL PDO Database Connector (phpMyAdmin)
 * Exclusively uses MySQL database managed via phpMyAdmin
 */

require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $instance = null;
    private static string $driver = 'mysql';

    /**
     * Get singleton PDO connection to main MySQL database
     */
    public static function getConnection(): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_PORT,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            self::$driver   = 'mysql';
            return self::$instance;
        } catch (\Throwable $e) {
            error_log('[DB FATAL] MySQL / phpMyAdmin connection failed: ' . $e->getMessage());
            jsonError(
                'phpMyAdmin MySQL database connection failed. Please verify DB_HOST, DB_NAME, DB_USER, and DB_PASS in your .env file.',
                500,
                ['error' => $e->getMessage()]
            );
        }
    }

    /**
     * Get active driver (strictly 'mysql')
     */
    public static function getDriver(): string {
        return 'mysql';
    }

    /**
     * Get direct PDO connection for certificates database in MySQL
     */
    public static function getCertificatesConnection(): PDO {
        if (defined('DB_CERTIFICATES_NAME') && DB_CERTIFICATES_NAME && DB_CERTIFICATES_NAME !== DB_NAME) {
            static $certPdo = null;
            if ($certPdo === null) {
                try {
                    $dsn = sprintf(
                        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                        DB_HOST,
                        DB_PORT,
                        DB_CERTIFICATES_NAME,
                        DB_CHARSET
                    );
                    $options = [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES   => false,
                    ];
                    $certPdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                } catch (\Throwable $e) {
                    error_log('[DB NOTICE] Failed to connect directly to DB_CERTIFICATES_NAME: ' . $e->getMessage());
                    return self::getConnection();
                }
            }
            return $certPdo;
        }
        return self::getConnection();
    }

    /**
     * Get direct PDO connection for projects database in MySQL
     */
    public static function getProjectsConnection(): PDO {
        if (defined('DB_PROJECTS_NAME') && DB_PROJECTS_NAME && DB_PROJECTS_NAME !== DB_NAME) {
            static $projPdo = null;
            if ($projPdo === null) {
                try {
                    $dsn = sprintf(
                        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                        DB_HOST,
                        DB_PORT,
                        DB_PROJECTS_NAME,
                        DB_CHARSET
                    );
                    $options = [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES   => false,
                    ];
                    $projPdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                } catch (\Throwable $e) {
                    error_log('[DB NOTICE] Failed to connect directly to DB_PROJECTS_NAME: ' . $e->getMessage());
                    return self::getConnection();
                }
            }
            return $projPdo;
        }
        return self::getConnection();
    }

    /**
     * Helper to run parameterized query and fetch single row
     */
    public static function fetchOne(string $sql, array $params = []): ?array {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Helper to run parameterized query and fetch all rows
     */
    public static function fetchAll(string $sql, array $params = []): array {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll() ?: [];
    }

    /**
     * Helper to execute insert, update, or delete query
     */
    public static function execute(string $sql, array $params = []): int {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    /**
     * Get last insert ID
     */
    public static function lastInsertId(): string {
        return self::getConnection()->lastInsertId();
    }
}
