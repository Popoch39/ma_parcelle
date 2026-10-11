# Ma parcelle

Ma parcelle réunit sur une carte, pour une parcelle cadastrale, ce que les sources publiques ouvertes disent de ce que l'on peut y faire, de ce qu'elle risque et de ce qu'elle vaut.

## Désigner un terrain

**Parcelle** :
Unité de terrain délimitée par le cadastre, rattachée à une commune et identifiée par une section et un numéro. C'est l'objet central de l'app : on n'en consulte qu'une à la fois.
_Éviter_ : terrain, lot, propriété, unité foncière (qui désigne un ensemble de parcelles d'un même propriétaire)

**IDU** :
Identifiant unique national d'une parcelle, sur 14 caractères : département, commune, préfixe, section et numéro. À Paris, Lyon et Marseille, la partie « commune » est le code de l'arrondissement.
_Éviter_ : identifiant cadastral, ID parcelle, code parcelle

**Référence cadastrale** :
Désignation d'une parcelle telle qu'elle figure dans les actes : une commune (par son code INSEE ou son nom), une section et un numéro, par exemple « 33063 AB 123 ».
_Éviter_ : numéro de parcelle, réf. cadastre

## Lire une parcelle

**Fiche** :
Vue unique et partageable de tout ce que l'app sait d'une parcelle : une synthèse suivie de blocs.
_Éviter_ : rapport, dossier, page parcelle

**Synthèse** :
En-tête de la fiche qui traduit en langage clair les faits essentiels, chacun avec son niveau d'alerte. Elle ne rend jamais de verdict de constructibilité.
_Éviter_ : résumé, conclusion, diagnostic

**Bloc** :
Section thématique et dépliable de la fiche (cadastre, urbanisme et servitudes, risques, ventes, DPE et bâtiment) qui détaille ses données et cite sa source officielle et sa date.
_Éviter_ : onglet, module, widget

**Alerte** :
Niveau d'attention attaché à un fait : information, vigilance ou alerte.
_Éviter_ : sévérité, criticité, warning

## Urbanisme

**Document d'urbanisme** :
Acte qui fixe les règles d'usage du sol applicables à une commune. Ses formes sont :
- **PLU** (plan local d'urbanisme) : document communal qui découpe le territoire en zones et fixe leur règlement ;
- **PLUi** : PLU élaboré à l'échelle d'une intercommunalité ;
- **carte communale** : document plus simple qui distingue seulement les secteurs constructibles et ceux qui ne le sont pas ;
- **RNU** (règlement national d'urbanisme) : règles nationales qui s'appliquent quand la commune n'a aucun document propre ;
- **PSMV** (plan de sauvegarde et de mise en valeur) : document qui remplace le PLU dans le secteur sauvegardé d'un centre historique.
_Éviter_ : POS (ancien régime, caduc), règlement d'urbanisme

**Zone** :
Portion du territoire à laquelle le document d'urbanisme attribue une vocation et un règlement, désignée par un code (ex. « UB ») et un libellé. Sa grande famille se lit à sa lettre : urbaine (U), à urbaniser (AU), agricole (A) ou naturelle (N). Le secteur d'une carte communale en tient lieu.
_Éviter_ : zonage (qui désigne l'ensemble des zones), secteur PLU

**Prescription** :
Contrainte localisée que le document d'urbanisme superpose aux zones, comme un espace boisé classé ou un emplacement réservé.
_Éviter_ : contrainte PLU, surcharge

**Servitude** :
Servitude d'utilité publique : limitation administrative du droit de propriété instituée au profit d'un intérêt général (protection d'un monument, passage d'une ligne électrique, captage d'eau…), indépendante du document d'urbanisme mais annexée à celui-ci.
_Éviter_ : SUP, servitude de droit privé (de passage, de vue…), qui n'est pas couverte

**Périmètre ABF** :
Abords d'un monument historique, en général 500 m autour de lui, où les travaux visibles sont soumis à l'avis de l'architecte des bâtiments de France. C'est une servitude.
_Éviter_ : périmètre MH, zone ABF, rayon de 500 m

## Marché

**Vente** :
Mutation à titre onéreux publiée par l'administration fiscale : une date, un prix et un ou plusieurs biens (logements, dépendances, terrains, locaux).
_Éviter_ : transaction, mutation (sauf pour citer la source), acte

**Vente simple** :
Vente qui porte sur un seul logement, maison ou appartement, dépendances comprises. Seules les ventes simples comptent dans le prix médian au m² ; les autres restent listées mais en sont exclues.
_Éviter_ : vente unitaire, vente standard

**Prix médian au m²** :
Médiane du prix rapporté à la surface bâtie, calculée séparément pour les maisons et les appartements, sur les ventes simples du voisinage des cinq dernières années. Il s'affiche toujours avec le nombre de ventes retenues.
_Éviter_ : prix moyen, prix au m² (seul), estimation

**Voisinage** :
Cercle autour de la parcelle dont on montre les données faute de mieux : 500 m pour les ventes, 100 m pour les DPE. Ses données sont toujours présentées comme celles du voisinage, jamais comme celles de la parcelle.
_Éviter_ : quartier, alentours, environs, secteur

## Bâti

**DPE** :
Diagnostic de performance énergétique d'un logement, qui le classe de A à G selon sa consommation d'énergie (étiquette énergie) et ses émissions de gaz à effet de serre (étiquette climat).
_Éviter_ : diagnostic énergie, étiquette énergie (qui n'en est qu'une partie)
