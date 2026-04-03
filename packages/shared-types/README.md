# shared-types

Types metier partages entre backoffice, admin-api et publisher-cli.

Le package couvre le noyau metier MVP :
- roles, users, templates ;
- clients, offres, programmes ;
- rubriques, medias, lots ;
- publications et deploiements.
- contrats techniques `admin-api` (`health`, `modules`, `contracts`).
- contrats de payload `admin-php` (auth, referentiels, chaines programme/publication, workflow build/deploy).

Le package expose aussi des constantes de reference pour les statuts/types metier :
- `CLIENT_STATUSES`
- `PROGRAMME_STATUSES`
- `PROGRAMME_PUBLICATION_STATUSES`
- `PUBLICATION_STATUSES`
- `MEDIA_TYPES`
- `MEDIA_STATUSES`

Validation runtime minimale exposee :
- `isAdminPhpAuthLoginPayload`
- `isAdminPhpAuthMePayload`
- `isAdminPhpAuthLogoutPayload`
- `isAdminPhpPublicationCreatePayload`
- `isAdminPhpPublicationStatusUpdatePayload`
- `isAdminPhpRolesListPayload`
- `isAdminPhpUsersListPayload`
- `isAdminPhpTemplatesListPayload`
- `isAdminPhpClientsListPayload`
- `isAdminPhpOffresListPayload`
- `isAdminPhpProgrammesListPayload`
- `isAdminPhpRubriquesListPayload`
- `isAdminPhpMediasListPayload`
- `isAdminPhpLotsListPayload`
- `isAdminPhpPublicationsListPayload`
- `isAdminPhpUserItemPayload`
- `isAdminPhpTemplateItemPayload`
- `isAdminPhpClientItemPayload`
- `isAdminPhpOffreItemPayload`
- `isAdminPhpProgrammeItemPayload`
- `isAdminPhpRubriqueItemPayload`
- `isAdminPhpMediaItemPayload`
- `isAdminPhpLotItemPayload`
- `isAdminPhpPublicationItemPayload`
- `isAdminPhpPublicationDeploymentsPayload`
- `isAdminPhpPublicationDeploySummaryData`
- `isAdminPhpPublicationDeploySummaryPayload`
- `isAdminPhpPublicationBuildPayload`
- `isAdminPhpPublicationPreviewPayload`
- `isAdminPhpPublicationDeployPayload`
- `isAdminPhpPublicationTextArtifactPayload`
- `isAdminPhpPublicationArtifactsPayload`
- `isAdminPhpPublicationWorkflowDetailPayload`
