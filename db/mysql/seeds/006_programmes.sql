INSERT INTO programmes (
    client_id,
    offre_id,
    template_id,
    code,
    name,
    slug,
    headline,
    short_description,
    city,
    status,
    publication_status,
    target_path,
    target_domain
)
SELECT
    c.id,
    o.id,
    t.id,
    'PRG-0001',
    'Residence Horizon',
    'residence-horizon',
    'Une adresse moderne au coeur de la ville',
    'Programme de demonstration pour le socle admin PHP.',
    'Tunis',
    'draft',
    'not_published',
    '/www/minisites/residence-horizon',
    'abdou.wechwech.tn'
FROM clients c
INNER JOIN offres o ON o.code = 'ESSENTIAL'
INNER JOIN templates t ON t.code = 'default-minisite'
WHERE c.code = 'ARA'
LIMIT 1;
