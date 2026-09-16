import { useTranslation } from 'react-i18next';
import { FaCircleArrowRight } from 'react-icons/fa6';
import { useNavigate } from 'react-router';
import type { Parcela } from '../../hooks/parcela.hook.tsx';

export const ParcelasItem = ({ parcela }: { parcela: Parcela }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="card bg-base-100 w-96 shadow-sm">
      <div className="card-body">
        <div className="flex items-center gap-2">
          <h2 className="card-title">{parcela.nombre}</h2>
          {parcela.esParcelaReferencia && (
            <span className="badge badge-success badge-sm">
              {t('parcelas.referenceBadge')}
            </span>
          )}
        </div>
        <p>SIGPAC: {parcela.sigpac ?? '-'}</p>
        <p>{t('common.fields.cadastralReference')}: {parcela.refCat ?? '-'}</p>
        <p>{t('common.fields.portugalId')}: {parcela.ptIdParcela ?? '-'}</p>
        <div className="card-actions justify-end">
          <button
            className="btn btn-primary btn-circle"
            onClick={() => void navigate(`/parcelas/${parcela.id}`)}
          >
            <FaCircleArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
