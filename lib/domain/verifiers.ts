// Verifiers — the PROOF layer. Each constraint type has a deterministic checker,
// parametrized by the rule's own data (no Maison-Lumière hardcoding).
// register-tone is honestly marked NOT verifiable (judged, not proven).
//
// verify(copy, rule) → { localId, pass, verifiable, evidence }

import { directiveSignature, numericBound } from './directive';
import { Rule, Verdict } from './types';

const lc = (s: string) => s.toLowerCase();
const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// Medical / therapeutic claim markers across the bundled locales (EN/FR/DE/IT + JP).
// Kept to UNAMBIGUOUS claims so legitimate luxury copy ("soin", "cliniquement testé")
// is not flagged — only cure/heal/therapeutic + "clinically/medically proven" variants.
// Exact (inflected) forms — matched with BOTH word boundaries, so "healthy",
// "secure", "traitement" etc. are never false-flagged.
const MEDICAL_CLAIM_TERMS = [
  // EN
  'cures', 'cure', 'heals', 'heal', 'treats', 'medically proven', 'clinically proven',
  // FR — cure verbs + "prouvé(e)(s)" adjective forms + therapeutic
  'guerit', 'guerir', 'gueris', 'guerie', 'gueries', 'therapeutique',
  'cliniquement prouve', 'cliniquement prouvee', 'cliniquement prouves', 'cliniquement prouvees',
  'medicalement prouve', 'medicalement prouvee',
  // DE
  'heilt', 'heilen', 'geheilt', 'medizinisch', 'therapeutisch', 'klinisch erwiesen', 'klinisch bewiesen',
  // IT
  'guarisce', 'guariscono', 'terapeutico', 'clinicamente provato', 'clinicamente provata',
  // JP
  '治療', '治す',
];

/** Accent-insensitive, multi-script presence check (for medical claims). */
function containsClaim(copy: string, term: string): boolean {
  const c = stripDiacritics(copy).toLowerCase();
  const t = stripDiacritics(term).toLowerCase();
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // latin word-ish boundary; CJK terms sit between non-[a-z0-9] chars so they still match
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, 'i').test(c);
}

/** All quoted tokens in a string, lowercased. */
function quotedTokens(text: string): string[] {
  const out: string[] = [];
  const re = /[“"‘]([^”"’]{1,40})[”"’]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(lc(m[1].trim()));
  return out;
}

