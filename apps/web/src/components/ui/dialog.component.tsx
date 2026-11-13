import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { Button, IconButton } from './button.component.tsx';
import { Callout } from './feedback.component.tsx';

const SIZE_CLASS = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

type DialogFrameProps = {
  labelledBy: string;
  onClose: () => void;
  /** Mientras se guarda no se cierra con Escape ni pulsando fuera */
  locked?: boolean;
  size?: keyof typeof SIZE_CLASS;
  children: ReactNode;
};

/**
 * `<dialog>` nativo abierto con showModal(): se pinta en la capa superior del
 * navegador (por encima de la barra de navegación) y gestiona el foco.
 */
const DialogFrame = ({ labelledBy, onClose, locked, size = 'md', children }: DialogFrameProps) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  const close = () => {
    if (!locked) onClose();
  };

  return (
    <dialog
      ref={ref}
      className="modal modal-bottom sm:modal-middle"
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className={`modal-box flex max-h-[calc(100dvh-5em)] flex-col p-0 ${SIZE_CLASS[size]}`}>{children}</div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" aria-label={t('common.actions.close')} onClick={close}>
          {t('common.actions.close')}
        </button>
      </form>
    </dialog>
  );
};

const DialogFooter = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-base-200 bg-base-200/40 px-6 py-4">
    {children}
  </div>
);

type DialogProps = {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  locked?: boolean;
  size?: keyof typeof SIZE_CLASS;
  /** Botones del pie; si el cuerpo es un formulario, el de envío usa `form={idDelFormulario}` */
  footer?: ReactNode;
  children: ReactNode;
};

/** Ventana modal con cabecera, cuerpo desplazable y pie de acciones */
export const Dialog = ({ title, description, onClose, locked, size, footer, children }: DialogProps) => {
  const { t } = useTranslation();
  const titleId = useId();

  return (
    <DialogFrame labelledBy={titleId} onClose={onClose} locked={locked} size={size}>
      <div className="flex items-start justify-between gap-4 border-b border-base-200 px-6 pb-4 pt-6">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-semibold break-words">{title}</h2>
          {description && <div className="text-sm text-muted">{description}</div>}
        </div>
        <IconButton icon={FiX} label={t('common.actions.close')} onClick={onClose} disabled={locked} />
      </div>
      <div className="overflow-y-auto px-6 py-5">{children}</div>
      {footer && <DialogFooter>{footer}</DialogFooter>}
    </DialogFrame>
  );
};

type ConfirmDialogProps = {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  /** `danger` para acciones destructivas o irreversibles */
  tone?: 'danger' | 'primary';
  icon?: IconType;
  /** Si falla, el diálogo sigue abierto y muestra el error */
  onConfirm: () => Promise<void>;
  onClose: () => void;
  /** Mensaje para el error de `onConfirm`; sin él (o si devuelve `undefined`), uno genérico */
  describeError?: (e: unknown) => string | undefined;
  cancelLabel?: string;
};

/** Pide confirmación antes de una acción y muestra su error sin cerrarse */
export const ConfirmDialog = ({
  title,
  body,
  confirmLabel,
  tone = 'danger',
  icon: Icon = FiAlertTriangle,
  onConfirm,
  onClose,
  describeError,
  cancelLabel,
}: ConfirmDialogProps) => {
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
      setError(describeError?.(e) ?? t('common.unexpectedError'));
      setBusy(false);
    }
  };

  return (
    <DialogFrame labelledBy={titleId} onClose={onClose} locked={busy} size="sm">
      <div className="flex gap-4 p-6">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
            tone === 'danger' ? 'bg-error text-error-content' : 'bg-primary text-primary-content'
          }`}
        >
          <Icon aria-hidden />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 id={titleId} className="text-lg font-semibold break-words">{title}</h2>
          <div className="flex flex-col gap-2 text-sm">{body}</div>
          {error && <Callout tone="error" live className="mt-1">{error}</Callout>}
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          {cancelLabel ?? t('common.actions.cancel')}
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={busy} onClick={() => void confirm()}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogFrame>
  );
};
