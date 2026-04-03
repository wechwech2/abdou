<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';

use Abdou\AdminPhp\Database\ConnectionFactory;

function readPublicationId(array $argv): ?int
{
    foreach ($argv as $arg) {
        if (!is_string($arg) || !str_starts_with($arg, '--publicationId=')) {
            continue;
        }
        $raw = substr($arg, strlen('--publicationId='));
        if ($raw === false || !ctype_digit($raw)) {
            return null;
        }
        $id = (int)$raw;
        return $id > 0 ? $id : null;
    }

    return null;
}

function fail(string $error, int $code = 1): never
{
    fwrite(STDERR, json_encode(['ok' => false, 'error' => $error], JSON_UNESCAPED_SLASHES) . PHP_EOL);
    exit($code);
}

function normalize_text(mixed $value): string
{
    $raw = is_string($value) ? $value : (is_numeric($value) ? (string)$value : '');
    $raw = trim($raw);
    if ($raw === '') {
        return '';
    }

    $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $raw);
    if (is_string($ascii) && $ascii !== '') {
        $raw = $ascii;
    }

    return mb_strtolower($raw);
}

function rubrique_matches(array $rubrique, array $keywords): bool
{
    $haystack = normalize_text(
        implode(' ', [
            (string)($rubrique['code'] ?? ''),
            (string)($rubrique['slug'] ?? ''),
            (string)($rubrique['title'] ?? ''),
        ])
    );
    if ($haystack === '') {
        return false;
    }

    foreach ($keywords as $keyword) {
        if (str_contains($haystack, normalize_text($keyword))) {
            return true;
        }
    }

    return false;
}

$publicationId = readPublicationId($argv ?? []);
if ($publicationId === null) {
    fail('invalid_publication_id');
}

