<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';

use Abdou\AdminPhp\Http\Router;

$router = new Router();
$requestUri = (string)($_SERVER['REQUEST_URI'] ?? '/');
$parsedPath = parse_url($requestUri, PHP_URL_PATH) ?: '/';

if ($parsedPath === '/admin' || $parsedPath === '/admin/') {
    $dispatchUri = '/admin';
} elseif (str_starts_with($parsedPath, '/admin/')) {
    $suffix = substr($parsedPath, strlen('/admin'));
    $query = parse_url($requestUri, PHP_URL_QUERY);
    $dispatchUri = ($suffix !== '' ? $suffix : '/')
        . ($query !== null && $query !== '' ? '?' . $query : '');
} else {
    $dispatchUri = $requestUri;
}

$router->dispatch($dispatchUri, (string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
