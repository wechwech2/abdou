<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Http\JsonResponse;

final class ContractsController
{
    public function index(): void
    {
        JsonResponse::send(200, [
            'ok' => true,
            'items' => [
                'client_status' => ['active', 'inactive', 'archived'],
                'role_code' => ['admin', 'content_operator', 'validator', 'technical_operator'],
                'programme_status' => ['draft', 'ready', 'archived'],
                'programme_publication_status' => ['not_published', 'generated', 'deployed', 'failed'],
                'publication_status' => ['draft', 'generating', 'generated', 'deployed', 'failed', 'archived'],
                'media_type' => ['image', 'video', 'document'],
                'media_status' => ['uploaded', 'optimized', 'published', 'archived'],
                'publication_deployment_target_type' => ['ovh_ftp', 'local_preview', 'manual'],
                'publication_deployment_status' => ['pending', 'running', 'success', 'failed', 'rolled_back'],
            ],
        ]);
    }
}
