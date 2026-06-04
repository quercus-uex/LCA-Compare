import { type SubmitHandler, useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/auth.hook.tsx';
import { useNavigate } from 'react-router';
import { API_BASE_URL } from '../../common/constants.ts';
import { useTranslation } from 'react-i18next';

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
    const res = await auth.login(data.email, data.password);
    if (res) {
      try {
        const userRes = await fetch(`${API_BASE_URL}/usuario`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const json = await userRes.json();
        navigate(json.data?.rol === 'admin' ? '/admin' : '/parcelas');
      } catch {
        navigate('/parcelas');
      }
      window.location.reload();
    }
  }

  return (
    <div className="w-full h-[50dvh] flex items-center justify-center">
      <div className="card w-96 bg-base-100 card-md shadow-sm">

        <div className="card-body flex flex-col gap-5 items-center">
          <h1 className="card-title">{t('auth.login.title')}</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 items-center w-full">
            <input className="input w-full" placeholder={t('auth.login.email')} type="email" {...register('email', { required: true })} />
            <input className="input w-full" placeholder={t('auth.login.password')} type="password" {...register('password', { required: true })} />
            <button type="submit" className="btn btn-primary w-full">{t('auth.login.submit')}</button>
          </form>
        </div>
      </div>

    </div>
  )
}
