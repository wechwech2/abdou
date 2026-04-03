CREATE TABLE programmes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    client_id BIGINT UNSIGNED NOT NULL,
    offre_id BIGINT UNSIGNED NOT NULL,
    template_id BIGINT UNSIGNED NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(190) NOT NULL,
    headline VARCHAR(255) NULL,
    short_description TEXT NULL,
    full_description MEDIUMTEXT NULL,
    city VARCHAR(100) NULL,
    address_line VARCHAR(255) NULL,
    postal_code VARCHAR(20) NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    hero_media_id BIGINT UNSIGNED NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    publication_status VARCHAR(30) NOT NULL DEFAULT 'not_published',
    target_path VARCHAR(255) NULL,
    target_domain VARCHAR(190) NULL,
    seo_title VARCHAR(255) NULL,
    seo_description TEXT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_programmes_code (code),
    UNIQUE KEY uq_programmes_slug (slug),
    CONSTRAINT fk_programmes_client
        FOREIGN KEY (client_id) REFERENCES clients(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
    CONSTRAINT fk_programmes_offre
        FOREIGN KEY (offre_id) REFERENCES offres(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
    CONSTRAINT fk_programmes_template
        FOREIGN KEY (template_id) REFERENCES templates(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL,
    CONSTRAINT fk_programmes_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL,
    CONSTRAINT fk_programmes_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;