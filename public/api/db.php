<?php
/**
 * Podar Pathways - Unified PDO Database Connector
 * Supports: MySQL (Production / cPanel) & SQLite (Local / Fallback)
 */

require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $instance = null;
    private static string $driver = 'mysql';

    /**
     * Get singleton PDO connection
     */
    public static function getConnection(): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $preferredDriver = defined('DB_DRIVER') ? strtolower(DB_DRIVER) : 'mysql';

        // 1. Try MySQL if explicitly preferred and not running in SQLite mode
        if ($preferredDriver === 'mysql') {
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
                    PDO::ATTR_TIMEOUT            => 1
                ];

                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
                self::$driver   = 'mysql';
                return self::$instance;
            } catch (\Throwable $e) {
                // If MySQL connection fails in local/dev environment, fall through to SQLite
                error_log('[DB NOTICE] MySQL connection unavailable. Falling back to SQLite...');
            }
        }

        // 2. Try SQLite
        $sqlitePaths = [
            defined('SQLITE_FILE') ? SQLITE_FILE : '',
            defined('SQLITE_LOCAL') ? SQLITE_LOCAL : '',
            __DIR__ . '/data/podar_pathways.db'
        ];

        $foundPath = null;
        foreach ($sqlitePaths as $p) {
            if ($p && file_exists($p)) {
                $foundPath = $p;
                break;
            }
        }

        if (!$foundPath) {
            $localDir = __DIR__ . '/data';
            if (!is_dir($localDir)) {
                @mkdir($localDir, 0755, true);
            }
            $foundPath = $localDir . '/podar_pathways.db';
        }

        try {
            self::$instance = new PDO('sqlite:' . $foundPath, null, null, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            self::$instance->exec('PRAGMA journal_mode = WAL;');

            // Attach separate databases for Certificates and Projects
            $dir = dirname($foundPath);
            $certDbFile = defined('SQLITE_CERTIFICATES_FILE') ? SQLITE_CERTIFICATES_FILE : ($dir . '/certificates.db');
            $projDbFile = defined('SQLITE_PROJECTS_FILE') ? SQLITE_PROJECTS_FILE : ($dir . '/projects.db');

            if (file_exists($certDbFile)) {
                self::$instance->exec("ATTACH DATABASE " . self::$instance->quote($certDbFile) . " AS cert_db;");
            }
            if (file_exists($projDbFile)) {
                self::$instance->exec("ATTACH DATABASE " . self::$instance->quote($projDbFile) . " AS proj_db;");
            }

            self::$driver = 'sqlite';
            return self::$instance;
        } catch (\Throwable $sqliteErr) {
            error_log('[DB FATAL] Both MySQL and SQLite connection failed: ' . $sqliteErr->getMessage());
            jsonError(
                'Database connection failed. Please verify your database configuration in api/config.php.',
                500,
                ['error' => $sqliteErr->getMessage()]
            );
        }
    }

    /**
     * Get active driver ('mysql' or 'sqlite')
     */
    public static function getDriver(): string {
        self::getConnection();
        return self::$driver;
    }

    /**
     * Get direct PDO connection for certificates database
     */
    public static function getCertificatesConnection(): PDO {
        if (self::getDriver() === 'mysql' && defined('DB_CERTIFICATES_NAME') && DB_CERTIFICATES_NAME) {
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

        $certDbFile = defined('SQLITE_CERTIFICATES_FILE') ? SQLITE_CERTIFICATES_FILE : (__DIR__ . '/data/certificates.db');
        if (self::getDriver() === 'sqlite' && file_exists($certDbFile)) {
            $pdo = new PDO('sqlite:' . $certDbFile, null, null, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            $pdo->exec('PRAGMA journal_mode = WAL;');
            return $pdo;
        }
        return self::getConnection();
    }

    /**
     * Get direct PDO connection for projects database
     */
    public static function getProjectsConnection(): PDO {
        $projDbFile = defined('SQLITE_PROJECTS_FILE') ? SQLITE_PROJECTS_FILE : (__DIR__ . '/data/projects.db');
        if (self::getDriver() === 'sqlite' && file_exists($projDbFile)) {
            $pdo = new PDO('sqlite:' . $projDbFile, null, null, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            $pdo->exec('PRAGMA journal_mode = WAL;');
            return $pdo;
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
