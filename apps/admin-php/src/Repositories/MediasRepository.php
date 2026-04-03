<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class MediasRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function list(string $q = '', string $status = 'all', string $type = 'all', int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        $where = ['1 = 1'];
        $params = [];

        if ($status !== 'all') {
            $where[] = 'm.status = :status';
            $params['status'] = $status;
        }
        if ($type !== 'all') {
            $where[] = 'm.type = :type';
            $params['type'] = $type;
        }
        if ($q !== '') {
            $where[] = "CONCAT_WS(' ', m.original_filename, m.title, m.alt_text, m.caption) LIKE :q";
            $params['q'] = '%' . $q . '%';
        }
        $whereSql = implode(' AND ', $where);

        $sql = <<<SQL
SELECT
    m.id,
    m.uuid,
    m.type,
    m.mime_type,
    m.original_filename,
    m.storage_filename,
    m.storage_path,
    m.public_url,
    m.title,
    m.alt_text,
    m.caption,
    m.width,
    m.height,
    m.file_size,
    m.checksum,
    m.status,
    m.uploaded_by,
    m.created_at,
    m.updated_at
FROM medias m
WHERE {$whereSql}
ORDER BY m.id DESC
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

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) AS total FROM medias m WHERE {$whereSql}");
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
        $stmt = $this->pdo->prepare('SELECT * FROM medias WHERE id = :id LIMIT 1');
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
INSERT INTO medias (
    uuid,
    type,
    mime_type,
    original_filename,
    storage_filename,
    storage_path,
    public_url,
    title,
    alt_text,
    caption,
    width,
    height,
    file_size,
    checksum,
    status,
    uploaded_by
) VALUES (
    :uuid,
    :type,
    :mime_type,
    :original_filename,
    :storage_filename,
    :storage_path,
    :public_url,
    :title,
    :alt_text,
    :caption,
    :width,
    :height,
    :file_size,
    :checksum,
    :status,
    :uploaded_by
)
SQL
        );
        $stmt->execute([
            'uuid' => $payload['uuid'],
            'type' => $payload['type'],
            'mime_type' => $payload['mime_type'],
            'original_filename' => $payload['original_filename'],
            'storage_filename' => $payload['storage_filename'],
            'storage_path' => $payload['storage_path'],
            'public_url' => $payload['public_url'] ?? null,
            'title' => $payload['title'] ?? null,
            'alt_text' => $payload['alt_text'] ?? null,
            'caption' => $payload['caption'] ?? null,
            'width' => $payload['width'] ?? null,
            'height' => $payload['height'] ?? null,
            'file_size' => $payload['file_size'] ?? null,
            'checksum' => $payload['checksum'] ?? null,
            'status' => $payload['status'] ?? 'uploaded',
            'uploaded_by' => $payload['uploaded_by'] ?? null,
        ]);

        return $this->findById((int)$this->pdo->lastInsertId());
    }
}
