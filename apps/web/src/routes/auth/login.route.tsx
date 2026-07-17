import { type SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/auth.hook.tsx';

type LoginType = {
  email: string;
  password: string;
}

export const LoginRoute = () => {
  const {
    register,
    handleSubmit,
  } = useForm<LoginType>();

  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onSubmit: SubmitHandler<LoginType> = async (data) => {
    try {
      const usuario = await auth.login(data.email, data.password);
      if (usuario) {
        void navigate(usuario.rol === 'admin' ? '/admin' : '/parcelas', { replace: true });
      }
    } catch {
      toast.error(t('auth.login.invalidCredentials'));
    }
  }

  return (
    <div className="w-full h-[50dvh] flex items-center justify-center">
      <div className="card w-96 bg-base-100 card-md shadow-sm">

        <div className="card-body flex flex-col gap-5 items-center">
          <h1 className="card-title">{t('auth.login.title')}</h1>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-2 items-center w-full">
            <input className="input w-full" placeholder={t('auth.login.email')} type="email" {...register('email', { required: true })} />
            <input className="input w-full" placeholder={t('auth.login.password')} type="password" {...register('password', { required: true })} />
            <button type="submit" className="btn btn-primary w-full">{t('auth.login.submit')}</button>
          </form>
        </div>
      </div>

    </div>
  )
}
