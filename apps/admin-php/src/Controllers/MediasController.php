<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Http\Request;
use Abdou\AdminPhp\Repositories\MediasRepository;
use Abdou\AdminPhp\Support\Validation;
use Throwable;

final class MediasController
{
    public function index(): void
    {
        try {
            $q = (string)(Request::queryString('q', '') ?? '');
            $status = (string)(Request::queryString('status', 'all') ?? 'all');
            $type = (string)(Request::queryString('type', 'all') ?? 'all');
            $page = Request::queryInt('page', 1, 1, 5000);
            $limit = Request::queryInt('limit', 20, 1, 100);

            $repo = new MediasRepository(ConnectionFactory::create());
            $result = $repo->list($q, $status, $type, $page, $limit);

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
                'error' => 'medias_list_failed',
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
            $repo = new MediasRepository(ConnectionFactory::create());
            $row = $repo->findById((int)$id);
            if ($row === null) {
                JsonResponse::send(404, ['ok' => false, 'error' => 'media_not_found']);
                return;
            }
            JsonResponse::send(200, ['ok' => true, 'item' => $row]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'media_read_failed', 'message' => $this->safeError($e)]);
        }
    }

    /**
     * @param array<string, mixed> $authUser
     */
    public function create(array $authUser): void
    {
        $body = Request::jsonBody();
        $required = ['type', 'mime_type', 'original_filename', 'storage_filename', 'storage_path'];
        foreach ($required as $field) {
            if (!isset($body[$field]) || trim((string)$body[$field]) === '') {
                JsonResponse::send(400, ['ok' => false, 'error' => 'missing_required_fields', 'required' => $required]);
                return;
            }
        }

        $type = trim((string)$body['type']);
        if (!Validation::inSet($type, ['image', 'video', 'document'])) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_type', 'allowed' => ['image', 'video', 'document']]);
            return;
        }

        $status = isset($body['status']) ? (string)$body['status'] : 'uploaded';
        if (!Validation::inSet($status, ['uploaded', 'optimized', 'published', 'archived'])) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_status', 'allowed' => ['uploaded', 'optimized', 'published', 'archived']]);
            return;
        }

        try {
            $repo = new MediasRepository(ConnectionFactory::create());
            $created = $repo->create([
                'uuid' => isset($body['uuid']) && trim((string)$body['uuid']) !== '' ? (string)$body['uuid'] : Validation::uuidV4(),
                'type' => $type,
                'mime_type' => trim((string)$body['mime_type']),
                'original_filename' => trim((string)$body['original_filename']),
                'storage_filename' => trim((string)$body['storage_filename']),
                'storage_path' => trim((string)$body['storage_path']),
                'public_url' => $body['public_url'] ?? null,
                'title' => $body['title'] ?? null,
                'alt_text' => $body['alt_text'] ?? null,
                'caption' => $body['caption'] ?? null,
                'width' => isset($body['width']) ? (int)$body['width'] : null,
                'height' => isset($body['height']) ? (int)$body['height'] : null,
                'file_size' => isset($body['file_size']) ? (int)$body['file_size'] : null,
                'checksum' => $body['checksum'] ?? null,
                'status' => $status,
                'uploaded_by' => (int)$authUser['id'],
            ]);
            JsonResponse::send(201, ['ok' => true, 'item' => $created]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'media_create_failed', 'message' => $this->safeError($e)]);
        }
    }

    private function safeError(Throwable $e): string
    {
        return ABDOU_APP_ENV === 'production' ? 'internal_error' : $e->getMessage();
    }
}
