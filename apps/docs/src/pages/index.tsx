import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

// Iconos de Feather (los mismos que usa la aplicación con react-icons/fi)
const icons = {
  capture: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  bridge: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  compare: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>
  ),
};

type Service = {
  key: keyof typeof icons;
  name: string;
  description: ReactNode;
  links: {to: string; label: ReactNode}[];
};

const services: Service[] = [
  {
    key: 'capture',
    name: 'LCA Capture',
    description: (
      <Translate id="homepage.capture.description">
        API de los datos de sensores (caudalímetro, fertilizante y tractor) que alimentan el cálculo de ACV.
      </Translate>
    ),
    links: [
      {to: '/docs/lca-capture/introduccion', label: <Translate id="homepage.link.introduction">Introducción</Translate>},
      {to: '/docs/lca-capture/autenticacion', label: <Translate id="homepage.link.authentication">Autenticación</Translate>},
    ],
  },
  {
    key: 'bridge',
    name: 'LCA Bridge',
    description: (
      <Translate id="homepage.bridge.description">
        Servicio que calcula el impacto ambiental de cada cultivo con openLCA y envía el resultado a LCA Compare.
      </Translate>
    ),
    links: [
      {to: '/docs/openlca-bridge/introduccion', label: <Translate id="homepage.link.introduction">Introducción</Translate>},
      {to: '/docs/openlca-bridge/json-entrada', label: <Translate id="homepage.link.input">JSON de entrada</Translate>},
      {to: '/docs/openlca-bridge/despliegue', label: <Translate id="homepage.link.deployment">Despliegue</Translate>},
    ],
  },
  {
    key: 'compare',
    name: 'LCA Compare',
    description: (
      <Translate id="homepage.compare.description">
        Aplicación web para consultar, comparar y analizar los resultados de ACV de parcelas y campañas.
      </Translate>
    ),
    links: [
      {to: '/docs/acv-compare/introduccion', label: <Translate id="homepage.link.introduction">Introducción</Translate>},
      {to: '/docs/acv-compare/uso', label: <Translate id="homepage.link.usage">Guía de uso</Translate>},
      {to: '/docs/acv-compare/desarrollo', label: <Translate id="homepage.link.development">Desarrollo</Translate>},
    ],
  },
];

function Hero() {
  return (
    <header className={styles.hero}>
      <div className={clsx('container', styles.heroInner)}>
        <p className={styles.eyebrow}>
          <Translate id="homepage.eyebrow">Análisis de Ciclo de Vida de cultivos</Translate>
        </p>
        <Heading as="h1" className={styles.title}>
          <Translate id="homepage.title">Documentación de LCA Capture, LCA Bridge y LCA Compare</Translate>
        </Heading>
        <p className={styles.subtitle}>
          <Translate id="homepage.subtitle">
            Guías de desarrollo, despliegue y uso para LCA Capture, LCA Bridge y LCA Compare.
          </Translate>
        </p>
        <div className={styles.actions}>
          <Link className={clsx('button button--lg', styles.primaryButton)} to="/docs/introduccion/">
            <Translate id="homepage.startButton">Empezar</Translate>
          </Link>
          <Link className="button button--lg button--outline button--primary" to="/docs/acv-compare/uso">
            <Translate id="homepage.usageButton">Guía de uso de LCA Compare</Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

function ServiceCard({service}: {service: Service}) {
  const headingId = `service-${service.key}`;
  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true">
        {icons[service.key]}
      </svg>
      <Heading as="h2" id={headingId} className={styles.cardTitle}>
        {service.name}
      </Heading>
      <p className={styles.cardDescription}>{service.description}</p>
      <ul className={styles.cardLinks}>
        {service.links.map(({to, label}) => (
          <li key={to}>
            <Link to={to}>{label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title={translate({
        id: 'homepage.title',
        message: 'Documentación de LCA Capture, LCA Bridge y LCA Compare',
      })}
      description={translate({
        id: 'homepage.description',
        message: 'Documentación técnica y funcional de LCA Capture, LCA Bridge y LCA Compare.',
      })}>
      <main>
        <Hero />
        <div className={clsx('container', styles.services)}>
          {services.map((service) => (
            <ServiceCard key={service.key} service={service} />
          ))}
        </div>
      </main>
    </Layout>
  );
}
