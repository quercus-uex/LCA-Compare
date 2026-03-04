import { type Parcela, useParcela } from '../../hooks/parcela.hook.tsx';
import { useEffect, useState } from 'react';
import { ParcelasItem } from './parcelas-item.component.tsx';

export const ParcelasRoute = () => {
  const [parcelas, setParcelas] = useState<Parcela[] | undefined>(undefined);
  const parcela = useParcela();

  useEffect(() => {
    parcela.getFromToken()
      .then(p => setParcelas(p));
  }, [parcela]);

  return (
    <div className="flex flex-col gap-5 items-center">
      <h1 className="text-3xl font-bold">Mis parcelas</h1>

      {!parcelas &&
        <div className="skeleton w-full h-full" />}
      {parcelas &&
        <div className="flex gap-2 flex-wrap justify-center">
          {parcelas.map(p => <ParcelasItem key={p.id} parcela={p} />)}
        </div>
      }
    </div>
  );
}