/** Quoted tokens that are PRESCRIBED replacements ("always use X"), not forbidden. */
function replacementTokens(text: string): Set<string> {
  const reps = new Set<string>();
  // split on clause delimiters only — NOT the ASCII hyphen (it lives inside
  // hyphenated terms like “anti-aging” / “age-defying”).
  for (const seg of text.split(/[;—–]/)) {
    if (/\b(always use|use|prefer)\b/i.test(seg) && !/\b(never|avoid|don't|do not)\b/i.test(seg)) {
      for (const tok of quotedTokens(seg)) reps.add(tok);
    }
  }
  return reps;
}

/** Forbidden terms for a lexical-forbidden rule. */
function forbiddenTerms(rule: Rule): string[] {
  const quoted = quotedTokens(rule.text);
  const reps = replacementTokens(rule.text);
  const fromQuotes = quoted.filter((q) => !reps.has(q));
  if (fromQuotes.length) return fromQuotes;
  // subjects with no quotes → keyword sets
  if (rule.subject === 'commercial-value-terms')
    return ['cheap', 'discount', 'bargain', 'sale'];
  if (rule.subject === 'medical-claims')
    return ['cures', 'heals', 'medically proven', 'cure', 'heal', 'treats'];
  return rule.subject ? [rule.subject] : [];
}

/** Variant (wrong-form) tokens for a lexical-required rule = quoted after "never". */
function forbiddenVariants(text: string): string[] {
  const out: string[] = [];
  for (const seg of text.split(/[;—–,]/)) {
    if (/\b(never|not|avoid)\b/i.test(seg)) out.push(...quotedTokens(seg));
  }
  return out;
}

function present(copy: string, term: string): boolean {
  // word-ish boundary, case-insensitive, accent-sensitive
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}])${esc}([^\\p{L}]|$)`, 'iu').test(copy);
}

function v(rule: Rule, pass: boolean, verifiable: boolean, evidence: string): Verdict {
  return {
    localId: rule.localId,
    ruleName: rule.name,
    constraintType: rule.constraintType,
    pass,
    verifiable,
    evidence,
  };
}

export function verify(copy: string, rule: Rule): Verdict {
  switch (rule.constraintType) {
    case 'lexical-forbidden': {
      // Medical claims = the legal INVARIANT floor → must hold in every locale,
      // not just English. Dedicated multilingual, accent-insensitive matcher.
      if (rule.subject === 'medical-claims') {
        const hit = MEDICAL_CLAIM_TERMS.find((t) => containsClaim(copy, t));
        return hit
          ? v(rule, false, true, `allégation médicale présente : « ${hit} »`)
          : v(rule, true, true, 'aucune allégation médicale (multilingue)');
      }
      const terms = forbiddenTerms(rule);
      const hit = terms.find((t) => present(copy, t));
      return hit
        ? v(rule, false, true, `terme interdit présent : « ${hit} »`)
        : v(rule, true, true, `aucun terme interdit (${terms.join(', ') || '∅'})`);
    }

    case 'lexical-required': {
      // The canonical form = first quoted token. It must NOT be treated as a
      // forbidden variant even when it shares a clause with "never" (e.g.
      // "Never translate X; keep it in French" → X is REQUIRED, not banned).
      const required = quotedTokens(rule.text)[0];
      const variants = forbiddenVariants(rule.text).filter((t) => t !== required);
      const badVariant = variants.find((t) => present(copy, t));
      if (badVariant) return v(rule, false, true, `forme incorrecte présente : « ${badVariant} »`);
      if (required && present(copy, required))
        return v(rule, true, true, `forme canonique respectée : « ${required} »`);
      return v(rule, true, true, 'aucune forme incorrecte détectée');
    }

    case 'length-bound': {
      const bound = numericBound(rule);
      if (bound == null) return v(rule, true, false, 'borne non parsée — jugé');
      // item-count rules (bullets) → count lines; else character count
      if (/item|bullet/i.test(rule.text)) {
        const items = copy.split(/\n+/).map((l) => l.trim()).filter(Boolean).length;
        const min = (rule.text.match(/(\d+)\s*to\s*\d+/) || [])[1];
        const ok = items <= bound && (min ? items >= Number(min) : true);
        return v(rule, ok, true, `${items} éléments (borne ${min ?? '?'}–${bound})`);
      }
      const len = copy.length;
      return v(rule, len <= bound, true, `${len}/${bound} caractères`);
    }

    case 'format-pattern': {
      const sig = directiveSignature(rule);
      const exclaims = (copy.match(/!/g) || []).length;
      if (rule.subject === 'exclamation-mark') {
        if (sig === 'exclaim:forbid')
          return v(rule, exclaims === 0, true, `${exclaims} point(s) d'exclamation (0 autorisé)`);
        if (sig === 'exclaim:allow-one')
          return v(rule, exclaims <= 1, true, `${exclaims} point(s) d'exclamation (≤1 autorisé)`);
      }
      if (rule.subject === 'currency') {
        const before = /€\s?\d/.test(copy);
        const after = /\d\s?(€|eur)/i.test(copy);
        if (!before && !after) return v(rule, true, true, 'aucun prix dans la copie (n/a)');
        if (sig === 'currency:after')
          return v(rule, after && !before, true, after && !before ? 'symbole après le montant' : 'symbole avant le montant — attendu après');
        if (sig === 'currency:before')
          return v(rule, before && !after, true, before ? 'symbole avant le montant' : 'symbole après — attendu avant');
      }
      if (rule.subject === 'quotes') {
        const straight = /"[^"]+"/.test(copy);
        if (sig === 'quotes:typographic')
          return v(rule, !straight, true, straight ? 'guillemets droits détectés' : 'guillemets typographiques');
        if (sig === 'quotes:guillemets')
          return v(rule, /«[^»]+»/.test(copy) || !straight, true, 'guillemets « » attendus');
      }
      if (rule.subject === 'units') {
        const bad = /\d(ml|g|kg|cl)\b/i.test(copy); // missing space
        return v(rule, !bad, true, bad ? 'espace manquant avant l’unité' : 'unités correctes');
      }
      // other format channels (case, punctuation, date, trademark): best-effort → judged
      return v(rule, true, false, 'format non mécanisé ici — jugé');
    }

    case 'structure':
      return v(rule, true, false, 'structure — jugé (non prouvé mécaniquement)');

    case 'register-tone':
      return v(rule, true, false, 'registre/ton — jugé par le LLM, non prouvé');
  }
}

/** Run all active rules against a copy → the proof report. */
export function verifyAll(copy: string, rules: Rule[]): Verdict[] {
  return rules.map((r) => verify(copy, r));
}

// ─── Franglais check (A) ─────────────────────────────────────────────────────
// Deterministic foreign-term detector for non-English Latin locales (fr/de/it).
// High-signal source = the replacement terms prescribed by lexical-forbidden
// rules ("use X instead"), which the LLM tends to paste verbatim in English.
// Plus a small, unambiguous English marker list. Brand + required canonical
// forms (trail-ready, coupe-vent…) are allow-listed so they never flag.
const EN_FRANGLAIS_MARKERS = [
  'the', 'and', 'with', 'your', 'you', 'for', 'this', 'our', 'from',
  'waterproof', 'water-resistant', 'eco-friendly', 'recycled', 'lightweight',
  'breathable', 'boost', 'glow', 'sleek', 'flawless',
];

