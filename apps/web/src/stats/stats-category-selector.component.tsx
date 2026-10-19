import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

type Props = {
  selected: EfCategoryId;
  onChange: (category: EfCategoryId) => void;
};

export const StatsCategorySelector = ({ selected, onChange }: Props) => {
  const { getCategoryLabel } = useTranslatedEfCategories();

  return (
    <select
      className="select select-bordered select-sm min-w-52"
      value={selected}
      onChange={(e) => onChange(e.target.value as EfCategoryId)}
    >
      {EF_CATEGORIES.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {getCategoryLabel(cat.id)}
        </option>
      ))}
    </select>
  );
};
