import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          <Translate id="homepage.title">
            Documentación de LCA Bridge y LCA Compare
          </Translate>
        </Heading>
        <p className="hero__subtitle">
          <Translate id="homepage.subtitle">
            Guías de desarrollo, despliegue y uso para LCA Bridge y LCA Compare.
          </Translate>
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/introduccion/">
            <Translate id="homepage.startButton">Empezar</Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title={translate({
        id: 'homepage.title',
        message: 'Documentación de Capture ACV y ACV Compare',
      })}
      description={translate({
        id: 'homepage.description',
        message: 'Documentación técnica y funcional de LCA Bridge y LCA Compare.',
      })}>
      <HomepageHeader />
    </Layout>
  );
}
