<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Http\Request;
use Abdou\AdminPhp\Repositories\ClientsRepository;
use Abdou\AdminPhp\Support\Validation;
use Throwable;

final class ClientsController
{
    public function index(): void
    {
        $status = (string)(Request::queryString('status', 'active') ?? 'active');
        if (!Validation::inSet($status, ['active', 'inactive', 'archived', 'all'])) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_status',
                'allowed' => ['active', 'inactive', 'archived', 'all'],
            ]);
            return;
        }

        try {
            $q = (string)(Request::queryString('q', '') ?? '');
            $page = Request::queryInt('page', 1, 1, 5000);
            $limit = Request::queryInt('limit', 20, 1, 100);

            $repository = new ClientsRepository(ConnectionFactory::create());
            $result = $repository->list($q, $status, $page, $limit);

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
                'error' => 'clients_list_failed',
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
            $repository = new ClientsRepository(ConnectionFactory::create());
            $row = $repository->findById((int)$id);

            if ($row === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'client_not_found',
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
                'error' => 'client_read_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    public function create(): void
    {
        $payload = Request::jsonBody();
        $code = isset($payload['code']) ? Validation::normalizeString($payload['code']) : '';
        $name = isset($payload['name']) ? Validation::normalizeString($payload['name']) : '';
        $slug = isset($payload['slug']) ? Validation::normalizeString($payload['slug']) : '';

        if ($code === '' || $name === '' || $slug === '') {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'missing_required_fields',
                'required' => ['code', 'name', 'slug'],
            ]);
            return;
        }
        $code = mb_strtoupper($code);
        $slug = mb_strtolower($slug);

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
        if (!Validation::isValidEmail(isset($payload['contact_email']) ? (string)$payload['contact_email'] : null)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_email',
            ]);
            return;
        }
        if (isset($payload['status']) && !Validation::inSet((string)$payload['status'], ['active', 'inactive', 'archived'])) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_status',
                'allowed' => ['active', 'inactive', 'archived'],
            ]);
            return;
        }

        try {
            $repository = new ClientsRepository(ConnectionFactory::create());
            $created = $repository->create([
                'code' => mb_strtoupper($code),
                'name' => $name,
                'slug' => mb_strtolower($slug),
                'legal_name' => $payload['legal_name'] ?? null,
                'contact_name' => $payload['contact_name'] ?? null,
                'contact_email' => $payload['contact_email'] ?? null,
                'contact_phone' => $payload['contact_phone'] ?? null,
                'brand_primary_color' => $payload['brand_primary_color'] ?? null,
                'brand_secondary_color' => $payload['brand_secondary_color'] ?? null,
                'status' => $payload['status'] ?? 'active',
                'notes' => $payload['notes'] ?? null,
            ]);

            JsonResponse::send(201, [
                'ok' => true,
                'item' => $created,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'client_create_failed',
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

        if (isset($payload['slug'])) {
            $payload['slug'] = mb_strtolower(Validation::normalizeString($payload['slug']));
            if (!Validation::isValidSlug((string)$payload['slug'])) {
                JsonResponse::send(400, [
                    'ok' => false,
                    'error' => 'invalid_slug',
                ]);
                return;
            }
        }
        if (isset($payload['name'])) {
            $payload['name'] = Validation::normalizeString($payload['name']);
            if ($payload['name'] === '') {
                JsonResponse::send(400, [
                    'ok' => false,
                    'error' => 'invalid_name',
                ]);
                return;
            }
        }
        if (isset($payload['status']) && !Validation::inSet((string)$payload['status'], ['active', 'inactive', 'archived'])) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_status',
                'allowed' => ['active', 'inactive', 'archived'],
            ]);
            return;
        }
        if (array_key_exists('contact_email', $payload) && !Validation::isValidEmail(isset($payload['contact_email']) ? (string)$payload['contact_email'] : null)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_email',
            ]);
            return;
        }

        try {
            $repository = new ClientsRepository(ConnectionFactory::create());
            $current = $repository->findById((int)$id);
            if ($current === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'client_not_found',
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
                'error' => 'client_update_failed',
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
