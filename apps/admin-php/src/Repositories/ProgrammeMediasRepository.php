<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class ProgrammeMediasRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listByProgramme(int $programmeId): array
    {
        $stmt = $this->pdo->prepare(
            <<<SQL
SELECT
    pm.id,
    pm.programme_id,
    pm.media_id,
    pm.rubrique_id,
    pm.lot_id,
    pm.usage_code,
    pm.display_order,
    pm.is_featured,
    pm.is_published,
    pm.created_at,
    pm.updated_at,
    m.type AS media_type,
    m.mime_type,
    m.public_url,
    m.storage_path,
    m.title,
    m.alt_text,
    m.caption
FROM programme_medias pm
INNER JOIN medias m ON m.id = pm.media_id
WHERE pm.programme_id = :programme_id
ORDER BY pm.display_order ASC, pm.id ASC
SQL
        );
        $stmt->execute(['programme_id' => $programmeId]);
        return $stmt->fetchAll();
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>|null
     */
    public function create(array $payload): ?array
    {
        $stmt = $this->pdo->prepare(
            <<<SQL
INSERT INTO programme_medias (
    programme_id,
    media_id,
    rubrique_id,
    lot_id,
    usage_code,
    display_order,
    is_featured,
    is_published
) VALUES (
    :programme_id,
    :media_id,
    :rubrique_id,
    :lot_id,
    :usage_code,
    :display_order,
    :is_featured,
    :is_published
)
SQL
        );
        $stmt->execute([
            'programme_id' => $payload['programme_id'],
            'media_id' => $payload['media_id'],
            'rubrique_id' => $payload['rubrique_id'] ?? null,
            'lot_id' => $payload['lot_id'] ?? null,
            'usage_code' => $payload['usage_code'],
            'display_order' => $payload['display_order'] ?? 1,
            'is_featured' => $payload['is_featured'] ?? 0,
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
        $allowed = ['usage_code', 'display_order', 'is_featured', 'is_published', 'rubrique_id', 'lot_id'];
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

        $stmt = $this->pdo->prepare(sprintf('UPDATE programme_medias SET %s WHERE id = :id', implode(', ', $sets)));
        $stmt->execute($params);
        return $this->findById($id);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM programme_medias WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            <<<SQL
SELECT
    pm.*,
    m.type AS media_type,
    m.mime_type,
    m.public_url,
    m.storage_path,
    m.title,
    m.alt_text,
    m.caption
FROM programme_medias pm
INNER JOIN medias m ON m.id = pm.media_id
WHERE pm.id = :id
LIMIT 1
SQL
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }
}

