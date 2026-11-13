import {
  createContext,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useContext,
  useId,
} from 'react';
import type { IconType } from 'react-icons';

type FieldContextValue = { id: string; describedBy?: string; invalid: boolean; required?: boolean };

// El campo pasa a su control el id, la descripción y el estado de error sin que haya que enlazarlos a mano
const FieldContext = createContext<FieldContextValue | null>(null);

/** Atributos que el control toma del `Field` que lo envuelve: id, descripción y estado de error */
export const useFieldControl = (id?: string) => {
  const field = useContext(FieldContext);
  if (!field) return { id };
  return {
    id: id ?? field.id,
    'aria-describedby': field.describedBy,
    'aria-invalid': field.invalid || undefined,
    required: field.required,
  };
};

type FieldProps = {
  label: ReactNode;
  /** Ayuda bajo el control; si hay error, el error ocupa su lugar */
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Id del control, si hay que conocerlo desde fuera */
  id?: string;
  className?: string;
  children: ReactNode;
};

/** Etiqueta, control, ayuda y error, enlazados entre sí para los lectores de pantalla */
export const Field = ({ label, hint, error, required, id, className, children }: FieldProps) => {
  const autoId = useId();
  const controlId = id ?? autoId;
  const message = error ?? hint;
  const describedBy = message ? `${controlId}-desc` : undefined;

  return (
    <FieldContext.Provider value={{ id: controlId, describedBy, invalid: !!error, required }}>
      <div className={`flex flex-col gap-1 ${className ?? ''}`}>
        <label htmlFor={controlId} className="text-sm font-medium">
          {label}
          {required && <span aria-hidden className="text-muted"> *</span>}
        </label>
        {children}
        {message && (
          <p id={describedBy} className={`text-sm ${error ? 'font-medium text-danger' : 'text-muted'}`}>
            {message}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
};

type ControlSize = 'sm' | 'md';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: ControlSize;
  /** Icono decorativo dentro del campo, a la izquierda (buscar, p. ej.) */
  icon?: IconType;
  ref?: React.Ref<HTMLInputElement>;
};

export const Input = ({ size = 'md', icon: Icon, className, id, ...rest }: InputProps) => {
  const control = useFieldControl(id);
  const invalid = control['aria-invalid'] ?? rest['aria-invalid'];
  const sizeClass = size === 'sm' ? 'input-sm' : '';
  // El `error` del tema es pastel: el borde de un campo erróneo usa el rojo de texto
  const stateClass = invalid ? 'border-danger' : '';

  if (!Icon) {
    return <input {...control} {...rest} className={`input w-full ${sizeClass} ${stateClass} ${className ?? ''}`} />;
  }
  // Con icono, DaisyUI pide que el borde lo pinte una etiqueta que envuelve icono e input
  return (
    <label className={`input w-full ${sizeClass} ${stateClass} ${className ?? ''}`}>
      <Icon aria-hidden className="shrink-0 text-muted" />
      <input {...control} {...rest} className="grow" />
    </label>
  );
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & { size?: ControlSize };

export const Select = ({ size = 'md', className, id, children, ...rest }: SelectProps) => {
  const control = useFieldControl(id);
  const invalid = control['aria-invalid'] ?? rest['aria-invalid'];
  return (
    <select
      {...control}
      {...rest}
      className={`select w-full ${size === 'sm' ? 'select-sm' : ''} ${invalid ? 'border-danger' : ''} ${className ?? ''}`}
    >
      {children}
    </select>
  );
};

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> };

export const Textarea = ({ className, id, ...rest }: TextareaProps) => {
  const control = useFieldControl(id);
  const invalid = control['aria-invalid'] ?? rest['aria-invalid'];
  return <textarea {...control} {...rest} className={`textarea w-full ${invalid ? 'border-danger' : ''} ${className ?? ''}`} />;
};

type CheckProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Texto junto al control; sin él, el control necesita `aria-label` */
  label?: ReactNode;
  /** Ayuda bajo el texto */
  hint?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
};

// Clases completas y literales: Tailwind solo genera las que encuentra escritas en el código
const CHECK_CLASS = {
  checkbox: { sm: 'checkbox checkbox-primary checkbox-sm', md: 'checkbox checkbox-primary', lg: 'checkbox checkbox-primary checkbox-lg' },
  toggle: { sm: 'toggle toggle-primary toggle-sm', md: 'toggle toggle-primary', lg: 'toggle toggle-primary toggle-lg' },
} as const;

// La primera línea del texto mide lo mismo que el control y se centra con él,
// así queda alineada sea cual sea el tamaño (con la ayuda debajo)
const LABEL_LINE = { sm: 'min-h-5', md: 'min-h-6', lg: 'min-h-8' } as const;

const CheckControl = ({ kind, label, hint, size = 'md', className, id, ...rest }: CheckProps & { kind: 'checkbox' | 'toggle' }) => {
  const autoId = useId();
  const controlId = id ?? autoId;
  const input = (
    <input
      {...rest}
      id={controlId}
      type="checkbox"
      role={kind === 'toggle' ? 'switch' : undefined}
      aria-describedby={hint ? `${controlId}-desc` : rest['aria-describedby']}
      className={`${CHECK_CLASS[kind][size]} ${label ? '' : className ?? ''}`}
    />
  );
  if (!label) return input;

  return (
    <div className={`flex items-start gap-2.5 ${className ?? ''}`}>
      {input}
      <div className="flex flex-col">
        <label htmlFor={controlId} className={`flex cursor-pointer items-center text-sm font-medium ${LABEL_LINE[size]}`}>{label}</label>
        {hint && <p id={`${controlId}-desc`} className="text-sm text-muted">{hint}</p>}
      </div>
    </div>
  );
};

/** Casilla para elegir uno o varios elementos de una lista */
export const Checkbox = (props: CheckProps) => <CheckControl kind="checkbox" {...props} />;

/** Interruptor para activar o desactivar una opción con efecto inmediato */
export const Toggle = (props: CheckProps) => <CheckControl kind="toggle" {...props} />;
