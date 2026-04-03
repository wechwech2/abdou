INSERT INTO users (
    role_id,
    first_name,
    last_name,
    email,
    password_hash,
    is_active
)
SELECT
    r.id,
    'Operator',
    'Abdou',
    'operator@abdou.local',
    '$2y$10$yY2ZiPaN.WBj84jdS4Upmew0aqbC.0883U818g4XUgVewR/vX4Eh2',
    1
FROM roles r
WHERE r.code = 'content_operator';
