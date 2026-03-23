import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, ClipboardList } from 'lucide-react';

const CoachDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground">Espace Coach</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <Link to="/coach/sportifs" className="rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.32) 0%, rgba(139,92,246,0.2) 100%)', boxShadow: '0 8px 32px rgba(59,130,246,0.18), inset 0 1px 0 rgba(255,255,255,0.22)', border: '1px solid rgba(99,179,237,0.38)' }}>
          <div className="h-14 w-14 sm:h-16 sm:w-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <Users className="h-7 w-7 sm:h-8 sm:w-8 text-blue-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Mes Sportifs</h2>
          <p className="text-muted-foreground mt-2 text-sm">Voir les profils, stats et ajouter des annotations.</p>
        </Link>

        <Link to="/coach/events" className="rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.32) 0%, rgba(5,150,105,0.2) 100%)', boxShadow: '0 8px 32px rgba(16,185,129,0.18), inset 0 1px 0 rgba(255,255,255,0.22)', border: '1px solid rgba(52,211,153,0.38)' }}>
          <div className="h-14 w-14 sm:h-16 sm:w-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-7 w-7 sm:h-8 sm:w-8 text-green-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Événements</h2>
          <p className="text-muted-foreground mt-2 text-sm">Planifier des séances et gérer les présences.</p>
        </Link>

        <div className="rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center opacity-60" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(109,40,217,0.12) 100%)', boxShadow: '0 8px 32px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.15)', border: '1px solid rgba(167,139,250,0.28)' }}>
          <div className="h-14 w-14 sm:h-16 sm:w-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="h-7 w-7 sm:h-8 sm:w-8 text-purple-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Rapports</h2>
          <p className="text-muted-foreground mt-2 text-sm">Analyse de performance (Bientôt disponible).</p>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
