import { useTranslation } from 'react-i18next';
import { EF_CATEGORIES, type EfLabelId } from '../common/constants.ts';

export const useTranslatedEfCategories = () => {
  const { t } = useTranslation();

  const getCategoryLabel = (id: EfLabelId) => t(`impactCategories.${id}`);
  const translatedCategories = EF_CATEGORIES.map((category) => ({
    ...category,
    label: getCategoryLabel(category.id),
  }));

  return { translatedCategories, getCategoryLabel };
};
