import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../components/ui/index.ts';

export const NotFoundRoute = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-secondary">404</h1>
      <h2 className="text-2xl font-semibold">{t('common.notFound.title')}</h2>
      <p className="text-muted max-w-md">
        {t('common.notFound.description')}
      </p>
      <ButtonLink variant="primary" to="/" replace>
        {t('common.notFound.goHome')}
      </ButtonLink>
    </div>
  );
};