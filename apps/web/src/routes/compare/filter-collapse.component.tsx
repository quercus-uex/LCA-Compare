import { Toggle } from '../../components/ui/index.ts';

export const FilterCollapse = ({
  title,
  enabled,
  onToggle,
  disabled = false,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={`collapse bg-base-100 border-base-300 border ${enabled ? 'collapse-open' : ''} ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="flex p-5">
        <div className="flex gap-2 items-center justify-between w-full">
          <p className="font-semibold text-lg">{title}</p>
          <Toggle
            size="lg"
            aria-label={title}
            checked={enabled}
            disabled={disabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
        </div>
      </div>
      {children && <div className="collapse-content">{children}</div>}
    </div>
  );
};
