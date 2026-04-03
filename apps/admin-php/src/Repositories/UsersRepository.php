<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Repositories;

use PDO;

final class UsersRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByEmail(string $email): ?array
    {
        $sql = <<<SQL
SELECT
    u.id,
    u.role_id,
    r.code AS role_code,
    r.label AS role_label,
    u.first_name,
    u.last_name,
    u.email,
    u.password_hash,
    u.is_active,
    r.is_active AS role_is_active,
    u.last_login_at,
    u.created_at,
    u.updated_at
FROM users u
INNER JOIN roles r ON r.id = u.role_id
WHERE u.email = :email
LIMIT 1
SQL;

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['email' => mb_strtolower(trim($email))]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listActive(): array
    {
        $sql = <<<SQL
SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.is_active,
    u.last_login_at,
    u.created_at,
    u.updated_at,
    r.id AS role_id,
    r.code AS role_code,
    r.label AS role_label
FROM users u
INNER JOIN roles r ON r.id = u.role_id
WHERE u.is_active = 1
ORDER BY u.id ASC
SQL;
        return $this->pdo->query($sql)->fetchAll();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            <<<SQL
SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.is_active,
    u.last_login_at,
    u.created_at,
    u.updated_at,
    r.id AS role_id,
    r.code AS role_code,
    r.label AS role_label
FROM users u
INNER JOIN roles r ON r.id = u.role_id
WHERE u.id = :id
LIMIT 1
SQL
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    public function touchLastLogin(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
