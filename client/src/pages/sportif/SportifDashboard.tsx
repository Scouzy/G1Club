import React, { useEffect, useRef, useState } from 'react';
import api from '../../lib/axios';
import { useRefresh } from '../../context/RefreshContext';
import { getCategoryMessages, Message } from '../../services/messageService';
import { getTrainings, Training } from '../../services/trainingService';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar
} from 'recharts';
import {
  User, TrendingUp, Calendar, CheckCircle, XCircle, Star,
  Activity, Target, Dumbbell, Brain, Zap, Shield, MessageSquare, Trophy, Clock, Camera
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SportifProfile {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  height?: number;
  weight?: number;
  position?: string;
  category: { id: string; name: string };
  evaluations: Evaluation[];
  attendances: Attendance[];
  annotations: Annotation[];
}

interface Evaluation {
  id: string;
  date: string;
  type: string;
  ratings: string;
  comment?: string;
  coach: { user: { name: string } };
}

interface Attendance {
  id: string;
  present: boolean;
  reason?: string;
  training: {
    id: string;
    date: string;
    type: string;
    duration: number;
    location?: string;
  };
}

interface Annotation {
  id: string;
  content: string;
  type: string;
  createdAt: string;
}

const EVAL_TYPE_LABELS: Record<string, string> = {
  TECHNIQUE: 'Technique',
  PHYSIQUE: 'Physique',
  TACTIQUE: 'Tactique',
  MENTAL: 'Mental',
  GLOBAL: 'Évaluation globale',
};

const CRITERIA_LABELS: Record<string, string> = {
  technique: 'Technique',
  endurance: 'Endurance',
  vitesse: 'Vitesse',
  mental: 'Mental',
};

const CRITERIA_COLORS: Record<string, string> = {
  technique: '#3b82f6',
  endurance: '#22c55e',
  vitesse: '#f97316',
  mental: '#a855f7',
};

const safeParseRatings = (raw: string): Record<string, number> => {
  try {
    let parsed = JSON.parse(raw);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).filter(([, v]) => typeof v === 'number')
      ) as Record<string, number>;
    }
  } catch {}
  return {};
};

const EVAL_TYPE_ICONS: Record<string, React.ElementType> = {
  TECHNIQUE: Dumbbell,
  PHYSIQUE: Activity,
  TACTIQUE: Target,
  MENTAL: Brain,
  GLOBAL: Star,
};

const EVAL_TYPE_COLORS: Record<string, string> = {
  TECHNIQUE: '#3b82f6',
  PHYSIQUE: '#10b981',
  TACTIQUE: '#f59e0b',
  MENTAL: '#8b5cf6',
  GLOBAL: '#6366f1',
};

const ANNOTATION_COLORS: Record<string, string> = {
  POINT_FORT: 'text-green-400 bg-green-500/10 border-green-500/20',
  POINT_FAIBLE: 'text-red-400 bg-red-500/10 border-red-500/20',
  TECHNIQUE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  RECOMMANDATION: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
};

const ANNOTATION_LABELS: Record<string, string> = {
  POINT_FORT: 'Point fort',
  POINT_FAIBLE: 'Point faible',
  TECHNIQUE: 'Technique',
  RECOMMANDATION: 'Recommandation',
};

