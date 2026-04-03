CREATE TABLE batiments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    programme_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    display_order INT UNSIGNED NOT NULL DEFAULT 1,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_batiments_programme_code (programme_id, code),
    CONSTRAINT fk_batiments_programme
        FOREIGN KEY (programme_id) REFERENCES programmes(id)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE etages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    batiment_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    level_number INT NOT NULL,
    display_order INT UNSIGNED NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_etages_batiment_code (batiment_id, code),
    CONSTRAINT fk_etages_batiment
        FOREIGN KEY (batiment_id) REFERENCES batiments(id)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lots (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    programme_id BIGINT UNSIGNED NOT NULL,
    batiment_id BIGINT UNSIGNED NULL,
    etage_id BIGINT UNSIGNED NULL,
    reference VARCHAR(80) NOT NULL,
    title VARCHAR(180) NULL,
    typology VARCHAR(100) NULL,
    surface_m2 DECIMAL(10,2) NULL,
    price_label VARCHAR(100) NULL,
    commercial_status VARCHAR(50) NULL,
    short_description TEXT NULL,
    display_order INT UNSIGNED NOT NULL DEFAULT 1,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_lots_programme_reference (programme_id, reference),
    CONSTRAINT fk_lots_programme
        FOREIGN KEY (programme_id) REFERENCES programmes(id)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,
    CONSTRAINT fk_lots_batiment
        FOREIGN KEY (batiment_id) REFERENCES batiments(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL,
    CONSTRAINT fk_lots_etage
        FOREIGN KEY (etage_id) REFERENCES etages(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE programme_medias
    ADD CONSTRAINT fk_programme_medias_lot
        FOREIGN KEY (lot_id) REFERENCES lots(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL;