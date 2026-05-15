export const FilterCollapse = ({
  title,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={`collapse bg-base-100 border-base-300 border ${enabled ? 'collapse-open' : ''}`}
    >
      <div className="flex p-5">
        <div className="flex gap-2 items-center justify-between w-full">
          <p className="font-semibold text-lg">{title}</p>
          <input
            type="checkbox"
            className="toggle toggle-lg"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
        </div>
      </div>
      <div className="collapse-content">{children}</div>
    </div>
  );
};
