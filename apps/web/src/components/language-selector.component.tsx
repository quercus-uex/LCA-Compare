import { useTranslation } from 'react-i18next';
import { FiGlobe } from 'react-icons/fi';
import { supportedLanguages, toSupportedLanguage } from '../i18n/index.ts';
import { Dropdown } from './dropdown.component.tsx';

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const currentLanguage = toSupportedLanguage(i18n.language);

  return (
    <Dropdown
      triggerClassName="btn btn-ghost"
      contentClassName="w-32"
      label={t('language.label')}
      title={t('language.label')}
      trigger={
        <>
          <FiGlobe />
          <span className="uppercase">{currentLanguage}</span>
        </>
      }
    >
      <ul className="menu w-full p-0">
        {supportedLanguages.map(({ code }) => (
          <li key={code}>
            <button
              type="button"
              className={code === currentLanguage ? 'active' : ''}
              onClick={() => void i18n.changeLanguage(code)}
            >
              {code.toUpperCase()}
            </button>
          </li>
        ))}
      </ul>
    </Dropdown>
  );
};
