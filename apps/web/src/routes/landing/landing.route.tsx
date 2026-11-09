import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBarChart2, FiLayers, FiMap } from 'react-icons/fi';
import { DOCS_URL } from '../../common/constants.ts';
import { ButtonLink, CardLink } from '../../components/ui/index.ts';
import { useAuth } from '../../hooks/auth.hook.tsx';

export const LandingRoute = () => {
  const { t } = useTranslation();
  const auth = useAuth();
  const descriptionId = useId();

  const features = [
    {
      icon: FiLayers,
      title: t('landing.features.compare.title'),
      description: t('landing.features.compare.description'),
      ariaLabel: t('landing.features.compare.ariaLabel'),
      to: '/compare',
    },
    {
      icon: FiBarChart2,
      title: t('landing.features.stats.title'),
      description: t('landing.features.stats.description'),
      ariaLabel: t('landing.features.stats.ariaLabel'),
      to: '/estadisticas',
    },
    {
      icon: FiMap,
      title: t('landing.features.plots.title'),
      description: t('landing.features.plots.description'),
      ariaLabel: t('landing.features.plots.ariaLabel'),
      to: auth.usuario ? '/parcelas' : '/auth/login',
    },
  ];

  return (
    <div className="w-full max-w-5xl flex flex-col gap-16 py-10">
      <section className="flex flex-col items-center gap-6 text-center py-10">
        <h1 className="text-5xl font-bold text-secondary">
          {t('landing.hero.title')}
        </h1>
        <p className="text-lg text-base-content/80 max-w-2xl">
          {t('landing.hero.subtitle')}
        </p>
        <div className="flex gap-3 flex-wrap justify-center mt-2">
          <ButtonLink variant="primary" size="lg" to="/compare" aria-label={t('landing.hero.cta.primaryAriaLabel')}>
            {t('landing.hero.cta.primary')}
          </ButtonLink>
          <ButtonLink variant="outline" size="lg" href={DOCS_URL} aria-label={t('landing.hero.cta.secondaryAriaLabel')}>
            {t('landing.hero.cta.secondary')}
          </ButtonLink>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label={t('landing.hero.title')}>
        {features.map(({ icon: Icon, title, description, ariaLabel, to }, i) => (
          <CardLink key={title} to={to} label={ariaLabel} aria-describedby={`${descriptionId}-${i}`} className="text-center">
            <Icon aria-hidden className="mx-auto text-3xl text-primary" />
            <h2 className="text-xl font-semibold">{title}</h2>
            <p id={`${descriptionId}-${i}`} className="text-base-content/80">{description}</p>
          </CardLink>
        ))}
      </section>
    </div>
  );
};
