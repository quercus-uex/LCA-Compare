import { FaCircleArrowRight } from 'react-icons/fa6';
import type { Parcela } from '../../hooks/parcela.hook.tsx';
import { useNavigate } from 'react-router';

export const ParcelasItem = ({ parcela }: { parcela: Parcela }) => {
  const navigate = useNavigate();
  return (
    <div className="card bg-base-100 w-96 shadow-sm">
      <div className="card-body">
        <h2 className="card-title">{parcela.nombre}</h2>
        <p>SIGPAC: {parcela.sigpac}</p>
        <p>Referencia catastral: {parcela.refCat}</p>
        <p>ID Portugal: {parcela.ptIdParcela}</p>
        <div className="card-actions justify-end">
          <button
            className="btn btn-primary btn-circle"
            onClick={() => navigate(`/parcelas/${parcela.id}`)}
          >
            <FaCircleArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}