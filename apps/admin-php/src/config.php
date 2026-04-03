<?php

declare(strict_types=1);

function abdou_env(string $key, ?string $default = null): ?string
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    if ($value === false || $value === null || $value === '') {
        return $default;
    }

    return (string)$value;
}

defined('ABDOU_APP_ENV') || define('ABDOU_APP_ENV', abdou_env('APP_ENV', 'development'));
defined('ABDOU_TIMEZONE') || define('ABDOU_TIMEZONE', abdou_env('APP_TIMEZONE', 'Africa/Tunis'));
defined('ABDOU_DB_HOST') || define('ABDOU_DB_HOST', abdou_env('MYSQL_HOST', '127.0.0.1'));
defined('ABDOU_DB_PORT') || define('ABDOU_DB_PORT', abdou_env('MYSQL_PORT', '3306'));
defined('ABDOU_DB_NAME') || define('ABDOU_DB_NAME', abdou_env('MYSQL_DATABASE', 'abdou'));
defined('ABDOU_DB_USER') || define('ABDOU_DB_USER', abdou_env('MYSQL_USER', 'root'));
defined('ABDOU_DB_PASSWORD') || define('ABDOU_DB_PASSWORD', abdou_env('MYSQL_PASSWORD', ''));
defined('ABDOU_SESSION_NAME') || define('ABDOU_SESSION_NAME', abdou_env('SESSION_NAME', 'ABDOU_ADMIN'));
defined('ABDOU_NODE_BIN') || define('ABDOU_NODE_BIN', abdou_env('NODE_BIN', 'node'));

date_default_timezone_set(ABDOU_TIMEZONE);
