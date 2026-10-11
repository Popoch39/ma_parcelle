# Application 100 % client, relais Cloudflare seulement en secours

Ma parcelle n'a pas de serveur applicatif : c'est un site statique (Cloudflare Pages) dont le navigateur appelle directement les API publiques (Géoplateforme, API Carto, Géorisques, Cerema, ADEME, BDNB). Au 2026-10-11, toutes acceptent les appels depuis un navigateur (CORS), sont gratuites et sans clé ; un serveur n'apporterait qu'un coût d'hébergement, de la latence et un point de panne de plus. Un relais (Worker ou Pages Function, avec cache edge) ne sera ajouté que pour une API qui viendrait à casser : refus des appels depuis le navigateur, quota trop serré, ou passage à une clé obligatoire comme Géorisques v2.

## Consequences

- Chaque source est isolée derrière un chargeur de bloc : brancher le relais pour une API ne touche que son chargeur, pas l'interface.
- Faute de serveur pour mutualiser les appels, les quotas (souvent non documentés) sont ménagés par un cache client long, et une API en panne ne casse que son bloc.
- Les données qui n'existent qu'en fichiers sans CORS restent hors de portée tant qu'aucun relais n'est en place (voir ADR 0002).
