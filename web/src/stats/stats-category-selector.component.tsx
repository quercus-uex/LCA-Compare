import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';

type Props = {
  selected?: EfCategoryId;
  onChange: (category: EfCategoryId | undefined) => void;
};

export const StatsCategorySelector = ({ selected, onChange }: Props) => {
  return (
    <select
      className="select select-bordered select-sm min-w-52"
      value={selected ?? ''}
      onChange={(e) =>
        onChange(
          e.target.value ? (e.target.value as EfCategoryId) : undefined,
        )
      }
    >
      <option value="">Todas las categorías</option>
      {EF_CATEGORIES.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.spanishName}
        </option>
      ))}
    </select>
  );
};
