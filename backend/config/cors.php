<?php

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS) Configuration
|--------------------------------------------------------------------------
|
| L'API s'authentifie par JWT (header Authorization: Bearer), pas par cookie
| de session. `supports_credentials` doit donc rester à false : cela permet
| de refuser catégoriquement l'envoi de cookies cross-origin.
|
| Les origines autorisées sont pilotées par CORS_ALLOWED_ORIGINS (liste
| séparée par des virgules), avec repli sur FRONTEND_URL.
|
| https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
|
*/

/** Découpe une variable d'env "a,b,c" en tableau nettoyé. */
$list = static fn (?string $value): array => array_values(array_filter(
    array_map(trim(...), explode(',', (string) $value)),
    static fn (string $item): bool => $item !== '',
));

/**
 * Le header Origin envoyé par le navigateur n'a jamais de slash final :
 * "https://exemple.com/" ne matcherait pas et la requête serait bloquée.
 */
$origins = array_map(
    static fn (string $origin): string => rtrim($origin, '/'),
    $list(env('CORS_ALLOWED_ORIGINS') ?: env('FRONTEND_URL', 'http://localhost:5174')),
);

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => $origins,

    // Regex complètes, délimiteurs inclus. Ex. pour les previews Vercel :
    // CORS_ALLOWED_ORIGIN_PATTERNS="#^https://mk-bazaar-[a-z0-9-]+\.vercel\.app$#"
    'allowed_origins_patterns' => $list(env('CORS_ALLOWED_ORIGIN_PATTERNS')),

    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],

    'exposed_headers' => [],

    // Durée de mise en cache du preflight OPTIONS par le navigateur (secondes).
    'max_age' => (int) env('CORS_MAX_AGE', 86400),

    'supports_credentials' => false,

];
