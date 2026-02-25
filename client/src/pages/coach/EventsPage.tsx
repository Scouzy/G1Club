import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Category, getCategories } from '../../services/categoryService';
import { Training, getTrainings, createTraining, updateTraining, deleteTraining } from '../../services/trainingService';
import { TrainingSchedule, DAY_NAMES, getSchedulesByCategory, createSchedule, deleteSchedule } from '../../services/scheduleService';
import { useCoachCategories } from '../../hooks/useCoachCategories';
import { Plus, Trash2, Pencil, Calendar, Clock, Layers, ChevronLeft, Users, Lock } from 'lucide-react';

type PageView = 'categories' | 'detail';
type DetailTab = 'seances' | 'entrainements' | 'evenements';

const DAYS = [1, 2, 3, 4, 5, 6, 7];

const EventsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { canEdit } = useCoachCategories();
  const [categories, setCategories] = useState<Category[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<PageView>('categories');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('seances');

  // Schedule form
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ dayOfWeek: 1, startTime: '18:00', duration: 90, location: '' });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: '', time: '10:00', duration: 90, type: 'Match', location: '', opponent: '', objectives: '' });
  const [savingEvent, setSavingEvent] = useState(false);

  const now = new Date();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [cats, trains] = await Promise.all([getCategories(), getTrainings()]);
      setCategories(cats);
      setTrainings(trains);
      // Restore category from URL param (coming back from attendance page)
      const returnCatId = searchParams.get('categoryId');
      if (returnCatId) {
        const cat = cats.find(c => c.id === returnCatId);
        if (cat) {
          setSelectedCategory(cat);
          setView('detail');
          setActiveTab('entrainements');
          try {
            const s = await getSchedulesByCategory(cat.id);
            setSchedules(s);
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCategory = async (cat: Category) => {
    setSelectedCategory(cat);
    setView('detail');
    setActiveTab('seances');
    try {
      const s = await getSchedulesByCategory(cat.id);
      setSchedules(s);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBack = () => {
    setView('categories');
    setSelectedCategory(null);
    setSchedules([]);
    setShowScheduleForm(false);
    setShowEventForm(false);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setSavingSchedule(true);
    try {
      const created = await createSchedule({ ...newSchedule, categoryId: selectedCategory.id });
      setSchedules(prev => [...prev, created].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
      setNewSchedule({ dayOfWeek: 1, startTime: '18:00', duration: 90, location: '' });
      setShowScheduleForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setSavingEvent(true);
    try {
      const dateTime = new Date(`${newEvent.date}T${newEvent.time}`);
      await createTraining({
        date: dateTime.toISOString(),
        duration: newEvent.duration,
        type: newEvent.type,
        location: newEvent.location,
        opponent: newEvent.opponent,
        objectives: newEvent.objectives,
        categoryId: selectedCategory.id,
      });
      const trains = await getTrainings();
      setTrainings(trains);
      setNewEvent({ date: '', time: '10:00', duration: 90, type: 'Match', location: '', opponent: '', objectives: '' });
      setShowEventForm(false);
    } catch (e) {
      console.error(e);
      alert('Échec de la création de l\'événement');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string): Promise<void> => {
    await deleteTraining(id);
    setTrainings(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateEvent = async (id: string, data: Partial<Training>): Promise<void> => {
    const updated = await updateTraining(id, data);
    setTrainings(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  };

  if (loading) return <div className="p-6 text-muted-foreground">Chargement...</div>;

  // ── CATEGORY CARDS VIEW ──────────────────────────────────────────────
  if (view === 'categories') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Événements</h1>
        <p className="text-sm text-muted-foreground">Sélectionnez une catégorie pour gérer ses créneaux d'entraînement et ses événements.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {categories.map(cat => {
            const catTrainings = trainings.filter(t => t.categoryId === cat.id);
            const upcomingEvents = catTrainings.filter(t =>
              (t.type === 'Match' || t.type === 'Tournoi') && new Date(t.date) >= now
            ).length;
            const editable = canEdit(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => openCategory(cat)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 bg-card hover:shadow-md transition-all ${
                  editable ? 'border-border hover:shadow-md' : 'border-border/50 opacity-70 hover:opacity-90'
                }`}
                style={editable && cat.color ? { borderColor: cat.color + '55' } : undefined}
              >
                {!editable && (
                  <span className="absolute top-2 right-2">
                    <Lock size={11} className="text-muted-foreground" />
                  </span>
                )}
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: (cat.color || '#3b82f6') + '22', color: cat.color || '#3b82f6' }}
                >
                  <Layers size={20} />
                </div>
                <span className="text-sm font-bold text-foreground">{cat.name}</span>
                <span className="text-xs text-muted-foreground mt-1">{catTrainings.length} séance{catTrainings.length > 1 ? 's' : ''}</span>
                {upcomingEvents > 0 && (
                  <span className="text-xs text-orange-500 font-medium mt-0.5">{upcomingEvents} événement{upcomingEvents > 1 ? 's' : ''} à venir</span>
                )}
                {!editable && (
                  <span className="text-xs text-muted-foreground mt-1 italic">Lecture seule</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── CATEGORY DETAIL VIEW ─────────────────────────────────────────────
  const catTrainingsAll = trainings.filter(t => t.categoryId === selectedCategory!.id);
  const catEntrainements = catTrainingsAll.filter(t => t.type === 'Entraînement' || t.type === 'Entrainement');
  const catEvents = catTrainingsAll.filter(t => t.type !== 'Entraînement' && t.type !== 'Entrainement');
  const upcomingEvents = catEvents.filter(t => new Date(t.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pastEvents = catEvents.filter(t => new Date(t.date) < now).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} /> Retour
          </button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: selectedCategory!.color || '#3b82f6' }} />
            Catégorie {selectedCategory!.name}
          </h1>
        </div>
        {activeTab !== 'entrainements' && canEdit(selectedCategory!.id) && (
          <button
            onClick={() => { activeTab === 'seances' ? setShowScheduleForm(true) : setShowEventForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} />
            {activeTab === 'seances' ? 'Ajouter un créneau' : 'Ajouter un événement'}
          </button>
        )}
        {!canEdit(selectedCategory!.id) && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-3 py-2">
            <Lock size={12} /> Lecture seule
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('seances')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'seances' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Calendar size={14} className="inline mr-1.5" />Créneaux
        </button>
        <button
          onClick={() => setActiveTab('entrainements')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'entrainements' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          ⚽ Entraînements ({catEntrainements.length})
        </button>
        <button
          onClick={() => setActiveTab('evenements')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'evenements' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          🏆 Événements ({catEvents.length})
        </button>
      </div>

      {/* ── SÉANCES TAB ── */}
      {activeTab === 'seances' && (
        <div className="space-y-4">
          <div className="bg-muted/20 border border-border rounded-xl p-4 text-sm text-muted-foreground">
            <p>Les créneaux définis s'appliquent <strong className="text-foreground">toute la saison</strong> (Septembre → Juin), hors vacances scolaires.</p>
          </div>

          {/* Add schedule form */}
          {showScheduleForm && (
            <form onSubmit={handleAddSchedule} className="bg-card border border-primary/30 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Nouveau créneau</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Jour</label>
                  <select
                    className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                    value={newSchedule.dayOfWeek}
                    onChange={e => setNewSchedule(p => ({ ...p, dayOfWeek: parseInt(e.target.value) }))}
                  >
                    {DAYS.map(d => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Heure de début</label>
                  <input type="time" required className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                    value={newSchedule.startTime} onChange={e => setNewSchedule(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Durée (min)</label>
                  <input type="number" min={15} max={300} required className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                    value={newSchedule.duration} onChange={e => setNewSchedule(p => ({ ...p, duration: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Lieu</label>
                  <input type="text" className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                    placeholder="Terrain, salle..." value={newSchedule.location} onChange={e => setNewSchedule(p => ({ ...p, location: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowScheduleForm(false)} className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-muted">Annuler</button>
                <button type="submit" disabled={savingSchedule} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {savingSchedule ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          )}

          {/* Schedule list */}
          {schedules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              Aucun créneau défini. Ajoutez les jours et heures d'entraînement de cette catégorie.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map(s => (
                <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/40 transition-colors">
                  <div>
                    <p className="font-semibold text-foreground">{DAY_NAMES[s.dayOfWeek]}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Clock size={13} /> {s.startTime} · {s.duration} min
                    </p>
                    {s.location && <p className="text-xs text-muted-foreground mt-0.5">📍 {s.location}</p>}
                  </div>
                  {canEdit(selectedCategory!.id) && (
                    <button onClick={() => handleDeleteSchedule(s.id)} className="p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-muted">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ENTRAÎNEMENTS TAB ── */}
      {activeTab === 'entrainements' && (
        <EntrainementsTab
          schedules={schedules}
          trainings={catEntrainements}
          categoryId={selectedCategory!.id}
          now={now}
          readOnly={!canEdit(selectedCategory!.id)}
          onSessionCreated={async () => {
            const trains = await getTrainings();
            setTrainings(trains);
          }}
        />
      )}

      {/* ── ÉVÉNEMENTS TAB ── */}
      {activeTab === 'evenements' && (
        <div className="space-y-6">
          {/* Add event form */}
          {showEventForm && (
            <form onSubmit={handleAddEvent} className="bg-card border border-primary/30 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Nouvel événement</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                  <input type="date" required className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                    value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Heure</label>
                  <input type="time" required className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                    value={newEvent.time} onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                  <select className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                    value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))}>
                    <option>Entraînement</option>
                    <option>Match</option>
                    <option>Tournoi</option>
                    <option>Stage</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Durée (min)</label>
                  <input type="number" min={15} className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                    value={newEvent.duration} onChange={e => setNewEvent(p => ({ ...p, duration: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Lieu</label>
                  <input type="text" className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                    value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Adversaire</label>
                  <input type="text" className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                    value={newEvent.opponent} onChange={e => setNewEvent(p => ({ ...p, opponent: e.target.value }))} />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Objectifs</label>
                  <input type="text" className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                    value={newEvent.objectives} onChange={e => setNewEvent(p => ({ ...p, objectives: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowEventForm(false)} className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-muted">Annuler</button>
                <button type="submit" disabled={savingEvent} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {savingEvent ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          )}

          {/* Upcoming events */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">🏆 À venir</h2>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Aucun événement à venir.</div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(t => <EventCard key={t.id} training={t} now={now} onDelete={handleDeleteEvent} onUpdate={handleUpdateEvent} />)}
              </div>
            )}
          </section>

          {/* Past events */}
          {pastEvents.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-muted-foreground mb-3">Événements passés</h2>
              <div className="space-y-3 opacity-70">
                {pastEvents.map(t => <EventCard key={t.id} training={t} now={now} onDelete={handleDeleteEvent} onUpdate={handleUpdateEvent} />)}
              </div>
            </section>
          )}

          {catEvents.length === 0 && !showEventForm && (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              Aucun événement enregistré pour cette catégorie.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── ENTRAÎNEMENTS TAB COMPONENT ─────────────────────────────────────────────
const WEEKS_AHEAD = 6;
const WEEKS_PAST = 4;

function getOccurrences(schedules: TrainingSchedule[], weeksAhead: number, weeksPast: number): { date: Date; schedule: TrainingSchedule }[] {
  const result: { date: Date; schedule: TrainingSchedule }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const s of schedules) {
    // dayOfWeek: 1=Lundi ... 7=Dimanche, JS: 0=Dimanche ... 6=Samedi
    const jsDow = s.dayOfWeek === 7 ? 0 : s.dayOfWeek;
    const start = new Date(today);
    start.setDate(today.getDate() - weeksPast * 7);

    for (let i = 0; i < (weeksAhead + weeksPast) * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d.getDay() === jsDow) {
        const [h, m] = s.startTime.split(':').map(Number);
        d.setHours(h, m, 0, 0);
        result.push({ date: d, schedule: s });
      }
    }
  }

  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

const EntrainementsTab: React.FC<{
  schedules: TrainingSchedule[];
  trainings: Training[];
  categoryId: string;
  now: Date;
  readOnly?: boolean;
  onSessionCreated: () => Promise<void>;
}> = ({ schedules, trainings, categoryId, now, readOnly = false, onSessionCreated }) => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState<string | null>(null); // key = date ISO
  const [confirming, setConfirming] = useState<string | null>(null); // training id
  const [deleting, setDeleting] = useState<string | null>(null); // training id

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
        Aucun créneau défini. Ajoutez d'abord des créneaux dans l'onglet "Créneaux".
      </div>
    );
  }

  const occurrences = getOccurrences(schedules, WEEKS_AHEAD, WEEKS_PAST);

  const findTraining = (occ: { date: Date; schedule: TrainingSchedule }): Training | undefined => {
    return trainings.find(t => {
      const td = new Date(t.date);
      return (
        td.getFullYear() === occ.date.getFullYear() &&
        td.getMonth() === occ.date.getMonth() &&
        td.getDate() === occ.date.getDate() &&
        t.categoryId === categoryId
      );
    });
  };

  const handleDelete = async (trainingId: string) => {
    setDeleting(trainingId);
    try {
      await deleteTraining(trainingId);
      await onSessionCreated();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
      setConfirming(null);
    }
  };

  const handleCreate = async (occ: { date: Date; schedule: TrainingSchedule }) => {
    const key = occ.date.toISOString();
    setCreating(key);
    try {
      await createTraining({
        date: occ.date.toISOString(),
        duration: occ.schedule.duration,
        type: 'Entraînement',
        location: occ.schedule.location,
        categoryId,
      });
      await onSessionCreated();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(null);
    }
  };

  const upcoming = occurrences.filter(o => o.date >= now);
  const past = occurrences.filter(o => o.date < now);

  const renderRow = (occ: { date: Date; schedule: TrainingSchedule }, dimmed = false) => {
    const training = findTraining(occ);
    const key = occ.date.toISOString();
    const isCreating = creating === key;
    const dayName = DAY_NAMES[occ.schedule.dayOfWeek];
    const dateStr = occ.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
      <div key={key} className={`flex items-center justify-between bg-card border rounded-xl px-4 py-3 transition-all ${
        dimmed ? 'opacity-60 border-border' : training ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-primary/30'
      }`}>
        <div className="flex items-center gap-4">
          <div className="text-center w-12">
            <p className="text-xs text-muted-foreground">{dayName}</p>
            <p className="text-sm font-bold text-foreground">{occ.date.getDate()}</p>
            <p className="text-xs text-muted-foreground">{occ.date.toLocaleDateString('fr-FR', { month: 'short' })}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {occ.schedule.startTime} · {occ.schedule.duration} min
              {occ.schedule.location && <span className="text-muted-foreground"> · 📍 {occ.schedule.location}</span>}
            </p>
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {training ? (
            !readOnly && confirming === training.id ? (
              <>
                <span className="text-xs text-muted-foreground">Annuler la séance ?</span>
                <button
                  onClick={() => handleDelete(training.id)}
                  disabled={deleting === training.id}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                >
                  {deleting === training.id ? '...' : 'Supprimer'}
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  disabled={deleting === training.id}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  Non
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate(`/coach/trainings/${training.id}/attendance?categoryId=${categoryId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <Users size={13} /> Présences
                </button>
                {!readOnly && (
                  <button
                    onClick={() => setConfirming(training.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition-colors"
                    title="Supprimer la séance"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </>
            )
          ) : (
            !readOnly ? (
              <button
                onClick={() => handleCreate(occ)}
                disabled={isCreating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
              >
                <Plus size={13} /> {isCreating ? '...' : 'Créer la séance'}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground italic">Non planifiée</span>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">⚽ À venir ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Aucune séance à venir.</div>
        ) : (
          <div className="space-y-2">{upcoming.map(o => renderRow(o))}</div>
        )}
      </section>
      {past.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-muted-foreground mb-3">Séances passées ({past.length})</h2>
          <div className="space-y-2">{past.map(o => renderRow(o, true))}</div>
        </section>
      )}
    </div>
  );
};

const EventCard: React.FC<{
  training: Training;
  now: Date;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, data: Partial<Training>) => Promise<void>;
}> = ({ training, now, onDelete, onUpdate }) => {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dateObj = new Date(training.date);
  const [form, setForm] = useState({
    date: dateObj.toISOString().slice(0, 10),
    time: dateObj.toTimeString().slice(0, 5),
    duration: training.duration,
    type: training.type,
    location: training.location || '',
    opponent: training.opponent || '',
    result: training.result || '',
    objectives: training.objectives || '',
  });

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await onDelete(training.id);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de la suppression');
      setConfirming(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const dateTime = new Date(`${form.date}T${form.time}`);
      await onUpdate(training.id, {
        date: dateTime.toISOString(),
        duration: form.duration,
        type: form.type,
        location: form.location,
        opponent: form.opponent,
        result: form.result,
        objectives: form.objectives,
      });
      setEditing(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <form onSubmit={handleSave} className="bg-card rounded-xl border border-primary/40 p-5 space-y-4">
        <h3 className="font-semibold text-foreground text-sm">Modifier l'événement</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
            <input type="date" required className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
              value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Heure</label>
            <input type="time" required className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
              value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
            <select className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
              value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option>Match</option>
              <option>Tournoi</option>
              <option>Stage</option>
              <option>Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Durée (min)</label>
            <input type="number" min={15} className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
              value={form.duration} onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Lieu</label>
            <input type="text" className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
              value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Adversaire</label>
            <input type="text" className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
              value={form.opponent} onChange={e => setForm(p => ({ ...p, opponent: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Résultat</label>
            <input type="text" placeholder="Ex: 3-1" className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
              value={form.result} onChange={e => setForm(p => ({ ...p, result: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Objectifs</label>
            <input type="text" className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
              value={form.objectives} onChange={e => setForm(p => ({ ...p, objectives: e.target.value }))} />
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setEditing(false)} disabled={saving}
            className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary/40 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
            ${training.type === 'Match' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
              training.type === 'Tournoi' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
              training.type === 'Stage' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
            {training.type}
          </span>
          {new Date(training.date) >= now && <span className="text-xs text-primary font-medium">À venir</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-foreground">
          <span className="flex items-center gap-1">
            <Calendar size={13} className="text-muted-foreground" />
            {new Date(training.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} className="text-muted-foreground" />
            {new Date(training.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ({training.duration} min)
          </span>
        </div>
        {training.location && <p className="text-muted-foreground text-sm mt-1">📍 {training.location}</p>}
        {training.opponent && <p className="text-muted-foreground text-sm mt-1">🆚 vs <span className="font-medium text-foreground">{training.opponent}</span></p>}
        {training.result && <p className="text-sm mt-1 font-semibold text-primary">🏆 {training.result}</p>}
        {training.objectives && <p className="text-muted-foreground text-sm mt-1">Objectif : {training.objectives}</p>}
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {confirming ? (
          <>
            <span className="text-xs text-muted-foreground">Supprimer ?</span>
            <button onClick={handleConfirmDelete} disabled={deleting}
              className="px-3 py-1 text-xs rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium disabled:opacity-50">
              {deleting ? '...' : 'Oui'}
            </button>
            <button onClick={() => setConfirming(false)} disabled={deleting}
              className="px-3 py-1 text-xs rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50">
              Non
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate(`/coach/trainings/${training.id}/attendance?categoryId=${training.categoryId}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <Users size={13} /> Présences
            </button>
            <button onClick={() => setEditing(true)}
              className="p-2 text-muted-foreground hover:text-primary rounded-full hover:bg-muted">
              <Pencil size={16} />
            </button>
            <button onClick={() => setConfirming(true)}
              className="p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-muted">
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
