<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Http\Request;
use Abdou\AdminPhp\Repositories\TemplatesRepository;
use Throwable;

final class TemplatesController
{
    public function index(): void
    {
        try {
            $q = (string)(Request::queryString('q', '') ?? '');
            $page = Request::queryInt('page', 1, 1, 5000);
            $limit = Request::queryInt('limit', 20, 1, 100);

            $repository = new TemplatesRepository(ConnectionFactory::create());
            $result = $repository->listActive($q, $page, $limit);

            JsonResponse::send(200, [
                'ok' => true,
                'meta' => [
                    'total' => $result['total'],
                    'page' => $result['page'],
                    'limit' => $result['limit'],
                ],
                'items' => $result['items'],
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'templates_list_failed',
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
            $repository = new TemplatesRepository(ConnectionFactory::create());
            $row = $repository->findById((int)$id);

            if ($row === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'template_not_found',
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
                'error' => 'template_read_failed',
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
