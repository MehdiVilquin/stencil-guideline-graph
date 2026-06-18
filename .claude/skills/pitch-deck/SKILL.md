---
name: pitch-deck
description: Construire ou améliorer un pitch deck / présentation / slide deck — arc narratif, anatomie par catégorie de slide, langue graphique unique tenue de bout en bout, visuels avant le texte, vrais composants produit plutôt que des SVG factices, barre de craftsmanship muséale. Déclencheurs — « prépare / améliore / refais un pitch deck », « la présentation n'est pas de bonne qualité », « slides », « deck », « pitch », « refais le visuel du deck ».
---

# Pitch deck — skill

> Un deck n'est pas un document décoré. C'est un **objet de design** : l'information vit
> dans les diagrammes et la composition, pas dans les paragraphes. Le texte est un accent
> visuel, rare et délibéré. Chaque slide doit paraître **minutieusement crafted**, comme
> si quelqu'un au sommet du métier y avait passé des heures — alignement parfait, marges
> généreuses, zéro chevauchement, une seule langue graphique tenue de bout en bout.

## La thèse (lire d'abord)

1. **Visuel d'abord.** Une slide se comprend en un coup d'œil. Le diagramme porte le
   sens ; les mots l'ancrent. Si une slide se résume à un titre + 4 puces de texte, elle
   n'a pas gagné sa place — transforme-la en schéma, ou supprime-la.
2. **Texte minimal, hiérarchique.** Le titre dit ce qu'on fait. Le sous-titre donne le
   détail. Le reste est visualisé. Jamais de pavé.
3. **Une seule langue graphique.** Une palette, une échelle typo, un motif récurrent
   (le kicker), un système de composants. On s'y engage pour TOUTES les slides — la
   cohérence est ce qui fait lire « produit fini » plutôt que « brouillon ».
4. **Vrais composants avant SVG factices.** Si le produit a déjà des visualisations
   (graphes, panneaux de preuve, dashboards), **montre-les** nourris aux vraies données.
   Le deck devient la démonstration vivante du produit — pas une maquette.
5. **Craftsmanship muséale.** Rien ne déborde, rien ne se chevauche. Chaque marge est
   intentionnelle. Le rythme vertical est constant. La taille de type exprime la
   hiérarchie (`clamp()` pour le responsive full-screen).

## Le workflow en 4 temps

### ① Déduire le fil conceptuel
La seule idée que le deck doit **prouver**. C'est l'ADN invisible tissé dans la forme,
la couleur, la composition — pas une slide « notre mission ». Quelqu'un de familier le
sentira ; les autres vivront juste une composition maîtrisée.
- *Ex. Stencil : « la preuve, pas la probabilité. »* → tout le deck (problème probabiliste
  vs solution déterministe, viz de graphe résolu, panneau de preuves) sert ce fil.

### ② Établir la langue graphique
Avant la première slide, figer et **écrire** (dans un commentaire / un fichier) :
- **Palette** — fond neutre, 1 primaire, et des teintes sémantiques (ok / alerte / conflit).
  Une teinte dominante **par acte** du récit, jamais un arc-en-ciel.
- **Échelle typo** — display (cover/hook/heros/chiffres), h2 (slides standards), body,
  et un kicker mono. En `clamp()` pour le full-screen.
- **Motif récurrent** — le kicker (mono uppercase, haut-gauche, ex. `PROBLÈME · 1/2`,
  `01 / 18`) présent sur chaque slide = le fil conducteur visuel.
- **Composants à réutiliser** — lister les vraies viz du produit à embarquer.

### ③ Construire slide-par-slide
Suivre la **taxonomie** ci-dessous. Pour chaque slide : catégorie (kicker) · titre
(phrase simple ≤ 8 mots) · sous-titre (1 phrase) · **visuel** (diagramme / vraie viz /
élément de langage) · traitement typo. Voir `reference/slide-taxonomy.md`.

### ④ Passe de polish
*« Rends-la plus œuvre d'art, n'ajoute pas de graphisme. »* Si l'instinct est de dessiner
une nouvelle forme, **arrête** et demande plutôt : comment rendre ce qui est déjà là plus
cohesif ? Vérifier : alignements, rythme vertical, respiration, zéro chevauchement,
cohérence de la palette, poids typo. Repasser 1–2 fois.

## Anatomie d'une slide (les règles non-négociables)

| Élément | Rôle | Régle |
|---|---|---|
| **Catégorie** | Situer dans le récit | Kicker mono uppercase, haut-gauche (ex. `SOLUTION`, `03 / 18`) |
| **Titre** | Dire ce qu'on fait / comprend | Phrase simple, ≤ 8 mots, graisse forte, tracking serré |
| **Sous-titre** | Détail de compréhension | 1 phrase, contrastance douce (muted) |
| **Visuel** | Porter le sens | Diagramme / vraie viz produit / élément de langage. **Jamais** un titre + 4 puces seules |
| **Typo** | Exprimer la hiérarchie | Display `clamp(...)` sur cover/hook/solution/outro/chiffres ; h2 ailleurs |

## Taxonomie des slides (rôle + visuel-type)

