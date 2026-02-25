import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { useRefresh } from '../../context/RefreshContext';
import { Calendar, Clock, MapPin, Trophy, Swords, Target, ChevronRight, Repeat } from 'lucide-react';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  location?: string;
}

const DAY_NAMES = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_COLORS = ['', 'bg-blue-500/10 text-blue-400 border-blue-500/20', 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', 'bg-violet-500/10 text-violet-400 border-violet-500/20', 'bg-purple-500/10 text-purple-400 border-purple-500/20', 'bg-pink-500/10 text-pink-400 border-pink-500/20', 'bg-orange-500/10 text-orange-400 border-orange-500/20', 'bg-red-500/10 text-red-400 border-red-500/20'];

interface Training {
  id: string;
  date: string;
  duration: number;
  type: string;
  location?: string;
  opponent?: string;
  result?: string;
  objectives?: string;
  category: { name: string };
  coach: { user: { name: string } };
}

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  Match:       { label: 'Match',        color: '#ef4444', bg: 'bg-red-500/10 text-red-400 border-red-500/20',       icon: Swords },
  Tournoi:     { label: 'Tournoi',      color: '#f97316', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: Trophy },
  Stage:       { label: 'Stage',        color: '#8b5cf6', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Target },
  Entraînement:{ label: 'Entraînement', color: '#3b82f6', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    icon: Target },
};

const getTypeStyle = (type: string) => TYPE_STYLES[type] ?? { label: type, color: '#6b7280', bg: 'bg-muted text-muted-foreground border-border', icon: Calendar };

const SportifEvents: React.FC = () => {
  const { attendanceVersion } = useRefresh();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [mainTab, setMainTab] = useState<'events' | 'schedules'>('schedules');

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await api.get('/sportifs/me');
        const profile = profileRes.data;
        setCategoryName(profile.category?.name ?? '');

        const [trainRes, schedRes] = await Promise.all([
          api.get(`/trainings?categoryId=${profile.categoryId}`),
          api.get(`/schedules/category/${profile.categoryId}`),
        ]);
        setTrainings(trainRes.data);
        setSchedules(schedRes.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Impossible de charger les événements');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attendanceVersion]);

  const filtered = trainings.filter(t => {
    const d = parseISO(t.date);
    if (filter === 'upcoming') return isFuture(d);
    if (filter === 'past') return isPast(d);
    return true;
  }).sort((a, b) => {
    if (filter === 'past') return new Date(b.date).getTime() - new Date(a.date).getTime();
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const upcomingCount = trainings.filter(t => isFuture(parseISO(t.date))).length;
  const nextEvent = trainings
    .filter(t => isFuture(parseISO(t.date)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Calendar size={40} className="mx-auto mb-3 opacity-30" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mes Événements</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catégorie <span className="font-semibold text-foreground">{categoryName}</span>
          {' · '}{trainings.length} séance{trainings.length > 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Prochain événement highlight */}
      {nextEvent && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ChevronRight size={12} /> Prochain événement
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {(() => {
                    const s = getTypeStyle(nextEvent.type);
                    const Icon = s.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.bg}`}>
                        <Icon size={11} /> {s.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-lg font-bold text-foreground">
                  {format(parseISO(nextEvent.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><Clock size={13} />{format(parseISO(nextEvent.date), 'HH:mm')} ({nextEvent.duration} min)</span>
                  {nextEvent.location && <span className="flex items-center gap-1"><MapPin size={13} />{nextEvent.location}</span>}
                </p>
                {nextEvent.opponent && (
                  <p className="text-sm text-foreground mt-1 font-medium">🆚 vs {nextEvent.opponent}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onglets principaux */}
      <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit">
        <button
          onClick={() => setMainTab('schedules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mainTab === 'schedules' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Repeat size={14} /> Créneaux hebdo ({schedules.length})
        </button>
        <button
          onClick={() => setMainTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mainTab === 'events' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar size={14} /> Événements ({trainings.length})
        </button>
      </div>

      {/* ===== CRÉNEAUX HEBDOMADAIRES ===== */}
      {mainTab === 'schedules' && (
        <div className="space-y-4">
          <div className="bg-muted/20 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground">
            📅 Ces créneaux s'appliquent <strong className="text-foreground">toute la saison</strong>, hors vacances scolaires.
          </div>
          {schedules.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              <Repeat size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucun créneau d'entraînement défini pour cette catégorie</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...schedules]
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map(s => (
                  <div key={s.id} className={`rounded-xl border p-5 space-y-3 ${DAY_COLORS[s.dayOfWeek] ?? 'bg-card border-border text-foreground'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold">{DAY_NAMES[s.dayOfWeek]}</span>
                      <span className="text-xs font-semibold opacity-70 uppercase tracking-wide">Hebdo</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <Clock size={14} className="opacity-70" />
                        {s.startTime}
                        <span className="opacity-60">· {s.duration} min</span>
                      </p>
                      {s.location && (
                        <p className="flex items-center gap-2 text-sm">
                          <MapPin size={14} className="opacity-70" />
                          {s.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ===== ÉVÉNEMENTS ===== */}
      {mainTab === 'events' && (
      <div className="space-y-4">
      {/* Filtres événements */}
      <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit">
        {([
          { id: 'upcoming', label: `À venir (${upcomingCount})` },
          { id: 'past',     label: 'Passés' },
          { id: 'all',      label: 'Tous' },
        ] as const).map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === f.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p>{filter === 'upcoming' ? 'Aucun événement à venir' : filter === 'past' ? 'Aucun événement passé' : 'Aucun événement'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const s = getTypeStyle(t.type);
            const Icon = s.icon;
            const past = isPast(parseISO(t.date));
            return (
              <div
                key={t.id}
                className={`bg-card border rounded-xl p-5 transition-colors ${past ? 'border-border opacity-70' : 'border-border hover:border-primary/40'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Date bloc */}
                  <div className="shrink-0 w-14 text-center">
                    <p className="text-2xl font-bold text-foreground leading-none">
                      {format(parseISO(t.date), 'dd')}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase font-medium">
                      {format(parseISO(t.date), 'MMM', { locale: fr })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(t.date), 'yyyy')}
                    </p>
                  </div>

                  {/* Separator */}
                  <div className="hidden sm:block w-px bg-border self-stretch" />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.bg}`}>
                        <Icon size={11} /> {s.label}
                      </span>
                      {!past && (
                        <span className="text-xs text-primary font-medium">À venir</span>
                      )}
                      {past && t.result && (
                        <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                          🏆 {t.result}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {format(parseISO(t.date), 'HH:mm')} · {t.duration} min
                      </span>
                      {t.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} /> {t.location}
                        </span>
                      )}
                    </div>

                    {t.opponent && (
                      <p className="text-sm font-medium text-foreground mt-1">🆚 vs {t.opponent}</p>
                    )}
                    {t.objectives && (
                      <p className="text-xs text-muted-foreground mt-1">🎯 {t.objectives}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Coach : {t.coach?.user?.name ?? '—'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
      )}
    </div>
  );
};

export default SportifEvents;
