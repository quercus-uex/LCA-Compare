import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Callout, DatePicker, Dialog, Field, Input, Select, Toggle } from '../../components/ui/index.ts';
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

  const renderControl = (field: FieldConfig) => {
    const value = form[field.name];
    const text = typeof value === 'string' ? value : '';
    const locked = (field.lockedOnEdit && mode === 'edit') || (isSelf && field.name === 'rol');
    const disabled = locked || saving;

    if (field.type === 'select') {
      return (
        <Select value={text} disabled={disabled} onChange={(e) => setValue(field.name, e.target.value)}>
          <option value="" disabled>
            {t('admin.form.selectPlaceholder')}
          </option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
          {/* Valores guardados fuera de la lista (p. ej. tipos de cultivo antiguos) */}
          {text && !field.options?.some((o) => o.value === text) && <option value={text}>{text}</option>}
        </Select>
      );
    }
    if (field.type === 'fk' && field.entity) {
      return (
        <IdLookupField
          entity={field.entity}
          value={text}
          initialLabel={initial.labels[field.name]}
          onChange={(v) => setValue(field.name, v)}
          disabled={disabled}
          clearable={!isFieldRequired(field, mode)}
        />
      );
    }
    if (field.type === 'date') {
      return (
        <DatePicker
          value={text}
          onChange={(v) => setValue(field.name, v)}
          disabled={disabled}
          clearable={!isFieldRequired(field, mode)}
        />
      );
    }
    return (
      <Input
        type={field.type}
        step={field.step}
        min={field.type === 'number' ? 0 : undefined}
        autoComplete={field.type === 'password' ? 'new-password' : 'off'}
        className={field.lockedOnEdit ? 'font-mono text-sm' : undefined}
        value={text}
        disabled={disabled}
        onChange={(e) => setValue(field.name, e.target.value)}
      />
    );
  };

  return (
    <Dialog
      title={t(`admin.${mode === 'create' ? 'createTitles' : 'editTitles'}.${config.titleKey}`)}
      description={mode === 'create' ? t('admin.form.createHelp') : t('admin.form.editHelp')}
      onClose={onClose}
      locked={saving}
      size="lg"
      footer={
        <>
          <p className="mr-auto text-sm text-muted">{t('admin.form.requiredHint')}</p>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="primary" type="submit" form={formId} loading={saving}>
            {mode === 'create' ? t('common.actions.create') : t('common.actions.save')}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {serverError && (
          <Callout tone="error" live className="sm:col-span-2">
            {serverError}
          </Callout>
        )}

        {config.formFields.map((field) => {
          const help = mode === 'edit' && field.helpEditKey ? field.helpEditKey : field.helpKey;
          const error = errors[field.name];
          const spanClass = field.span === 'full' ? 'sm:col-span-2' : '';

          if (field.type === 'checkbox') {
            return (
              <Toggle
                key={field.name}
                label={t(field.labelKey)}
                hint={help && t(help)}
                className={`rounded-box bg-base-200/60 p-3 ${spanClass}`}
                checked={form[field.name] === true}
                disabled={(field.lockedOnEdit && mode === 'edit') || saving}
                onChange={(e) => setValue(field.name, e.target.checked)}
              />
            );
          }

          // El rol propio no se puede cambiar: la ayuda lo explica
          const ownRole = isSelf && field.name === 'rol';
          return (
            <Field
              key={field.name}
              label={t(field.labelKey)}
              required={isFieldRequired(field, mode)}
              hint={help ? t(help) : ownRole ? t('admin.help.ownRole') : undefined}
              error={error && t(error)}
              className={spanClass}
            >
              {renderControl(field)}
            </Field>
          );
        })}
      </form>
    </Dialog>
  );
};
