<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class LotsRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function list(string $q = '', ?int $programmeId = null, string $published = 'all', int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        $where = ['1 = 1'];
        $params = [];

        if ($programmeId !== null) {
            $where[] = 'l.programme_id = :programme_id';
            $params['programme_id'] = $programmeId;
        }
        if ($published === 'published') {
            $where[] = 'l.is_published = 1';
        } elseif ($published === 'unpublished') {
            $where[] = 'l.is_published = 0';
        }
        if ($q !== '') {
            $where[] = "CONCAT_WS(' ', l.reference, l.title, l.typology, l.commercial_status) LIKE :q";
            $params['q'] = '%' . $q . '%';
        }
        $whereSql = implode(' AND ', $where);

        $sql = <<<SQL
SELECT
    l.id,
    l.programme_id,
    l.batiment_id,
    l.etage_id,
    l.reference,
    l.title,
    l.typology,
    l.surface_m2,
    l.price_label,
    l.commercial_status,
    l.short_description,
    l.display_order,
    l.is_published,
    l.created_at,
    l.updated_at,
    p.code AS programme_code,
    p.name AS programme_name
FROM lots l
INNER JOIN programmes p ON p.id = l.programme_id
WHERE {$whereSql}
ORDER BY l.programme_id ASC, l.display_order ASC, l.id ASC
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

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) AS total FROM lots l WHERE {$whereSql}");
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
    l.*,
    p.code AS programme_code,
    p.name AS programme_name
FROM lots l
INNER JOIN programmes p ON p.id = l.programme_id
WHERE l.id = :id
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
INSERT INTO lots (
    programme_id,
    batiment_id,
    etage_id,
    reference,
    title,
    typology,
    surface_m2,
    price_label,
    commercial_status,
    short_description,
    display_order,
    is_published
) VALUES (
    :programme_id,
    :batiment_id,
    :etage_id,
    :reference,
    :title,
    :typology,
    :surface_m2,
    :price_label,
    :commercial_status,
    :short_description,
    :display_order,
    :is_published
)
SQL
        );
        $stmt->execute([
            'programme_id' => $payload['programme_id'],
            'batiment_id' => $payload['batiment_id'] ?? null,
            'etage_id' => $payload['etage_id'] ?? null,
            'reference' => $payload['reference'],
            'title' => $payload['title'] ?? null,
            'typology' => $payload['typology'] ?? null,
            'surface_m2' => $payload['surface_m2'] ?? null,
            'price_label' => $payload['price_label'] ?? null,
            'commercial_status' => $payload['commercial_status'] ?? null,
            'short_description' => $payload['short_description'] ?? null,
            'display_order' => $payload['display_order'] ?? 1,
            'is_published' => $payload['is_published'] ?? 1,
        ]);

        return $this->findById((int)$this->pdo->lastInsertId());
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>|null
     */
    public function update(int $id, array $payload): ?array
    {
        $allowed = [
            'reference',
            'title',
            'typology',
            'surface_m2',
            'price_label',
            'commercial_status',
            'short_description',
            'display_order',
            'is_published',
            'batiment_id',
            'etage_id',
        ];
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
        $sql = sprintf('UPDATE lots SET %s WHERE id = :id', implode(', ', $sets));
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $this->findById($id);
    }
}
