import type {ReactNode} from 'react';

interface Props {
  id: string;
  language?: string;
  redacted: string;
}

export default function RedactedSecret({id, language, redacted}: Props): ReactNode {
  const languageClass = language ? ` language-${language}` : '';

  return (
    <pre className={`redacted-secret${languageClass}`} data-secret-id={id}>
      <code>{redacted}</code>
    </pre>
  );
}
