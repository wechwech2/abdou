SELECT 'roles' AS table_name, COUNT(*) AS total FROM roles
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'offres', COUNT(*) FROM offres
UNION ALL
SELECT 'programmes', COUNT(*) FROM programmes
UNION ALL
SELECT 'publications', COUNT(*) FROM publications;
