# Taxonomie des slides — référence

Rôle, anatomie et visuel-type par catégorie. À consulter avant de construire une slide.
Anatomie = **Catégorie** (kicker) · **Titre** · **Sous-titre** · **Visuel** · **Typo**.

## Acte I — Ouverture

### cover
- **Rôle** : poser la marque et la promesse en une ligne.
- **Visuel-type** : wordmark sobre + icône de marque + credentials en pills. Fond wash.
- **Typo** : display. *Ex. « Stencil — Des règles de marque, rendues applicables. »*

### hook
- **Rôle** : créer la tension, l'empathie au problème. Une phrase qui résonne.
- **Visuel-type** : typographique (grande phrase) + un mini-motif graphique (1 arête, 1
  icône) — pas un diagramme complet.
- **Typo** : display.

## Acte II — Problème

### problem (1/2, 2/2)
- **Rôle** : nommer la douleur, puis pourquoi les solutions actuelles échouent.
- **Visuel-type** : (1) le chaos visualisé — graphe dense / fouillis de règles ; (2) un
  contraste — probabiliste vs déterministe, boîte noire vs transparente.
- **Typo** : h2. Teinte dominante = alerte (ambre) / conflit (rouge).

## Acte III — Solution

### solution
- **Rôle** : la thèse en image. C'est souvent le hero du deck.
- **Visuel-type** : **la vraie viz produit nourrie aux vraies données** (le graphe résolu).
- **Typo** : display.

### how-it-works (pipeline)
- **Rôle** : démystifier en N étapes déterministes.
- **Visuel-type** : flux horizontal d'étapes, chacune avec un mini-artefact réel
  (fichier → nœuds → set actif → preuve).
- **Typo** : h2.

### data-model
- **Rôle** : montrer la rigueur du modèle sous-jacent.
- **Visuel-type** : entité annotée (nœud de règle) + ses dimensions (lattice du scope) +
  légende des types de relations.
- **Typo** : h2.

### algorithm
- **Rôle** : prouver la déterminisme (pas de ML).
- **Visuel-type** : entonnoir / flux en étapes avec décompte qui se réduit (47 → N).
- **Typo** : h2.

## Acte IV — Produit (la preuve)

### demo
- **Rôle** : inviter au concret. Souvent un CTA vers le produit live.
- **Visuel-type** : une viz « beauty shot » (sunburst) + gros bouton CTA.
- **Typo** : display.

### product (1/3, 2/3, 3/3)
- **Rôle** : le deep-dive en 3 temps — ingestion · résolution · preuve.
- **Visuel-type** : (1) mock d'ingestion réel (fichier → lignes → graphe) ; (2) viz du
  contexte résolu + callout de conflit réel tiré des `decisions` ; (3) **vrai rapport de
  preuves** stylé (✓/✗/◐ par règle). Le 3/3 est le money shot « glass-box ».
- **Typo** : h2.

## Acte V — Marché & clôture

### benefits
- **Rôle** : traduire la techno en valeur client (4 leviers max).
- **Visuel-type** : cartes resserrées (rayon `--radius-sm`), 1 icône par levier.
- **Typo** : h2.

### competitors
- **Rôle** : positionner. « Aucun concurrent direct. »
- **Visuel-type** : tableau comparatif ; la ligne produit surlignée (primaire).
- **Typo** : h2.

### market
- **Rôle** : la taille du prize.
- **Visuel-type** : **chiffres en display clamp géants** — moment typo fort.
- **Typo** : display.

### pricing
- **Rôle** : modèle économique + marge.
- **Visuel-type** : 2 tiers (abonnement / usage) + une quote.
- **Typo** : h2.

### roadmap
- **Rôle** : la trajectoire (et le GTM si fondu dedans).
- **Visuel-type** : **timeline horizontale** (Q1 → Q4), préférable aux cartes verticales.
- **Typo** : h2.

### outro
- **Rôle** : refermer sur la promesse, symétrique du cover. Un CTA.
- **Visuel-type** : typo display pure + CTA. Fond wash.
- **Typo** : display.

---

## Anti-patterns (à proscrire)

- Titre + 4 puces de texte sans visuel porteur.
- Plus de 2 teintes accent par slide (arc-en-ciel = brouillon).
- SVG factice quand une vraie viz produit existe.
- Chaque slide à une mise en page différente (casser la cohérence).
- Couleur hors palette (ex. violet parasite sur un deck bleu).
- Texte qui déborde ou se chevauche — **non-négociable** : tout tient dans la slide avec
  des marges.
