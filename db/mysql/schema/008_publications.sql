CREATE TABLE publications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    programme_id BIGINT UNSIGNED NOT NULL,
    version_number INT UNSIGNED NOT NULL,
    build_code VARCHAR(100) NOT NULL,
    template_id BIGINT UNSIGNED NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    source_snapshot_json JSON NULL,
    build_path VARCHAR(500) NULL,
    public_path VARCHAR(500) NULL,
    published_url VARCHAR(500) NULL,
    started_at DATETIME NULL,
    generated_at DATETIME NULL,
    deployed_at DATETIME NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_publications_build_code (build_code),
    UNIQUE KEY uq_publications_programme_version (programme_id, version_number),
    CONSTRAINT fk_publications_programme
        FOREIGN KEY (programme_id) REFERENCES programmes(id)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,
    CONSTRAINT fk_publications_template
        FOREIGN KEY (template_id) REFERENCES templates(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
    CONSTRAINT fk_publications_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE publication_assets (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    publication_id BIGINT UNSIGNED NOT NULL,
    media_id BIGINT UNSIGNED NULL,
    relative_output_path VARCHAR(500) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_publication_assets_publication
        FOREIGN KEY (publication_id) REFERENCES publications(id)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,
    CONSTRAINT fk_publication_assets_media
        FOREIGN KEY (media_id) REFERENCES medias(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE publication_deployments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    publication_id BIGINT UNSIGNED NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_label VARCHAR(100) NOT NULL,
    target_host VARCHAR(190) NULL,
    target_path VARCHAR(500) NOT NULL,
    deployment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    deployed_by BIGINT UNSIGNED NULL,
    started_at DATETIME NULL,
    finished_at DATETIME NULL,
    log_excerpt MEDIUMTEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_publication_deployments_publication
        FOREIGN KEY (publication_id) REFERENCES publications(id)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,
    CONSTRAINT fk_publication_deployments_user
        FOREIGN KEY (deployed_by) REFERENCES users(id)
        ON UPDATE RESTRICT
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;