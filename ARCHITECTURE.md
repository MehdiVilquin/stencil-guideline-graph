# Semantic Guidelines Graph — Architecture & Fonctionnement

## Le problème

Un brand a des dizaines de guidelines de rédaction. Jetées en vrac dans un prompt, elles créent une soupe probabiliste : le LLM ignore des règles, ne sait pas laquelle choisir quand deux se contredisent, et ne peut pas justifier ses choix.

**La thèse :** sortir la résolution de conflits du LLM — qui est probabiliste — et la confier à un moteur déterministe sur un graphe de règles typé. Le LLM est rétrogradé à un seul rôle : rédiger dans un espace de contraintes déjà arbitré.

---

## L'architecture en trois temps

### 1. Ingestion — construire le graphe

Les règles brutes (JSON) sont transformées en un **graphe typé** : chaque règle est un nœud, chaque relation entre règles est une arête avec un type explicite.

| Type d'arête | Signification |
|---|---|
| `overrides` | La règle A prime sur B (scope plus spécifique) |
| `conflicts-with` | A et B se contredisent au même niveau |
| `reinforces` | A et B vont dans le même sens |
| `justified-by` | A est justifiée par un invariant de conformité |

Ce graphe est construit **une fois**, figé, auditable.

---

### 2. Résolution — le moteur de précédence

C'est ici que le projet est gagné.

Donné un **contexte de génération** (`brand · locale · contentType · field · productType`), le moteur calcule exactement quelles règles s'appliquent et lesquelles gagnent en cas de conflit.

**L'algorithme, en trois étapes :**

```
1. FILTRER        — garder uniquement les règles compatibles avec le contexte
2. PARTITIONNER   — regrouper par sujet (le "ring")
3. RÉSOUDRE       — pour chaque ring :
                   • Invariants (légal/médical) → plancher absolu, jamais supprimés
                   • Sinon : spécificité ≻ force (lexicographique)
                   • Égalité irréductible → flag for human, pas de décision arbitraire
```

**Résultat :** 47 règles → 8 règles actives, conflits résolus, chaque décision tracée avec sa raison (`#21 gagne sur #07 : scope plus spécifique, 4 dimensions vs 2`).

Ce moteur est **100% déterministe** : même entrée, même résultat, toujours.

---

### 3. Génération — le rôle de l'IA

Le LLM reçoit **uniquement les règles déjà résolues** sous forme de prompt système structuré. Il ne voit pas les conflits, pas les règles supprimées, pas les 47 règles brutes.

```
"Tu es rédacteur pour Lumière Paris.
 Respecte exactement ces règles — elles ont déjà été arbitrées :
 (#04) « anti-aging » interdit
 (#21) titre ≤ 80 caractères
 (#19) devise après le montant (50 €, pas €50)
 …"
```

Le LLM a un seul travail : **écrire ou réécrire du texte dans cet espace de contraintes**.

---

### 4. Vérification — la preuve déterministe

Après chaque réécriture, un vérificateur mécanique check chaque règle active :

| Type de contrainte | Méthode |
|---|---|
| `lexical-forbidden` | Regex word-boundary sur les termes interdits |
| `lexical-required` | Présence de la forme canonique |
| `length-bound` | Comptage de caractères vs borne |
| `format-pattern` | Regex devise / guillemets / ponctuation |
| `register-tone` | ⚠ non prouvable mécaniquement — *jugé* |

Si une règle mécanique échoue, la copie repart au LLM avec la liste des violations (max 2 tentatives). Le rapport final est la **preuve** : pass/fail par règle, chacune liée à son `localId`.

---

## Ce qui ne passe jamais par l'IA

- La sélection des règles applicables
- La résolution des conflits entre règles
- La décision de quelle règle prime sur quelle autre
- La vérification de conformité

## Ce que l'IA fait uniquement

- Rédiger ou réécrire du texte dans un espace de contraintes déjà arbitré

---

## La doctrine

La **doctrine** est la compilation lisible du graphe en markdown — la "loi" de marque explicitée, exportable, ratifiable par un brand manager. Elle sert à l'audit humain, pas à l'IA.

---

## Le flow de démo

```
① Contexte : Lumière Paris · de-DE · title · Skincare
  → moteur résout : 8 règles actives sur 47

② Coller une copie qui viole des règles
  → "Anti-Aging Serum für nur €50!"

③ Vérifier (déterministe, sans clé API)
  → rapport immédiat : 3 violations identifiées

④ Corriger (LLM + vérificateur)
  → LLM réécrit → vérificateur prouve → 0 violation
```

---

## Schéma du flow

```
  INGESTION          GRAPHE               RÉSOLUTION              GÉNÉRATION
  ─────────          ──────               ──────────              ──────────

  47 règles    →   Graphe typé      →   Moteur de          →   Prompt système
  JSON             overrides            précédence              (8 règles
                   conflicts-with       déterministe             en clair)
                   reinforces           ↑                             ↓
                   justified-by         Contexte                     LLM
                                       brand · locale               (réécrit)
                                       field · type                      ↓
                                                                 Vérificateur
                                                                 déterministe
                                                                      ↓
                                       Doctrine (.md)          Rapport de preuve
                                       ← export humain         pass/fail par règle
                                         pas pour le LLM
```
