import Ajv from 'ajv';
import addFormats from 'ajv-formats';

let ajv: Ajv | null = null;

export async function getCanonicalReservationValidator() {
  if (!ajv) {
    ajv = new Ajv({ strict: false, code: { optimize: 1 }, allErrors: false });
    addFormats(ajv);
  }
  // dynamic import keeps startup light
  const schema = await import('../../contracts/pos/canonical-reservation.schema.json');
  const s = (schema as any).default ?? schema;
  return ajv.compile(s);
}
