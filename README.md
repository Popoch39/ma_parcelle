# Ma parcelle

Carte web plein écran pour tout savoir d'une parcelle cadastrale. On cherche une adresse, une référence cadastrale, un IDU ou des coordonnées, ou on clique une parcelle, et une fiche unique réunit ce que les sources publiques ouvertes en disent : cadastre, urbanisme et servitudes, risques, ventes du voisinage, DPE et bâtiment. Une synthèse en langage clair ouvre la fiche, des blocs détaillés suivent, chacun avec sa source.

Gratuit, sans compte et sans serveur applicatif : le navigateur appelle directement les API publiques ([ADR 0001](docs/adr/0001-application-client-relais-en-secours.md)). Le vocabulaire du domaine est défini dans [GLOSSARY.md](GLOSSARY.md).

## Stack

- React 19 (React Compiler), Vite 8, TypeScript
- MapLibre GL
- Tailwind CSS v4, shadcn sur Base UI
- TanStack Query (données des API), Zustand (état client, dont la carte)
- Vitest, oxlint
- [Bun](https://bun.sh) comme gestionnaire de paquets et lanceur de scripts

## Commandes

```sh
bun install          # dépendances
bun run dev          # serveur de développement
bun run typecheck    # vérification des types
bun run lint         # oxlint
bun run test         # Vitest, exécution unique
bun run build        # build de production dans dist/
bun run preview      # sert le build localement
```

## Tests

Une seule seam : la fonction `fetch`, injectée dans les chargeurs de bloc et le résolveur de recherche. Les tests leur passent un faux `fetch` (`src/test/fake-fetch.ts`) qui rejoue de vraies réponses d'API, puis vérifient le modèle renvoyé. Pas de tests de composants ni de la carte : l'interface se vérifie dans un vrai navigateur.

Convention des fixtures :

- une fixture est le corps JSON d'une vraie réponse, capturé avec `curl` sur l'API réelle, jamais écrit à la main ;
- elle est tronquée au strict nécessaire pour le test (quelques entités), sans jamais modifier les valeurs restantes ;
- elle est rangée dans `src/api/__fixtures__/<source>/<cas>.json`, le nom décrivant le cas (`search-20-avenue-de-segur.json`, `parcelle-code-insee-invalide-400.json`) ;
- le statut HTTP d'une réponse en erreur est donné par le test, pas stocké dans la fixture.

## Sources de données

| Bloc | Source |
|---|---|
| Recherche | Géoplateforme IGN, géocodage (adresses et parcelles) |
| Carte | OpenFreeMap (fond clair et sombre), IGN (orthophoto, parcelles PCI, zonage d'urbanisme) |
| Cadastre | API Carto IGN, module cadastre |
| Urbanisme et servitudes | API Carto IGN, Géoportail de l'urbanisme (GPU) |
| Risques | Géorisques (API v1) |
| Ventes | DVF via l'API du Cerema, data.gouv.fr en secours ([ADR 0002](docs/adr/0002-ventes-dvf-via-api-cerema.md)) |
| DPE | ADEME, DPE des logements existants (depuis 2021) |
| Bâtiment | BDNB (CSTB), altimétrie IGN |

Les données sont indicatives : la fiche ne remplace pas un certificat d'urbanisme.