const SportifDashboard: React.FC = () => {
  const { attendanceVersion } = useRefresh();
  const [profile, setProfile] = useState<SportifProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'evaluations' | 'presences' | 'annotations'>('overview');
  const [categoryMessages, setCategoryMessages] = useState<Message[]>([]);
  const [recentMatches, setRecentMatches] = useState<Training[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Training[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 3 * 1024 * 1024) { alert('Image trop lourde (max 3 Mo)'); return; }
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const photoUrl = reader.result as string;
        await api.put('/sportifs/me/photo', { photoUrl });
        setProfile(prev => prev ? { ...prev, photoUrl } as any : prev);
      } catch (err) {
        console.error(err);
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    api.get('/sportifs/me')
      .then(res => {
        setProfile(res.data);
        if (res.data?.category?.id) {
          const catId = res.data.category.id;
          getCategoryMessages(catId)
            .then(msgs => setCategoryMessages([...msgs].reverse().slice(0, 5).reverse()))
            .catch(console.error);
          getTrainings({ categoryId: catId })
            .then(trainings => {
              const now = new Date();
              const matches = trainings
                .filter(t => t.type === 'Match' || t.type === 'Tournoi')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              setRecentMatches(matches.filter(t => new Date(t.date) < now).slice(0, 5));
              setUpcomingEvents(matches.filter(t => new Date(t.date) >= now).slice(0, 3));
            })
            .catch(console.error);
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [attendanceVersion]);

  // --- Computed stats ---
  const totalSessions = profile?.attendances.length ?? 0;
  const presentSessions = profile?.attendances.filter(a => a.present).length ?? 0;
  const absenceSessions = totalSessions - presentSessions;
  const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  // Latest evaluation per type
  const latestEvalByType = (profile?.evaluations ?? []).reduce((acc, ev) => {
    if (!acc[ev.type] || new Date(ev.date) > new Date(acc[ev.type].date)) acc[ev.type] = ev;
    return acc;
  }, {} as Record<string, Evaluation>);

  // Radar data: for GLOBAL evals use individual criteria, for typed evals use avg
  const radarData = (() => {
    // Prefer GLOBAL evaluations for radar (use latest GLOBAL)
    const globalEval = (profile?.evaluations ?? [])
      .filter(e => e.type === 'GLOBAL')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (globalEval) {
      const r = safeParseRatings(globalEval.ratings);
      return Object.entries(r).map(([k, v]) => ({
        subject: CRITERIA_LABELS[k] ?? k,
        value: v,
        fullMark: 10,
      }));
    }
    // Fallback: typed evals
    return Object.entries(latestEvalByType).map(([type, ev]) => {
      const ratings = safeParseRatings(ev.ratings);
      const vals = Object.values(ratings);
      const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      return { subject: EVAL_TYPE_LABELS[type] ?? type, value: avg, fullMark: 10 };
    });
  })();

  // Evolution chart: average score per evaluation over time
  const evolutionData = [...(profile?.evaluations ?? [])]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(ev => {
      const ratings = safeParseRatings(ev.ratings);
      const vals = Object.values(ratings);
      const avg = vals.length > 0
        ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
        : 0;
      return {
        date: format(parseISO(ev.date), 'dd/MM', { locale: fr }),
        score: avg,
        type: EVAL_TYPE_LABELS[ev.type] ?? ev.type,
      };
    });

  // Attendance bar chart: last 8 sessions
  const attendanceChartData = [...(profile?.attendances ?? [])]
    .sort((a, b) => new Date(b.training.date).getTime() - new Date(a.training.date).getTime())
    .slice(0, 8)
    .reverse()
    .map(a => ({
      date: format(parseISO(a.training.date), 'dd/MM', { locale: fr }),
      présent: a.present ? 1 : 0,
      absent: a.present ? 0 : 1,
    }));

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
    { id: 'evaluations', label: 'Évaluations', icon: Star },
    { id: 'presences', label: 'Présences', icon: Calendar },
    { id: 'annotations', label: 'Notes du coach', icon: Zap },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <User size={48} className="mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Profil sportif non trouvé</h2>
        <p className="text-muted-foreground">Votre profil sportif n'a pas encore été créé par votre coach.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative group shrink-0">
          <div
            className="h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center border border-border"
            style={{ backgroundColor: ((profile.category as any).color || '#3b82f6') + '22', color: (profile.category as any).color || '#3b82f6' }}
          >
            {(profile as any).photoUrl ? (
              <img src={(profile as any).photoUrl} alt={`${profile.firstName} ${profile.lastName}`} className="h-full w-full object-cover" />
            ) : (
              <User size={26} />
            )}
          </div>
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="Changer ma photo"
          >
            {uploadingPhoto ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera size={18} className="text-white" />
            )}
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{profile.firstName} {profile.lastName}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: (profile.category as any).color || '#3b82f6' }} />
            {profile.category.name}
            {profile.position && <span> · {profile.position}</span>}
            {profile.height && <span> · {profile.height} cm</span>}
            {profile.weight && <span> · {profile.weight} kg</span>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-full overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== VUE D'ENSEMBLE ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Séances totales</p>
              <p className="text-3xl font-bold text-foreground">{totalSessions}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Taux de présence</p>
              <p className="text-3xl font-bold text-green-400">{attendanceRate}%</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Présences</p>
              <p className="text-3xl font-bold text-blue-400">{presentSessions}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Absences</p>
              <p className="text-3xl font-bold text-red-400">{absenceSessions}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar des compétences */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield size={16} className="text-primary" /> Profil de compétences
              </h3>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                    <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Aucune évaluation disponible
                </div>
              )}
            </div>

            {/* Évolution des scores */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" /> Évolution des scores
              </h3>
              {evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="Score moyen" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Aucune donnée d'évolution
                </div>
              )}
            </div>
          </div>

          {/* Prochains événements */}
          {upcomingEvents.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock size={16} className="text-primary" /> Prochains événements
              </h3>
              <div className="space-y-2">
                {upcomingEvents.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {t.type}{t.opponent ? ` · vs ${t.opponent}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(t.date), 'EEEE dd MMM yyyy', { locale: fr })}
                          {t.location ? ` · ${t.location}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      À venir
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Derniers résultats */}
          {recentMatches.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Trophy size={16} className="text-primary" /> Derniers résultats
              </h3>
              <div className="space-y-2">
                {recentMatches.map(t => {
                  const result = t.result?.trim();
                  let resultColor = 'text-muted-foreground bg-muted';
                  let resultLabel = result || '—';
                  if (result) {
                    const lower = result.toLowerCase();
                    if (lower.startsWith('v') || lower.includes('victoire') || lower.includes('gagn')) {
                      resultColor = 'text-green-400 bg-green-500/10';
                    } else if (lower.startsWith('d') || lower.includes('défaite') || lower.includes('perdu')) {
                      resultColor = 'text-red-400 bg-red-500/10';
                    } else if (lower.startsWith('n') || lower.includes('nul')) {
                      resultColor = 'text-yellow-400 bg-yellow-500/10';
                    }
                  }
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Trophy size={14} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {t.type}{t.opponent ? ` · vs ${t.opponent}` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(t.date), 'dd MMM yyyy', { locale: fr })}
                            {t.location ? ` · ${t.location}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${resultColor}`}>
                        {resultLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages du coach */}
          {categoryMessages.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare size={16} className="text-primary" /> Messages de l'encadrement
              </h3>
              <div className="space-y-3">
                {categoryMessages.map(msg => (
                  <div key={msg.id} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {msg.sender.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">{msg.sender.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(msg.createdAt), 'dd MMM à HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dernières évaluations par type */}
          {Object.keys(latestEvalByType).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Star size={16} className="text-primary" /> Dernières notes par domaine
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(latestEvalByType).map(([type, ev]) => {
                  const ratings = safeParseRatings(ev.ratings);
                  const vals = Object.values(ratings);
                  const avg = vals.length > 0
                    ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                    : '—';
                  const Icon = EVAL_TYPE_ICONS[type] ?? Star;
                  const color = EVAL_TYPE_COLORS[type] ?? '#3b82f6';
                  return (
                    <div key={type} className="rounded-xl border border-border p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                          <Icon size={15} style={{ color }} />
                        </div>
                        <span className="text-sm font-medium text-foreground">{EVAL_TYPE_LABELS[type]}</span>
                      </div>
                      <p className="text-3xl font-bold" style={{ color }}>{avg}<span className="text-sm text-muted-foreground">/10</span></p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(ev.date), 'dd MMM yyyy', { locale: fr })}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ÉVALUATIONS ===== */}
      {activeTab === 'evaluations' && (
        <div className="space-y-4">
          {profile.evaluations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Star size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucune évaluation pour le moment</p>
            </div>
          ) : (
            [...profile.evaluations]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(ev => {
                const ratings = safeParseRatings(ev.ratings);
                const vals = Object.values(ratings);
                const avg = vals.length > 0
                  ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                  : '—';
                const Icon = EVAL_TYPE_ICONS[ev.type] ?? Star;
                const color = EVAL_TYPE_COLORS[ev.type] ?? '#6366f1';
                const isGlobal = ev.type === 'GLOBAL';
                const chartData = Object.entries(ratings).map(([k, v]) => ({
                  name: CRITERIA_LABELS[k] ?? k,
                  score: v,
                  fill: CRITERIA_COLORS[k] ?? color,
                }));
                return (
                  <div key={ev.id} className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                          <Icon size={18} style={{ color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">{isGlobal ? 'Évaluation globale' : (EVAL_TYPE_LABELS[ev.type] ?? ev.type)}</p>
                            {(ev as any).training && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                {(ev as any).training.type}{(ev as any).training.opponent ? ` · vs ${(ev as any).training.opponent}` : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(ev.date), 'dd MMMM yyyy', { locale: fr })} · par {ev.coach.user.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color }}>{avg}</p>
                        <p className="text-xs text-muted-foreground">/10</p>
                      </div>
                    </div>

                    {chartData.length > 0 && isGlobal && (
                      <div className="space-y-2 mt-2">
                        {chartData.map(({ name, score, fill }) => (
                          <div key={name}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-foreground">{name}</span>
                              <span className="text-xs font-bold text-foreground">{score}<span className="text-muted-foreground font-normal">/10</span></span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${(score / 10) * 100}%`, backgroundColor: fill }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {chartData.length > 0 && !isGlobal && (
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={chartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                          <XAxis type="number" domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} width={90} />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          />
                          <Bar dataKey="score" fill={color} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {ev.comment && (
                      <p className="mt-3 text-sm text-muted-foreground border-t border-border pt-3 italic">💬 {ev.comment}</p>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ===== PRÉSENCES ===== */}
      {activeTab === 'presences' && (
        <div className="space-y-6">
          {/* Bar chart */}
          {attendanceChartData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Présences — 8 dernières séances</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  />
                  <Bar dataKey="présent" fill="#10b981" radius={[4, 4, 0, 0]} name="Présent" />
                  <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* List */}
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {profile.attendances.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucune séance enregistrée</p>
              </div>
            ) : (
              [...profile.attendances]
                .sort((a, b) => new Date(b.training.date).getTime() - new Date(a.training.date).getTime())
                .map(a => (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                    {a.present
                      ? <CheckCircle size={18} className="text-green-400 shrink-0" />
                      : <XCircle size={18} className="text-red-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{a.training.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(a.training.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                        {a.training.location && ` · ${a.training.location}`}
                        {` · ${a.training.duration} min`}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      a.present ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {a.present ? 'Présent' : 'Absent'}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ===== ANNOTATIONS ===== */}
      {activeTab === 'annotations' && (
        <div className="space-y-3">
          {profile.annotations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Zap size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucune note de coach pour le moment</p>
            </div>
          ) : (
            [...profile.annotations]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(ann => (
                <div key={ann.id} className={`rounded-xl border p-4 ${ANNOTATION_COLORS[ann.type] ?? 'text-foreground bg-card border-border'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {ANNOTATION_LABELS[ann.type] ?? ann.type}
                    </span>
                    <span className="text-xs opacity-60">
                      {format(parseISO(ann.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{ann.content}</p>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};

export default SportifDashboard;
