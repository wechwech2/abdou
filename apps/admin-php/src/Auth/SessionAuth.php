<?php

declare(strict_types=1);

namespace Abdou\AdminPhp\Auth;

final class SessionAuth
{
    public static function login(array $identity): void
    {
        $_SESSION['auth_user'] = $identity;
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function user(): ?array
    {
        $user = $_SESSION['auth_user'] ?? null;
        return is_array($user) ? $user : null;
    }

    public static function logout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool)$params['secure'], (bool)$params['httponly']);
        }
        session_destroy();
    }
}
