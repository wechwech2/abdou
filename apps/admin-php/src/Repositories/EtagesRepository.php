<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class EtagesRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function list(string $q = '', ?int $batimentId = null, int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        $where = ['1 = 1'];
        $params = [];

        if ($batimentId !== null) {
            $where[] = 'e.batiment_id = :batiment_id';
            $params['batiment_id'] = $batimentId;
        }
        if ($q !== '') {
            $where[] = "CONCAT_WS(' ', e.code, e.name, e.level_number) LIKE :q";
            $params['q'] = '%' . $q . '%';
        }
        $whereSql = implode(' AND ', $where);

        $sql = <<<SQL
SELECT
    e.id,
    e.batiment_id,
    e.code,
    e.name,
    e.level_number,
    e.display_order,
    e.created_at,
    e.updated_at,
    b.code AS batiment_code,
    b.name AS batiment_name,
    b.programme_id
FROM etages e
INNER JOIN batiments b ON b.id = e.batiment_id
WHERE {$whereSql}
ORDER BY e.batiment_id ASC, e.level_number ASC, e.display_order ASC, e.id ASC
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

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) AS total FROM etages e WHERE {$whereSql}");
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
    e.*,
    b.code AS batiment_code,
    b.name AS batiment_name,
    b.programme_id
FROM etages e
INNER JOIN batiments b ON b.id = e.batiment_id
WHERE e.id = :id
LIMIT 1
SQL
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>|null
     */
    public function create(array $payload): ?array
    {
        $stmt = $this->pdo->prepare(
            <<<SQL
INSERT INTO etages (
    batiment_id,
    code,
    name,
    level_number,
    display_order
) VALUES (
    :batiment_id,
    :code,
    :name,
    :level_number,
    :display_order
)
SQL
        );
        $stmt->execute([
            'batiment_id' => $payload['batiment_id'],
            'code' => $payload['code'],
            'name' => $payload['name'],
            'level_number' => $payload['level_number'],
            'display_order' => $payload['display_order'] ?? 1,
        ]);

        return $this->findById((int)$this->pdo->lastInsertId());
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>|null
     */
    public function update(int $id, array $payload): ?array
    {
        $allowed = ['code', 'name', 'level_number', 'display_order'];
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
        $sql = sprintf('UPDATE etages SET %s WHERE id = :id', implode(', ', $sets));
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $this->findById($id);
    }
}
