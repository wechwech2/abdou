<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class OffresRepository
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
        $where = ['o.is_active = 1'];
        $params = [];
        if ($q !== '') {
            $where[] = "CONCAT_WS(' ', o.code, o.name, o.slug) LIKE :q";
            $params['q'] = '%' . $q . '%';
        }
        $whereSql = implode(' AND ', $where);

        $sql = <<<SQL
SELECT
    o.id,
    o.code,
    o.name,
    o.slug,
    o.description,
    o.template_id,
    t.code AS template_code,
    t.name AS template_name,
    o.max_rubriques,
    o.enable_lots,
    o.enable_documents,
    o.enable_gallery,
    o.enable_map,
    o.enable_contact_block,
    o.is_active,
    o.created_at,
    o.updated_at
FROM offres o
INNER JOIN templates t ON t.id = o.template_id
WHERE {$whereSql}
ORDER BY o.id ASC
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

        $countSql = "SELECT COUNT(*) AS total FROM offres o WHERE {$whereSql}";
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
        $sql = <<<SQL
SELECT
    o.id,
    o.code,
    o.name,
    o.slug,
    o.description,
    o.template_id,
    t.code AS template_code,
    t.name AS template_name,
    o.max_rubriques,
    o.enable_lots,
    o.enable_documents,
    o.enable_gallery,
    o.enable_map,
    o.enable_contact_block,
    o.is_active,
    o.created_at,
    o.updated_at
FROM offres o
INNER JOIN templates t ON t.id = o.template_id
WHERE o.id = :id
LIMIT 1
SQL;

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }
}
