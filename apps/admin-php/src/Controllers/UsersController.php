<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Repositories\UsersRepository;
use Throwable;

final class UsersController
{
    public function index(): void
    {
        try {
            $repository = new UsersRepository(ConnectionFactory::create());
            $rows = $repository->listActive();

            JsonResponse::send(200, [
                'ok' => true,
                'count' => count($rows),
                'items' => $rows,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'users_list_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    public function show(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        try {
            $repository = new UsersRepository(ConnectionFactory::create());
            $row = $repository->findById((int)$id);

            if ($row === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'user_not_found',
                ]);
                return;
            }

            JsonResponse::send(200, [
                'ok' => true,
                'item' => $row,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'user_read_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    private function safeError(Throwable $e): string
    {
        if (ABDOU_APP_ENV === 'production') {
            return 'internal_error';
        }

        return $e->getMessage();
    }
}
