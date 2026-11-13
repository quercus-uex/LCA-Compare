import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaRegClipboard } from 'react-icons/fa6';
import { toast } from 'sonner';
import { IconButton } from './ui/index.ts';

export const CopyToClipboardBtn = ({ text, label }: { text: string | null; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  if (!text) return null;

  return (
    <IconButton
      icon={copied ? FaCheck : FaRegClipboard}
      label={t('clipboard.copy', { label: label ?? text })}
      variant="outline"
      size="xs"
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
    />
  );
}
