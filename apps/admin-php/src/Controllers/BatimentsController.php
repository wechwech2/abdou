<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Http\Request;
use Abdou\AdminPhp\Repositories\BatimentsRepository;
use Throwable;

final class BatimentsController
{
    public function index(): void
    {
        try {
            $q = (string)(Request::queryString('q', '') ?? '');
            $active = (string)(Request::queryString('active', 'all') ?? 'all');
            $programmeIdRaw = Request::queryString('programme_id');
            $programmeId = ($programmeIdRaw !== null && ctype_digit($programmeIdRaw)) ? (int)$programmeIdRaw : null;
            $page = Request::queryInt('page', 1, 1, 5000);
            $limit = Request::queryInt('limit', 20, 1, 100);

            $repo = new BatimentsRepository(ConnectionFactory::create());
            $result = $repo->list($q, $programmeId, $active, $page, $limit);

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
                'error' => 'batiments_list_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    public function show(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_id']);
            return;
        }

        try {
            $repo = new BatimentsRepository(ConnectionFactory::create());
            $row = $repo->findById((int)$id);
            if ($row === null) {
                JsonResponse::send(404, ['ok' => false, 'error' => 'batiment_not_found']);
                return;
            }
            JsonResponse::send(200, ['ok' => true, 'item' => $row]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'batiment_read_failed', 'message' => $this->safeError($e)]);
        }
    }

    public function create(): void
    {
        $body = Request::jsonBody();
        $required = ['programme_id', 'code', 'name'];
        foreach ($required as $field) {
            if (!isset($body[$field]) || trim((string)$body[$field]) === '') {
                JsonResponse::send(400, ['ok' => false, 'error' => 'missing_required_fields', 'required' => $required]);
                return;
            }
        }

        if (!ctype_digit((string)$body['programme_id'])) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_programme_id']);
            return;
        }

        try {
            $repo = new BatimentsRepository(ConnectionFactory::create());
            $created = $repo->create([
                'programme_id' => (int)$body['programme_id'],
                'code' => trim((string)$body['code']),
                'name' => trim((string)$body['name']),
                'display_order' => isset($body['display_order']) ? (int)$body['display_order'] : 1,
                'is_active' => isset($body['is_active']) ? (int)(bool)$body['is_active'] : 1,
            ]);
            JsonResponse::send(201, ['ok' => true, 'item' => $created]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'batiment_create_failed', 'message' => $this->safeError($e)]);
        }
    }

    public function update(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_id']);
            return;
        }

        $body = Request::jsonBody();
        if ($body === []) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'empty_payload']);
            return;
        }

        try {
            $repo = new BatimentsRepository(ConnectionFactory::create());
            $current = $repo->findById((int)$id);
            if ($current === null) {
                JsonResponse::send(404, ['ok' => false, 'error' => 'batiment_not_found']);
                return;
            }

            if (isset($body['display_order'])) {
                $body['display_order'] = (int)$body['display_order'];
            }
            if (isset($body['is_active'])) {
                $body['is_active'] = (int)(bool)$body['is_active'];
            }
            if (isset($body['code'])) {
                $body['code'] = trim((string)$body['code']);
            }
            if (isset($body['name'])) {
                $body['name'] = trim((string)$body['name']);
            }

            $updated = $repo->update((int)$id, $body);
            JsonResponse::send(200, ['ok' => true, 'item' => $updated]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'batiment_update_failed', 'message' => $this->safeError($e)]);
        }
    }

    public function etages(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_id']);
            return;
        }

        try {
            $repo = new BatimentsRepository(ConnectionFactory::create());
            $current = $repo->findById((int)$id);
            if ($current === null) {
                JsonResponse::send(404, ['ok' => false, 'error' => 'batiment_not_found']);
                return;
            }

            $items = $repo->listEtages((int)$id);
            JsonResponse::send(200, [
                'ok' => true,
                'count' => count($items),
                'items' => $items,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'etages_list_failed', 'message' => $this->safeError($e)]);
        }
    }

    private function safeError(Throwable $e): string
    {
        return ABDOU_APP_ENV === 'production' ? 'internal_error' : $e->getMessage();
    }
}
