# Ventes DVF via l'API Cerema plutôt que les CSV Etalab

Les ventes viennent de l'API « geomutations » du Cerema, avec dvf-api.data.gouv.fr en secours, et non des CSV officiels DVF publiés par Etalab. Ces CSV ne sont pas servis avec les en-têtes CORS : le navigateur ne peut pas les lire, et l'app n'a pas de serveur pour le faire à sa place (ADR 0001). Le Cerema, lui, répond au navigateur, interroge les ventes par emprise géographique, et c'est exactement ce dont le voisinage a besoin.

## Considered Options

- **CSV Etalab via un relais ou un précalcul** (tuiles, base) : source de référence, mais impose un serveur ou une chaîne de traitement, hors du périmètre de la v1.
- **dvf-api.data.gouv.fr seule** : accepte le navigateur, mais n'est pas documentée et ne se consulte que section par section ; gardée comme secours.

## Consequences

- L'API Cerema est en préproduction : elle peut changer ou disparaître sans préavis. C'est pourquoi les deux sources partagent une interface commune et que l'app bascule seule sur le secours.
- Elle n'accepte qu'une emprise de 0,02° de côté au plus : on demande un carré d'environ 1 km et on garde le cercle de 500 m côté client.
- Son lien de page suivante est renvoyé en `http://` et doit être réécrit en `https://`, sans quoi le navigateur le bloque (contenu mixte).
