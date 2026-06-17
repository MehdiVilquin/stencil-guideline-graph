// Classification — the real kernel.
// Assigns each rule a (constraintType, subject) = its "ring", plus an
// `overridable` flag (false = legal/medical/safety invariant → floor).
//
// 100% deterministic keyword heuristics on the rule TEXT — never on local_id,
// brand name, or any Maison-Lumière specific value (stays data-driven, kills P5).
// In production the LLM would assist on ambiguous rows; the result would be
// frozen + reviewable. Here the heuristics classify the sample correctly and
// the reasoning is surfaced in the glass-box (`classifierReason`).

import { ConstraintType, Strength } from './types';

export interface ClassifyInput {
  name: string;
  text: string;
  field: string; // normalized product_field (may be WILDCARD '*')
  strength: Strength;
  segmentExample: string;
}

export interface Classification {
  constraintType: ConstraintType;
  subject: string;
  overridable: boolean;
  reason: string;
}

const lc = (s: string) => s.toLowerCase();
const has = (s: string, re: RegExp) => re.test(s);

/** First quoted token (“ ” or " " or ‘ ’), lowercased — the natural subject of a lexical rule. */
function firstQuoted(text: string): string | null {
  const m = text.match(/[“"‘]([^”"’]{1,40})[”"’]/);
  return m ? lc(m[1].trim()) : null;
}

/** Detect the format channel a rule governs (→ stable shared subject). */
function formatChannel(t: string): string | null {
  if (has(t, /exclamation/)) return 'exclamation-mark';
  if (has(t, /emoji/)) return 'emoji';
  if (has(t, /currency|price|€|symbol (before|after)|comma decimal/)) return 'currency';
  if (has(t, /quotation mark|guillemet|typographic quote|straight quote|« »|“ ”/))
    return 'quotes';
  if (has(t, /date/) && has(t, /dd\/mm|format|month/)) return 'date-format';
  if (has(t, /full-width|punctuation/)) return 'punctuation';
  if (has(t, /\bunit(s)?\b|metric|ml\b|space before the unit/)) return 'units';
  if (has(t, /sentence case|title case|capitali/)) return 'heading-case';
  if (has(t, /trademark|®/)) return 'trademark';
  return null;
}

/** Detect a register/tone aspect (→ shared subject; NOT mechanically verifiable). */
function registerAspect(t: string): string | null {
  if (has(t, /second person|address the reader|formal|informal|\bsie\b|tutoiement|“you”|“tu”/))
    return 'reader-address';
  if (has(t, /desu|masu|polite register|plain form/)) return 'register-jp';
  if (has(t, /voice is|tone|restraint|understated|refined|confident/)) return 'brand-voice';
  if (has(t, /luxurious|aspirational/)) return 'luxury-feel';
  if (has(t, /conversational|emoji|social/)) return 'social-register';
  if (has(t, /editorial|sensorial|evocative/)) return 'editorial-opening';
  if (has(t, /comparison|competitor/)) return 'competitor-comparison';
  if (has(t, /inclusive writing|midpoint/)) return 'inclusive-writing';
  if (has(t, /curated ritual|bundle|savings|gift set/)) return 'giftset-framing';
  if (has(t, /cross-sell|hero benefit|above the fold/)) return 'page-focus';
  return null;
}

/**
 * Invariant detection: a forbidden rule whose violation is a legal/medical/
 * safety risk rather than a style choice. Crucially EXCLUDES term-substitution
 * rules (those that prescribe a replacement, e.g. "Always use …") so that a
 * lexical rule citing "medical claim" as mere justification stays overridable.
 */
function detectInvariant(name: string, text: string, strength: Strength): boolean {
  const t = lc(`${name} ${text}`);
  const medicalOrLegal = has(
    t,
    /\b(medical|therapeutic|medically proven|clinically proven|drug|legal|gdpr|allerg)\b/,
  );
  const prescribesReplacement = has(text, /always use|use “|use "/i);
  return strength === 'forbidden' && medicalOrLegal && !prescribesReplacement;
}

export function classify(input: ClassifyInput): Classification {
  const { name, text, field, strength, segmentExample } = input;
  const t = lc(`${name}. ${text}`);
  const overridable = !detectInvariant(name, text, strength);
  const inv = overridable ? '' : ' · invariant (compliance floor)';

  // Invariants (medical/legal claims) get a stable compliance subject.
  if (!overridable) {
    return mk('lexical-forbidden', 'medical-claims', false, `forbidden compliance claim${inv}`);
  }

  // 1) length / count bounds
  if (
    has(t, /\d+\s*characters?|must not exceed|maximum \d+|extend to \d+|up to \d+ char/) ||
    has(t, /\d+\s*to\s*\d+\s*(items|sentences)|one to two sentences/)
  ) {
    const subjField = field !== '*' ? field : lengthSubjectFromText(t);
    return mk('length-bound', `length:${subjField}`, overridable, `numeric length/count bound on ${subjField}${inv}`);
  }

  // 2) format channels (currency, quotes, date, units, punctuation, case, ®)
  const channel = formatChannel(t);
  if (channel) {
    // exclamation/emoji rules are framed as forbidden/permitted punctuation usage
    return mk('format-pattern', channel, overridable, `format/punctuation channel: ${channel}${inv}`);
  }

  // 3) structure (ordering / required sections / must-state)
  if (
    has(t, /follow:|structure|hook →|in order|must list|must state|must appear|composition|placement|offer period|fall back|fallback/)
  ) {
    const subj = structureSubject(t);
    return mk('structure', subj, overridable, `structural requirement: ${subj}${inv}`);
  }

  // 4) register / tone (NOT mechanically verifiable)
  const aspect = registerAspect(t);
  if (aspect) {
    return mk('register-tone', aspect, overridable, `register/tone aspect: ${aspect} (judged, not proven)${inv}`);
  }

  // 5) lexical: forbidden vs required term.
  // Rules that PRESERVE/PRESCRIBE a canonical form → required, even if they also
  // say "never <variant>" (e.g. "Always write …; never lowercase"; "keep in French").
  const quoted = firstQuoted(text);
  const preserves = has(
    t,
    /always write|do not translate|never translate|keep (it|them|the [^.]* )in|render .* as|british spelling|use the/,
  );
  if (preserves) {
    const subj = quoted ?? lexicalSubject(t) ?? (segmentExample ? lc(segmentExample) : 'term');
    return mk('lexical-required', subj, overridable, `required/canonical form: "${subj}"${inv}`);
  }

  // Otherwise: whichever of forbid/prescribe leads the sentence wins the channel.
  const idxForbid = t.search(/\b(never|avoid|forbidden|do not use|don't use)\b/);
  const idxAllow = t.search(/\b(use ["“]|always use|prefer)\b/);
  const leadsForbidden = idxForbid !== -1 && (idxAllow === -1 || idxForbid < idxAllow);
  if (leadsForbidden) {
    const subj = commercialSubject(t) ?? quoted ?? 'forbidden-term';
    return mk('lexical-forbidden', subj, overridable, `forbidden term: "${subj}"${inv}`);
  }
  const subj = quoted ?? lexicalSubject(t) ?? (segmentExample ? lc(segmentExample) : 'term');
  return mk('lexical-required', subj, overridable, `required/canonical term: "${subj}"${inv}`);
}

function mk(
  constraintType: ConstraintType,
  subject: string,
  overridable: boolean,
  reason: string,
): Classification {
  return { constraintType, subject, overridable, reason };
}

function lengthSubjectFromText(t: string): string {
  if (has(t, /title/)) return 'title';
  if (has(t, /bullet/)) return 'bullet_points';
  if (has(t, /short description/)) return 'short_description';
  if (has(t, /seo|meta/)) return 'seo_meta';
  if (has(t, /editorial|intro/)) return 'editorial-intro';
  return 'body';
}

function structureSubject(t: string): string {
  if (has(t, /gift set|curated ritual/)) return 'giftset-composition';
  if (has(t, /offer period|end date/)) return 'offer-period';
  if (has(t, /ingredient (concentration|figure)|retinol|%/)) return 'ingredient-figures';
  if (has(t, /fall back|fallback|locale-specific/)) return 'locale-fallback';
  if (has(t, /hook|key benefit|how to use/)) return 'product-description-structure';
  return 'structure';
}

function commercialSubject(t: string): string | null {
  if (has(t, /cheap|discount|bargain|sale|exclusive offer|limited edition/))
    return 'commercial-value-terms';
  return null;
}

function lexicalSubject(t: string): string | null {
  if (has(t, /house name|maison/)) return 'house-name';
  if (has(t, /flagship|product name|serum/)) return 'flagship-name';
  if (has(t, /spelling|moisturiser|colour|centre/)) return 'spelling';
  if (has(t, /fragrance|profumo/)) return 'fragrance-term';
  if (has(t, /sub-brand|playful english/)) return 'subbrand-names';
  return null;
}
