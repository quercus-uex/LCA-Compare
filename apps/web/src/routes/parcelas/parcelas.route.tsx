import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Parcela, useParcela } from '../../hooks/parcela.hook.tsx';
import { ParcelasItem } from './parcelas-item.component.tsx';

export const ParcelasRoute = () => {
  const [parcelas, setParcelas] = useState<Parcela[] | undefined>(undefined);
  const [query, setQuery] = useState<string>('');
  const parcela = useParcela();
  const { t } = useTranslation();

  useEffect(() => {
    void parcela.getFromToken()
      .then(p => setParcelas(p));
  }, [parcela]);

  const parcelasFiltered = parcelas?.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase())) ?? []

  return (
    <div className="flex flex-col gap-5 items-center">
      <h1 className="text-3xl font-bold">{t('parcelas.title')}</h1>

      {!parcelas &&
        <div className="skeleton w-full h-full" />}
      {parcelas &&
        <>
          <input
              type="text"
              className="input"
               placeholder={t('parcelas.searchPlaceholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap justify-center">
            {parcelasFiltered.map(p => <ParcelasItem key={p.id} parcela={p} />)}
          </div>
        </>
      }
    </div>
  );
}