`cover` · `hook` · `problem` (1–2) · `solution` · `how-it-works` (pipeline) · `data-model`
· `algorithm` · `demo` · `product` (1–3 deep-dive) · `benefits` · `competitors` · `market`
· `pricing` · `roadmap` · `outro`.

Détail (rôle, anatomy, visuel-type par catégorie) dans **`reference/slide-taxonomy.md`** —
l'invoquer avant de construire.

## Règle d'or de la langue graphique

> Établir **UNE** palette + **UNE** échelle typo + **UN** motif récurrent, et n'en pas
> dévier. Si une slide demande une nouveauté visuelle, c'est presque toujours un signe que
> son contenu n'est pas clair — revoir le fil conceptuel plutôt que d'ajouter de l'ornement.

---

## Annexe référentielle (projet guidelines-graph)

Ce repo fournit des pièces réelles à réutiliser — **toujours** les préférer à du neuf.

**Design tokens** — `app/globals.css`
- Primaire `--primary` `oklch(0.56 0.2 257)` (bleu) · sémantiques `--ok` (vert preuve),
  `--judged` (ambre, jugé/non-prouvable), `--destructive` (rouge conflit/invariant).
- Fonds `--background` / `--card`, rayons `--radius-sm` (14px) → `--radius-xl` (22px).
- Fonts : `--font-sans` (SF Pro) · `--font-mono` (JetBrains Mono).
- Échelle typo deck : classes `.d-kicker` · `.d-title-xl/lg` · `.d-title` · `.d-subtitle`
  · `.d-body` · `.d-stat` · `.d-mono` (paliers à **line-heights constants**, en `clamp()`),
  layouts `.deck-hero / .deck-split / .deck-visual-top` + grille `.deck-shell`. **Système
  complet (table typo, grille, layouts, tokens, couleur-par-acte, animation) documenté dans
  `reference/deck-system.md` — le lire avant de toucher au deck.**
- Wash par acte : attributs `[data-slide-bg="cover|hook|problem|solution|demo|…"]`.

**Composants viz** (consommer en lecture, ne pas modifier)
- `app/components/graph/Strata.tsx` — sunburst de conformité, props `{ active: Rule[] }`,
  SVG pur, **non-interactif** → idéal pour slide.
- `app/components/graph/ForceGraph.tsx` — nœuds par bandes de force + arêtes typées,
  props `{ nodes: GraphNode[], edges: Edge[], onRule? }`, SVG pur, **non-interactif**.
- `app/components/RuleGraphSVG.tsx` — graphe interactif (zoom/pan/wheel) ; l'éviter en slide
  passive, ou l'isoler.
- `app/components/doctrine/DoctrineDoc.tsx` — compilation markdown du graphe (audit humain).
- `app/components/icons.tsx` — `StencilIcon`, `Shield`, `Scale`, `Nodes`, `Check`, `Cross`,
  `Triangle`, `Sparkle`… (stroke = `currentColor`).

**Données réelles + pipeline** (le deck affiche le VRAI graphe résolu)
- `lib/data/index.ts` — `defaultRawRules` (47 règles Maison Lumière).
- `lib/domain/ingest.ts` — `ingest(rows): RuleGraph { rules, edges, flaggedAtIngest }`.
- `lib/domain/precedence.ts` — `resolve(allRules, ctx): { active, decisions, flagged, applicableCount }`.
  `decisions[i] = { winner, beat:[{rule, why}], reason, subject, constraintType }`.
- `app/components/RuleGraphSVG.tsx` — type `GraphNode = { rule: Rule, status: "active"|"suppressed"|"flagged"|"neutral" }`.
- `lib/domain/scope.ts` — `ruleSpecificity(rule)`, `isApplicable(scope, ctx)`.
- `lib/ui/labels.ts` — `CONSTRAINT_LABEL[ct] = { label, color }`.
- `lib/ui/proof.ts` — `proofStatus(report)` (stats seulement ; le rendu des `Verdict` est à faire).

**Exemple de câblage** (module-scope, déterministe, client-safe) :
```ts
import { defaultRawRules } from "@/lib/data";
import { ingest } from "@/lib/domain/ingest";
import { resolve } from "@/lib/domain/precedence";
import type { GenerationContext } from "@/lib/domain/types";
import type { GraphNode } from "@/components/RuleGraphSVG";

const graph = ingest(defaultRawRules);
const { active, decisions } = resolve(graph.rules, DEMO_CTX as GenerationContext);
const activeIds = new Set(active.map(r => r.localId));
const nodes: GraphNode[] = graph.rules.map(r => ({
  rule: r, status: activeIds.has(r.localId) ? "active" : "neutral",
}));
// → <Strata active={active} /> · <ForceGraph nodes={nodes} edges={graph.edges} />
```

## Barre de qualité (checklist de sortie)

- [ ] Le fil conceptuel se lit à travers tout le deck (pas juste une slide).
- [ ] Une seule langue graphique ; une teinte dominante par acte.
- [ ] Chaque slide a un **visuel** porteur, pas un titre + puces.
- [ ] Échelle typo `clamp()` ; moments display sur cover/hook/solution/outro/chiffres.
- [ ] Zéro chevauchement, marges généreuses, rythme vertical constant.
- [ ] Kicker présent et cohérent sur chaque slide.
- [ ] Les viz montrent de **vraies données** produit, pas des SVG factices.
