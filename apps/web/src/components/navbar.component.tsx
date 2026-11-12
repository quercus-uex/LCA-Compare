import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiExternalLink, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { Link, matchPath, useLocation, useNavigate } from 'react-router';
import { AVATAR_URL, DOCS_URL } from '../common/constants.ts';
import { useAuth } from '../hooks/auth.hook.tsx';
import { useNotificaciones } from '../hooks/notificaciones.hook.tsx';
import { useClickOutside } from '../hooks/use-click-outside.ts';
import { supportedLanguages, toSupportedLanguage } from '../i18n/index.ts';
import type { ParcelaLinkState } from '../routes/parcelas/parcelas.utils.ts';
import { LanguageSelector } from './language-selector.component.tsx';
import { BellIcon, NotificationsBell, NotificationsPanel, useBellLabel } from './notifications-bell.component.tsx';
import { ButtonLink, ButtonNavLink, Dropdown, IconButton, Menu, MenuItem, SegmentedControl, Skeleton } from './ui/index.ts';

type NavItem = { to: string; labelKey: string };

const UserHeader = ({ nombre, apellidos, email }: { nombre: string; apellidos: string; email: string }) => (
  <div className="flex flex-col border-b border-base-300 px-3 pb-2 pt-1 text-left">
    <span className="font-semibold">{nombre} {apellidos}</span>
    <span className="truncate text-xs text-muted">{email}</span>
  </div>
);

/** Idioma como selector segmentado, para el menú móvil */
const LanguageSegmented = () => {
  const { i18n, t } = useTranslation();
  const current = toSupportedLanguage(i18n.language);

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span>{t('language.label')}</span>
      <SegmentedControl
        label={t('language.label')}
        options={supportedLanguages.map(({ code, labelKey }) => ({
          value: code,
          label: <span title={t(labelKey)}>{code.toUpperCase()}</span>,
        }))}
        value={current}
        onChange={(code) => void i18n.changeLanguage(code)}
      />
    </div>
  );
};

