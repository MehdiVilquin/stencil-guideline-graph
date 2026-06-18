// File → RawRule[] — client-side parsing of an uploaded guideline set.
// JSON is parsed natively; XLSX + CSV go through SheetJS, dynamic-imported so it
// only enters the bundle when a file is actually dropped. The parsed rows feed
// the SAME ingest pipeline as the bundled sample (data-driven, nothing hardcoded).

import type { RawRule } from "@/lib/domain/ingest";

/** Columns the ingest pipeline understands — used to pick the data sheet. */
const KNOWN_COLUMNS = [
  "local_id",
  "guideline_text",
  "name",
  "brand",
  "target_locale",
  "content_typology",
  "product_category",
  "product_type",
  "product_field",
  "generation_type",
  "guideline_type",
  "data_quality",
];

export interface ParsedFile {
  rows: RawRule[];
  source: string;
}

/** Coerce any record into a RawRule (all values stringified, keys trimmed). */
function toRawRule(o: Record<string, unknown>): RawRule {
  const out: RawRule = {};
  for (const [k, v] of Object.entries(o)) {
    out[k.trim()] = v == null ? "" : String(v).trim();
  }
  return out;
}

/** A row is meaningful if it carries the rule text or at least a name. */
function hasContent(r: RawRule): boolean {
  return Boolean((r.guideline_text && r.guideline_text.length) || (r.name && r.name.length));
}

type XLSXModule = typeof import("xlsx");

/** Pick the sheet whose header row best matches the known schema (handles the
 *  "legend"/readme second sheet in the sample). Falls back to the first sheet. */
function pickDataSheet(XLSX: XLSXModule, wb: import("xlsx").WorkBook) {
  let best = wb.Sheets[wb.SheetNames[0]];
  let bestScore = -1;
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (!rows.length) continue;
    const keys = Object.keys(rows[0]).map((k) => k.toLowerCase().trim());
    const score = KNOWN_COLUMNS.filter((k) => keys.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = sheet;
    }
  }
  return best;
}

/** Parse an uploaded guideline file (.json / .csv / .xlsx) into raw rows. */
export async function parseGuidelineFile(file: File): Promise<ParsedFile> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "json") {
    const parsed = JSON.parse(await file.text());
    const arr = Array.isArray(parsed) ? parsed : parsed?.rows;
    if (!Array.isArray(arr)) {
      throw new Error("JSON attendu : un tableau d'objets, ou { rows: [...] }.");
    }
    const rows = arr.map(toRawRule).filter(hasContent);
    if (!rows.length) throw new Error("Aucune règle trouvée dans le fichier JSON.");
    return { rows, source: file.name };
  }

  if (ext === "csv" || ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = pickDataSheet(XLSX, wb);
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      raw: false,
      defval: "",
    });
    const rows = json.map(toRawRule).filter(hasContent);
    if (!rows.length) throw new Error("Aucune règle trouvée dans le fichier.");
    return { rows, source: file.name };
  }

  throw new Error(`Format non supporté : .${ext}. Utilisez .xlsx, .csv ou .json.`);
}
