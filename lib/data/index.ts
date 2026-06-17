import raw from './maison_lumiere.json';
import { RawRule } from '../domain/ingest';

/** The bundled sample (47 rules). The default set goes through the SAME
 *  pipeline as any uploaded set — proving the system is data-driven. */
export const defaultRawRules = raw as RawRule[];
