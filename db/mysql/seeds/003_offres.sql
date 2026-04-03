INSERT INTO offres (
    code,
    name,
    slug,
    description,
    template_id,
    max_rubriques,
    enable_lots,
    enable_documents,
    enable_gallery,
    enable_map,
    enable_contact_block,
    is_active
)
SELECT
    'ESSENTIAL',
    'Offre Essential',
    'essential',
    'Offre minimale pour minisite de présentation avec contenu éditorial de base.',
    t.id,
    6,
    0,
    1,
    1,
    1,
    1,
    1
FROM templates t
WHERE t.code = 'default-minisite';

INSERT INTO offres (
    code,
    name,
    slug,
    description,
    template_id,
    max_rubriques,
    enable_lots,
    enable_documents,
    enable_gallery,
    enable_map,
    enable_contact_block,
    is_active
)
SELECT
    'BUSINESS',
    'Offre Business',
    'business',
    'Offre intermédiaire avec galerie enrichie, documents et structure éditoriale plus complète.',
    t.id,
    10,
    0,
    1,
    1,
    1,
    1,
    1
FROM templates t
WHERE t.code = 'default-minisite';

INSERT INTO offres (
    code,
    name,
    slug,
    description,
    template_id,
    max_rubriques,
    enable_lots,
    enable_documents,
    enable_gallery,
    enable_map,
    enable_contact_block,
    is_active
)
SELECT
    'PREMIUM',
    'Offre Premium',
    'premium',
    'Offre complète avec gestion des lots, contenu riche et publication avancée.',
    t.id,
    20,
    1,
    1,
    1,
    1,
    1,
    1
FROM templates t
WHERE t.code = 'premium-minisite';