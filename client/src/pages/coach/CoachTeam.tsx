import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoaches, Coach } from '../../services/coachService';
import { useAuth } from '../../hooks/useAuth';
import { User, Phone, MapPin, Star, Layers } from 'lucide-react';

const CoachTeam: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCoaches()
      .then(setCoaches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Équipe d'encadrement</h1>
          <p className="text-sm text-muted-foreground mt-1">{coaches.length} entraîneur{coaches.length > 1 ? 's' : ''} dans le club</p>
        </div>
      </div>

      {coaches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
          Aucun coach enregistré.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coaches.map(coach => {
            const isMe = user?.role === 'COACH' && coach.user?.email === user?.email;
            return (
              <div
                key={coach.id}
                className={`bg-card border rounded-xl p-5 shadow-sm transition-all ${
                  isMe ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border hover:border-primary/30'
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden text-primary font-bold text-lg shrink-0">
                    {coach.photoUrl ? (
                      <img src={coach.photoUrl} alt={coach.user?.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{coach.user?.name?.charAt(0) || 'C'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-foreground truncate">{coach.user?.name}</h2>
                      {isMe && (
                        <span className="shrink-0 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                          Moi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{coach.user?.email}</p>
                  </div>
                </div>

                {/* Infos */}
                <div className="space-y-1.5 mb-3">
                  {coach.specialties && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star size={13} className="text-primary shrink-0" />
                      <span className="truncate">{coach.specialties}</span>
                    </div>
                  )}
                  {coach.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone size={13} className="text-primary shrink-0" />
                      <span>{coach.phone}</span>
                    </div>
                  )}
                  {coach.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={13} className="text-primary shrink-0" />
                      <span className="truncate">{coach.address}</span>
                    </div>
                  )}
                  {coach.experience && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User size={13} className="text-primary shrink-0" />
                      <span className="truncate">{coach.experience}</span>
                    </div>
                  )}
                </div>

                {/* Catégories */}
                {coach.categories && coach.categories.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Layers size={12} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Catégories</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {coach.categories.map(cat => (
                        <span key={cat.id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bouton Ma fiche (si c'est le coach connecté) */}
                {isMe && (
                  <button
                    onClick={() => navigate('/coach/profile')}
                    className="w-full mt-1 px-3 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Modifier ma fiche
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoachTeam;
