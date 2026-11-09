import { useTranslation } from 'react-i18next';
import { FiGlobe } from 'react-icons/fi';
import { supportedLanguages, toSupportedLanguage } from '../i18n/index.ts';
import { Dropdown, Menu, MenuItem } from './ui/index.ts';

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const currentLanguage = toSupportedLanguage(i18n.language);

  return (
    <Dropdown
      variant="ghost"
      width="w-32"
      label={t('language.label')}
      trigger={
        <>
          <FiGlobe aria-hidden />
          <span className="uppercase">{currentLanguage}</span>
        </>
      }
    >
      <Menu>
        {supportedLanguages.map(({ code }) => (
          <MenuItem key={code} onClick={() => void i18n.changeLanguage(code)}>
            {code.toUpperCase()}
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
};
