import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import {
  formFromItem,
  isFieldRequired,
  saveItem,
  toSubmitBody,
  validateForm,
  type AdminError,
  type FieldErrors,
  type FormMode,
  type FormState,
} from './admin-api.ts';
import { AdminDialog } from './admin-dialog.component.tsx';
import { CONFIG, type Entity, type FieldConfig, type Item } from './admin.config.ts';
import { IdLookupField } from './id-lookup-field.component.tsx';

type Props = {
  entity: Entity;
  mode: FormMode;
  item: Item | null;
  currentUserId?: string;
  onClose: () => void;
  onSaved: () => void;
};

export const AdminFormModal = ({ entity, mode, item, currentUserId, onClose, onSaved }: Props) => {
  const { t } = useTranslation();
  const titleId = useId();
  const formId = useId();
  const config = CONFIG[entity];
  const [initial] = useState(() => formFromItem(entity, item));
  const [form, setForm] = useState<FormState>(initial.form);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isSelf = entity === 'usuarios' && mode === 'edit' && item?.id === currentUserId;

  const setValue = (name: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const describeError = (error: AdminError): string => {
    if (error.code === 'duplicate') {
      const labels = error.fields
        .map((name) => config.formFields.find((f) => f.name === name))
        .filter((f): f is FieldConfig => f !== undefined)
        .map((f) => t(f.labelKey));
      return labels.length
        ? t('admin.errors.duplicateFields', { fields: labels.join(', ') })
        : t('admin.errors.duplicate');
    }
    if (error.code === 'in-use') return t('admin.errors.relatedMissing');
    if (error.code === 'not-found') return t('admin.errors.notFound');
    if (error.code === 'forbidden') return t('admin.errors.forbidden');
    if (error.code === 'validation') {
      return error.message ? t('admin.errors.validationDetail', { detail: error.message }) : t('admin.errors.validation');
    }
    return t('admin.errors.unknown');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm(entity, form, mode);
    setErrors(validation);
    setServerError(null);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    try {
      const error = await saveItem(entity, mode, item?.id as string | undefined, toSubmitBody(entity, form, mode));
      if (error) {
        if (error.code === 'duplicate') {
          setErrors(Object.fromEntries(error.fields.map((name) => [name, 'admin.validation.duplicate'])));
        }
        setServerError(describeError(error));
        return;
      }
      onSaved();
    } catch {
      setServerError(t('admin.errors.network'));
    } finally {
      setSaving(false);
    }
  };

  const renderControl = (field: FieldConfig, inputId: string, describedBy: string | undefined) => {
    const value = form[field.name];
    const invalid = Boolean(errors[field.name]);
    const locked = (field.lockedOnEdit && mode === 'edit') || (isSelf && field.name === 'rol');
    const common = {
      id: inputId,
      'aria-invalid': invalid,
      'aria-describedby': describedBy,
      disabled: locked || saving,
    };

    if (field.type === 'checkbox') {
      return (
        <input
          {...common}
          type="checkbox"
          className="toggle toggle-primary"
          checked={value === true}
          onChange={(e) => setValue(field.name, e.target.checked)}
        />
      );
    }
    if (field.type === 'select') {
      return (
        <select
          {...common}
          className={`select w-full ${invalid ? 'select-error' : ''}`}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => setValue(field.name, e.target.value)}
        >
          <option value="" disabled>
            {t('admin.form.selectPlaceholder')}
          </option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
          {/* Valores guardados fuera de la lista (p. ej. tipos de cultivo antiguos) */}
          {typeof value === 'string' && value && !field.options?.some((o) => o.value === value) && (
            <option value={value}>{value}</option>
          )}
        </select>
      );
    }
    if (field.type === 'fk' && field.entity) {
      return (
        <IdLookupField
          id={inputId}
          entity={field.entity}
          value={typeof value === 'string' ? value : ''}
          initialLabel={initial.labels[field.name]}
          onChange={(v) => setValue(field.name, v)}
          disabled={locked || saving}
          invalid={invalid}
          clearable={!isFieldRequired(field, mode)}
        />
      );
    }
    return (
      <input
        {...common}
        type={field.type}
        step={field.step}
        min={field.type === 'number' ? 0 : undefined}
        autoComplete={field.type === 'password' ? 'new-password' : 'off'}
        className={`input w-full ${invalid ? 'input-error' : ''} ${field.lockedOnEdit ? 'font-mono text-sm' : ''}`}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => setValue(field.name, e.target.value)}
      />
    );
  };

  return (
    <AdminDialog labelledBy={titleId} onClose={onClose} locked={saving} className="max-w-2xl">
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className="flex flex-col max-h-[calc(100dvh-5em)]">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-base-200">
          <div>
            <h3 id={titleId} className="text-lg font-semibold">
              {t(`admin.${mode === 'create' ? 'createTitles' : 'editTitles'}.${config.titleKey}`)}
            </h3>
            <p className="text-sm text-base-content/60">
              {mode === 'create' ? t('admin.form.createHelp') : t('admin.form.editHelp')}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
            disabled={saving}
            aria-label={t('common.actions.close')}
          >
            <FiX aria-hidden />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          {serverError && (
            <div role="alert" className="alert alert-error sm:col-span-2">
              <FiAlertCircle aria-hidden />
              <span>{serverError}</span>
            </div>
          )}

          {config.formFields.map((field) => {
            const inputId = `${formId}-${field.name}`;
            const required = isFieldRequired(field, mode);
            const help = mode === 'edit' && field.helpEditKey ? field.helpEditKey : field.helpKey;
            const error = errors[field.name];
            const describedBy = error || help ? `${inputId}-desc` : undefined;
            const spanClass = field.span === 'full' ? 'sm:col-span-2' : '';

            if (field.type === 'checkbox') {
              return (
                <div key={field.name} className={`flex items-start gap-3 rounded-box bg-base-200/60 p-3 ${spanClass}`}>
                  {renderControl(field, inputId, describedBy)}
                  <div>
                    <label htmlFor={inputId} className="font-medium text-sm cursor-pointer">
                      {t(field.labelKey)}
                    </label>
                    {help && (
                      <p id={describedBy} className="text-xs text-base-content/60">
                        {t(help)}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={field.name} className={`flex flex-col gap-1 ${spanClass}`}>
                <label htmlFor={inputId} className="text-sm font-medium">
                  {t(field.labelKey)}
                  {required && (
                    <span className="text-base-content/50" aria-hidden>
                      {' '}
                      *
                    </span>
                  )}
                </label>
                {renderControl(field, inputId, describedBy)}
                {(error || help) && (
                  <p id={describedBy} className={`text-xs ${error ? 'text-red-700 font-medium' : 'text-base-content/60'}`}>
                    {error ? t(error) : t(help!)}
                  </p>
                )}
                {isSelf && field.name === 'rol' && (
                  <p className="text-xs text-base-content/60">{t('admin.help.ownRole')}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-base-200 bg-base-200/40">
          <p className="text-xs text-base-content/60">{t('admin.form.requiredHint')}</p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              {t('common.actions.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="loading loading-spinner loading-sm" aria-hidden />}
              {mode === 'create' ? t('common.actions.create') : t('common.actions.save')}
            </button>
          </div>
        </div>
      </form>
    </AdminDialog>
  );
};
