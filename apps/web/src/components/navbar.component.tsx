import { useAuth } from '../hooks/auth.hook.tsx';
import { Link, useNavigate } from 'react-router';
import {FiExternalLink} from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './language-selector.component.tsx';
import { AVATAR_URL, DOCS_URL } from '../common/constants.ts';

export const NavBar = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <div className="w-full relative z-[1100]">
      <div className="w-full min-h-16 bg-white flex items-center p-3 rounded-xl gap-3 flex-wrap">
        <div className="flex-1">
          <p>{t('nav.appName')}</p>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          <LanguageSelector />

          <a
            className="btn btn-ghost"
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiExternalLink />
            {t('nav.documentation')}
          </a>

          <button className="btn" onClick={() => navigate('/compare')}>
            {t('nav.compare')}
          </button>

          <button className="btn" onClick={() => navigate('/estadisticas')}>
            {t('nav.statistics')}
          </button>

          {auth.loading ? (
            <div className="skeleton rounded-full w-10 h-10" />
          ) : (
            auth.usuario === null && (
              <button
                className="btn btn-md btn-primary"
                onClick={() => navigate('/auth/login')}
              >
                {t('nav.login')}
              </button>
            )
          )}

          {auth.usuario !== null && (
            <div className="dropdown dropdown-end z-40">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-square rounded-full avatar"
              >
                <div className="w-10 rounded-full">
                  <img
                    src={AVATAR_URL}
                    alt={t('nav.profileImageAlt')}
                  />
                </div>
              </div>

              <ul
                tabIndex={-1}
                className="dropdown-content menu bg-base-100 rounded-box w-52 p-2 shadow-sm mt-5"
              >
                <li>
                  <Link to="/parcelas">
                    <p>{t('nav.myPlots')}</p>
                  </Link>
                </li>
                {auth.usuario.rol === 'admin' && (
                  <li>
                    <Link to="/admin">
                      <p>{t('nav.admin')}</p>
                    </Link>
                  </li>
                )}
                <div className="divider m-0"></div>
                <li>
                  <button
                    type="button"
                    className="btn btn-error"
                    onClick={() => {
                      auth.logout();
                      navigate('/auth/login', { replace: true });
                    }}
                  >
                    {t('nav.logout')}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
