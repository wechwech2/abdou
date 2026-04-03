CREATE INDEX idx_users_role_id ON users(role_id);

CREATE INDEX idx_programmes_client_id ON programmes(client_id);
CREATE INDEX idx_programmes_offre_id ON programmes(offre_id);
CREATE INDEX idx_programmes_template_id ON programmes(template_id);
CREATE INDEX idx_programmes_status ON programmes(status);
CREATE INDEX idx_programmes_publication_status ON programmes(publication_status);

CREATE INDEX idx_programme_rubriques_programme_id ON programme_rubriques(programme_id);
CREATE INDEX idx_programme_rubriques_display_order ON programme_rubriques(display_order);

CREATE INDEX idx_medias_status ON medias(status);
CREATE INDEX idx_medias_uploaded_by ON medias(uploaded_by);

CREATE INDEX idx_programme_medias_programme_id ON programme_medias(programme_id);
CREATE INDEX idx_programme_medias_media_id ON programme_medias(media_id);
CREATE INDEX idx_programme_medias_rubrique_id ON programme_medias(rubrique_id);
CREATE INDEX idx_programme_medias_lot_id ON programme_medias(lot_id);
CREATE INDEX idx_programme_medias_usage_code ON programme_medias(usage_code);

CREATE INDEX idx_batiments_programme_id ON batiments(programme_id);
CREATE INDEX idx_etages_batiment_id ON etages(batiment_id);

CREATE INDEX idx_lots_programme_id ON lots(programme_id);
CREATE INDEX idx_lots_batiment_id ON lots(batiment_id);
CREATE INDEX idx_lots_etage_id ON lots(etage_id);
CREATE INDEX idx_lots_commercial_status ON lots(commercial_status);

CREATE INDEX idx_publications_programme_id ON publications(programme_id);
CREATE INDEX idx_publications_template_id ON publications(template_id);
CREATE INDEX idx_publications_status ON publications(status);

CREATE INDEX idx_publication_assets_publication_id ON publication_assets(publication_id);
CREATE INDEX idx_publication_assets_media_id ON publication_assets(media_id);

CREATE INDEX idx_publication_deployments_publication_id ON publication_deployments(publication_id);
CREATE INDEX idx_publication_deployments_status ON publication_deployments(deployment_status);