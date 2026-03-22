import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useClub } from '../context/ClubContext';
import { Link } from 'react-router-dom';
import { getGlobalStats, getCategoryStats, getSportifStats, GlobalStats, SportifStats } from '../services/statsService';
import api from '../lib/axios';
import { Announcement, getAnnouncements, createAnnouncement, deleteAnnouncement } from '../services/announcementService';
import ClubBanner from '../components/ClubBanner';
import { Users, Shield, Award, Activity, Calendar, Trophy, TrendingUp, Globe, Facebook, Instagram, Twitter, Youtube, Linkedin, Megaphone, Trash2, Plus, X, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useRefresh } from '../context/RefreshContext';

const TikTokIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
);

const SOCIAL_LINKS = [
  { key: 'website',   label: 'Site web',    Icon: Globe,      color: 'text-blue-500' },
  { key: 'facebook',  label: 'Facebook',    Icon: Facebook,   color: 'text-blue-600' },
  { key: 'instagram', label: 'Instagram',   Icon: Instagram,  color: 'text-pink-500' },
  { key: 'twitter',   label: 'X / Twitter', Icon: Twitter,    color: 'text-sky-500' },
  { key: 'youtube',   label: 'YouTube',     Icon: Youtube,    color: 'text-red-500' },
  { key: 'tiktok',    label: 'TikTok',      Icon: TikTokIcon, color: 'text-foreground' },
  { key: 'linkedin',  label: 'LinkedIn',    Icon: Linkedin,   color: 'text-blue-700' },
] as const;

