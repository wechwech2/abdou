# Routing notes

Objectif : conserver des URLs publiques lisibles et stables pour un site statique.

Principes :
- privilegier des chemins bases sur les slugs ;
- eviter les query params techniques en URL primaire ;
- gerer le fallback vers `index.html` via `.htaccess.public`.