try {
    $pdo = ConnectionFactory::create();

    $publicationStmt = $pdo->prepare(
        <<<SQL
SELECT
    pub.id AS publication_id,
    pub.build_code,
    pub.version_number,
    pub.status AS publication_status,
    pub.public_path,
    pub.published_url,
    pr.id AS programme_id,
    pr.code AS programme_code,
    pr.name AS programme_name,
    pr.slug AS programme_slug,
    pr.headline,
    pr.short_description,
    pr.full_description,
    pr.city,
    pr.target_domain,
    pr.target_path,
    pr.seo_title,
    pr.seo_description,
    o.id AS offre_id,
    o.code AS offre_code,
    o.name AS offre_name,
    o.enable_lots,
    o.enable_documents,
    o.enable_gallery,
    o.enable_map,
    t.id AS template_id,
    t.code AS template_code,
    t.name AS template_name
FROM publications pub
INNER JOIN programmes pr ON pr.id = pub.programme_id
INNER JOIN offres o ON o.id = pr.offre_id
LEFT JOIN templates t ON t.id = pub.template_id
WHERE pub.id = :publication_id
LIMIT 1
SQL
    );
    $publicationStmt->execute(['publication_id' => $publicationId]);
    $row = $publicationStmt->fetch();

    if ($row === false) {
        fail('publication_not_found', 2);
    }

    $programmeId = (int)$row['programme_id'];

    $rubriquesStmt = $pdo->prepare(
        <<<SQL
SELECT
    id,
    code,
    title,
    slug,
    content_html,
    content_text,
    display_order,
    is_menu_visible
FROM programme_rubriques
WHERE programme_id = :programme_id
  AND is_enabled = 1
ORDER BY display_order ASC, id ASC
SQL
    );
    $rubriquesStmt->execute(['programme_id' => $programmeId]);
    $rubriques = $rubriquesStmt->fetchAll();

    $mediasStmt = $pdo->prepare(
        <<<SQL
SELECT
    m.id,
    pm.usage_code,
    pm.display_order,
    pm.is_featured,
    m.type,
    COALESCE(NULLIF(m.public_url, ''), m.storage_path) AS public_url,
    m.title,
    m.alt_text,
    m.caption
FROM programme_medias pm
INNER JOIN medias m ON m.id = pm.media_id
WHERE pm.programme_id = :programme_id
  AND pm.is_published = 1
ORDER BY pm.display_order ASC, pm.id ASC
SQL
    );
    $mediasStmt->execute(['programme_id' => $programmeId]);
    $medias = $mediasStmt->fetchAll();

    $lotsStmt = $pdo->prepare(
        <<<SQL
SELECT
    l.id,
    l.reference,
    l.title,
    l.typology,
    l.surface_m2,
    l.price_label,
    l.commercial_status,
    l.short_description,
    l.batiment_id,
    b.code AS batiment_code,
    b.name AS batiment_name
FROM lots l
LEFT JOIN batiments b ON b.id = l.batiment_id
WHERE l.programme_id = :programme_id
  AND l.is_published = 1
ORDER BY l.display_order ASC, l.id ASC
SQL
    );
    $lotsStmt->execute(['programme_id' => $programmeId]);
    $lots = $lotsStmt->fetchAll();

    $batimentsStmt = $pdo->prepare(
        <<<SQL
SELECT DISTINCT
    b.id,
    b.code,
    b.name,
    b.display_order
FROM lots l
INNER JOIN batiments b ON b.id = l.batiment_id
WHERE l.programme_id = :programme_id
  AND l.is_published = 1
ORDER BY b.display_order ASC, b.id ASC
SQL
    );
    $batimentsStmt->execute(['programme_id' => $programmeId]);
    $batiments = $batimentsStmt->fetchAll();

    $imageMedias = [];
    $videoMedias = [];
    $documentMedias = [];
    $heroMedia = null;

    foreach ($medias as $media) {
        $type = (string)($media['type'] ?? '');
        $usageCode = normalize_text($media['usage_code'] ?? '');

        if ($heroMedia === null && str_contains($usageCode, 'hero')) {
            $heroMedia = $media;
        }

        if ($type === 'image') {
            $imageMedias[] = $media;
            continue;
        }
        if ($type === 'video') {
            $videoMedias[] = $media;
            continue;
        }
        if ($type === 'document') {
            $documentMedias[] = $media;
        }
    }

    if ($heroMedia === null && count($imageMedias) > 0) {
        $heroMedia = $imageMedias[0];
    }

    $environnementRubrique = null;
    $maquetteRubrique = null;
    $imagesRubrique = null;
    $videoRubrique = null;
    $documentationRubrique = null;

    foreach ($rubriques as $rubrique) {
        if ($environnementRubrique === null && rubrique_matches($rubrique, ['environnement', 'quartier', 'localisation', 'acces'])) {
            $environnementRubrique = $rubrique;
        }
        if ($maquetteRubrique === null && rubrique_matches($rubrique, ['maquette', 'lot', 'plan'])) {
            $maquetteRubrique = $rubrique;
        }
        if ($imagesRubrique === null && rubrique_matches($rubrique, ['image', 'galerie', 'photo'])) {
            $imagesRubrique = $rubrique;
        }
        if ($videoRubrique === null && rubrique_matches($rubrique, ['video', 'video'])) {
            $videoRubrique = $rubrique;
        }
        if ($documentationRubrique === null && rubrique_matches($rubrique, ['document', 'brochure', 'notice', 'plan'])) {
            $documentationRubrique = $rubrique;
        }
    }

    $hasLotsSection = count($lots) > 0;
    $hasEnvironnementSection = $environnementRubrique !== null || trim((string)($row['city'] ?? '')) !== '';
    $hasImagesSection = count($imageMedias) > 0;
    $hasVideoSection = count($videoMedias) > 0;
    $hasDocumentationSection = ((int)$row['enable_documents'] === 1) && count($documentMedias) > 0;

    $payload = [
        'ok' => true,
        'generated_at' => gmdate('c'),
        'publication' => [
            'id' => (int)$row['publication_id'],
            'build_code' => (string)$row['build_code'],
            'version_number' => (int)$row['version_number'],
            'status' => (string)$row['publication_status'],
            'public_path' => $row['public_path'],
            'published_url' => $row['published_url'],
        ],
        'programme' => [
            'id' => (int)$row['programme_id'],
            'code' => (string)$row['programme_code'],
            'name' => (string)$row['programme_name'],
            'slug' => (string)$row['programme_slug'],
            'headline' => $row['headline'],
            'short_description' => $row['short_description'],
            'full_description' => $row['full_description'],
            'city' => $row['city'],
            'target_domain' => $row['target_domain'],
            'target_path' => $row['target_path'],
            'seo_title' => $row['seo_title'],
            'seo_description' => $row['seo_description'],
        ],
        'offre' => [
            'id' => (int)$row['offre_id'],
            'code' => (string)$row['offre_code'],
            'name' => (string)$row['offre_name'],
            'enable_lots' => (bool)$row['enable_lots'],
            'enable_documents' => (bool)$row['enable_documents'],
            'enable_gallery' => (bool)$row['enable_gallery'],
            'enable_map' => (bool)$row['enable_map'],
        ],
        'template' => [
            'id' => $row['template_id'] !== null ? (int)$row['template_id'] : null,
            'code' => (string)($row['template_code'] ?? ''),
            'name' => (string)($row['template_name'] ?? ''),
        ],
        'hero' => [
            'title' => (string)$row['programme_name'],
            'subtitle' => $row['headline'] ?? $row['short_description'],
            'media' => $heroMedia,
        ],
        'rubriques' => $rubriques,
        'medias' => [
            'all' => $medias,
            'images' => $imageMedias,
            'videos' => $videoMedias,
            'documents' => $documentMedias,
        ],
        'batiments' => $batiments,
        'lots' => $lots,
        'sections' => [
            'environnement' => [
                'enabled' => $hasEnvironnementSection,
                'rubrique' => $environnementRubrique,
            ],
            'maquette_lots' => [
                'enabled' => $hasLotsSection,
                'rubrique' => $maquetteRubrique,
            ],
            'images' => [
                'enabled' => $hasImagesSection,
                'rubrique' => $imagesRubrique,
            ],
            'video' => [
                'enabled' => $hasVideoSection,
                'rubrique' => $videoRubrique,
            ],
            'documentation' => [
                'enabled' => $hasDocumentationSection,
                'rubrique' => $documentationRubrique,
            ],
        ],
    ];

    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;
    exit(0);
} catch (Throwable $e) {
    fail(ABDOU_APP_ENV === 'production' ? 'internal_error' : $e->getMessage());
}