export const NavBar = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  // En móvil solo hay un panel abierto a la vez: el menú o las notificaciones
  const [openPanel, setOpenPanel] = useState<'menu' | 'notificaciones' | null>(null);
  const menuOpen = openPanel === 'menu';
  const notificacionesOpen = openPanel === 'notificaciones';
  const menuId = useId();
  const notificacionesId = useId();
  const barRef = useRef<HTMLDivElement>(null);
  const usuario = auth.usuario;
  const { total } = useNotificaciones();
  const bellLabel = useBellLabel();
  const togglePanel = (panel: 'menu' | 'notificaciones') =>
    setOpenPanel((open) => (open === panel ? null : panel));

  const items: NavItem[] = [
    { to: '/compare', labelKey: 'nav.compare' },
    { to: '/estadisticas', labelKey: 'nav.statistics' },
    ...(usuario
      ? [
          { to: '/parcelas', labelKey: 'nav.myPlots' },
          { to: '/organizaciones', labelKey: 'nav.organizations' },
        ]
      : []),
  ];

  // Una parcela o un resultado abiertos desde las parcelas de un miembro
  // pertenecen a «Organizaciones», aunque su ruta cuelgue de /parcelas
  const viaOrganizacion = !!(location.state as ParcelaLinkState | null)?.organizacion;
  const isItemActive = (to: string, isActive: boolean) => {
    if (!viaOrganizacion) return isActive;
    if (to === '/organizaciones') return true;
    return to === '/parcelas' ? false : isActive;
  };
  // Para el menú móvil, que no usa NavLink: la sección está activa si la ruta empieza por ella
  const isRouteActive = (to: string) => !!matchPath({ path: to, end: false }, location.pathname);

  // Los paneles móviles se cierran al navegar, al pulsar fuera y con Escape
  const closeMenu = useCallback(() => setOpenPanel(null), []);
  useEffect(closeMenu, [location.pathname, closeMenu]);
  useClickOutside(barRef, closeMenu);
  useEffect(() => {
    if (!openPanel) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeMenu();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openPanel, closeMenu]);

  const logout = () => {
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
              <ButtonNavLink to={item.to} isActive={(active) => isItemActive(item.to, active)} className="whitespace-nowrap">
                {t(item.labelKey)}
              </ButtonNavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-1 lg:flex">
          <LanguageSelector />
          {/* Entre lg y xl no cabe el texto junto al resto de la barra: queda el icono, con el nombre como tooltip */}
          <ButtonLink variant="ghost" href={DOCS_URL} icon={FiExternalLink} title={t('nav.documentation')} className="whitespace-nowrap">
            <span className="max-xl:sr-only">{t('nav.documentation')}</span>
          </ButtonLink>

          {auth.loading && <Skeleton className="size-10 rounded-full" />}

          {!auth.loading && !usuario && (
            <ButtonLink variant="primary" to="/auth/login">{t('nav.login')}</ButtonLink>
          )}

          {usuario && <NotificationsBell />}

          {usuario && (
            <Dropdown
              variant="ghost"
              circle
              width="w-64"
              label={t('nav.account')}
              title={`${usuario.nombre} ${usuario.apellidos}`}
              trigger={
                <span className="block size-10 overflow-hidden rounded-full">
                  <img src={AVATAR_URL} alt={t('nav.profileImageAlt')} className="size-full object-cover" />
                </span>
              }
            >
              <UserHeader {...usuario} />
              <div className="pt-1">
                <Menu>
                  {usuario.rol === 'admin' && <MenuItem to="/admin">{t('nav.admin')}</MenuItem>}
                  <MenuItem danger onClick={logout}>
                    <FiLogOut aria-hidden />
                    {t('nav.logout')}
                  </MenuItem>
                </Menu>
              </div>
            </Dropdown>
          )}
        </div>

        {/* Móvil y tablet */}
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          {usuario && (
            <IconButton
              icon={notificacionesOpen ? <FiX aria-hidden className="size-5" /> : <BellIcon total={total} />}
              label={notificacionesOpen ? t('notificaciones.close') : bellLabel}
              size="md"
              aria-expanded={notificacionesOpen}
              aria-controls={notificacionesId}
              onClick={() => togglePanel('notificaciones')}
            />
          )}
          <IconButton
            icon={menuOpen ? FiX : FiMenu}
            label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            size="md"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => togglePanel('menu')}
          />
        </div>
      </nav>

      {/* Anuncia los cambios del número de novedades, que el sondeo puede traer en cualquier momento */}
      {usuario && (
        <span className="sr-only" aria-live="polite">
          {total > 0 ? t('notificaciones.liveCount', { count: total }) : ''}
        </span>
      )}

      {notificacionesOpen && usuario && (
        <div
          id={notificacionesId}
          className="absolute inset-x-0 top-full mt-2 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-xl bg-white p-2 shadow-lg lg:hidden"
        >
          <NotificationsPanel />
        </div>
      )}

      {menuOpen && (
        // En el panel móvil las opciones van a tamaño de texto normal, más fáciles de pulsar
        <div
          id={menuId}
          className="absolute inset-x-0 top-full mt-2 rounded-xl bg-white p-2 shadow-lg lg:hidden [&_.menu]:text-base"
        >
          {usuario && <div className="mb-1"><UserHeader {...usuario} /></div>}
          <Menu>
            {items.map((item) => (
              <MenuItem key={item.to} to={item.to} active={isItemActive(item.to, isRouteActive(item.to))}>
                {t(item.labelKey)}
              </MenuItem>
            ))}
            {usuario?.rol === 'admin' && (
              <MenuItem to="/admin" active={isRouteActive('/admin')}>{t('nav.admin')}</MenuItem>
            )}
          </Menu>

          <div className="my-2 border-t border-base-300" />

          <Menu>
            <MenuItem href={DOCS_URL}>
              {t('nav.documentation')}
              <FiExternalLink aria-hidden className="ml-auto" />
            </MenuItem>
          </Menu>
          <LanguageSegmented />

          <div className="my-2 border-t border-base-300" />

          {auth.loading ? (
            <Skeleton className="h-10 w-full" />
          ) : usuario ? (
            <Menu>
              <MenuItem danger onClick={logout}>
                <FiLogOut aria-hidden />
                {t('nav.logout')}
              </MenuItem>
            </Menu>
          ) : (
            <ButtonLink variant="primary" to="/auth/login" block>{t('nav.login')}</ButtonLink>
          )}
        </div>
      )}
    </div>
  );
};
