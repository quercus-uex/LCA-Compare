import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import { useTranslation } from 'react-i18next';

export const useTranslatedEfCategories = () => {
  const { t } = useTranslation();

  const getCategoryLabel = (id: EfCategoryId) => t(`impactCategories.${id}`);
  const translatedCategories = EF_CATEGORIES.map((category) => ({
    ...category,
    label: getCategoryLabel(category.id),
  }));

  return { translatedCategories, getCategoryLabel };
};
