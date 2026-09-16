import { useTranslation } from 'react-i18next';
import { FiGlobe } from 'react-icons/fi';
import {
  isSupportedLanguage,
  supportedLanguages,
} from '../i18n/index.ts';

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const currentLanguage = isSupportedLanguage(i18n.language)
    ? i18n.language
    : 'es';

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        className="btn btn-ghost"
        aria-label={t('language.label')}
        title={t('language.label')}
        tabIndex={0}
      >
        <FiGlobe />
        <span className="uppercase">{currentLanguage}</span>
      </button>
      <ul
        className="dropdown-content menu bg-base-100 rounded-box z-50 mt-2 w-32 p-2 shadow-sm"
        tabIndex={-1}
      >
        {supportedLanguages.map(({ code }) => (
          <li key={code}>
            <button
              type="button"
              className={code === currentLanguage ? 'active' : ''}
              onClick={() => {
                void i18n.changeLanguage(code);
              }}
            >
              {code.toUpperCase()}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
