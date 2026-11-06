import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Dropdown } from '../../components/dropdown.component.tsx';
import type { Parcela } from '../../hooks/parcela.hook.tsx';

/** Abre el comparador con la parcela precargada como conjunto objetivo o de referencia */
export const CompararParcelaDropdown = ({ parcela }: { parcela: Parcela }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Dropdown triggerClassName="btn btn-secondary btn-sm" contentClassName="w-64" trigger={t('parcelas.detail.compare')}>
      <ul className="menu w-full p-0">
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
    </Dropdown>
  );
};
