<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class PublicationsRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(string $status = 'all', ?int $programmeId = null, int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        $where = ['1 = 1'];
        $params = [];

        if ($status !== 'all') {
            $where[] = 'p.status = :status';
            $params['status'] = $status;
        }
        if ($programmeId !== null) {
            $where[] = 'p.programme_id = :programme_id';
            $params['programme_id'] = $programmeId;
        }
        $whereSql = implode(' AND ', $where);

        $sql = <<<SQL
SELECT
    p.id,
    p.programme_id,
    p.version_number,
    p.build_code,
    p.template_id,
    p.status,
    p.build_path,
    p.public_path,
    p.published_url,
    p.started_at,
    p.generated_at,
    p.deployed_at,
    p.created_by,
    p.created_at,
    p.updated_at,
    pr.code AS programme_code,
    pr.name AS programme_name
FROM publications p
INNER JOIN programmes pr ON pr.id = p.programme_id
WHERE {$whereSql}
ORDER BY p.id DESC
LIMIT :limit OFFSET :offset
SQL;

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $type = is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue(':' . $k, $v, $type);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) AS total FROM publications p WHERE {$whereSql}");
        foreach ($params as $k => $v) {
            $type = is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $countStmt->bindValue(':' . $k, $v, $type);
        }
        $countStmt->execute();
        $total = (int)($countStmt->fetch()['total'] ?? 0);

        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array
    {
        $sql = <<<SQL
SELECT
    p.id,
    p.programme_id,
    p.version_number,
    p.build_code,
    p.template_id,
    p.status,
    p.source_snapshot_json,
    p.build_path,
    p.public_path,
    p.published_url,
    p.started_at,
    p.generated_at,
    p.deployed_at,
    p.created_by,
    p.created_at,
    p.updated_at,
    pr.code AS programme_code,
    pr.name AS programme_name
FROM publications p
INNER JOIN programmes pr ON pr.id = p.programme_id
WHERE p.id = :id
LIMIT 1
SQL;
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function createFromProgramme(int $programmeId, int $createdBy): ?array
    {
        $stmt = $this->pdo->prepare(
            <<<SQL
SELECT
    p.id,
    p.code,
    p.name,
    p.slug,
    p.target_domain,
    p.target_path,
    COALESCE(p.template_id, o.template_id) AS effective_template_id
FROM programmes p
INNER JOIN offres o ON o.id = p.offre_id
WHERE p.id = :id
LIMIT 1
SQL
        );
        $stmt->execute(['id' => $programmeId]);
        $programme = $stmt->fetch();
        if ($programme === false) {
            return null;
        }

        $templateId = $programme['effective_template_id'] !== null ? (int)$programme['effective_template_id'] : null;
        if ($templateId === null || $templateId <= 0) {
            return null;
        }

        $versionStmt = $this->pdo->prepare('SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM publications WHERE programme_id = :id');
        $versionStmt->execute(['id' => $programmeId]);
        $nextVersion = (int)($versionStmt->fetch()['next_version'] ?? 1);

        $buildCode = sprintf(
            '%s-v%03d-%s',
            (string)$programme['code'],
            $nextVersion,
            date('YmdHis')
        );

        $snapshot = [
            'programme_id' => (int)$programme['id'],
            'programme_code' => (string)$programme['code'],
            'programme_name' => (string)$programme['name'],
            'programme_slug' => (string)$programme['slug'],
        ];

        $insert = $this->pdo->prepare(
            <<<SQL
INSERT INTO publications (
    programme_id,
    version_number,
    build_code,
    template_id,
    status,
    source_snapshot_json,
    build_path,
    public_path,
    published_url,
    started_at,
    created_by
) VALUES (
    :programme_id,
    :version_number,
    :build_code,
    :template_id,
    'draft',
    :source_snapshot_json,
    :build_path,
    :public_path,
    :published_url,
    NOW(),
    :created_by
)
SQL
        );

        $buildPath = sprintf('dist/published-sites/%s/%s', (string)$programme['slug'], $buildCode);
        $publicPath = (string)($programme['target_path'] ?? '');
        $publishedUrl = $this->composePublishedUrl((string)($programme['target_domain'] ?? ''), (string)($programme['slug'] ?? ''));

        $insert->execute([
            'programme_id' => $programmeId,
            'version_number' => $nextVersion,
            'build_code' => $buildCode,
            'template_id' => $templateId,
            'source_snapshot_json' => json_encode($snapshot, JSON_UNESCAPED_SLASHES),
            'build_path' => $buildPath,
            'public_path' => $publicPath !== '' ? $publicPath : null,
            'published_url' => $publishedUrl,
            'created_by' => $createdBy,
        ]);

        return $this->findById((int)$this->pdo->lastInsertId());
    }

    /**
     * @return array<string, mixed>|null
     */
    public function updateStatus(int $id, string $status): ?array
    {
        $fields = ['status = :status'];
        if ($status === 'generated') {
            $fields[] = 'generated_at = NOW()';
        }
        if ($status === 'deployed') {
            $fields[] = 'deployed_at = NOW()';
        }
        $sql = sprintf('UPDATE publications SET %s WHERE id = :id', implode(', ', $fields));
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'id' => $id,
            'status' => $status,
        ]);

        return $this->findById($id);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listDeployments(int $publicationId): array
    {
        $stmt = $this->pdo->prepare(
            <<<SQL
SELECT
    id,
    publication_id,
    target_type,
    target_label,
    target_host,
    target_path,
    deployment_status,
    deployed_by,
    started_at,
    finished_at,
    log_excerpt,
    created_at
FROM publication_deployments
WHERE publication_id = :publication_id
ORDER BY id DESC
SQL
        );
        $stmt->execute(['publication_id' => $publicationId]);
        return $stmt->fetchAll();
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>|null
     */
    public function createDeployment(int $publicationId, int $userId, array $payload): ?array
    {
        $publication = $this->findById($publicationId);
        if ($publication === null) {
            return null;
        }

        $targetType = isset($payload['target_type']) ? (string)$payload['target_type'] : 'ovh_hosting_pro';
        $targetLabel = isset($payload['target_label']) ? (string)$payload['target_label'] : 'production';
        $targetHost = isset($payload['target_host']) ? (string)$payload['target_host'] : null;
        $targetPath = isset($payload['target_path']) ? (string)$payload['target_path'] : ((string)($publication['public_path'] ?? '/www'));
        $status = isset($payload['deployment_status']) ? (string)$payload['deployment_status'] : 'success';
        $logExcerpt = isset($payload['log_excerpt']) ? (string)$payload['log_excerpt'] : 'Deployment simulated by admin-php workflow.';

        $insert = $this->pdo->prepare(
            <<<SQL
INSERT INTO publication_deployments (
    publication_id,
    target_type,
    target_label,
    target_host,
    target_path,
    deployment_status,
    deployed_by,
    started_at,
    finished_at,
    log_excerpt
) VALUES (
    :publication_id,
    :target_type,
    :target_label,
    :target_host,
    :target_path,
    :deployment_status,
    :deployed_by,
    NOW(),
    NOW(),
    :log_excerpt
)
SQL
        );
        $insert->execute([
            'publication_id' => $publicationId,
            'target_type' => $targetType,
            'target_label' => $targetLabel,
            'target_host' => $targetHost,
            'target_path' => $targetPath,
            'deployment_status' => $status,
            'deployed_by' => $userId,
            'log_excerpt' => $logExcerpt,
        ]);

        $deploymentId = (int)$this->pdo->lastInsertId();
        $this->updateStatus($publicationId, 'deployed');

        $read = $this->pdo->prepare('SELECT * FROM publication_deployments WHERE id = :id LIMIT 1');
        $read->execute(['id' => $deploymentId]);
        $row = $read->fetch();

        return $row === false ? null : $row;
    }

    private function composePublishedUrl(string $domain, string $slug): ?string
    {
        $domain = trim($domain);
        if ($domain === '') {
            return null;
        }

        $slug = trim($slug);
        if ($slug === '') {
            return sprintf('https://%s', $domain);
        }

        return sprintf('https://%s/minisites/%s', $domain, $slug);
    }
}
