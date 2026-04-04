<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Http;

use Abdou\AdminPhp\Auth\SessionAuth;
use Abdou\AdminPhp\Controllers\AuthController;
use Abdou\AdminPhp\Controllers\BatimentsController;
use Abdou\AdminPhp\Controllers\DashboardController;
use Abdou\AdminPhp\Controllers\EtagesController;
use Abdou\AdminPhp\Controllers\HealthController;
use Abdou\AdminPhp\Controllers\ClientsController;
use Abdou\AdminPhp\Controllers\ContractsController;
use Abdou\AdminPhp\Controllers\LotsController;
use Abdou\AdminPhp\Controllers\MediasController;
use Abdou\AdminPhp\Controllers\OffresController;
use Abdou\AdminPhp\Controllers\ProgrammeMediasController;
use Abdou\AdminPhp\Controllers\ProgrammesController;
use Abdou\AdminPhp\Controllers\PublicationsController;
use Abdou\AdminPhp\Controllers\RolesController;
use Abdou\AdminPhp\Controllers\RubriquesController;
use Abdou\AdminPhp\Controllers\TemplatesController;
use Abdou\AdminPhp\Controllers\UsersController;

final class Router
{
    public function dispatch(string $uri, string $method): void
    {
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        if ($path === '/api') {
            $path = '/';
        } elseif (str_starts_with($path, '/api/')) {
            $path = substr($path, 4) ?: '/';
        }
        $healthController = new HealthController();
        $dashboardController = new DashboardController();
        $etagesController = new EtagesController();
        $authController = new AuthController();
        $batimentsController = new BatimentsController();
        $clientsController = new ClientsController();
        $contractsController = new ContractsController();
        $lotsController = new LotsController();
        $mediasController = new MediasController();
        $offresController = new OffresController();
        $programmeMediasController = new ProgrammeMediasController();
        $programmesController = new ProgrammesController();
        $publicationsController = new PublicationsController();
        $rolesController = new RolesController();
        $rubriquesController = new RubriquesController();
        $templatesController = new TemplatesController();
        $usersController = new UsersController();

        if ($method === 'GET' && $path === '/admin') {
            $this->adminPage();
            return;
        }

        if ($method === 'GET' && $path === '/health') {
            $healthController->show();
            return;
        }

        if ($method === 'GET' && $path === '/health/db') {
            $healthController->db();
            return;
        }

        if ($method === 'GET' && $path === '/dashboard/summary') {
            if (!$this->requireAuth()) {
                return;
            }
            $dashboardController->summary();
            return;
        }

        if ($method === 'GET' && $path === '/contracts') {
            if (!$this->requireAuth()) {
                return;
            }
            $contractsController->index();
            return;
        }

        if ($method === 'POST' && $path === '/auth/login') {
            $authController->login();
            return;
        }

        if ($method === 'GET' && $path === '/auth/me') {
            $authController->me();
            return;
        }

        if ($method === 'POST' && $path === '/auth/logout') {
            $authController->logout();
            return;
        }

        if ($method === 'GET' && $path === '/offres') {
            if (!$this->requireAuth()) {
                return;
            }
            $offresController->index();
            return;
        }

        if ($method === 'GET' && $path === '/templates') {
            if (!$this->requireAuth()) {
                return;
            }
            $templatesController->index();
            return;
        }

        if ($method === 'GET' && preg_match('#^/offres/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $offresController->show($matches[1]);
            return;
        }

        if ($method === 'GET' && preg_match('#^/templates/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $templatesController->show($matches[1]);
            return;
        }

        if ($method === 'GET' && $path === '/clients') {
            if (!$this->requireAuth()) {
                return;
            }
            $clientsController->index();
            return;
        }

        if ($method === 'POST' && $path === '/clients') {
            if (!$this->requireRole('admin')) {
                return;
            }
            $clientsController->create();
            return;
        }

        if ($method === 'GET' && preg_match('#^/clients/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $clientsController->show($matches[1]);
            return;
        }

        if ($method === 'PUT' && preg_match('#^/clients/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireRole('admin')) {
                return;
            }
            $clientsController->update($matches[1]);
            return;
        }

        if ($method === 'GET' && $path === '/programmes') {
            if (!$this->requireAuth()) {
                return;
            }
            $programmesController->index();
            return;
        }

        if ($method === 'POST' && $path === '/programmes') {
            if (!$this->requireRole('admin')) {
                return;
            }
            $programmesController->create();
            return;
        }

        if ($method === 'GET' && preg_match('#^/programmes/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $programmesController->show($matches[1]);
            return;
        }

        if ($method === 'PUT' && preg_match('#^/programmes/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireRole('admin')) {
                return;
            }
            $programmesController->update($matches[1]);
            return;
        }

        if ($method === 'GET' && preg_match('#^/programmes/(\d+)/medias$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $programmeMediasController->index($matches[1]);
            return;
        }

        if ($method === 'POST' && preg_match('#^/programmes/(\d+)/medias$#', $path, $matches) === 1) {
            if (!$this->requireRole('admin')) {
                return;
            }
            $programmeMediasController->create($matches[1]);
            return;
        }

        if ($method === 'PUT' && preg_match('#^/programmes/(\d+)/medias/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireRole('admin')) {
                return;
            }
            $programmeMediasController->update($matches[1], $matches[2]);
            return;
        }

        if ($method === 'DELETE' && preg_match('#^/programmes/(\d+)/medias/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireRole('admin')) {
                return;
            }
            $programmeMediasController->delete($matches[1], $matches[2]);
            return;
        }

        if ($method === 'GET' && $path === '/lots') {
            if (!$this->requireAuth()) {
                return;
            }
            $lotsController->index();
            return;
        }

        if ($method === 'GET' && $path === '/batiments') {
            if (!$this->requireAuth()) {
                return;
            }
            $batimentsController->index();
            return;
        }

        if ($method === 'POST' && $path === '/batiments') {
            if (!$this->requireRole('admin')) {
                return;
            }
            $batimentsController->create();
            return;
        }

        if ($method === 'GET' && preg_match('#^/batiments/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $batimentsController->show($matches[1]);
            return;
        }

        if ($method === 'PUT' && preg_match('#^/batiments/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireRole('admin')) {
                return;
            }
            $batimentsController->update($matches[1]);
            return;
        }

        if ($method === 'GET' && preg_match('#^/batiments/(\d+)/etages$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $batimentsController->etages($matches[1]);
            return;
        }

        if ($method === 'GET' && $path === '/etages') {
            if (!$this->requireAuth()) {
                return;
            }
            $etagesController->index();
            return;
        }

        if ($method === 'POST' && $path === '/etages') {
            if (!$this->requireRole('admin')) {
                return;
            }
            $etagesController->create();
            return;
        }

        if ($method === 'GET' && preg_match('#^/etages/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $etagesController->show($matches[1]);
            return;
        }

        if ($method === 'PUT' && preg_match('#^/etages/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireRole('admin')) {
                return;
            }
            $etagesController->update($matches[1]);
            return;
        }

        if ($method === 'POST' && $path === '/lots') {
            if (!$this->requireRole('admin')) {
                return;
            }
            $lotsController->create();
            return;
        }

        if ($method === 'GET' && preg_match('#^/lots/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $lotsController->show($matches[1]);
            return;
        }

        if ($method === 'PUT' && preg_match('#^/lots/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireRole('admin')) {
                return;
            }
            $lotsController->update($matches[1]);
            return;
        }

        if ($method === 'GET' && $path === '/rubriques') {
            if (!$this->requireAuth()) {
                return;
            }
            $rubriquesController->index();
            return;
        }

        if ($method === 'POST' && $path === '/rubriques') {
            if (!$this->requireRole('admin')) {
                return;
            }
            $rubriquesController->create();
            return;
        }

        if ($method === 'GET' && preg_match('#^/rubriques/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $rubriquesController->show($matches[1]);
            return;
        }

        if ($method === 'PUT' && preg_match('#^/rubriques/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireRole('admin')) {
                return;
            }
            $rubriquesController->update($matches[1]);
            return;
        }

        if ($method === 'GET' && $path === '/medias') {
            if (!$this->requireAuth()) {
                return;
            }
            $mediasController->index();
            return;
        }

        if ($method === 'POST' && $path === '/medias') {
            $user = $this->requireRole('admin');
            if ($user === null) {
                return;
            }
            $mediasController->create($user);
            return;
        }

        if ($method === 'GET' && preg_match('#^/medias/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $mediasController->show($matches[1]);
            return;
        }

        if ($method === 'GET' && $path === '/publications') {
            if (!$this->requireAuth()) {
                return;
            }
            $publicationsController->index();
            return;
        }

        if ($method === 'POST' && $path === '/publications') {
            $user = $this->requireRole('admin');
            if ($user === null) {
                return;
            }
            $publicationsController->create($user);
            return;
        }

        if ($method === 'GET' && preg_match('#^/publications/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $publicationsController->show($matches[1]);
            return;
        }

        if ($method === 'PUT' && preg_match('#^/publications/(\d+)/status$#', $path, $matches) === 1) {
            $user = $this->requireRole('admin');
            if ($user === null) {
                return;
            }
            $publicationsController->updateStatus($matches[1]);
            return;
        }

        if ($method === 'GET' && preg_match('#^/publications/(\d+)/deployments$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $publicationsController->deployments($matches[1]);
            return;
        }

        if ($method === 'POST' && preg_match('#^/publications/(\d+)/deploy$#', $path, $matches) === 1) {
            $user = $this->requireRole('admin');
            if ($user === null) {
                return;
            }
            $publicationsController->deploy($matches[1], $user);
            return;
        }

        if ($method === 'POST' && preg_match('#^/publications/(\d+)/preview$#', $path, $matches) === 1) {
            if (!$this->requireRole('admin')) {
                return;
            }
            $publicationsController->buildPreview($matches[1]);
            return;
        }

        if ($method === 'POST' && preg_match('#^/publications/(\d+)/build$#', $path, $matches) === 1) {
            if (!$this->requireRole('admin')) {
                return;
            }
            $publicationsController->build($matches[1]);
            return;
        }

        if ($method === 'GET' && preg_match('#^/publications/(\d+)/build-log$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $publicationsController->buildLog($matches[1]);
            return;
        }

        if ($method === 'GET' && preg_match('#^/publications/(\d+)/deploy-log$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $publicationsController->deployLog($matches[1]);
            return;
        }

        if ($method === 'GET' && preg_match('#^/publications/(\d+)/deploy-manifest$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $publicationsController->deployManifest($matches[1]);
            return;
        }

        if ($method === 'GET' && preg_match('#^/publications/(\d+)/deploy-verify-log$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $publicationsController->deployVerifyLog($matches[1]);
            return;
        }

        if ($method === 'GET' && preg_match('#^/publications/(\d+)/deploy-artifacts$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $publicationsController->deployArtifacts($matches[1]);
            return;
        }

        if ($method === 'GET' && preg_match('#^/publications/(\d+)/deploy-summary$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $publicationsController->deploySummary($matches[1]);
            return;
        }

        if ($method === 'GET' && preg_match('#^/publications/(\d+)/workflow-detail$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $publicationsController->workflowDetail($matches[1]);
            return;
        }

        if ($method === 'GET' && $path === '/roles') {
            if (!$this->requireAuth()) {
                return;
            }
            $rolesController->index();
            return;
        }

        if ($method === 'GET' && $path === '/users') {
            if (!$this->requireAuth()) {
                return;
            }
            $usersController->index();
            return;
        }

        if ($method === 'GET' && preg_match('#^/users/(\d+)$#', $path, $matches) === 1) {
            if (!$this->requireAuth()) {
                return;
            }
            $usersController->show($matches[1]);
            return;
        }

        JsonResponse::send(404, [
            'ok' => false,
            'error' => 'not_found',
            'path' => $path,
        ]);
    }

    private function requireAuth(): bool
    {
        if (SessionAuth::user() !== null) {
            return true;
        }

        JsonResponse::send(401, [
            'ok' => false,
            'error' => 'unauthorized',
        ]);
        return false;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function requireRole(string $roleCode): ?array
    {
        $user = SessionAuth::user();
        if ($user === null) {
            JsonResponse::send(401, [
                'ok' => false,
                'error' => 'unauthorized',
            ]);
            return null;
        }

        $currentRole = (string)($user['role']['code'] ?? '');
        if ($currentRole !== $roleCode) {
            JsonResponse::send(403, [
                'ok' => false,
                'error' => 'forbidden',
                'required_role' => $roleCode,
            ]);
            return null;
        }

        return $user;
    }

    private function adminPage(): void
    {
        $file = dirname(__DIR__, 2) . '/public/admin/index.html';
        if (!is_file($file)) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'admin_page_missing',
            ]);
            return;
        }

        header('Content-Type: text/html; charset=utf-8');
        readfile($file);
    }
}
