import { FaCheck, FaRegClipboard } from 'react-icons/fa6';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const CopyToClipboardBtn = ({ text }: { text: string | null }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  if (!text) return null;

  return (
    <button
      className="btn btn-outline w-7 h-7 btn-square"
      onClick={() => {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setCopied(true);
            toast.success(t('clipboard.copied'));
          })
          .catch((e) => {
            alert(t('clipboard.error', { error: String(e) }));
          });
      }}
    >
      {copied ? <FaCheck /> : <FaRegClipboard />}
    </button>
  );
}
