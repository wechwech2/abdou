<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Http\Request;
use Abdou\AdminPhp\Repositories\RubriquesRepository;
use Abdou\AdminPhp\Support\Validation;
use Throwable;

final class RubriquesController
{
    public function index(): void
    {
        try {
            $q = (string)(Request::queryString('q', '') ?? '');
            $enabled = (string)(Request::queryString('enabled', 'all') ?? 'all');
            $programmeIdRaw = Request::queryString('programme_id');
            $programmeId = ($programmeIdRaw !== null && ctype_digit($programmeIdRaw)) ? (int)$programmeIdRaw : null;
            $page = Request::queryInt('page', 1, 1, 5000);
            $limit = Request::queryInt('limit', 20, 1, 100);

            $repo = new RubriquesRepository(ConnectionFactory::create());
            $result = $repo->list($q, $programmeId, $enabled, $page, $limit);

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
                'error' => 'rubriques_list_failed',
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
            $repo = new RubriquesRepository(ConnectionFactory::create());
            $row = $repo->findById((int)$id);
            if ($row === null) {
                JsonResponse::send(404, ['ok' => false, 'error' => 'rubrique_not_found']);
                return;
            }
            JsonResponse::send(200, ['ok' => true, 'item' => $row]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'rubrique_read_failed', 'message' => $this->safeError($e)]);
        }
    }

    public function create(): void
    {
        $body = Request::jsonBody();
        $required = ['programme_id', 'code', 'title', 'slug'];
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

        $code = mb_strtoupper(trim((string)$body['code']));
        $slug = mb_strtolower(trim((string)$body['slug']));
        if (!Validation::isValidCode($code) || !Validation::isValidSlug($slug)) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_format']);
            return;
        }

        try {
            $repo = new RubriquesRepository(ConnectionFactory::create());
            $created = $repo->create([
                'programme_id' => (int)$body['programme_id'],
                'code' => $code,
                'title' => trim((string)$body['title']),
                'slug' => $slug,
                'content_html' => $body['content_html'] ?? null,
                'content_text' => $body['content_text'] ?? null,
                'display_order' => isset($body['display_order']) ? (int)$body['display_order'] : 1,
                'is_enabled' => isset($body['is_enabled']) ? (int)(bool)$body['is_enabled'] : 1,
                'is_menu_visible' => isset($body['is_menu_visible']) ? (int)(bool)$body['is_menu_visible'] : 1,
                'settings_json' => isset($body['settings_json']) ? json_encode($body['settings_json'], JSON_UNESCAPED_SLASHES) : null,
            ]);
            JsonResponse::send(201, ['ok' => true, 'item' => $created]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'rubrique_create_failed', 'message' => $this->safeError($e)]);
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

        if (isset($body['slug'])) {
            $body['slug'] = mb_strtolower(trim((string)$body['slug']));
            if (!Validation::isValidSlug((string)$body['slug'])) {
                JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_slug']);
                return;
            }
        }
        if (isset($body['settings_json'])) {
            $body['settings_json'] = json_encode($body['settings_json'], JSON_UNESCAPED_SLASHES);
        }

        try {
            $repo = new RubriquesRepository(ConnectionFactory::create());
            $current = $repo->findById((int)$id);
            if ($current === null) {
                JsonResponse::send(404, ['ok' => false, 'error' => 'rubrique_not_found']);
                return;
            }
            $updated = $repo->update((int)$id, $body);
            JsonResponse::send(200, ['ok' => true, 'item' => $updated]);
        } catch (Throwable $e) {
            JsonResponse::send(500, ['ok' => false, 'error' => 'rubrique_update_failed', 'message' => $this->safeError($e)]);
        }
    }

    private function safeError(Throwable $e): string
    {
        return ABDOU_APP_ENV === 'production' ? 'internal_error' : $e->getMessage();
    }
}
