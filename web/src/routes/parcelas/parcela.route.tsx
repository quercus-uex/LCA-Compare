import { CopyToClipboardBtn } from '../../components/copy-to-clipboard.btn.component.tsx';
import { CultivoCard } from './cultivo.card.component.tsx';
import { type Parcela, useParcela } from '../../hooks/parcela.hook.tsx';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { MapPreview } from '../../components/map-preview.component.tsx';

export const ParcelaRoute = () => {
  const [parcela, setParcela] = useState<Parcela | undefined>(undefined);
  const p = useParcela();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;

    p.getById(id)
      .then(p => setParcela(p))
      .catch(() => {navigate('/404')});
  }, [id, navigate, p])

  if (!parcela || !parcela.cultivos || !parcela.geom) return <div className="skeleton w-full h-full" />

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div className="card w-full md:w-auto lg:card-side bg-base-100 shadow-sm">
        <figure>
          <MapPreview
            polygon={parcela.geom.coordinates[0]}
            className="w-full md:w-96 aspect-square rounded-tl-md rounded-tb-md"
          />
        </figure>
        <div className="card-body flex flex-col">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">{parcela.nombre}</h1>
            <div className="flex gap-2 items-center">
              <p>
                <span className="font-bold">SIGPAC: </span>
                {parcela.sigpac}
              </p>
              <CopyToClipboardBtn text={parcela.sigpac} />
            </div>
            <div className="flex gap-2 items-center">
              <p>
                <span className="font-bold">Referencia catastral: </span>
                {parcela.refCat}
              </p>
              <CopyToClipboardBtn text={parcela.refCat} />
            </div>
            <div className="flex gap-2 items-center">
              <p>
                <span className="font-bold">ID Portugal: </span>
                {parcela.ptIdParcela}
              </p>
              <CopyToClipboardBtn text={parcela.ptIdParcela} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl ">Cultivo actual</h2>
            <CultivoCard cultivo={parcela.cultivos[0]} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold">Cultivos anteriores</h2>
        <div className="flex gap-5 flex-wrap ">
          {parcela.cultivos.slice(1).map((c) => (
            <CultivoCard key={c.id} cultivo={c} />
          ))}
        </div>
      </div>
    </div>
  );
}