<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class BatimentsRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function list(string $q = '', ?int $programmeId = null, string $active = 'all', int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        $where = ['1 = 1'];
        $params = [];

        if ($programmeId !== null) {
            $where[] = 'b.programme_id = :programme_id';
            $params['programme_id'] = $programmeId;
        }
        if ($active === 'active') {
            $where[] = 'b.is_active = 1';
        } elseif ($active === 'inactive') {
            $where[] = 'b.is_active = 0';
        }
        if ($q !== '') {
            $where[] = "CONCAT_WS(' ', b.code, b.name) LIKE :q";
            $params['q'] = '%' . $q . '%';
        }
        $whereSql = implode(' AND ', $where);

        $sql = <<<SQL
SELECT
    b.id,
    b.programme_id,
    b.code,
    b.name,
    b.display_order,
    b.is_active,
    b.created_at,
    b.updated_at,
    p.code AS programme_code,
    p.name AS programme_name
FROM batiments b
INNER JOIN programmes p ON p.id = b.programme_id
WHERE {$whereSql}
ORDER BY b.programme_id ASC, b.display_order ASC, b.id ASC
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

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) AS total FROM batiments b WHERE {$whereSql}");
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
        $stmt = $this->pdo->prepare(
            <<<SQL
SELECT
    b.*,
    p.code AS programme_code,
    p.name AS programme_name
FROM batiments b
INNER JOIN programmes p ON p.id = b.programme_id
WHERE b.id = :id
LIMIT 1
SQL
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function create(array $payload): ?array
    {
        $stmt = $this->pdo->prepare(
            <<<SQL
INSERT INTO batiments (
    programme_id,
    code,
    name,
    display_order,
    is_active
) VALUES (
    :programme_id,
    :code,
    :name,
    :display_order,
    :is_active
)
SQL
        );
        $stmt->execute([
            'programme_id' => $payload['programme_id'],
            'code' => $payload['code'],
            'name' => $payload['name'],
            'display_order' => $payload['display_order'] ?? 1,
            'is_active' => $payload['is_active'] ?? 1,
        ]);

        return $this->findById((int)$this->pdo->lastInsertId());
    }

    /**
     * @return array<string, mixed>|null
     */
    public function update(int $id, array $payload): ?array
    {
        $allowed = ['code', 'name', 'display_order', 'is_active'];
        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $payload)) {
                $sets[] = "$field = :$field";
                $params[$field] = $payload[$field];
            }
        }
        if ($sets === []) {
            return $this->findById($id);
        }
        $sql = sprintf('UPDATE batiments SET %s WHERE id = :id', implode(', ', $sets));
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $this->findById($id);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listEtages(int $batimentId): array
    {
        $stmt = $this->pdo->prepare(
            <<<SQL
SELECT
    e.id,
    e.batiment_id,
    e.code,
    e.name,
    e.level_number,
    e.display_order,
    e.created_at,
    e.updated_at
FROM etages e
WHERE e.batiment_id = :batiment_id
ORDER BY e.level_number ASC, e.display_order ASC, e.id ASC
SQL
        );
        $stmt->execute(['batiment_id' => $batimentId]);
        return $stmt->fetchAll();
    }
}
