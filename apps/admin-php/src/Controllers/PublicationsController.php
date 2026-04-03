<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Http\Request;
use Abdou\AdminPhp\Repositories\PublicationsRepository;
use Abdou\AdminPhp\Support\Validation;
use Throwable;

final class PublicationsController
{
    private const STATUS_GENERATED = 'generated';
    private const STATUS_DEPLOYED = 'deployed';
    private const STATUS_FAILED = 'failed';

    public function index(): void
    {
        $status = (string)(Request::queryString('status', 'all') ?? 'all');
        $allowedStatus = ['all', 'draft', 'generating', 'generated', 'deployed', 'failed', 'archived'];
        if (!Validation::inSet($status, $allowedStatus)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_status',
                'allowed' => $allowedStatus,
            ]);
            return;
        }

        $programmeIdRaw = Request::queryString('programme_id');
        if ($programmeIdRaw !== null && !Validation::isPositiveIntString($programmeIdRaw)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_programme_id_query',
            ]);
            return;
        }

        try {
            $programmeId = $programmeIdRaw !== null ? (int)$programmeIdRaw : null;
            $page = Request::queryInt('page', 1, 1, 5000);
            $limit = Request::queryInt('limit', 20, 1, 100);

            $repository = new PublicationsRepository(ConnectionFactory::create());
            $result = $repository->list($status, $programmeId, $page, $limit);

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
                'error' => 'publications_list_failed',
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
            $repository = new PublicationsRepository(ConnectionFactory::create());
            $row = $repository->findById((int)$id);
            if ($row === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'publication_not_found',
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
                'error' => 'publication_read_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    /**
     * @param array<string, mixed> $authUser
     */
    public function create(array $authUser): void
    {
        $body = Request::jsonBody();
        $programmeId = isset($body['programme_id']) ? (string)$body['programme_id'] : '';
        if (!Validation::isPositiveIntString($programmeId)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_programme_id',
            ]);
            return;
        }

        try {
            $repository = new PublicationsRepository(ConnectionFactory::create());
            $created = $repository->createFromProgramme((int)$programmeId, (int)$authUser['id']);
            if ($created === null) {
                JsonResponse::send(400, [
                    'ok' => false,
                    'error' => 'publication_create_failed',
                    'message' => 'programme_or_template_unavailable',
                ]);
                return;
            }

            JsonResponse::send(201, [
                'ok' => true,
                'item' => $created,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'publication_create_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    public function updateStatus(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        $body = Request::jsonBody();
        $status = isset($body['status']) ? mb_strtolower(Validation::normalizeString($body['status'])) : '';
        $allowed = ['draft', 'generating', 'generated', 'deployed', 'failed', 'archived'];
        if (!Validation::inSet($status, $allowed)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_status',
                'allowed' => $allowed,
            ]);
            return;
        }

        try {
            $repository = new PublicationsRepository(ConnectionFactory::create());
            $current = $repository->findById((int)$id);
            if ($current === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'publication_not_found',
                ]);
                return;
            }

            $updated = $repository->updateStatus((int)$id, $status);
            JsonResponse::send(200, [
                'ok' => true,
                'item' => $updated,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'publication_update_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    public function deployments(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        try {
            $repository = new PublicationsRepository(ConnectionFactory::create());
            $publication = $repository->findById((int)$id);
            if ($publication === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'publication_not_found',
                ]);
                return;
            }

            $items = $repository->listDeployments((int)$id);
            JsonResponse::send(200, [
                'ok' => true,
                'count' => count($items),
                'items' => $items,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'publication_deployments_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    /**
     * @param array<string, mixed> $authUser
     */
    public function deploy(string $id, array $authUser): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        $body = Request::jsonBody();

        try {
            $repository = new PublicationsRepository(ConnectionFactory::create());
            $deployment = $repository->createDeployment((int)$id, (int)$authUser['id'], $body);
            if ($deployment === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'publication_not_found',
                ]);
                return;
            }

            $run = $this->runNodePublicationScript('deploy-publication.mjs', (int)$id);
            if (!$run['ok']) {
                $repository->updateStatus((int)$id, self::STATUS_FAILED);
            } else {
                $repository->updateStatus((int)$id, self::STATUS_DEPLOYED);
            }

            $parsed = $this->parseScriptOutput($run['stdout'], 'deploy-publication');
            $publication = $repository->findById((int)$id);
            JsonResponse::send(200, [
                'ok' => true,
                'deployment' => $deployment,
                'publication' => $publication,
                'local_deploy' => [
                    'ok' => $run['ok'],
                    'log_path' => $parsed['log'] ?? null,
                    'manifest_path' => $parsed['manifest'] ?? null,
                    'verify_log_path' => $parsed['verify_log'] ?? null,
                    'source_dir' => $parsed['source'] ?? null,
                    'target_dir' => $parsed['target'] ?? null,
                    'mode' => $parsed['mode'] ?? 'local',
                    'verify_status' => $parsed['verify_status'] ?? ($run['ok'] ? 'ok' : 'failed'),
                    'stdout' => $run['stdout'],
                    'stderr' => $run['stderr'],
                ],
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'publication_deploy_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    public function build(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        $publicationId = (int)$id;
        try {
            $repository = new PublicationsRepository(ConnectionFactory::create());
            $publication = $repository->findById($publicationId);
            if ($publication === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'publication_not_found',
                ]);
                return;
            }

            $run = $this->runNodePublicationScript('build-publication.mjs', $publicationId);
            $parsed = $this->parseScriptOutput($run['stdout'], 'build-publication');
            $statusSync = ['ok' => false, 'reason' => 'not_attempted'];

            if ($run['ok']) {
                $updated = $repository->updateStatus($publicationId, self::STATUS_GENERATED);
                $statusSync = [
                    'ok' => $updated !== null,
                    'status' => $updated !== null ? 200 : 500,
                ];
            }

            JsonResponse::send($run['ok'] ? 200 : 500, [
                'ok' => $run['ok'],
                'publication_id' => $publicationId,
                'output_path' => $parsed['output'] ?? null,
                'log_path' => $parsed['log'] ?? null,
                'stdout' => $run['stdout'],
                'stderr' => $run['stderr'],
                'status_sync' => $statusSync,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'publication_build_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    public function buildPreview(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        try {
            $repository = new PublicationsRepository(ConnectionFactory::create());
            $publicationId = (int)$id;
            $publication = $repository->findById($publicationId);
            if ($publication === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'publication_not_found',
                ]);
                return;
            }

            $buildRun = $this->runNodePublicationScript('build-publication.mjs', $publicationId);
            if (!$buildRun['ok']) {
                JsonResponse::send(500, [
                    'ok' => false,
                    'error' => 'publication_preview_build_failed',
                    'stdout' => $buildRun['stdout'],
                    'stderr' => $buildRun['stderr'],
                ]);
                return;
            }
            $repository->updateStatus($publicationId, self::STATUS_GENERATED);

            $deployRun = $this->runNodePublicationScript('deploy-publication.mjs', $publicationId, [
                '--targetDir=dist/preview',
                '--mode=local',
            ]);
            if (!$deployRun['ok']) {
                JsonResponse::send(500, [
                    'ok' => false,
                    'error' => 'publication_preview_deploy_failed',
                    'stdout' => $deployRun['stdout'],
                    'stderr' => $deployRun['stderr'],
                ]);
                return;
            }

            $buildParsed = $this->parseScriptOutput($buildRun['stdout'], 'build-publication');
            $minisitePath = (string)($buildParsed['output'] ?? '');
            $previewRoute = (string)($buildParsed['route'] ?? '');
            if ($previewRoute === '') {
                $previewRoute = $this->extractPreviewRouteFromOutput($minisitePath) ?? '';
            }
            $publicationAfter = $repository->findById($publicationId);

            JsonResponse::send(200, [
                'ok' => true,
                'preview' => [
                    'publication_id' => $publicationId,
                    'build_output' => $minisitePath,
                    'route' => $previewRoute !== '' ? $previewRoute : null,
                    'url' => $previewRoute !== '' ? 'https://abdou.wechwech.tn' . $previewRoute : null,
                ],
                'publication' => $publicationAfter,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'publication_preview_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    public function buildLog(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        $publicationId = (int)$id;
        $path = $this->projectRoot() . '/dist/logs/publications/publication-' . $publicationId . '.log';
        if (!is_file($path)) {
            JsonResponse::send(404, [
                'ok' => false,
                'error' => 'build_log_not_found',
                'publication_id' => $publicationId,
                'path' => $path,
            ]);
            return;
        }

        JsonResponse::send(200, [
            'ok' => true,
            'publication_id' => $publicationId,
            'path' => $path,
            'content' => (string)file_get_contents($path),
        ]);
    }

    public function deployLog(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        $publicationId = (int)$id;
        $path = $this->projectRoot() . '/dist/logs/deployments/publication-' . $publicationId . '.log';
        if (!is_file($path)) {
            JsonResponse::send(404, [
                'ok' => false,
                'error' => 'deploy_log_not_found',
                'publication_id' => $publicationId,
                'path' => $path,
            ]);
            return;
        }

        JsonResponse::send(200, [
            'ok' => true,
            'publication_id' => $publicationId,
            'path' => $path,
            'content' => (string)file_get_contents($path),
        ]);
    }

    public function deployManifest(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        $publicationId = (int)$id;
        $deployLog = $this->readDeployLogForPublication($publicationId);
        $manifestPath = $this->extractPathFromDeployLog($deployLog['content'], 'manifest=');
        if ($manifestPath === null || !is_file($manifestPath)) {
            JsonResponse::send(404, [
                'ok' => false,
                'error' => 'deploy_manifest_not_found',
                'publication_id' => $publicationId,
                'path' => $manifestPath ?? '',
            ]);
            return;
        }

        JsonResponse::send(200, [
            'ok' => true,
            'publication_id' => $publicationId,
            'path' => $manifestPath,
            'content' => (string)file_get_contents($manifestPath),
        ]);
    }

    public function deployVerifyLog(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        $publicationId = (int)$id;
        $deployLog = $this->readDeployLogForPublication($publicationId);
        $verifyPath = $this->extractPathFromDeployLog($deployLog['content'], 'log=');
        if ($verifyPath === null || !is_file($verifyPath)) {
            JsonResponse::send(404, [
                'ok' => false,
                'error' => 'deploy_verify_log_not_found',
                'publication_id' => $publicationId,
                'path' => $verifyPath ?? '',
            ]);
            return;
        }

        JsonResponse::send(200, [
            'ok' => true,
            'publication_id' => $publicationId,
            'path' => $verifyPath,
            'content' => (string)file_get_contents($verifyPath),
        ]);
    }

    public function deployArtifacts(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        $publicationId = (int)$id;
        $deployLog = $this->readDeployLogForPublication($publicationId);
        $manifestPath = $this->extractPathFromDeployLog($deployLog['content'], 'manifest=');
        $verifyPath = $this->extractPathFromDeployLog($deployLog['content'], 'log=');

        $manifestFound = $manifestPath !== null && is_file($manifestPath);
        $verifyFound = $verifyPath !== null && is_file($verifyPath);

        $payload = [
            'publication_id' => $publicationId,
            'manifest' => [
                'found' => $manifestFound,
                'path' => $manifestPath ?? '',
                'content' => $manifestFound ? (string)file_get_contents($manifestPath) : '',
            ],
            'verify_log' => [
                'found' => $verifyFound,
                'path' => $verifyPath ?? '',
                'content' => $verifyFound ? (string)file_get_contents($verifyPath) : '',
            ],
        ];

        if (!$manifestFound && !$verifyFound) {
            JsonResponse::send(404, [
                'ok' => false,
                'error' => 'deploy_artifacts_not_found',
                'publication_id' => $publicationId,
                'artifacts' => $payload,
            ]);
            return;
        }

        JsonResponse::send(200, [
            'ok' => true,
            'publication_id' => $publicationId,
            'artifacts' => $payload,
        ]);
    }

    public function deploySummary(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        $publicationId = (int)$id;
        $deployLog = $this->readDeployLogForPublication($publicationId);
        $summary = $this->buildDeploySummary($publicationId, $deployLog['content']);
        $hasData =
            $summary['source_dir'] !== '' ||
            $summary['target_dir'] !== '' ||
            $summary['mode'] !== '' ||
            $summary['verify_status'] !== '' ||
            $summary['status'] !== '';

        if (!$hasData) {
            JsonResponse::send(404, [
                'ok' => false,
                'error' => 'deploy_summary_not_found',
                'publication_id' => $publicationId,
                'summary' => $summary,
            ]);
            return;
        }

        JsonResponse::send(200, [
            'ok' => true,
            'publication_id' => $publicationId,
            'summary' => $summary,
        ]);
    }

    public function workflowDetail(string $id): void
    {
        if (!ctype_digit($id)) {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'invalid_id',
            ]);
            return;
        }

        $publicationId = (int)$id;
        try {
            $repository = new PublicationsRepository(ConnectionFactory::create());
            $detailItem = $repository->findById($publicationId);
            if ($detailItem === null) {
                JsonResponse::send(404, [
                    'ok' => false,
                    'error' => 'publication_not_found',
                ]);
                return;
            }

            $deployments = $repository->listDeployments($publicationId);
            $buildLogPath = $this->projectRoot() . '/dist/logs/publications/publication-' . $publicationId . '.log';
            $deployLogPath = $this->projectRoot() . '/dist/logs/deployments/publication-' . $publicationId . '.log';
            $buildLog = [
                'found' => is_file($buildLogPath),
                'path' => $buildLogPath,
                'content' => is_file($buildLogPath) ? (string)file_get_contents($buildLogPath) : '',
            ];
            $deployLog = [
                'found' => is_file($deployLogPath),
                'path' => $deployLogPath,
                'content' => is_file($deployLogPath) ? (string)file_get_contents($deployLogPath) : '',
            ];

            $manifestPath = $this->extractPathFromDeployLog($deployLog['content'], 'manifest=');
            $verifyPath = $this->extractPathFromDeployLog($deployLog['content'], 'log=');
            $deployArtifacts = [
                'publication_id' => $publicationId,
                'manifest' => [
                    'found' => $manifestPath !== null && is_file($manifestPath),
                    'path' => $manifestPath ?? '',
                    'content' => ($manifestPath !== null && is_file($manifestPath)) ? (string)file_get_contents($manifestPath) : '',
                ],
                'verify_log' => [
                    'found' => $verifyPath !== null && is_file($verifyPath),
                    'path' => $verifyPath ?? '',
                    'content' => ($verifyPath !== null && is_file($verifyPath)) ? (string)file_get_contents($verifyPath) : '',
                ],
            ];
            $deploySummary = $this->buildDeploySummary($publicationId, $deployLog['content']);

            JsonResponse::send(200, [
                'ok' => true,
                'publication_id' => $publicationId,
                'detail' => [
                    'ok' => true,
                    'item' => $detailItem,
                ],
                'deployments' => [
                    'ok' => true,
                    'count' => count($deployments),
                    'items' => $deployments,
                ],
                'build_log' => $buildLog,
                'deploy_log' => $deployLog,
                'deploy_artifacts' => $deployArtifacts,
                'deploy_summary' => $deploySummary,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'publication_workflow_detail_failed',
                'message' => $this->safeError($e),
            ]);
        }
    }

    /**
     * @return array{ok: bool, exit_code: int, stdout: string, stderr: string}
     */
    private function runNodePublicationScript(string $scriptName, int $publicationId, array $extraArgs = []): array
    {
        $projectRoot = $this->projectRoot();
        $script = $projectRoot . '/deploy/scripts/' . $scriptName;
        if (!is_file($script)) {
            return [
                'ok' => false,
                'exit_code' => 1,
                'stdout' => '',
                'stderr' => 'script_not_found:' . $script,
            ];
        }

        $nodeBin = defined('ABDOU_NODE_BIN') ? (string)ABDOU_NODE_BIN : 'node';
        $escapedExtraArgs = array_map(static fn (string $arg): string => escapeshellarg($arg), $extraArgs);
        $command = sprintf(
            '%s %s --publicationId=%d%s',
            escapeshellarg($nodeBin),
            escapeshellarg($script),
            $publicationId,
            $escapedExtraArgs !== [] ? ' ' . implode(' ', $escapedExtraArgs) : ''
        );

        $descriptors = [
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $pipes = [];
        $process = proc_open($command, $descriptors, $pipes, $projectRoot);
        if (!is_resource($process)) {
            return [
                'ok' => false,
                'exit_code' => 1,
                'stdout' => '',
                'stderr' => 'process_start_failed',
            ];
        }

        $stdout = isset($pipes[1]) ? (string)stream_get_contents($pipes[1]) : '';
        $stderr = isset($pipes[2]) ? (string)stream_get_contents($pipes[2]) : '';
        if (isset($pipes[1]) && is_resource($pipes[1])) {
            fclose($pipes[1]);
        }
        if (isset($pipes[2]) && is_resource($pipes[2])) {
            fclose($pipes[2]);
        }
        $exitCode = proc_close($process);

        return [
            'ok' => $exitCode === 0,
            'exit_code' => is_int($exitCode) ? $exitCode : 1,
            'stdout' => trim($stdout),
            'stderr' => trim($stderr),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function parseScriptOutput(string $stdout, string $prefix): array
    {
        $output = [];
        foreach (preg_split('/\r?\n/', $stdout) as $line) {
            if (!is_string($line)) {
                continue;
            }
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            $pattern = sprintf('/^\[%s\]\s+([a-z_]+)=(.+)$/i', preg_quote($prefix, '/'));
            if (preg_match($pattern, $line, $matches) === 1) {
                $output[strtolower($matches[1])] = trim($matches[2]);
            }
        }
        return $output;
    }

    /**
     * @return array{found: bool, path: string, content: string}
     */
    private function readDeployLogForPublication(int $publicationId): array
    {
        $path = $this->projectRoot() . '/dist/logs/deployments/publication-' . $publicationId . '.log';
        if (!is_file($path)) {
            return [
                'found' => false,
                'path' => $path,
                'content' => '',
            ];
        }

        return [
            'found' => true,
            'path' => $path,
            'content' => (string)file_get_contents($path),
        ];
    }

    private function extractPathFromDeployLog(string $content, string $marker): ?string
    {
        $lines = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $content) ?: []), static fn (string $line): bool => $line !== ''));
        for ($i = count($lines) - 1; $i >= 0; $i -= 1) {
            $line = $lines[$i];
            if ($marker === 'log=' && stripos($line, 'VERIFY') === false) {
                continue;
            }
            $pattern = sprintf('/%s([^\s]+)/i', preg_quote($marker, '/'));
            if (preg_match($pattern, $line, $matches) === 1 && isset($matches[1])) {
                return trim($matches[1]);
            }
        }

        return null;
    }

    /**
     * @return array{publication_id: int, source_dir: string, target_dir: string, mode: string, verify_status: string, status: string}
     */
    private function buildDeploySummary(int $publicationId, string $deployLogContent): array
    {
        $summary = [
            'publication_id' => $publicationId,
            'source_dir' => '',
            'target_dir' => '',
            'mode' => '',
            'verify_status' => '',
            'status' => '',
        ];

        foreach (preg_split('/\r?\n/', $deployLogContent) as $line) {
            if (!is_string($line)) {
                continue;
            }
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            if (preg_match('/\bSOURCE\s+(.+)$/', $line, $matches) === 1) {
                $summary['source_dir'] = trim($matches[1]);
            }
            if (preg_match('/\bTARGET\s+(.+)$/', $line, $matches) === 1) {
                $summary['target_dir'] = trim($matches[1]);
            }
            if (preg_match('/\bMODE\s+([^\s]+)$/', $line, $matches) === 1) {
                $summary['mode'] = trim($matches[1]);
            }
            if (preg_match('/\bVERIFY\b.*\bstatus=([^\s]+)/i', $line, $matches) === 1) {
                $summary['verify_status'] = trim($matches[1]);
            }
            if (preg_match('/\bDONE\s+status=([^\s]+)/i', $line, $matches) === 1) {
                $summary['status'] = trim($matches[1]);
            }
        }

        return $summary;
    }

    private function projectRoot(): string
    {
        return dirname(__DIR__, 4);
    }

    private function extractPreviewRouteFromOutput(string $outputPath): ?string
    {
        $path = str_replace('\\', '/', trim($outputPath));
        if ($path === '') {
            return null;
        }

        $marker = '/minisites/';
        $pos = strpos($path, $marker);
        if ($pos === false) {
            return null;
        }

        $suffix = substr($path, $pos + strlen($marker));
        if ($suffix === false || $suffix === '') {
            return null;
        }

        $parts = explode('/', $suffix);
        $slug = trim((string)($parts[0] ?? ''));
        if ($slug === '') {
            return null;
        }

        return '/minisites/' . $slug;
    }

    private function safeError(Throwable $e): string
    {
        if (ABDOU_APP_ENV === 'production') {
            return 'internal_error';
        }

        return $e->getMessage();
    }
}
