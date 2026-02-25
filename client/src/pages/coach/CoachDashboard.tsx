import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, ClipboardList } from 'lucide-react';

const CoachDashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Espace Coach</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/coach/sportifs" className="bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-all border border-border flex flex-col items-center justify-center text-center group hover:border-primary/50">
          <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
            <Users className="h-8 w-8 text-primary dark:text-blue-300" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Mes Sportifs</h2>
          <p className="text-muted-foreground mt-2">Voir les profils, stats et ajouter des annotations.</p>
        </Link>

        <Link to="/coach/trainings" className="bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-all border border-border flex flex-col items-center justify-center text-center group hover:border-primary/50">
          <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
            <Calendar className="h-8 w-8 text-green-600 dark:text-green-300" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Événements</h2>
          <p className="text-muted-foreground mt-2">Planifier des séances et gérer les présences.</p>
        </Link>

        {/* Placeholder for future feature */}
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 transition-opacity">
           <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Rapports</h2>
          <p className="text-muted-foreground mt-2">Analyse de performance (Bientôt disponible).</p>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
