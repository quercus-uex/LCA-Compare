import { useTranslation } from 'react-i18next';
import { FiBarChart2, FiLayers, FiMap } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { DOCS_URL } from '../../common/constants.ts';
import { useAuth } from '../../hooks/auth.hook.tsx';

export const LandingRoute = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useAuth();

  const features = [
    {
      icon: <FiLayers className="text-3xl text-primary" aria-hidden="true" />,
      title: t('landing.features.compare.title'),
      description: t('landing.features.compare.description'),
      ariaLabel: t('landing.features.compare.ariaLabel'),
      action: () => navigate('/compare'),
    },
    {
      icon: <FiBarChart2 className="text-3xl text-primary" aria-hidden="true" />,
      title: t('landing.features.stats.title'),
      description: t('landing.features.stats.description'),
      ariaLabel: t('landing.features.stats.ariaLabel'),
      action: () => navigate('/estadisticas'),
    },
    {
      icon: <FiMap className="text-3xl text-primary" aria-hidden="true" />,
      title: t('landing.features.plots.title'),
      description: t('landing.features.plots.description'),
      ariaLabel: t('landing.features.plots.ariaLabel'),
      action: () => navigate(auth.usuario ? '/parcelas' : '/auth/login'),
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
          <button
            type="button"
            className="btn btn-primary btn-lg focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={t('landing.hero.cta.primaryAriaLabel')}
            onClick={() => void navigate('/compare')}
          >
            {t('landing.hero.cta.primary')}
          </button>
          <a
            className="btn btn-outline btn-lg focus-visible:outline-2 focus-visible:outline-offset-2"
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer external"
            aria-label={t('landing.hero.cta.secondaryAriaLabel')}
          >
            {t('landing.hero.cta.secondary')}
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label={t('landing.hero.title')}>
        {features.map((feature, index) => {
          const descId = `landing-feature-${index}-desc`;
          return (
            <button
              key={feature.title}
              type="button"
              className="card bg-base-100 shadow-sm text-left transition hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-box"
              aria-label={feature.ariaLabel}
              aria-describedby={descId}
              onClick={() => void feature.action()}
            >
              <div className="card-body items-center text-center gap-3">
                {feature.icon}
                <h2 className="card-title text-xl">{feature.title}</h2>
                <p id={descId} className="text-base-content/80">{feature.description}</p>
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
};