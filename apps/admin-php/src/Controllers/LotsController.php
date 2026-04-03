<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Http\Request;
use Abdou\AdminPhp\Repositories\LotsRepository;
use Throwable;

final class LotsController
{
    public function index(): void
    {
        try {
            $q = (string)(Request::queryString('q', '') ?? '');
            $published = (string)(Request::queryString('published', 'all') ?? 'all');
            $programmeIdRaw = Request::queryString('programme_id');
            $programmeId = ($programmeIdRaw !== null && ctype_digit($programmeIdRaw)) ? (int)$programmeIdRaw : null;
            $page = Request::queryInt('page', 1, 1, 5000);
            $limit = Request::queryInt('limit', 20, 1, 100);

            $repo = new LotsRepository(ConnectionFactory::create());
            $result = $repo->list($q, $programmeId, $published, $page, $limit);

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
                'error' => 'lots_list_failed',
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
            $repo = new LotsRepository(ConnectionFactory::create());
            $row = $repo->findById((int)$id);
            if ($row === null) {
                JsonResponse::send(404, ['ok' => false, 'error' => 'lot_not_found']);
                return;
            }
            JsonResponse::send(200, ['ok' => true, 'item' => $row]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'lot_read_failed', 'message' => $this->safeError($e)]);
        }
    }

    public function create(): void
    {
        $body = Request::jsonBody();
        $required = ['programme_id', 'reference'];
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
            $repo = new LotsRepository(ConnectionFactory::create());
            $created = $repo->create([
                'programme_id' => (int)$body['programme_id'],
                'batiment_id' => isset($body['batiment_id']) && ctype_digit((string)$body['batiment_id']) ? (int)$body['batiment_id'] : null,
                'etage_id' => isset($body['etage_id']) && ctype_digit((string)$body['etage_id']) ? (int)$body['etage_id'] : null,
                'reference' => trim((string)$body['reference']),
                'title' => $body['title'] ?? null,
                'typology' => $body['typology'] ?? null,
                'surface_m2' => isset($body['surface_m2']) ? (float)$body['surface_m2'] : null,
                'price_label' => $body['price_label'] ?? null,
                'commercial_status' => $body['commercial_status'] ?? null,
                'short_description' => $body['short_description'] ?? null,
                'display_order' => isset($body['display_order']) ? (int)$body['display_order'] : 1,
                'is_published' => isset($body['is_published']) ? (int)(bool)$body['is_published'] : 1,
            ]);
            JsonResponse::send(201, ['ok' => true, 'item' => $created]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'lot_create_failed', 'message' => $this->safeError($e)]);
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
            $repo = new LotsRepository(ConnectionFactory::create());
            $current = $repo->findById((int)$id);
            if ($current === null) {
                JsonResponse::send(404, ['ok' => false, 'error' => 'lot_not_found']);
                return;
            }

            if (isset($body['batiment_id']) && $body['batiment_id'] !== null && !ctype_digit((string)$body['batiment_id'])) {
                JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_batiment_id']);
                return;
            }
            if (isset($body['etage_id']) && $body['etage_id'] !== null && !ctype_digit((string)$body['etage_id'])) {
                JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_etage_id']);
                return;
            }
            if (isset($body['surface_m2']) && $body['surface_m2'] !== null) {
                $body['surface_m2'] = (float)$body['surface_m2'];
            }
            if (isset($body['is_published'])) {
                $body['is_published'] = (int)(bool)$body['is_published'];
            }

            $updated = $repo->update((int)$id, $body);
            JsonResponse::send(200, ['ok' => true, 'item' => $updated]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'lot_update_failed', 'message' => $this->safeError($e)]);
        }
    }

    private function safeError(Throwable $e): string
    {
        return ABDOU_APP_ENV === 'production' ? 'internal_error' : $e->getMessage();
    }
}
