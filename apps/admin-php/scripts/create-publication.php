<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Repositories\PublicationsRepository;

function read_int_arg(array $argv, string $name, int $default): int
{
    $prefix = '--' . $name . '=';
    foreach ($argv as $arg) {
        if (!is_string($arg) || !str_starts_with($arg, $prefix)) {
            continue;
        }
        $raw = substr($arg, strlen($prefix));
        if ($raw === false || !ctype_digit($raw)) {
            return $default;
        }
        $value = (int)$raw;
        return $value > 0 ? $value : $default;
    }
    return $default;
}

$programmeId = read_int_arg($argv ?? [], 'programmeId', 1);
$createdBy = read_int_arg($argv ?? [], 'createdBy', 1);

$repo = new PublicationsRepository(ConnectionFactory::create());
$created = $repo->createFromProgramme($programmeId, $createdBy);

if ($created === null) {
    fwrite(STDERR, "create_failed\n");
    exit(1);
}

echo (string)$created['id'] . PHP_EOL;

