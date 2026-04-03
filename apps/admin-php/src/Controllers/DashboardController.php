<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Repositories\DashboardRepository;
use Throwable;

final class DashboardController
{
    public function summary(): void
    {
        try {
            $repository = new DashboardRepository(ConnectionFactory::create());
            $summary = $repository->summary();

            JsonResponse::send(200, [
                'ok' => true,
                'summary' => $summary,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'dashboard_summary_failed',
                'message' => ABDOU_APP_ENV === 'production' ? 'internal_error' : $e->getMessage(),
            ]);
        }
    }
}
