import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from './ui/index.ts';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

type ErrorBoundaryState = { error: Error | null };

class ErrorBoundaryInner extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ error: null });

  override render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return <DefaultFallback error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

const DefaultFallback = ({ error, reset }: { error: Error; reset: () => void }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
    >
      <h2 className="text-2xl font-semibold text-danger">
        {t('common.errors.boundaryTitle')}
      </h2>
      <p className="text-muted max-w-md">
        {t('common.errors.boundaryDescription')}
      </p>
      {import.meta.env.DEV && (
        <pre className="text-xs text-muted max-w-xl overflow-auto bg-base-200 p-3 rounded-box">
          {error.message}
        </pre>
      )}
      <div className="flex gap-2">
        <Button variant="primary" onClick={reset}>
          {t('common.errors.retry')}
        </Button>
        <Button variant="ghost" onClick={() => void navigate('/', { replace: true })}>
          {t('common.errors.goHome')}
        </Button>
      </div>
    </div>
  );
};

export const ErrorBoundary = ({ children, fallback }: ErrorBoundaryProps) => (
  <ErrorBoundaryInner fallback={fallback}>{children}</ErrorBoundaryInner>
);