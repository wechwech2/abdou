<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Http\Request;
use Abdou\AdminPhp\Repositories\ProgrammeMediasRepository;
use Throwable;

final class ProgrammeMediasController
{
    public function index(string $programmeId): void
    {
        if (!ctype_digit($programmeId)) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_programme_id']);
            return;
        }

        try {
            $repo = new ProgrammeMediasRepository(ConnectionFactory::create());
            $items = $repo->listByProgramme((int)$programmeId);
            JsonResponse::send(200, ['ok' => true, 'count' => count($items), 'items' => $items]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'programme_medias_list_failed', 'message' => $this->safeError($e)]);
        }
    }

    public function create(string $programmeId): void
    {
        if (!ctype_digit($programmeId)) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_programme_id']);
            return;
        }

        $body = Request::jsonBody();
        if (!isset($body['media_id']) || !ctype_digit((string)$body['media_id'])) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_media_id']);
            return;
        }

        $usageCode = trim((string)($body['usage_code'] ?? 'gallery'));
        if ($usageCode === '') {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_usage_code']);
            return;
        }

        try {
            $repo = new ProgrammeMediasRepository(ConnectionFactory::create());
            $created = $repo->create([
                'programme_id' => (int)$programmeId,
                'media_id' => (int)$body['media_id'],
                'rubrique_id' => isset($body['rubrique_id']) && ctype_digit((string)$body['rubrique_id']) ? (int)$body['rubrique_id'] : null,
                'lot_id' => isset($body['lot_id']) && ctype_digit((string)$body['lot_id']) ? (int)$body['lot_id'] : null,
                'usage_code' => $usageCode,
                'display_order' => isset($body['display_order']) ? (int)$body['display_order'] : 1,
                'is_featured' => isset($body['is_featured']) ? (int)(bool)$body['is_featured'] : 0,
                'is_published' => isset($body['is_published']) ? (int)(bool)$body['is_published'] : 1,
            ]);
            JsonResponse::send(201, ['ok' => true, 'item' => $created]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'programme_media_create_failed', 'message' => $this->safeError($e)]);
        }
    }

    public function update(string $programmeId, string $id): void
    {
        if (!ctype_digit($programmeId) || !ctype_digit($id)) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_id']);
            return;
        }

        $body = Request::jsonBody();
        if ($body === []) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'empty_payload']);
            return;
        }

        if (isset($body['is_featured'])) {
            $body['is_featured'] = (int)(bool)$body['is_featured'];
        }
        if (isset($body['is_published'])) {
            $body['is_published'] = (int)(bool)$body['is_published'];
        }
        if (isset($body['display_order'])) {
            $body['display_order'] = (int)$body['display_order'];
        }
        if (isset($body['rubrique_id']) && $body['rubrique_id'] !== null) {
            $body['rubrique_id'] = ctype_digit((string)$body['rubrique_id']) ? (int)$body['rubrique_id'] : null;
        }
        if (isset($body['lot_id']) && $body['lot_id'] !== null) {
            $body['lot_id'] = ctype_digit((string)$body['lot_id']) ? (int)$body['lot_id'] : null;
        }

        try {
            $repo = new ProgrammeMediasRepository(ConnectionFactory::create());
            $current = $repo->findById((int)$id);
            if ($current === null || (int)$current['programme_id'] !== (int)$programmeId) {
                JsonResponse::send(404, ['ok' => false, 'error' => 'programme_media_not_found']);
                return;
            }
            $updated = $repo->update((int)$id, $body);
            JsonResponse::send(200, ['ok' => true, 'item' => $updated]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'programme_media_update_failed', 'message' => $this->safeError($e)]);
        }
    }

    public function delete(string $programmeId, string $id): void
    {
        if (!ctype_digit($programmeId) || !ctype_digit($id)) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_id']);
            return;
        }

        try {
            $repo = new ProgrammeMediasRepository(ConnectionFactory::create());
            $current = $repo->findById((int)$id);
            if ($current === null || (int)$current['programme_id'] !== (int)$programmeId) {
                JsonResponse::send(404, ['ok' => false, 'error' => 'programme_media_not_found']);
                return;
            }
            $deleted = $repo->delete((int)$id);
            JsonResponse::send(200, ['ok' => true, 'deleted' => $deleted, 'id' => (int)$id]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'programme_media_delete_failed', 'message' => $this->safeError($e)]);
        }
    }

    private function safeError(Throwable $e): string
    {
        return ABDOU_APP_ENV === 'production' ? 'internal_error' : $e->getMessage();
    }
}

