<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class TemplatesRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listActive(string $q = '', int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        $where = ['is_active = 1'];
        $params = [];

        if ($q !== '') {
            $where[] = "CONCAT_WS(' ', code, name, version) LIKE :q";
            $params['q'] = '%' . $q . '%';
        }

        $whereSql = implode(' AND ', $where);
        $sql = <<<SQL
SELECT
    id,
    code,
    name,
    version,
    is_default,
    is_active,
    created_at,
    updated_at
FROM templates
WHERE {$whereSql}
ORDER BY id ASC
LIMIT :limit OFFSET :offset
SQL;

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue(':' . $k, $v, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        $countSql = "SELECT COUNT(*) AS total FROM templates WHERE {$whereSql}";
        $countStmt = $this->pdo->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue(':' . $k, $v, PDO::PARAM_STR);
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
        $stmt = $this->pdo->prepare(
            <<<SQL
SELECT
    id,
    code,
    name,
    version,
    is_default,
    is_active,
    created_at,
    updated_at
FROM templates
WHERE id = :id
LIMIT 1
SQL
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }
}
