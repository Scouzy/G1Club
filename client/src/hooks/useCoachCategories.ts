import { useEffect, useState } from 'react';
import { getCurrentCoachProfile } from '../services/coachService';
import { useAuth } from './useAuth';

export const useCoachCategories = () => {
  const { user } = useAuth();
  const [coachCategoryIds, setCoachCategoryIds] = useState<string[]>([]);
  const [loadingCoach, setLoadingCoach] = useState(false);

  useEffect(() => {
    if (user?.role !== 'COACH') return;
    let cancelled = false;
    setLoadingCoach(true);
    getCurrentCoachProfile()
      .then(profile => {
        if (!cancelled) setCoachCategoryIds(profile.categories?.map((c: any) => c.id) ?? []);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoadingCoach(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const canEdit = (categoryId: string): boolean => {
    if (user?.role === 'ADMIN') return true;
    return coachCategoryIds.includes(categoryId);
  };

  return { coachCategoryIds, loadingCoach, canEdit };
};
