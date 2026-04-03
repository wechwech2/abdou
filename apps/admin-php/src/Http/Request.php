<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Http;

final class Request
{
    /**
     * @return array<string, mixed>
     */
    public static function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return [];
        }

        return $decoded;
    }

    public static function queryString(string $key, ?string $default = null): ?string
    {
        $value = $_GET[$key] ?? null;
        if ($value === null) {
            return $default;
        }

        $value = trim((string)$value);
        return $value === '' ? $default : $value;
    }

    public static function queryInt(string $key, int $default, int $min = 1, int $max = 1000): int
    {
        $raw = $_GET[$key] ?? null;
        if ($raw === null || $raw === '') {
            return $default;
        }

        if (!is_numeric($raw)) {
            return $default;
        }

        $value = (int)$raw;
        if ($value < $min) {
            return $min;
        }
        if ($value > $max) {
            return $max;
        }

        return $value;
    }
}
