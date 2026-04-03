CREATE TABLE medias (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    uuid CHAR(36) NOT NULL,
    type VARCHAR(30) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(500) NULL,
    title VARCHAR(180) NULL,
    alt_text VARCHAR(255) NULL,
    caption TEXT NULL,
    width INT UNSIGNED NULL,
    height INT UNSIGNED NULL,
    file_size BIGINT UNSIGNED NULL,
    checksum VARCHAR(128) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'uploaded',
    uploaded_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_medias_uuid (uuid),
    CONSTRAINT fk_medias_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE clients
    ADD CONSTRAINT fk_clients_logo_media
        FOREIGN KEY (logo_media_id) REFERENCES medias(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL;

ALTER TABLE programmes
    ADD CONSTRAINT fk_programmes_hero_media
        FOREIGN KEY (hero_media_id) REFERENCES medias(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL;

CREATE TABLE programme_medias (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    programme_id BIGINT UNSIGNED NOT NULL,
    media_id BIGINT UNSIGNED NOT NULL,
    rubrique_id BIGINT UNSIGNED NULL,
    lot_id BIGINT UNSIGNED NULL,
    usage_code VARCHAR(50) NOT NULL,
    display_order INT UNSIGNED NOT NULL DEFAULT 1,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_programme_medias_programme
        FOREIGN KEY (programme_id) REFERENCES programmes(id)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,
    CONSTRAINT fk_programme_medias_media
        FOREIGN KEY (media_id) REFERENCES medias(id)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,
    CONSTRAINT fk_programme_medias_rubrique
        FOREIGN KEY (rubrique_id) REFERENCES programme_rubriques(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;