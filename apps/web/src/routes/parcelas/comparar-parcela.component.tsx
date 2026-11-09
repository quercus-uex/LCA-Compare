import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Dropdown, Menu, MenuItem } from '../../components/ui/index.ts';
import type { Parcela } from '../../hooks/parcela.hook.tsx';

/** Abre el comparador con la parcela precargada como conjunto objetivo o de referencia */
export const CompararParcelaDropdown = ({ parcela }: { parcela: Parcela }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Dropdown variant="secondary" size="sm" width="w-64" trigger={t('parcelas.detail.compare')}>
      <Menu>
        <MenuItem onClick={() => void navigate('/compare', { state: { parcelaObjetivo: parcela } })}>
          {t('parcelas.detail.compareAsTarget')}
        </MenuItem>
        <MenuItem onClick={() => void navigate('/compare', { state: { parcelaReferencia: parcela } })}>
          {t('parcelas.detail.compareAsReference')}
        </MenuItem>
      </Menu>
    </Dropdown>
  );
};
