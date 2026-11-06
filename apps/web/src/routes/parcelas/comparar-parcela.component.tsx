import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { Parcela } from '../../hooks/parcela.hook.tsx';

/** Abre el comparador con la parcela precargada como conjunto objetivo o de referencia */
export const CompararParcelaDropdown = ({ parcela }: { parcela: Parcela }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="dropdown dropdown-end">
      <button type="button" tabIndex={0} className="btn btn-secondary btn-sm">
        {t('parcelas.detail.compare')}
      </button>
      <ul tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-[1000] mt-2 w-64 p-2 shadow-sm">
        <li>
          <button type="button" onClick={() => void navigate('/compare', { state: { parcelaObjetivo: parcela } })}>
            {t('parcelas.detail.compareAsTarget')}
          </button>
        </li>
        <li>
          <button type="button" onClick={() => void navigate('/compare', { state: { parcelaReferencia: parcela } })}>
            {t('parcelas.detail.compareAsReference')}
          </button>
        </li>
      </ul>
    </div>
  );
};
