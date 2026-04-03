<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class ProgrammesRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listAll(string $q = '', string $status = 'all', ?int $clientId = null, ?int $offreId = null, int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        $where = ['1 = 1'];
        $params = [];

        if ($status !== 'all') {
            $where[] = 'p.status = :status';
            $params['status'] = $status;
        }
        if ($clientId !== null) {
            $where[] = 'p.client_id = :client_id';
            $params['client_id'] = $clientId;
        }
        if ($offreId !== null) {
            $where[] = 'p.offre_id = :offre_id';
            $params['offre_id'] = $offreId;
        }
        if ($q !== '') {
            $where[] = "CONCAT_WS(' ', p.code, p.name, p.slug, IFNULL(p.city, '')) LIKE :q";
            $params['q'] = '%' . $q . '%';
        }
        $whereSql = implode(' AND ', $where);

        $sql = <<<SQL
SELECT
    p.id,
    p.code,
    p.name,
    p.slug,
    p.status,
    p.publication_status,
    p.city,
    p.target_domain,
    p.target_path,
    p.created_at,
    p.updated_at,
    c.id AS client_id,
    c.code AS client_code,
    c.name AS client_name,
    o.id AS offre_id,
    o.code AS offre_code,
    o.name AS offre_name,
    t.id AS template_id,
    t.code AS template_code,
    t.name AS template_name
FROM programmes p
INNER JOIN clients c ON c.id = p.client_id
INNER JOIN offres o ON o.id = p.offre_id
LEFT JOIN templates t ON t.id = p.template_id
WHERE {$whereSql}
ORDER BY p.id ASC
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

        $countSql = <<<SQL
SELECT COUNT(*) AS total
FROM programmes p
INNER JOIN clients c ON c.id = p.client_id
INNER JOIN offres o ON o.id = p.offre_id
LEFT JOIN templates t ON t.id = p.template_id
WHERE {$whereSql}
SQL;
        $countStmt = $this->pdo->prepare($countSql);
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
    p.code,
    p.name,
    p.slug,
    p.headline,
    p.short_description,
    p.full_description,
    p.city,
    p.address_line,
    p.postal_code,
    p.latitude,
    p.longitude,
    p.status,
    p.publication_status,
    p.target_domain,
    p.target_path,
    p.seo_title,
    p.seo_description,
    p.created_at,
    p.updated_at,
    c.id AS client_id,
    c.code AS client_code,
    c.name AS client_name,
    o.id AS offre_id,
    o.code AS offre_code,
    o.name AS offre_name,
    t.id AS template_id,
    t.code AS template_code,
    t.name AS template_name
FROM programmes p
INNER JOIN clients c ON c.id = p.client_id
INNER JOIN offres o ON o.id = p.offre_id
LEFT JOIN templates t ON t.id = p.template_id
WHERE p.id = :id
LIMIT 1
SQL;

        $stmt = $this->pdo->prepare($sql);
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
INSERT INTO programmes (
    client_id,
    offre_id,
    template_id,
    code,
    name,
    slug,
    headline,
    short_description,
    city,
    status,
    publication_status,
    target_path,
    target_domain
) VALUES (
    :client_id,
    :offre_id,
    :template_id,
    :code,
    :name,
    :slug,
    :headline,
    :short_description,
    :city,
    :status,
    :publication_status,
    :target_path,
    :target_domain
)
SQL
        );

        $stmt->execute([
            'client_id' => $payload['client_id'],
            'offre_id' => $payload['offre_id'],
            'template_id' => $payload['template_id'] ?? null,
            'code' => $payload['code'],
            'name' => $payload['name'],
            'slug' => $payload['slug'],
            'headline' => $payload['headline'] ?? null,
            'short_description' => $payload['short_description'] ?? null,
            'city' => $payload['city'] ?? null,
            'status' => $payload['status'] ?? 'draft',
            'publication_status' => $payload['publication_status'] ?? 'not_published',
            'target_path' => $payload['target_path'] ?? null,
            'target_domain' => $payload['target_domain'] ?? null,
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
            'client_id',
            'offre_id',
            'template_id',
            'name',
            'slug',
            'headline',
            'short_description',
            'city',
            'status',
            'publication_status',
            'target_path',
            'target_domain',
            'seo_title',
            'seo_description',
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

        $sql = sprintf('UPDATE programmes SET %s WHERE id = :id', implode(', ', $sets));
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $this->findById($id);
    }
}
