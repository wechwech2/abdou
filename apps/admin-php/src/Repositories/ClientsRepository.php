<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class ClientsRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(string $q = '', string $status = 'active', int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        $where = [];
        $params = [];

        if ($status !== 'all') {
            $where[] = 'status = :status';
            $params['status'] = $status;
        }
        if ($q !== '') {
            $where[] = "CONCAT_WS(' ', code, name, slug, IFNULL(contact_email, '')) LIKE :q";
            $params['q'] = '%' . $q . '%';
        }
        if ($where === []) {
            $where[] = '1 = 1';
        }
        $whereSql = implode(' AND ', $where);

        $sql = <<<SQL
SELECT
    id,
    code,
    name,
    slug,
    legal_name,
    contact_name,
    contact_email,
    contact_phone,
    brand_primary_color,
    brand_secondary_color,
    status,
    created_at,
    updated_at
FROM clients
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

        $countSql = "SELECT COUNT(*) AS total FROM clients WHERE {$whereSql}";
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
    slug,
    legal_name,
    contact_name,
    contact_email,
    contact_phone,
    brand_primary_color,
    brand_secondary_color,
    status,
    notes,
    created_at,
    updated_at
FROM clients
WHERE id = :id
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
INSERT INTO clients (
    code,
    name,
    slug,
    legal_name,
    contact_name,
    contact_email,
    contact_phone,
    brand_primary_color,
    brand_secondary_color,
    status,
    notes
) VALUES (
    :code,
    :name,
    :slug,
    :legal_name,
    :contact_name,
    :contact_email,
    :contact_phone,
    :brand_primary_color,
    :brand_secondary_color,
    :status,
    :notes
)
SQL
        );

        $stmt->execute([
            'code' => $payload['code'],
            'name' => $payload['name'],
            'slug' => $payload['slug'],
            'legal_name' => $payload['legal_name'] ?? null,
            'contact_name' => $payload['contact_name'] ?? null,
            'contact_email' => $payload['contact_email'] ?? null,
            'contact_phone' => $payload['contact_phone'] ?? null,
            'brand_primary_color' => $payload['brand_primary_color'] ?? null,
            'brand_secondary_color' => $payload['brand_secondary_color'] ?? null,
            'status' => $payload['status'] ?? 'active',
            'notes' => $payload['notes'] ?? null,
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
            'name',
            'slug',
            'legal_name',
            'contact_name',
            'contact_email',
            'contact_phone',
            'brand_primary_color',
            'brand_secondary_color',
            'status',
            'notes',
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

        $sql = sprintf('UPDATE clients SET %s WHERE id = :id', implode(', ', $sets));
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $this->findById($id);
    }
}
