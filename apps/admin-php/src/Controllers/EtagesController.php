<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Http\Request;
use Abdou\AdminPhp\Repositories\EtagesRepository;
use Throwable;

final class EtagesController
{
    public function index(): void
    {
        try {
            $q = (string)(Request::queryString('q', '') ?? '');
            $batimentIdRaw = Request::queryString('batiment_id');
            $batimentId = ($batimentIdRaw !== null && ctype_digit($batimentIdRaw)) ? (int)$batimentIdRaw : null;
            $page = Request::queryInt('page', 1, 1, 5000);
            $limit = Request::queryInt('limit', 20, 1, 100);

            $repo = new EtagesRepository(ConnectionFactory::create());
            $result = $repo->list($q, $batimentId, $page, $limit);

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
                'error' => 'etages_list_failed',
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
            $repo = new EtagesRepository(ConnectionFactory::create());
            $row = $repo->findById((int)$id);
            if ($row === null) {
                JsonResponse::send(404, ['ok' => false, 'error' => 'etage_not_found']);
                return;
            }
            JsonResponse::send(200, ['ok' => true, 'item' => $row]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'etage_read_failed', 'message' => $this->safeError($e)]);
        }
    }

    public function create(): void
    {
        $body = Request::jsonBody();
        $required = ['batiment_id', 'code', 'name', 'level_number'];
        foreach ($required as $field) {
            if (!isset($body[$field]) || trim((string)$body[$field]) === '') {
                JsonResponse::send(400, ['ok' => false, 'error' => 'missing_required_fields', 'required' => $required]);
                return;
            }
        }

        if (!ctype_digit((string)$body['batiment_id'])) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_batiment_id']);
            return;
        }
        if (!is_numeric($body['level_number'])) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_level_number']);
            return;
        }

        try {
            $repo = new EtagesRepository(ConnectionFactory::create());
            $created = $repo->create([
                'batiment_id' => (int)$body['batiment_id'],
                'code' => trim((string)$body['code']),
                'name' => trim((string)$body['name']),
                'level_number' => (int)$body['level_number'],
                'display_order' => isset($body['display_order']) ? (int)$body['display_order'] : 1,
            ]);
            JsonResponse::send(201, ['ok' => true, 'item' => $created]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'etage_create_failed', 'message' => $this->safeError($e)]);
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
            $repo = new EtagesRepository(ConnectionFactory::create());
            $current = $repo->findById((int)$id);
            if ($current === null) {
                JsonResponse::send(404, ['ok' => false, 'error' => 'etage_not_found']);
                return;
            }

            if (isset($body['level_number']) && !is_numeric($body['level_number'])) {
                JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_level_number']);
                return;
            }
            if (isset($body['level_number'])) {
                $body['level_number'] = (int)$body['level_number'];
            }
            if (isset($body['display_order'])) {
                $body['display_order'] = (int)$body['display_order'];
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
            JsonResponse::send(500, ['ok' => false, 'error' => 'etage_update_failed', 'message' => $this->safeError($e)]);
        }
    }

    private function safeError(Throwable $e): string
    {
        return ABDOU_APP_ENV === 'production' ? 'internal_error' : $e->getMessage();
    }
}
