<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Support;

final class Validation
{
    public static function normalizeString(mixed $value): string
    {
        return trim((string)$value);
    }

    public static function isPositiveIntString(mixed $value): bool
    {
        return ctype_digit((string)$value) && (int)$value > 0;
    }

    public static function isNonEmptyString(mixed $value): bool
    {
        return self::normalizeString($value) !== '';
    }

    public static function isValidCode(string $value): bool
    {
        return preg_match('/^[A-Z0-9_-]{2,50}$/', $value) === 1;
    }

    public static function isValidSlug(string $value): bool
    {
        return preg_match('/^[a-z0-9-]{2,180}$/', $value) === 1;
    }

    public static function isValidEmail(?string $value): bool
    {
        if ($value === null || trim($value) === '') {
            return true;
        }

        return filter_var($value, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * @param array<int, string> $allowed
     */
    public static function inSet(string $value, array $allowed): bool
    {
        return in_array($value, $allowed, true);
    }

    public static function uuidV4(): string
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
