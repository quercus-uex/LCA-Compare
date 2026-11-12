import type {ReactNode} from 'react';

interface Props {
  id: string;
  language?: string;
  redacted: string;
}

export default function RedactedSecret({id, language, redacted}: Props): ReactNode {
  const languageClass = language ? ` language-${language}` : '';

  return (
    // tabIndex: el bloque puede desplazarse en horizontal y tiene que poder hacerse con el teclado
    <pre className={`redacted-secret${languageClass}`} data-secret-id={id} tabIndex={0}>
      <code>{redacted}</code>
    </pre>
  );
}
