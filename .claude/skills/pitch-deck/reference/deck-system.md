# Deck design system — référence

Le système visuel du deck `/pitch`. **Un seul système, tenu partout.**
Implémenté dans `app/globals.css` (tokens `--deck-*` + classes `.d-*` + layouts).

## 1. Échelle typographique (rôles, line-heights constants)

Les line-heights sont **constants par rôle** — c'est ce qui empêche le rendu de « sauter »
d'une slide à l'autre. Tout est en `clamp()` (deck full-screen `h-dvh`).

| Classe | Rôle | Taille | LH | Usage |
|---|---|---|---|---|
| `.d-kicker` | catégorisation | mono 11px | 1.2 | kicker haut-gauche de chaque slide |
| `.d-title-xl` | titre héro max | clamp 52–104px | 0.98 | **cover, outro** |
| `.d-title-lg` | titre héro | clamp 34–56px | 1.02 | **hook, solution, demo** |
| `.d-title` | titre standard | clamp 26–40px | 1.08 | tous les autres (dont **market**) |
| `.d-subtitle` | sous-titre | clamp 18–22px | 1.35 | sous un titre ou label de carte |
| `.d-body` | corps | clamp 14–16px | 1.55 | descriptions, body |
| `.d-stat` | chiffre | clamp 44–68px | 1.0 | **chiffres marché** (`tabular-nums`) |
| `.d-mono` | evidence mono | 12px | 1.4 | traces, métadonnées |

> Règle : **un seul palier de titre par slide**, choisi par `type` (cf. `TIER` dans
> `page.tsx`). Ne pas mélanger `d-title-xl` et `d-stat` sur la même slide (c'est ce qui
> faisait « sauter » la slide market en v1 — maintenant market = `d-title` + `d-stat`).

## 2. Grille + layouts nommés

Shell 12 colonnes (`--deck-gutter: 24px`, `max-width: 1200px`). Quatre layouts :

| Layout | Classe | Structure | Slides |
|---|---|---|---|
| `hero` | `.deck-hero` | 1 colonne centrée (flex-col, center) | cover, hook, demo, outro |
| `split` | `.deck-split` | grid `5fr / 7fr` (texte \| visuel), v-centered | solution, datamodel, product 1/2/3 |
| `visual-top` | `.deck-visual-top` | en-tête centré au-dessus d'un visuel pleine largeur | problem, pipeline, algo, competitors, pricing, roadmap |
| `grid` / `stats` | (dans `SlideView`) | cartes 2×2 / ligne de chiffres | benefits / market |

Chaque slide déclare son `layout` dans `SLIDES[]`. Le header (kicker + titre + body) est
partagé via `<SlideHeader>` qui respecte le palier `TIER[type]`.

## 3. Tokens composant

```
--deck-gutter: 24px        gouttière de grille
--deck-card-pad: 20px      padding interne des cartes
--deck-gap: 16px           écart standard
--deck-rule: 1px           épaisseur bordure standard
--radius-sm … --radius-xl  rayons (DS Apple)
```

## 4. Couleur-par-acte

Une teinte dominante par acte (mappée sur les tokens sémantiques existants), via `ACCENT[type]` :

- bleu `--primary` → cover · solution · pipeline · datamodel · roadmap · business · outro
- ambre `--judged` → hook (tension)
- rouge `--destructive` → problem (conflit)
- vert `--ok` → demo · product (preuve)

Appliquée au kicker + accents (puces, bordures de citation, icônes de benefits).

## 5. Animation (CSS pur, pas de lib)

- `@keyframes deck-flow` — traceur du pipeline (left 0→100%).
- Le cycle des étapes est piloté par l'état React (`PipelineFlow`, `setInterval` ~1s).
- Garde `@media (prefers-reduced-motion: reduce)` → `.deck-anim` fige toute animation/transition.
- Le remontage à l'entrée d'une slide se fait via `<VisualFor key={slide.id} />`.

## 6. Anti-patterns (à proscrire sur ce deck)

- Mélanger `d-title-xl` avec `d-stat` sur la même slide (reflow).
- Deux teintes accent sur une même slide.
- Un visuel qui déborde de sa colonne `split` (toujours `w-full` dans un `min-w-0`).
- Kartes sans `--deck-card-pad` (incohérence de taille).
