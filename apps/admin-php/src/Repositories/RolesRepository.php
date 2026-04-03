<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class RolesRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listActive(): array
    {
        $sql = <<<SQL
SELECT
    id,
    code,
    label,
    is_active,
    created_at,
    updated_at
FROM roles
WHERE is_active = 1
ORDER BY id ASC
SQL;

        return $this->pdo->query($sql)->fetchAll();
    }
}
