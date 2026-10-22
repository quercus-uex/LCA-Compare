import { apiRequest } from '../../common/api.ts';
import { safeString } from '../../common/utils.ts';
import { CONFIG, ENTITY_DISPLAY, type Entity, type FieldConfig, type Item } from './admin.config.ts';

export type FormState = Record<string, string | boolean>;
export type FormMode = 'create' | 'edit';
export type FieldErrors = Record<string, string>;
type SubmitBody = Record<string, string | number | boolean | null>;

/** Error del panel ya clasificado, listo para mostrar */
export type AdminError = {
  status: number;
  code: 'duplicate' | 'in-use' | 'not-found' | 'validation' | 'forbidden' | 'unknown';
  fields: string[];
  message?: string;
};

export type Summary = Partial<Record<Entity | 'parcelasSinPoblacion', number>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isFieldRequired = (field: FieldConfig, mode: FormMode) =>
  field.required === true || (field.required === 'create' && mode === 'create');

export async function readAdminError(res: Response): Promise<AdminError> {
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    fields?: string[];
    message?: string | string[];
  };
  const message = Array.isArray(body.message) ? body.message.join('. ') : body.message;
  const fields = body.fields ?? [];
  if (res.status === 409) {
    return { status: 409, code: body.error === 'duplicate' ? 'duplicate' : 'in-use', fields, message };
  }
  if (res.status === 404) return { status: 404, code: 'not-found', fields, message };
  if (res.status === 400) return { status: 400, code: 'validation', fields, message };
  if (res.status === 401 || res.status === 403) return { status: res.status, code: 'forbidden', fields, message };
  return { status: res.status, code: 'unknown', fields, message };
}

/** Valores iniciales del formulario y etiquetas de las relaciones ya cargadas */
export function formFromItem(entity: Entity, item: Item | null): { form: FormState; labels: Record<string, string> } {
  const form: FormState = {};
  const labels: Record<string, string> = {};
  for (const field of CONFIG[entity].formFields) {
    const raw = item?.[field.name];
    if (field.type === 'checkbox') {
      form[field.name] = raw === true;
      continue;
    }
    if (field.type === 'password') {
      form[field.name] = '';
      continue;
    }
    let value = safeString(raw) ?? '';
    if (field.type === 'date' && value) value = value.slice(0, 10);
    form[field.name] = value;

    if (field.type === 'fk' && field.entity && field.relation && item) {
      const relatedItem = item[field.relation];
      if (relatedItem && typeof relatedItem === 'object') {
        labels[field.name] = ENTITY_DISPLAY[field.entity].label(relatedItem as Item);
      }
    }
  }
  return { form, labels };
}

export function validateForm(entity: Entity, form: FormState, mode: FormMode): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of CONFIG[entity].formFields) {
    const value = form[field.name];
    if (field.type === 'checkbox') continue;
    const str = typeof value === 'string' ? value.trim() : '';
    if (!str) {
      if (isFieldRequired(field, mode)) errors[field.name] = 'admin.validation.required';
      continue;
    }
    if (field.type === 'number') {
      const num = Number(str);
      if (!Number.isFinite(num)) errors[field.name] = 'admin.validation.number';
      else if (field.step === '1' && !Number.isInteger(num)) errors[field.name] = 'admin.validation.integer';
      else if (num < 0) errors[field.name] = 'admin.validation.nonNegative';
    }
    if (field.type === 'email' && !EMAIL_PATTERN.test(str)) errors[field.name] = 'admin.validation.email';
    if (field.type === 'password' && str.length < 8) errors[field.name] = 'admin.validation.passwordLength';
  }
  return errors;
}

export function toSubmitBody(entity: Entity, form: FormState, mode: FormMode): SubmitBody {
  const body: SubmitBody = {};
  for (const field of CONFIG[entity].formFields) {
    if (field.lockedOnEdit && mode === 'edit') continue;
    const value = form[field.name];
    if (field.type === 'checkbox') {
      body[field.name] = value === true;
      continue;
    }
    const str = typeof value === 'string' ? value.trim() : '';
    // Contraseña vacía al editar: se mantiene la actual
    if (field.type === 'password' && !str && mode === 'edit') continue;
    if (!str) {
      // Un texto vacío en un campo único (SIGPAC, ref. catastral...) debe ser null
      body[field.name] = null;
    } else if (field.type === 'number') {
      body[field.name] = Number(str);
    } else if (field.type === 'date') {
      body[field.name] = `${str}T00:00:00.000Z`;
    } else {
      body[field.name] = str;
    }
  }
  return body;
}

export async function saveItem(
  entity: Entity,
  mode: FormMode,
  id: string | undefined,
  body: SubmitBody,
): Promise<AdminError | null> {
  const res = await apiRequest(mode === 'create' ? `/admin/${entity}` : `/admin/${entity}/${id}`, {
    method: mode === 'create' ? 'POST' : 'PUT',
    body: JSON.stringify(body),
  });
  return res.ok ? null : readAdminError(res);
}

export async function deleteItem(entity: Entity, id: string): Promise<AdminError | null> {
  const res = await apiRequest(`/admin/${entity}/${id}`, { method: 'DELETE' });
  return res.ok ? null : readAdminError(res);
}

export async function fetchSummary(signal?: AbortSignal): Promise<Summary> {
  const res = await apiRequest('/admin/resumen', { signal });
  if (!res.ok) throw new Error(String(res.status));
  return ((await res.json()) as { data: Summary }).data;
}

export async function fetchPage(
  entity: Entity,
  params: { search?: string; skip: number; take: number; sinPoblacion?: boolean },
  signal?: AbortSignal,
): Promise<{ data: Item[]; total: number }> {
  const query = new URLSearchParams({ skip: String(params.skip), take: String(params.take) });
  if (params.search) query.set('search', params.search);
  if (params.sinPoblacion) query.set('sinPoblacion', 'true');
  const res = await apiRequest(`/admin/${entity}?${query}`, { signal });
  if (!res.ok) throw new Error(String(res.status));
  const json = (await res.json()) as { data?: Item[]; total?: number };
  return { data: json.data ?? [], total: json.total ?? 0 };
}

export async function fetchOne(entity: Entity, id: string, signal?: AbortSignal): Promise<Item | null> {
  const res = await apiRequest(`/admin/${entity}/${id}`, { signal });
  if (!res.ok) return null;
  return ((await res.json()) as { data?: Item }).data ?? null;
}
