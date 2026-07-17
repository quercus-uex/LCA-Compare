import { useTranslation } from 'react-i18next';
import { IdLookupField } from './id-lookup-field.component.tsx';
import { CONFIG, FK_REFERENCES, ROLES, type Entity, type FieldConfig } from './admin.config.ts';

type FormState = Record<string, string | boolean>;

type Props = {
  modalOpen: boolean;
  modalMode: 'create' | 'edit';
  form: FormState;
  getEntity: () => Entity;
  getEntityLabel: (entity: Entity) => string;
  getFieldLabel: (field: FieldConfig) => string;
  handleChange: (name: string, value: string | boolean) => void;
  handleSubmit: () => Promise<void>;
  closeModal: () => void;
};

export const AdminModal = ({
  modalOpen,
  modalMode,
  form,
  getEntity,
  getEntityLabel,
  getFieldLabel,
  handleChange,
  handleSubmit,
  closeModal,
}: Props) => {
  const { t } = useTranslation();
  if (!modalOpen) return null;

  const entity = getEntity();
  const modalCfg = CONFIG[entity];
  const modalLabel = getEntityLabel(entity);

  return (
    <div className="modal modal-open backdrop:transition-opacity backdrop:duration-200">
      <div className="modal-box max-w-lg transition-transform duration-200">
        <h3 className="font-bold text-lg mb-1">
          {modalMode === 'create'
            ? t('admin.newEntity', { entity: modalLabel.slice(0, -1).toLowerCase() })
            : t('admin.editEntity', { entity: modalLabel.slice(0, -1).toLowerCase() })}
        </h3>
        <p className="text-sm text-base-content/50 mb-4">
          {modalMode === 'create'
            ? t('admin.createHelp')
            : t('admin.editHelp')}
        </p>

        <div className="flex flex-col gap-3">
          {modalCfg.formFields.map((field) => {
            const fkConfig = FK_REFERENCES[field.name];
            const isIdField = field.name === 'id' && entity === 'metodos-impacto';
            const isPassword = field.name === 'passwordHash';
            const isDisabled = isIdField && modalMode === 'edit';

            if (field.name === 'rol') {
              return (
                <label key={field.name} className="form-control w-full">
                  <div className="label py-0.5">
                    <span className="label-text">{getFieldLabel(field)}</span>
                  </div>
                  <select
                    className="select select-bordered w-full"
                    value={(form[field.name] as string) ?? ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  >
                    <option value="" disabled>{t('admin.selectRole')}</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
              );
            }

            if (fkConfig) {
              return (
                <label key={field.name} className="form-control w-full">
                  <div className="label py-0.5">
                    <span className="label-text">{getFieldLabel(field)}</span>
                  </div>
                  <IdLookupField
                    name={field.name}
                    value={(form[field.name] as string) ?? ''}
                    onChange={handleChange}
                    fkConfig={fkConfig}
                    disabled={isDisabled}
                  />
                </label>
              );
            }

            if (field.type === 'checkbox') {
              const checked = form[field.name] === true || form[field.name] === 'true';
              return (
                <label key={field.name} className="form-control w-full">
                  <div className="label py-0.5 justify-start gap-3">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={checked}
                      disabled={isDisabled}
                      onChange={(e) => handleChange(field.name, e.target.checked)}
                    />
                    <span className="label-text">{getFieldLabel(field)}</span>
                  </div>
                </label>
              );
            }

            return (
              <label key={field.name} className="form-control w-full">
                <div className="label py-0.5">
                  <span className="label-text">
                    {getFieldLabel(field)}
                    {field.optional && modalMode === 'edit'
                      ? ` (${t('admin.optional')})`
                      : ''}
                  </span>
                </div>
                <input
                  type={
                    isPassword
                      ? 'password'
                      : field.type === 'datetime-local'
                        ? 'datetime-local'
                        : field.type
                  }
                  className="input input-bordered w-full"
                  placeholder={getFieldLabel(field)}
                  value={(form[field.name] as string) ?? ''}
                  disabled={isDisabled}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              </label>
            );
          })}
        </div>

        <div className="modal-action mt-6 pt-3 border-t border-base-300">
          <button className="btn btn-ghost btn-sm" onClick={closeModal}>
            {t('common.actions.cancel')}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { void handleSubmit(); }}>
            {modalMode === 'create' ? t('common.actions.create') : t('common.actions.save')}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={closeModal}>
        <button className="opacity-0">close</button>
      </div>
    </div>
  );
};