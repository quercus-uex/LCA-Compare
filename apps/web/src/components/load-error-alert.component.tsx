import { useTranslation } from 'react-i18next';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

type Props = {
  message: string;
  onRetry: () => void;
  /** `warning` cuando aún se muestran datos anteriores */
  variant?: 'error' | 'warning';
};

export const LoadErrorAlert = ({ message, onRetry, variant = 'error' }: Props) => {
  const { t } = useTranslation();
  return (
    <div role="alert" className={`alert w-full ${variant === 'warning' ? 'alert-warning' : 'alert-error'}`}>
      <FiAlertTriangle aria-hidden />
      <span>{message}</span>
      <button type="button" className="btn btn-sm" onClick={onRetry}>
        <FiRefreshCw aria-hidden />
        {t('common.actions.retry')}
      </button>
    </div>
  );
};
