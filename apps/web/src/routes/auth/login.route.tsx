import type { LoginDto } from 'common/auth';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button, Card, Input } from '../../components/ui/index.ts';
import { useAuth } from '../../hooks/auth.hook.tsx';

export const LoginRoute = () => {
  const {
    register,
    handleSubmit,
  } = useForm<LoginDto>();

  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onSubmit: SubmitHandler<LoginDto> = async (data) => {
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
      <Card className="w-96">
        <h1 className="text-center text-lg font-semibold">{t('auth.login.title')}</h1>
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-2 w-full">
          <Input
            type="email"
            placeholder={t('auth.login.email')}
            aria-label={t('auth.login.email')}
            {...register('email', { required: true })}
          />
          <Input
            type="password"
            placeholder={t('auth.login.password')}
            aria-label={t('auth.login.password')}
            {...register('password', { required: true })}
          />
          <Button variant="primary" type="submit" block>{t('auth.login.submit')}</Button>
        </form>
      </Card>
    </div>
  )
}
