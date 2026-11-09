import { useTranslation } from 'react-i18next';
import { FiShield } from 'react-icons/fi';
import { Link } from 'react-router';
import { EmptyState } from '../parcelas/parcelas-states.component.tsx';

/** Estado de «no disponible» de las páginas de una organización (no existe o no la administra) */
export const OrganizacionNotFound = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={FiShield}
      title={t('organizaciones.panel.notFoundTitle')}
      description={t('organizaciones.panel.notFoundDescription')}
      action={<Link to="/organizaciones" className="btn btn-primary btn-sm">{t('organizaciones.panel.back')}</Link>}
    />
  );
};
