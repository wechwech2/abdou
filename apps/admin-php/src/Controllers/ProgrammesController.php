<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Http\Request;
use Abdou\AdminPhp\Repositories\ProgrammesRepository;
use Abdou\AdminPhp\Support\Validation;
use Throwable;

final class ProgrammesController
{
    public function index(): void
    {
        $status = (string)(Request::queryString('status', 'all') ?? 'all');
        $allowedStatus = ['all', 'draft', 'ready', 'archived'];
        if (!Validation::inSet($status, $allowedStatus)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_status',
                'allowed' => $allowedStatus,
            ]);
            return;
        }

        $clientIdRaw = Request::queryString('client_id');
        if ($clientIdRaw !== null && !Validation::isPositiveIntString($clientIdRaw)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_client_id_query',
            ]);
            return;
        }
        $offreIdRaw = Request::queryString('offre_id');
        if ($offreIdRaw !== null && !Validation::isPositiveIntString($offreIdRaw)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_offre_id_query',
            ]);
            return;
        }

        try {
            $q = (string)(Request::queryString('q', '') ?? '');
            $clientId = $clientIdRaw !== null ? (int)$clientIdRaw : null;
            $offreId = $offreIdRaw !== null ? (int)$offreIdRaw : null;
            $page = Request::queryInt('page', 1, 1, 5000);
            $limit = Request::queryInt('limit', 20, 1, 100);

            $repository = new ProgrammesRepository(ConnectionFactory::create());
            $result = $repository->listAll($q, $status, $clientId, $offreId, $page, $limit);

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
                'error' => 'programmes_list_failed',
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
            $repository = new ProgrammesRepository(ConnectionFactory::create());
            $row = $repository->findById((int)$id);

            if ($row === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'programme_not_found',
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
                'error' => 'programme_read_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    public function create(): void
    {
        $payload = Request::jsonBody();
        $required = ['client_id', 'offre_id', 'code', 'name', 'slug'];
        foreach ($required as $field) {
            if (!isset($payload[$field]) || trim((string)$payload[$field]) === '') {
                JsonResponse::send(400, [
                    'ok' => false,
                    'error' => 'missing_required_fields',
                    'required' => $required,
                ]);
                return;
            }
        }

            if (!Validation::isPositiveIntString($payload['client_id']) || !Validation::isPositiveIntString($payload['offre_id'])) {
                JsonResponse::send(400, [
                    'ok' => false,
                    'error' => 'invalid_foreign_keys',
            ]);
            return;
        }

        try {
            $code = mb_strtoupper(Validation::normalizeString($payload['code']));
            $slug = mb_strtolower(Validation::normalizeString($payload['slug']));
            if (!Validation::isValidCode($code) || !Validation::isValidSlug($slug)) {
                JsonResponse::send(400, [
                    'ok' => false,
                    'error' => 'invalid_format',
                    'rules' => [
                        'code' => '^[A-Z0-9_-]{2,50}$',
                        'slug' => '^[a-z0-9-]{2,180}$',
                    ],
                ]);
                return;
            }
            $status = isset($payload['status']) ? (string)$payload['status'] : 'draft';
            $publicationStatus = isset($payload['publication_status']) ? (string)$payload['publication_status'] : 'not_published';
            if (!Validation::inSet($status, ['draft', 'ready', 'archived'])) {
                JsonResponse::send(400, [
                    'ok' => false,
                    'error' => 'invalid_status',
                    'allowed' => ['draft', 'ready', 'archived'],
                ]);
                return;
            }
            if (!Validation::inSet($publicationStatus, ['not_published', 'generated', 'deployed', 'failed'])) {
                JsonResponse::send(400, [
                    'ok' => false,
                    'error' => 'invalid_publication_status',
                    'allowed' => ['not_published', 'generated', 'deployed', 'failed'],
                ]);
                return;
            }

            $repository = new ProgrammesRepository(ConnectionFactory::create());
            $created = $repository->create([
                'client_id' => (int)$payload['client_id'],
                'offre_id' => (int)$payload['offre_id'],
                'template_id' => isset($payload['template_id']) && ctype_digit((string)$payload['template_id']) ? (int)$payload['template_id'] : null,
                'code' => $code,
                'name' => Validation::normalizeString($payload['name']),
                'slug' => $slug,
                'headline' => $payload['headline'] ?? null,
                'short_description' => $payload['short_description'] ?? null,
                'city' => $payload['city'] ?? null,
                'status' => $status,
                'publication_status' => $publicationStatus,
                'target_path' => $payload['target_path'] ?? null,
                'target_domain' => $payload['target_domain'] ?? null,
            ]);

            JsonResponse::send(201, [
                'ok' => true,
                'item' => $created,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'programme_create_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    public function update(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        $payload = Request::jsonBody();
        if ($payload === []) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'empty_payload',
            ]);
            return;
        }

        if (isset($payload['client_id']) && !Validation::isPositiveIntString($payload['client_id'])) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_client_id']);
            return;
        }
        if (isset($payload['offre_id']) && !Validation::isPositiveIntString($payload['offre_id'])) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_offre_id']);
            return;
        }
        if (isset($payload['template_id']) && $payload['template_id'] !== null && !Validation::isPositiveIntString($payload['template_id'])) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_template_id']);
            return;
        }

        if (isset($payload['slug'])) {
            $payload['slug'] = mb_strtolower(Validation::normalizeString($payload['slug']));
            if (!Validation::isValidSlug((string)$payload['slug'])) {
                JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_slug']);
                return;
            }
        }
        if (isset($payload['name'])) {
            $payload['name'] = Validation::normalizeString($payload['name']);
            if ($payload['name'] === '') {
                JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_name']);
                return;
            }
        }
        if (isset($payload['client_id'])) {
            $payload['client_id'] = (int)$payload['client_id'];
        }
        if (isset($payload['offre_id'])) {
            $payload['offre_id'] = (int)$payload['offre_id'];
        }
        if (isset($payload['template_id']) && $payload['template_id'] !== null) {
            $payload['template_id'] = (int)$payload['template_id'];
        }
        if (isset($payload['status']) && !Validation::inSet((string)$payload['status'], ['draft', 'ready', 'archived'])) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_status', 'allowed' => ['draft', 'ready', 'archived']]);
            return;
        }
        if (isset($payload['publication_status']) && !Validation::inSet((string)$payload['publication_status'], ['not_published', 'generated', 'deployed', 'failed'])) {
            JsonResponse::send(400, ['ok' => false, 'error' => 'invalid_publication_status', 'allowed' => ['not_published', 'generated', 'deployed', 'failed']]);
            return;
        }

        try {
            $repository = new ProgrammesRepository(ConnectionFactory::create());
            $current = $repository->findById((int)$id);
            if ($current === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'programme_not_found',
                ]);
                return;
            }

            $updated = $repository->update((int)$id, $payload);
            JsonResponse::send(200, [
                'ok' => true,
                'item' => $updated,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'programme_update_failed',
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
