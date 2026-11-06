import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaRegClipboard } from 'react-icons/fa6';
import { toast } from 'sonner';

export const CopyToClipboardBtn = ({ text, label }: { text: string | null; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  if (!text) return null;

  return (
    <button
      type="button"
      className="btn btn-outline w-7 h-7 btn-square"
      aria-label={t('clipboard.copy', { label: label ?? text })}
      title={t('clipboard.copy', { label: label ?? text })}
      onClick={() => {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setCopied(true);
            toast.success(t('clipboard.copied'));
          })
          .catch((e) => {
            toast.error(t('clipboard.error', { error: String(e) }));
          });
      }}
    >
      {copied ? <FaCheck aria-hidden /> : <FaRegClipboard aria-hidden />}
    </button>
  );
}
