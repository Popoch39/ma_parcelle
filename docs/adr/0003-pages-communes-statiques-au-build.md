# Pages communes statiques, générées au build, à partir de 500 habitants

L'app est une carte : pour un moteur de recherche, c'est une seule page. Pour être trouvée sur « cadastre Bordeaux » ou « PLU Mérignac », elle publie une page statique par commune (`/commune/<nom>-<code INSEE>`), une par département (`/departement/<nom>-<code>`) et un annuaire (`/communes`), avec sitemap, robots.txt et une vraie page 404. Un plugin Vite (`src/seo/plugin.ts`) les génère à chaque build à partir de la liste des communes de geo.api.gouv.fr. Le site reste 100 % statique (ADR 0001). Chaque page commune renvoie vers la carte ouverte sur la commune (`/#carte=zoom/lat/lon`) : c'est un fragment, donc pas une nouvelle page à indexer.

Cloudflare Pages, en plan gratuit, sert au plus 20 000 fichiers par déploiement, pour environ 35 000 communes. Seules les communes d'au moins 500 habitants ont donc leur page (environ 16 700, 94 % de la population), ainsi que les arrondissements de Paris, Lyon et Marseille. Les plus petites sont listées sur la page de leur département, avec un lien vers la carte.

## Considered Options

- **Toutes les communes, plan payant** (Workers Paid, 100 000 fichiers) : couverture complète, mais 5 $ par mois pour des communes que presque personne ne cherche.
- **Toutes les communes, rendues à l'edge** par une Pages Function : gratuit, mais ajoute un serveur, contre l'ADR 0001.
- **Une page par parcelle** : des millions de pages au contenu mince, que les moteurs traitent comme du remplissage. Une fiche partagée (`?parcelle=`) reste accessible, avec la page d'accueil pour canonique.

## Consequences

- Le build appelle geo.api.gouv.fr : sans lui, il échoue plutôt que de déployer un site sans ses pages.
- Le seuil (`MIN_POPULATION_FOR_PAGE`) se relève si le nombre de fichiers approche les 20 000, et il disparaît avec un passage au plan payant.
- Les pages réutilisent la feuille de style de l'app : leurs classes Tailwind vivent dans `src/seo/`, que Tailwind analyse comme le reste de `src/`.
- Les modules chargés par `vite.config.ts` importent en relatif, extension comprise, et n'utilisent l'alias `@/` que pour des types (voir `src/seo/plugin.ts`).
