<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Controllers;

use Abdou\AdminPhp\Auth\SessionAuth;
use Abdou\AdminPhp\Database\ConnectionFactory;
use Abdou\AdminPhp\Http\JsonResponse;
use Abdou\AdminPhp\Http\Request;
use Abdou\AdminPhp\Repositories\UsersRepository;
use Throwable;

final class AuthController
{
    public function login(): void
    {
        $body = Request::jsonBody();
        $email = isset($body['email']) ? (string)$body['email'] : '';
        $password = isset($body['password']) ? (string)$body['password'] : '';

        if ($email === '' || $password === '') {
            JsonResponse::send(400, [
                'ok' => false,
                'error' => 'missing_credentials',
            ]);
            return;
        }

        try {
            $pdo = ConnectionFactory::create();
            $users = new UsersRepository($pdo);
            $user = $users->findByEmail($email);

            if (
                $user === null ||
                (int)$user['is_active'] !== 1 ||
                (int)$user['role_is_active'] !== 1 ||
                !password_verify($password, (string)$user['password_hash'])
            ) {
                JsonResponse::send(401, [
                    'ok' => false,
                    'error' => 'invalid_credentials',
                ]);
                return;
            }

            $identity = [
                'id' => (int)$user['id'],
                'email' => (string)$user['email'],
                'first_name' => (string)$user['first_name'],
                'last_name' => (string)$user['last_name'],
                'role' => [
                    'id' => (int)$user['role_id'],
                    'code' => (string)$user['role_code'],
                    'label' => (string)$user['role_label'],
                ],
            ];

            SessionAuth::login($identity);
            $users->touchLastLogin((int)$user['id']);

            JsonResponse::send(200, [
                'ok' => true,
                'user' => $identity,
            ]);
        } catch (Throwable $e) {
            JsonResponse::send(500, [
                'ok' => false,
                'error' => 'auth_login_failed',
                'message' => ABDOU_APP_ENV === 'production' ? 'internal_error' : $e->getMessage(),
            ]);
        }
    }

    public function me(): void
    {
        $user = SessionAuth::user();
        if ($user === null) {
            JsonResponse::send(401, [
                'ok' => false,
                'error' => 'unauthorized',
            ]);
            return;
        }

        JsonResponse::send(200, [
            'ok' => true,
            'user' => $user,
        ]);
    }

    public function logout(): void
    {
        SessionAuth::logout();
        JsonResponse::send(200, [
            'ok' => true,
        ]);
    }
}
