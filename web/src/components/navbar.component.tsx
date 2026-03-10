import { useAuth } from '../hooks/auth.hook.tsx';
import { Link, useNavigate } from 'react-router';

export const NavBar = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="w-full">
      <div className="w-full h-16 bg-white flex items-center p-3 rounded-xl">
        <div className="flex-1">
          <p>Comparador ACV</p>
        </div>

        <div className="flex gap-2">
          <button className="btn" onClick={() => navigate('/compare')}>
            Comparador
          </button>

          {auth.loading ? (
            <div className="skeleton rounded-full w-10 h-10" />
          ) : (
            auth.usuario === null && (
              <button
                className="btn btn-md btn-primary"
                onClick={() => navigate('/auth/login')}
              >
                Iniciar sesión
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
                    src="https://cdn-icons-png.freepik.com/512/12225/12225935.png"
                    alt="Imagen de perfil"
                  />
                </div>
              </div>

              <ul
                tabIndex={-1}
                className="dropdown-content menu bg-base-100 rounded-box w-52 p-2 shadow-sm mt-5"
              >
                <li>
                  <Link to="/parcelas">
                    <p>Mis parcelas</p>
                  </Link>
                </li>
                <div className="divider m-0"></div>
                <li>
                  <a className="btn btn-error" onClick={auth.logout}>
                    Cerrar sesión
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};