const Dashboard: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { club } = useClub();
  const { attendanceVersion } = useRefresh();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [sportifStats, setSportifStats] = useState<SportifStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annSending, setAnnSending] = useState(false);
  const [annError, setAnnError] = useState<string>('');
  const [allClubsStats, setAllClubsStats] = useState<any[]>([]);
  const activeClubId = localStorage.getItem('activeClubId');
  const isGlobalView = isSuperAdmin && !activeClubId;

  useEffect(() => {
    if (isGlobalView) {
      loadAllClubsStats();
    } else if (user?.role === 'ADMIN' || user?.role === 'COACH') {
      loadStats();
    } else if (user?.role === 'SPORTIF') {
      loadSportifData();
    } else {
      setLoading(false);
    }
  }, [user, attendanceVersion, activeClubId]);

  useEffect(() => {
    if (user) loadAnnouncementsData();
  }, [user]);

  const loadAnnouncementsData = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch {
      // Super admin sans club sélectionné : pas d'annonces à afficher
      setAnnouncements([]);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim() || annSending) return;
    setAnnSending(true);
    setAnnError('');
    try {
      const created = await createAnnouncement(annTitle.trim(), annContent.trim());
      setAnnouncements(prev => [created, ...prev]);
      setAnnTitle('');
      setAnnContent('');
      setShowAnnouncementForm(false);
    } catch (err: any) {
      setAnnError(err?.response?.data?.message || 'Erreur lors de la publication');
    } finally {
      setAnnSending(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch {}
  };

  const loadAllClubsStats = async () => {
    try {
      const res = await api.get<any[]>('/stats/all-clubs');
      setAllClubsStats(res.data);
    } catch (error) {
      console.error('Error loading all clubs stats', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const loadSportifData = async () => {
    try {
      const data = await getSportifStats();
      setSportifStats(data);
    } catch (error) {
      console.error('Error loading sportif stats', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [globalData, catData] = await Promise.all([
        getGlobalStats(),
        getCategoryStats()
      ]);
      setStats(globalData);
      setCategoryStats(catData);
    } catch (error) {
      console.error('Error loading stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl font-semibold text-muted-foreground">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div>
      <ClubBanner />
      <div className="mb-6">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground">Tableau de bord</h1>
      </div>
      
      <div className="space-y-6">

        {/* ── Vue Super Admin globale : tous les clubs ── */}
        {isGlobalView && allClubsStats.length > 0 && (
          <div className="space-y-5">
            {allClubsStats.map((cs: any) => (
              <div key={cs.club.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                {/* En-tête club avec logo */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30">
                  <div className="h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center bg-white shadow-sm border border-border shrink-0">
                    <img src={cs.club.logoUrl || '/G1C.png'} alt={cs.club.name} className="h-9 w-9 object-contain" />
                  </div>
                  <h2 className="font-bold text-foreground text-base">{cs.club.name}</h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg px-4 py-3 border border-blue-100 dark:border-blue-900">
                      <Users size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sportifs</p>
                        <p className="text-xl font-bold text-foreground">{cs.counts.sportifs}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/40 rounded-lg px-4 py-3 border border-green-100 dark:border-green-900">
                      <Shield size={18} className="text-green-600 dark:text-green-400 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Coachs</p>
                        <p className="text-xl font-bold text-foreground">{cs.counts.coaches}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-950/40 rounded-lg px-4 py-3 border border-yellow-100 dark:border-yellow-900">
                      <Award size={18} className="text-yellow-600 dark:text-yellow-400 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Catégories</p>
                        <p className="text-xl font-bold text-foreground">{cs.counts.categories}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-950/40 rounded-lg px-4 py-3 border border-purple-100 dark:border-purple-900">
                      <Calendar size={18} className="text-purple-600 dark:text-purple-400 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Événements à venir</p>
                        <p className="text-xl font-bold text-foreground">{cs.counts.upcomingTrainings}</p>
                      </div>
                    </div>
                  </div>
                  {/* Prochains événements */}
                  {cs.nextTrainings.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Calendar size={12} /> Prochains événements
                      </p>
                      <div className="space-y-1.5">
                        {cs.nextTrainings.map((t: any) => (
                          <div key={t.id} className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-muted/40">
                            <div className="bg-muted rounded-md p-1.5 text-center min-w-[38px] shrink-0">
                              <div className="font-bold text-xs leading-none">{new Date(t.date).getDate()}</div>
                              <div className="text-[10px] uppercase text-muted-foreground">{new Date(t.date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-foreground">{t.category?.name}</span>
                              <span className="text-muted-foreground"> · {t.type}</span>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(t.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Overview for Admin/Coach */}
        {(user?.role === 'ADMIN' || user?.role === 'COACH') && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Sportifs */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(37,99,235,0.15) 60%, rgba(99,179,237,0.25) 100%)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99,179,237,0.3)',
            }} className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #60a5fa, transparent)', transform: 'translate(30%, -30%)' }} />
              <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(99,179,237,0.3)' }}>
                <Users className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.counts.sportifs}</p>
                <p className="text-xs font-medium text-blue-200/70 mt-0.5">Sportifs</p>
              </div>
            </div>
            {/* Coachs */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.15) 60%, rgba(52,211,153,0.25) 100%)',
              boxShadow: '0 8px 32px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(52,211,153,0.3)',
            }} className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #34d399, transparent)', transform: 'translate(30%, -30%)' }} />
              <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(52,211,153,0.3)' }}>
                <Shield className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.counts.coaches}</p>
                <p className="text-xs font-medium text-emerald-200/70 mt-0.5">Coachs</p>
              </div>
            </div>
            {/* Événements */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(109,40,217,0.15) 60%, rgba(167,139,250,0.25) 100%)',
              boxShadow: '0 8px 32px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(167,139,250,0.3)',
            }} className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #a78bfa, transparent)', transform: 'translate(30%, -30%)' }} />
              <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.25)', border: '1px solid rgba(167,139,250,0.3)' }}>
                <Activity className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.counts.trainings}</p>
                <p className="text-xs font-medium text-violet-200/70 mt-0.5">Événements</p>
              </div>
            </div>
            {/* Catégories */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.15) 60%, rgba(252,211,77,0.25) 100%)',
              boxShadow: '0 8px 32px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(252,211,77,0.3)',
            }} className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fcd34d, transparent)', transform: 'translate(30%, -30%)' }} />
              <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.25)', border: '1px solid rgba(252,211,77,0.3)' }}>
                <Award className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.counts.categories}</p>
                <p className="text-xs font-medium text-amber-200/70 mt-0.5">Catégories</p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Metrics Section for Admin/Coach */}
        {(user?.role === 'ADMIN' || user?.role === 'COACH') && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Attendance Rate */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,179,237,0.15) 0%, rgba(59,130,246,0.08) 100%)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99,179,237,0.2)',
            }} className="p-6 rounded-2xl">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground/80">
                   <Activity className="h-4 w-4 text-blue-400"/> Taux de Présence (30j)
                </h3>
                <div className="flex flex-col items-center justify-center py-4">
                    <div className="text-6xl font-bold text-blue-400 mb-2">{stats.attendanceRate}%</div>
                    <p className="text-xs text-muted-foreground text-center">Moyenne sur le dernier mois</p>
                </div>
            </div>

            {/* Upcoming Trainings */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.08) 100%)',
              boxShadow: '0 8px 32px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(167,139,250,0.2)',
            }} className="p-6 rounded-2xl">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground/80">
                   <Calendar className="h-4 w-4 text-violet-400"/> Prochains Événements
                </h3>
                <div className="space-y-2">
                   {stats.nextTrainings && stats.nextTrainings.length > 0 ? stats.nextTrainings.map((t: any) => (
                       <div key={t.id} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                           <div className="rounded-lg p-1.5 text-center min-w-[38px] shrink-0" style={{ background: 'rgba(139,92,246,0.2)' }}>
                               <div className="font-bold text-xs leading-none text-violet-300">{new Date(t.date).getDate()}</div>
                               <div className="text-[10px] uppercase text-violet-300/60">{new Date(t.date).toLocaleDateString('fr-FR', {month: 'short'})}</div>
                           </div>
                           <div>
                               <div className="font-medium text-foreground text-xs">{t.category?.name} · {t.type}</div>
                               <div className="text-[10px] text-muted-foreground">
                                   {new Date(t.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                   {t.location && <span> · 📍 {t.location}</span>}
                               </div>
                           </div>
                       </div>
                   )) : <p className="text-sm text-muted-foreground py-6 text-center">Aucun événement à venir.</p>}
                </div>
            </div>

            {/* Recent Results */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.08) 100%)',
              boxShadow: '0 8px 32px rgba(245,158,11,0.1), inset 0 1px 0 rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(252,211,77,0.2)',
            }} className="p-6 rounded-2xl">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground/80">
                   <Trophy className="h-4 w-4 text-amber-400"/> Derniers Résultats
                </h3>
                <div className="space-y-2">
                   {stats.recentMatches && stats.recentMatches.length > 0 ? stats.recentMatches.slice(0, 3).map((m: any) => (
                       <div key={m.id} className="flex justify-between items-center rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                           <div>
                               <div className="font-medium text-foreground text-xs">{m.category?.name} vs {m.opponent}</div>
                               <div className="text-[10px] text-muted-foreground">{new Date(m.date).toLocaleDateString('fr-FR')}</div>
                           </div>
                           <div className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                                m.result?.toLowerCase().includes('gagné') || m.result?.toLowerCase().includes('victoire') ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                m.result?.toLowerCase().includes('perdu') || m.result?.toLowerCase().includes('défaite') ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                'bg-white/10 text-white/60 border border-white/10'
                           }`}>
                               {m.result}
                           </div>
                       </div>
                   )) : <p className="text-sm text-muted-foreground py-4 text-center">Aucun résultat récent.</p>}
                </div>
            </div>
          </div>
        )}

        {/* ── Graphique activité mensuelle + Stats par catégorie ── */}
        {(user?.role === 'ADMIN' || user?.role === 'COACH') && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activité mensuelle */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99,179,237,0.15)',
            }} className="p-6 rounded-2xl">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground/80">
                <TrendingUp className="h-4 w-4 text-blue-400" /> Activité mensuelle (6 mois)
              </h3>
              {stats.activityData && stats.activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.activityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'currentColor' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Bar dataKey="count" name="Événements" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Aucune activité enregistrée.</p>
              )}
            </div>

            {/* Sportifs par catégorie */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(139,92,246,0.08) 100%)',
              boxShadow: '0 8px 32px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(52,211,153,0.15)',
            }} className="p-6 rounded-2xl">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground/80">
                <Users className="h-4 w-4 text-emerald-400" /> Sportifs par catégorie
              </h3>
              {categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'currentColor' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="sportifs" name="Sportifs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="trainings" name="Événements" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Aucune catégorie créée.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Vue SPORTIF ── */}
        {user?.role === 'SPORTIF' && sportifStats && (
          <div className="space-y-6">
            {/* Catégorie */}
            {sportifStats.sportif?.category && (
              <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-xl px-5 py-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Award size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Votre catégorie</p>
                  <p className="font-semibold text-foreground">{sportifStats.sportif.category.name}</p>
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-3 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <Activity size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Présence (30j)</p>
                  <p className="text-2xl font-bold text-foreground">{sportifStats.attendance.recent}%</p>
                </div>
              </div>
              <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-3 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Séances</p>
                  <p className="text-2xl font-bold text-foreground">
                    {sportifStats.attendance.presentSessions}
                    <span className="text-sm font-normal text-muted-foreground">/{sportifStats.attendance.totalSessions}</span>
                  </p>
                </div>
              </div>
              <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-3 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center shrink-0">
                  <Trophy size={18} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Matchs joués</p>
                  <p className="text-2xl font-bold text-foreground">{sportifStats.matchParticipations}</p>
                </div>
              </div>
              <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-3 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                  <Award size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Évaluations</p>
                  <p className="text-2xl font-bold text-foreground">{sportifStats.recentEvaluations.length}</p>
                </div>
              </div>
            </div>

            {/* Prochains événements + taux présence global */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prochains événements */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Calendar size={16} className="text-primary" /> Prochains événements
                  </h3>
                  <Link to="/sportif/events" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                    Voir tout <ChevronRight size={13} />
                  </Link>
                </div>
                <div className="divide-y divide-border">
                  {sportifStats.nextTrainings.length > 0 ? sportifStats.nextTrainings.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="bg-muted rounded-md p-1.5 text-center min-w-[38px] shrink-0">
                        <div className="font-bold text-xs leading-none">{new Date(t.date).getDate()}</div>
                        <div className="text-[10px] uppercase text-muted-foreground">{new Date(t.date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{t.type}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(t.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {t.location && <span> · 📍 {t.location}</span>}
                          {t.opponent && <span> · 🆚 {t.opponent}</span>}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="px-5 py-6 text-sm text-muted-foreground text-center">Aucun événement à venir.</p>
                  )}
                </div>
              </div>

              {/* Taux de présence global */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col justify-center items-center gap-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 self-start">
                  <Activity size={16} className="text-primary" /> Assiduité globale
                </h3>
                <div className="flex flex-col items-center gap-1 py-4">
                  <span className="text-6xl font-bold text-primary">{sportifStats.attendance.global}%</span>
                  <p className="text-xs text-muted-foreground text-center">
                    {sportifStats.attendance.presentSessions} présences sur {sportifStats.attendance.totalSessions} séances
                  </p>
                </div>
                {/* Barre de progression */}
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all"
                    style={{ width: `${sportifStats.attendance.global}%` }}
                  />
                </div>
                <Link to="/sportif" className="mt-2 text-xs text-primary hover:underline flex items-center gap-1">
                  Voir mon tableau de bord complet <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Nouvelle Annonce ── */}
        {showAnnouncementForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-lg p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Megaphone size={16} className="text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Nouvelle annonce</h3>
                </div>
                <button
                  onClick={() => { setShowAnnouncementForm(false); setAnnError(''); setAnnTitle(''); setAnnContent(''); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                {annError && (
                  <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {annError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Titre</label>
                  <input
                    type="text"
                    placeholder="Titre de l'annonce…"
                    value={annTitle}
                    onChange={e => { setAnnTitle(e.target.value); setAnnError(''); }}
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Message</label>
                  <textarea
                    placeholder="Contenu du message…"
                    value={annContent}
                    onChange={e => { setAnnContent(e.target.value); setAnnError(''); }}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowAnnouncementForm(false); setAnnError(''); setAnnTitle(''); setAnnContent(''); }}
                    className="px-4 py-2 text-sm border border-input rounded-lg text-foreground hover:bg-muted"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!annTitle.trim() || !annContent.trim() || annSending}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <Megaphone size={13} />
                    {annSending ? 'Envoi…' : 'Publier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Annonces du Club ── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Megaphone size={18} className="text-primary" />
              Annonces du club
            </h3>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setShowAnnouncementForm(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus size={13} />
                Nouvelle annonce
              </button>
            )}
          </div>

          {/* Liste des annonces */}
          <div className="divide-y divide-border">
            {announcements.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">Aucune annonce pour le moment.</p>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className="px-5 py-4 flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Megaphone size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground">{ann.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(ann.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded"
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{ann.content}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1.5">Par {ann.author.name}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Club Social Media */}
        {SOCIAL_LINKS.some(({ key }) => !!(club as any)[key]) && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Retrouvez-nous sur</h3>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_LINKS.filter(({ key }) => !!(club as any)[key]).map(({ key, label, Icon, color }) => (
                <a
                  key={key}
                  href={(club as any)[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium ${color}`}
                >
                  <Icon size={16} />
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
