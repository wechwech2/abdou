<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Http;

final class JsonResponse
{
    public static function send(int $status, array $payload): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    }
}
