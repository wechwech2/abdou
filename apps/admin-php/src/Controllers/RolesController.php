<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Repositories\RolesRepository;
use Throwable;

final class RolesController
{
    public function index(): void
    {
        try {
            $repository = new RolesRepository(ConnectionFactory::create());
            $rows = $repository->listActive();

            JsonResponse::send(200, [
                'ok' => true,
                'count' => count($rows),
                'items' => $rows,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'roles_list_failed',
                'message' => ABDOU_APP_ENV === 'production' ? 'internal_error' : $e->getMessage(),
            ]);
        }
    }
}
