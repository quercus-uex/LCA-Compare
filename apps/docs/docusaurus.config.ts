import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'LCA Capture / LCA Bridge / LCA Compare',
  tagline: '',
  favicon: '/img/icon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://openlca-acv-compare-docs.netlify.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'quercus-uex',
  projectName: 'Ventum-ACV-Visualizer',

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'pt'],
    localeConfigs: {
      es: {
        label: 'Español',
        htmlLang: 'es-ES',
      },
      en: {
        label: 'English',
        htmlLang: 'en-US',
      },
      pt: {
        label: 'Português',
        htmlLang: 'pt-PT',
      },
    },
  },

  plugins: [[require.resolve('docusaurus-lunr-search'), {
    languages: ['es', 'en', 'pt'],
  }]],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: '/img/icon.svg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Documentación de LCA Capture, LCA Bridge y LCA Compare',
      logo: {
        alt: 'LCA Compare',
        src: '/img/icon.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'introduccion/introduccion',
          position: 'left',
          label: 'Documentación',
        },
        {
          href: 'https://github.com/quercus-uex/LCA-Bridge',
          label: 'LCA Bridge',
          position: 'right',
        },
        {
          href: 'https://github.com/quercus-uex/LCA-Compare',
          label: 'LCA Compare',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      logo: {
        alt: 'TID4Agro',
        src: '/img/tid4agro-banner.png',
      },
      copyright: `Documentación de LCA Capture, LCA Bridge y LCA Compare.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
