CREATE TABLE programme_rubriques (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    programme_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(180) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    content_html MEDIUMTEXT NULL,
    content_text MEDIUMTEXT NULL,
    display_order INT UNSIGNED NOT NULL DEFAULT 1,
    is_enabled TINYINT(1) NOT NULL DEFAULT 1,
    is_menu_visible TINYINT(1) NOT NULL DEFAULT 1,
    settings_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_programme_rubriques_programme_slug (programme_id, slug),
    CONSTRAINT fk_programme_rubriques_programme
        FOREIGN KEY (programme_id) REFERENCES programmes(id)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;