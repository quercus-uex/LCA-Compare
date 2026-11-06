import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiExternalLink, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { AVATAR_URL, DOCS_URL } from '../common/constants.ts';
import { useAuth } from '../hooks/auth.hook.tsx';
import { isSupportedLanguage, supportedLanguages } from '../i18n/index.ts';
import { LanguageSelector } from './language-selector.component.tsx';

type NavItem = { to: string; labelKey: string };

// Los desplegables de DaisyUI se abren con el foco y siguen abiertos tras navegar
const blurActive = () => (document.activeElement as HTMLElement | null)?.blur();

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `btn btn-ghost ${isActive ? 'bg-base-200 text-secondary' : ''}`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'menu-active bg-base-200 font-semibold text-secondary' : '';

const UserHeader = ({ nombre, apellidos, email }: { nombre: string; apellidos: string; email: string }) => (
  <div className="flex flex-col border-b border-base-300 px-3 pb-2 pt-1 text-left">
    <span className="font-semibold">{nombre} {apellidos}</span>
    <span className="truncate text-xs text-base-content/70">{email}</span>
  </div>
);

/** Idioma como selector segmentado, para el menú móvil */
const LanguageSegmented = () => {
  const { i18n, t } = useTranslation();
  const current = isSupportedLanguage(i18n.language) ? i18n.language : 'es';

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span>{t('language.label')}</span>
      <div role="group" aria-label={t('language.label')} className="join">
        {supportedLanguages.map(({ code, labelKey }) => (
          <button
            key={code}
            type="button"
            className={`btn btn-sm join-item ${code === current ? 'btn-secondary' : ''}`}
            aria-pressed={code === current}
            title={t(labelKey)}
            onClick={() => void i18n.changeLanguage(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export const NavBar = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const barRef = useRef<HTMLDivElement>(null);
  const usuario = auth.usuario;

  const items: NavItem[] = [
    { to: '/compare', labelKey: 'nav.compare' },
    { to: '/estadisticas', labelKey: 'nav.statistics' },
    ...(usuario ? [{ to: '/parcelas', labelKey: 'nav.myPlots' }] : []),
  ];

  // El menú móvil se cierra al navegar, al pulsar fuera y con Escape
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const logout = () => {
    blurActive();
    auth.logout();
    void navigate('/auth/login', { replace: true });
  };

  return (
    <div ref={barRef} className="relative z-[1100] w-full">
      <nav aria-label={t('nav.mainNavigation')} className="flex min-h-14 w-full items-center gap-2 rounded-xl bg-white px-3 py-2">
        <Link to="/" className="mr-2 px-1 font-semibold transition-colors hover:text-secondary">
          {t('nav.appName')}
        </Link>

        {/* Escritorio */}
        <ul className="hidden flex-1 items-center gap-1 lg:flex">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={navLinkClass}>{t(item.labelKey)}</NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-1 lg:flex">
          <LanguageSelector />
          <a className="btn btn-ghost" href={DOCS_URL} target="_blank" rel="noopener noreferrer">
            <FiExternalLink aria-hidden />
            {t('nav.documentation')}
          </a>

          {auth.loading && <div className="skeleton size-10 rounded-full" />}

          {!auth.loading && !usuario && (
            <Link to="/auth/login" className="btn btn-primary">{t('nav.login')}</Link>
          )}

          {usuario && (
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-circle btn-ghost avatar"
                aria-label={t('nav.account')}
                title={`${usuario.nombre} ${usuario.apellidos}`}
              >
                <div className="w-10 rounded-full">
                  <img src={AVATAR_URL} alt={t('nav.profileImageAlt')} />
                </div>
              </div>
              <div tabIndex={-1} className="dropdown-content mt-3 w-64 rounded-box bg-base-100 p-2 shadow-sm">
                <UserHeader {...usuario} />
                <ul className="menu w-full p-0 pt-1">
                  {usuario.rol === 'admin' && (
                    <li><Link to="/admin" onClick={blurActive}>{t('nav.admin')}</Link></li>
                  )}
                  <li>
                    <button type="button" className="text-red-700" onClick={logout}>
                      <FiLogOut aria-hidden />
                      {t('nav.logout')}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Móvil y tablet */}
        <button
          type="button"
          className="btn btn-square btn-ghost ml-auto lg:hidden"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <FiX aria-hidden className="size-5" /> : <FiMenu aria-hidden className="size-5" />}
        </button>
      </nav>

      {menuOpen && (
        <div
          id={menuId}
          className="absolute inset-x-0 top-full mt-2 rounded-xl bg-white p-2 shadow-lg lg:hidden"
        >
          {usuario && <div className="mb-1"><UserHeader {...usuario} /></div>}
          <ul className="menu w-full gap-0.5 p-0 text-base">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={mobileLinkClass}>{t(item.labelKey)}</NavLink>
              </li>
            ))}
            {usuario?.rol === 'admin' && (
              <li><NavLink to="/admin" className={mobileLinkClass}>{t('nav.admin')}</NavLink></li>
            )}
          </ul>

          <div className="my-2 border-t border-base-300" />

          <ul className="menu w-full gap-0.5 p-0 text-base">
            <li>
              <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                {t('nav.documentation')}
                <FiExternalLink aria-hidden className="ml-auto" />
              </a>
            </li>
          </ul>
          <LanguageSegmented />

          <div className="my-2 border-t border-base-300" />

          {auth.loading ? (
            <div className="skeleton h-10 w-full" />
          ) : usuario ? (
            <ul className="menu w-full p-0 text-base">
              <li>
                <button type="button" className="text-red-700" onClick={logout}>
                  <FiLogOut aria-hidden />
                  {t('nav.logout')}
                </button>
              </li>
            </ul>
          ) : (
            <Link to="/auth/login" className="btn btn-primary w-full">{t('nav.login')}</Link>
          )}
        </div>
      )}
    </div>
  );
};
