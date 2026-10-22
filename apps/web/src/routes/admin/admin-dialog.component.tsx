import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  labelledBy: string;
  onClose: () => void;
  // Mientras se guarda no se cierra con Escape ni pulsando fuera
  locked?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * `<dialog>` nativo abierto con showModal(): se pinta en la capa superior del
 * navegador (por encima de la barra de navegación) y gestiona el foco.
 */
export const AdminDialog = ({ labelledBy, onClose, locked, className, children }: Props) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal modal-bottom sm:modal-middle"
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        if (!locked) onClose();
      }}
    >
      <div className={`modal-box p-0 ${className ?? ''}`}>{children}</div>
      <form method="dialog" className="modal-backdrop">
        <button
          type="button"
          aria-label={t('common.actions.close')}
          onClick={() => {
            if (!locked) onClose();
          }}
        >
          {t('common.actions.close')}
        </button>
      </form>
    </dialog>
  );
};
