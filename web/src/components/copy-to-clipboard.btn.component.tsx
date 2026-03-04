import { FaCheck, FaRegClipboard } from 'react-icons/fa6';
import { useState } from 'react';
import { toast } from 'sonner';

export const CopyToClipboardBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="btn btn-outline w-7 h-7 btn-square"
      onClick={() => {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setCopied(true);
            toast.success('Copiado al portapapeles');
          })
          .catch((e) => {
            alert('Error al copiar al portapapeles: ' + e);
          });
      }}
    >
      {copied ? <FaCheck /> : <FaRegClipboard />}
    </button>
  );
}
