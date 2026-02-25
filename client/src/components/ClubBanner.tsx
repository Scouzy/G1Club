import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useClub } from '../context/ClubContext';
import { Globe } from 'lucide-react';

interface ClubBannerProps {
  /** Override the page title shown next to the club badge */
  title?: string;
}

const ClubBanner: React.FC<ClubBannerProps> = ({ title }) => {
  const { isSuperAdmin } = useAuth();
  const { club } = useClub();

  if (!isSuperAdmin) return null;

  const hasClub = !!club?.id;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border mb-5 ${
      hasClub
        ? 'bg-primary/5 border-primary/20'
        : 'bg-amber-500/5 border-amber-500/20'
    }`}>
      {hasClub ? (
        <>
          <div className="h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-white shadow-sm border border-border">
            <img
              src={club.logoUrl || '/logo_G1C_transparent.png'}
              alt={club.clubName}
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Club actif</p>
            <p className="text-sm font-bold text-foreground truncate">{club.clubName}</p>
          </div>
        </>
      ) : (
        <>
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Globe size={18} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Vue globale</p>
            <p className="text-sm font-bold text-foreground">Tous les clubs — données agrégées</p>
          </div>
        </>
      )}
      {title && (
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full shrink-0">{title}</span>
      )}
    </div>
  );
};

export default ClubBanner;
