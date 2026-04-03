<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class RubriquesRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function list(string $q = '', ?int $programmeId = null, string $enabled = 'all', int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        $where = ['1 = 1'];
        $params = [];

        if ($programmeId !== null) {
            $where[] = 'r.programme_id = :programme_id';
            $params['programme_id'] = $programmeId;
        }
        if ($enabled === 'enabled') {
            $where[] = 'r.is_enabled = 1';
        } elseif ($enabled === 'disabled') {
            $where[] = 'r.is_enabled = 0';
        }
        if ($q !== '') {
            $where[] = "CONCAT_WS(' ', r.code, r.title, r.slug) LIKE :q";
            $params['q'] = '%' . $q . '%';
        }
        $whereSql = implode(' AND ', $where);

        $sql = <<<SQL
SELECT
    r.id,
    r.programme_id,
    r.code,
    r.title,
    r.slug,
    r.display_order,
    r.is_enabled,
    r.is_menu_visible,
    r.created_at,
    r.updated_at,
    p.code AS programme_code,
    p.name AS programme_name
FROM programme_rubriques r
INNER JOIN programmes p ON p.id = r.programme_id
WHERE {$whereSql}
ORDER BY r.programme_id ASC, r.display_order ASC, r.id ASC
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

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) AS total FROM programme_rubriques r WHERE {$whereSql}");
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
    r.*,
    p.code AS programme_code,
    p.name AS programme_name
FROM programme_rubriques r
INNER JOIN programmes p ON p.id = r.programme_id
WHERE r.id = :id
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
INSERT INTO programme_rubriques (
    programme_id,
    code,
    title,
    slug,
    content_html,
    content_text,
    display_order,
    is_enabled,
    is_menu_visible,
    settings_json
) VALUES (
    :programme_id,
    :code,
    :title,
    :slug,
    :content_html,
    :content_text,
    :display_order,
    :is_enabled,
    :is_menu_visible,
    :settings_json
)
SQL
        );
        $stmt->execute([
            'programme_id' => $payload['programme_id'],
            'code' => $payload['code'],
            'title' => $payload['title'],
            'slug' => $payload['slug'],
            'content_html' => $payload['content_html'] ?? null,
            'content_text' => $payload['content_text'] ?? null,
            'display_order' => $payload['display_order'] ?? 1,
            'is_enabled' => $payload['is_enabled'] ?? 1,
            'is_menu_visible' => $payload['is_menu_visible'] ?? 1,
            'settings_json' => $payload['settings_json'] ?? null,
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
            'title',
            'slug',
            'content_html',
            'content_text',
            'display_order',
            'is_enabled',
            'is_menu_visible',
            'settings_json',
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
        $sql = sprintf('UPDATE programme_rubriques SET %s WHERE id = :id', implode(', ', $sets));
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $this->findById($id);
    }
}
