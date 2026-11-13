import { useTranslation } from 'react-i18next';
import type { EfCategoryId } from '../common/constants.ts';

export const useTranslatedEfCategories = () => {
  const { t } = useTranslation();
  const getCategoryLabel = (id: EfCategoryId) => t(`impactCategories.${id}`);
  return { getCategoryLabel };
};
