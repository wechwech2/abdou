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
    'Admin',
    'Abdou',
    'admin@abdou.local',
    '$2y$10$yY2ZiPaN.WBj84jdS4Upmew0aqbC.0883U818g4XUgVewR/vX4Eh2',
    1
FROM roles r
WHERE r.code = 'admin';
