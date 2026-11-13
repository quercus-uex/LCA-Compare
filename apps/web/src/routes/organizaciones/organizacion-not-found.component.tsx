import { useTranslation } from 'react-i18next';
import { FiShield } from 'react-icons/fi';
import { ButtonLink, EmptyState } from '../../components/ui/index.ts';

/** Estado de «no disponible» de las páginas de una organización (no existe o no la administra) */
export const OrganizacionNotFound = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={FiShield}
      title={t('organizaciones.panel.notFoundTitle')}
      description={t('organizaciones.panel.notFoundDescription')}
      action={<ButtonLink variant="primary" size="sm" to="/organizaciones">{t('organizaciones.panel.back')}</ButtonLink>}
    />
  );
};
