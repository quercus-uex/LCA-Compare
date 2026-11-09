import { type ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle } from 'react-icons/fi';
import { AdminDialog } from '../admin/admin-dialog.component.tsx';
import { describeOrganizacionError } from './organizaciones.utils.ts';

type Props = {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  /** Si falla, el diálogo sigue abierto y muestra el error */
  onConfirm: () => Promise<void>;
  onClose: () => void;
  /** Mensaje propio para algún error; si devuelve `undefined` se usa el genérico */
  describeError?: (e: unknown) => string | undefined;
};

/** Confirmación de una acción destructiva de organización */
export const ConfirmActionDialog = ({ title, body, confirmLabel, onConfirm, onClose, describeError }: Props) => {
  const { t } = useTranslation();
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(describeError?.(e) ?? describeOrganizacionError(e, t));
      setBusy(false);
    }
  };

  return (
    <AdminDialog labelledBy={titleId} onClose={onClose} locked={busy} className="max-w-md">
      <div className="flex gap-4 p-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error text-error-content">
          <FiAlertTriangle aria-hidden />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h3 id={titleId} className="text-lg font-semibold break-words">{title}</h3>
          <div className="text-sm">{body}</div>
          {error && <div role="alert" className="alert alert-error mt-1 text-sm">{error}</div>}
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-base-200 bg-base-200/40 px-6 py-4">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
          {t('organizaciones.confirm.dismiss')}
        </button>
        <button type="button" className="btn btn-error" onClick={() => void confirm()} disabled={busy}>
          {busy && <span className="loading loading-spinner loading-sm" aria-hidden />}
          {confirmLabel}
        </button>
      </div>
    </AdminDialog>
  );
};
