import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

export const NotFoundRoute = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="text-2xl font-semibold">{t('common.notFound.title')}</h2>
      <p className="text-base-content/70 max-w-md">
        {t('common.notFound.description')}
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => void navigate('/', { replace: true })}
      >
        {t('common.notFound.goHome')}
      </button>
    </div>
  );
};