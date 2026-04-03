<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Throwable;

final class HealthController
{
    public function show(): void
    {
        JsonResponse::send(200, [
            'ok' => true,
            'service' => 'admin-php',
            'env' => ABDOU_APP_ENV,
            'timestamp' => gmdate('c'),
        ]);
    }

    public function db(): void
    {
        try {
            $pdo = ConnectionFactory::create();
            $result = $pdo->query('SELECT 1 AS ok')->fetch();

            JsonResponse::send(200, [
                'ok' => true,
                'service' => 'admin-php',
                'db' => 'up',
                'probe' => $result['ok'] ?? null,
                'timestamp' => gmdate('c'),
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'service' => 'admin-php',
                'db' => 'down',
                'error' => ABDOU_APP_ENV === 'production' ? 'db_unreachable' : $e->getMessage(),
                'timestamp' => gmdate('c'),
            ]);
        }
    }
}