/** Keep-verbatim tokens = first quoted token of each lexical-required rule. */
export function requiredCanonicalTokens(rules: Rule[]): string[] {
  return rules
    .filter((r) => r.constraintType === 'lexical-required')
    .map((r) => quotedTokens(r.text)[0])
    .filter((t): t is string => !!t);
}

/** Is this locale a non-English Latin-script locale the franglais check covers? */
export function franglaisApplies(locale: string): boolean {
  const lang = LOCALE_LANG[locale] ?? LOCALE_LANG[locale.split('-')[0]];
  return lang === 'fr' || lang === 'de' || lang === 'it';
}

/** Flag English replacement terms / markers appearing verbatim in non-English
 *  copy — EXCEPT the brand and required canonical forms. Rule-grounded + precise. */
export function verifyForeignTerms(copy: string, rules: Rule[], brand: string): Verdict {
  const mk = (pass: boolean, evidence: string): Verdict => ({
    localId: 'franglais',
    ruleName: 'Pas de franglais',
    constraintType: 'lexical-forbidden',
    pass,
    verifiable: true,
    evidence,
  });

  const suspects = new Set<string>(EN_FRANGLAIS_MARKERS);
  for (const r of rules) {
    if (r.constraintType === 'lexical-forbidden')
      for (const t of replacementTokens(r.text)) suspects.add(t);
  }

  const allow = new Set<string>();
  for (const t of requiredCanonicalTokens(rules)) allow.add(lc(t));
  for (const w of lc(brand).split(/[^\p{L}]+/u)) if (w) allow.add(w);

  const hits = [...suspects].filter((t) => !allow.has(lc(t)) && present(copy, t));
  return hits.length
    ? mk(false, `mot(s) anglais à traduire : ${hits.map((h) => `« ${h} »`).join(', ')}`)
    : mk(true, 'aucun mot anglais hors marque / termes imposés');
}

// ─── Language adherence (meta-check, not a graph rule) ───────────────────────
// The deterministic engine can't prove tone, but it CAN catch the gross failure
// of a copy written in the wrong language for the locale (e.g. French for de-DE).
const LOCALE_LANG: Record<string, string> = {
  'fr-FR': 'fr', 'de-DE': 'de', 'it-IT': 'it', 'ja-JP': 'ja', 'en-GB': 'en', 'en-US': 'en',
};
const STOPWORDS: Record<string, string[]> = {
  fr: ['le', 'la', 'les', 'des', 'une', 'vous', 'votre', 'vos', 'est', 'et', 'pour', 'avec', 'dans', 'que', 'qui', 'sur', 'ce'],
  de: ['der', 'die', 'das', 'und', 'mit', 'fur', 'sie', 'ihre', 'ist', 'ein', 'eine', 'auf', 'nicht', 'wird', 'den', 'zu', 'von'],
  it: ['il', 'la', 'di', 'per', 'con', 'una', 'che', 'non', 'gli', 'del', 'della', 'sono', 'tua', 'tuo', 'piu'],
  en: ['the', 'and', 'with', 'your', 'for', 'this', 'that', 'our', 'you', 'are', 'from', 'more'],
};
const hasCJK = (s: string) => /[぀-ヿ一-鿿]/.test(s);

function scoreLang(copy: string, lang: string): number {
  const words = stripDiacritics(copy).toLowerCase().match(/[a-z]+/g) ?? [];
  const set = new Set(STOPWORDS[lang]);
  return words.reduce((n, w) => n + (set.has(w) ? 1 : 0), 0);
}

/** Synthetic verdict: is the copy in the locale's language? Conservative —
 *  only fails when another language CLEARLY dominates the expected one. */
export function verifyLanguage(copy: string, locale: string): Verdict {
  const mk = (pass: boolean, evidence: string): Verdict => ({
    localId: 'lang',
    ruleName: 'Langue du locale',
    constraintType: 'format-pattern',
    pass,
    verifiable: true,
    evidence,
  });
  const lang = LOCALE_LANG[locale] ?? LOCALE_LANG[locale.split('-')[0]];
  const text = copy.trim();
  if (!lang || text.length < 12) return mk(true, 'langue non vérifiée');

  if (lang === 'ja') {
    return hasCJK(text)
      ? mk(true, 'caractères japonais présents')
      : mk(false, 'aucun caractère japonais — attendu en japonais');
  }

  const langs = ['fr', 'de', 'it', 'en'];
  const scores: Record<string, number> = {};
  for (const l of langs) scores[l] = scoreLang(text, l);
  const expected = scores[lang] ?? 0;
  const rivals = langs.filter((l) => l !== lang);
  const topRival = rivals.reduce((a, l) => (scores[l] > scores[a] ? l : a), rivals[0]);
  const top = scores[topRival];

  if (top >= expected + 3 || (expected === 0 && top >= 2)) {
    return mk(false, `copie en « ${topRival} », attendu « ${lang} »`);
  }
  return mk(true, `langue cohérente (${lang})`);
}
