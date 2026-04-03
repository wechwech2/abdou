<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Database;

use PDO;

final class ConnectionFactory
{
    public static function create(): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            ABDOU_DB_HOST,
            ABDOU_DB_PORT,
            ABDOU_DB_NAME
        );

        return new PDO(
            $dsn,
            ABDOU_DB_USER,
            ABDOU_DB_PASSWORD,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
    }
}
