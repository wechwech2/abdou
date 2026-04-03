<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class DashboardRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        return [
            'clients' => [
                'total' => $this->count('clients'),
                'active' => $this->countByStatus('clients', 'status', 'active'),
                'inactive' => $this->countByStatus('clients', 'status', 'inactive'),
                'archived' => $this->countByStatus('clients', 'status', 'archived'),
            ],
            'programmes' => [
                'total' => $this->count('programmes'),
                'draft' => $this->countByStatus('programmes', 'status', 'draft'),
                'ready' => $this->countByStatus('programmes', 'status', 'ready'),
                'archived' => $this->countByStatus('programmes', 'status', 'archived'),
                'not_published' => $this->countByStatus('programmes', 'publication_status', 'not_published'),
                'generated' => $this->countByStatus('programmes', 'publication_status', 'generated'),
                'deployed' => $this->countByStatus('programmes', 'publication_status', 'deployed'),
                'failed' => $this->countByStatus('programmes', 'publication_status', 'failed'),
            ],
            'publications' => [
                'total' => $this->count('publications'),
                'draft' => $this->countByStatus('publications', 'status', 'draft'),
                'generating' => $this->countByStatus('publications', 'status', 'generating'),
                'generated' => $this->countByStatus('publications', 'status', 'generated'),
                'deployed' => $this->countByStatus('publications', 'status', 'deployed'),
                'failed' => $this->countByStatus('publications', 'status', 'failed'),
                'archived' => $this->countByStatus('publications', 'status', 'archived'),
            ],
            'deployments' => [
                'total' => $this->count('publication_deployments'),
                'pending' => $this->countByStatus('publication_deployments', 'deployment_status', 'pending'),
                'running' => $this->countByStatus('publication_deployments', 'deployment_status', 'running'),
                'success' => $this->countByStatus('publication_deployments', 'deployment_status', 'success'),
                'failed' => $this->countByStatus('publication_deployments', 'deployment_status', 'failed'),
                'rolled_back' => $this->countByStatus('publication_deployments', 'deployment_status', 'rolled_back'),
            ],
            'timestamp' => gmdate('c'),
        ];
    }

    private function count(string $table): int
    {
        $stmt = $this->pdo->query(sprintf('SELECT COUNT(*) AS total FROM %s', $table));
        $row = $stmt->fetch();
        return (int)($row['total'] ?? 0);
    }

    private function countByStatus(string $table, string $column, string $status): int
    {
        $stmt = $this->pdo->prepare(sprintf('SELECT COUNT(*) AS total FROM %s WHERE %s = :status', $table, $column));
        $stmt->execute(['status' => $status]);
        $row = $stmt->fetch();
        return (int)($row['total'] ?? 0);
    }
}
