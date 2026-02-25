import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sportif, getSportifById } from '../../services/sportifService';
import { Annotation, getAnnotations, createAnnotation, deleteAnnotation } from '../../services/annotationService';
import { Evaluation, getEvaluations, createEvaluation, updateEvaluation, deleteEvaluation } from '../../services/evaluationService';
import { Team, getTeamsByCategory, assignSportifToTeam } from '../../services/teamService';
import { User, Calendar, Ruler, Weight, Plus, Trash2, CheckCircle, XCircle, Save, TrendingUp, Shield, Camera, Edit2 } from 'lucide-react';
import api from '../../lib/axios';
import { useRefresh } from '../../context/RefreshContext';
import { useCoachCategories } from '../../hooks/useCoachCategories';
import { useAuth } from '../../hooks/useAuth';

interface AttendanceEntry {
  id: string;
  present: boolean;
  reason?: string;
  training: {
    id: string;
    date: string;
    type: string;
    location?: string;
    opponent?: string;
    duration: number;
  };
}

const TYPE_COLORS: Record<string, string> = {
  Match:        'bg-red-500/10 text-red-400 border-red-500/20',
  Tournoi:      'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Stage:        'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Entraînement: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const SportifDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invalidateAttendance } = useRefresh();
  const { canEdit } = useCoachCategories();
  const { user } = useAuth();

  const [sportif, setSportif] = useState<Sportif | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [attendances, setAttendances] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'presences' | 'annotations' | 'evaluations'>('overview');

  // Team assignment
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [savingTeam, setSavingTeam] = useState(false);

  // Attendance editing
  const [editedAttendances, setEditedAttendances] = useState<Record<string, { present: boolean; reason?: string }>>({});
  const [savingAttendance, setSavingAttendance] = useState<string | null>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent'>('all');

  // Annotation Form
  const [newAnnotation, setNewAnnotation] = useState({ content: '', type: 'TECHNIQUE' });
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [isSubmittingAnnotation, setIsSubmittingAnnotation] = useState(false);

  // Evaluation Form
  const defaultScores = { technique: 5, endurance: 5, vitesse: 5, mental: 5 };
  const [evalComment, setEvalComment] = useState('');
  const [evalScores, setEvalScores] = useState({ ...defaultScores });
  const [evalTrainingId, setEvalTrainingId] = useState<string>('');
  const [sportifEvents, setSportifEvents] = useState<{ id: string; date: string; type: string; opponent?: string | null }[]>([]);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);

  // Photo upload
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    if (file.size > 3 * 1024 * 1024) { alert('Image trop lourde (max 3 Mo)'); return; }
    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const photoUrl = reader.result as string;
        await api.put(`/sportifs/${id}`, { photoUrl });
        setSportif(prev => prev ? { ...prev, photoUrl } : prev);
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (sportifId: string) => {
    try {
      const [sportifData, annotationsData, evaluationsData] = await Promise.all([
        getSportifById(sportifId),
        getAnnotations(sportifId),
        getEvaluations(sportifId),
      ]);
      setSportif(sportifData);
      setAnnotations(annotationsData);
      setEvaluations(evaluationsData);
      const raw: AttendanceEntry[] = (sportifData as any).attendances ?? [];
      setAttendances(raw);
      const init: Record<string, { present: boolean; reason?: string }> = {};
      raw.forEach(a => { init[a.id] = { present: a.present, reason: a.reason }; });
      setEditedAttendances(init);
      // Load teams and events for this sportif's category
      const catId = sportifData.categoryId;
      if (catId) {
        const teamsData = await getTeamsByCategory(catId);
        setTeams(teamsData);
        const assignedTeam = teamsData.find(t => t.sportifs.some(s => s.id === sportifId));
        setCurrentTeamId(assignedTeam?.id ?? null);
        // Load Match/Tournoi events for the evaluation form
        try {
          const eventsRes = await api.get('/trainings', { params: { categoryId: catId } });
          const events = (eventsRes.data as any[]).filter(t => t.type === 'Match' || t.type === 'Tournoi');
          setSportifEvents(events.map(t => ({ id: t.id, date: t.date, type: t.type, opponent: t.opponent })));
        } catch {}
      }
    } catch (error) {
      console.error('Error loading sportif details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamChange = async (teamId: string | null) => {
    if (!id || savingTeam) return;
    setSavingTeam(true);
    try {
      await assignSportifToTeam(id, teamId);
      setCurrentTeamId(teamId);
      // Refresh teams list
      if (sportif?.categoryId) {
        const teamsData = await getTeamsByCategory(sportif.categoryId);
        setTeams(teamsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTeam(false);
    }
  };

  const togglePresence = (attId: string) => {
    setEditedAttendances(prev => ({
      ...prev,
      [attId]: { ...prev[attId], present: !prev[attId]?.present },
    }));
  };

  const setReason = (attId: string, reason: string) => {
    setEditedAttendances(prev => ({ ...prev, [attId]: { ...prev[attId], reason } }));
  };

  const saveAttendance = async (att: AttendanceEntry) => {
    setSavingAttendance(att.id);
    try {
      const edited = editedAttendances[att.id];
      await api.put(`/trainings/${att.training.id}/attendance`, {
        attendances: [{ id: att.id, sportifId: id, present: edited.present, reason: edited.reason }],
      });
      setAttendances(prev => prev.map(a => a.id === att.id ? { ...a, present: edited.present, reason: edited.reason } : a));
      invalidateAttendance();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAttendance(null);
    }
  };

  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (isSubmittingAnnotation) return;
    
    setIsSubmittingAnnotation(true);
    try {
      await createAnnotation({
        content: newAnnotation.content,
        type: newAnnotation.type as any,
        sportifId: id
      });
      setNewAnnotation({ content: '', type: 'TECHNIQUE' });
      setIsAnnotationModalOpen(false);
      const updatedAnnotations = await getAnnotations(id);
      setAnnotations(updatedAnnotations);
    } catch (error) {
      console.error('Error adding annotation', error);
    } finally {
      setIsSubmittingAnnotation(false);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (window.confirm('Supprimer cette annotation ?')) {
      try {
        await deleteAnnotation(annotationId);
        setAnnotations(annotations.filter(a => a.id !== annotationId));
      } catch (error) {
        console.error('Error deleting annotation', error);
      }
    }
  };

  const openEditEvaluation = (evaluation: Evaluation) => {
    let scores = { ...defaultScores };
    try {
      const parsed = JSON.parse(evaluation.ratings);
      if (parsed && typeof parsed === 'object') scores = { ...defaultScores, ...parsed };
    } catch {}
    setEvalScores(scores);
    setEvalComment(evaluation.comment || '');
    setEvalTrainingId(evaluation.trainingId || '');
    setEditingEvaluation(evaluation);
    setIsEvaluationModalOpen(true);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || isSubmittingEvaluation) return;
    setIsSubmittingEvaluation(true);
    try {
      const trainingIdPayload = evalTrainingId || null;
      if (editingEvaluation) {
        await updateEvaluation(editingEvaluation.id, { ratings: evalScores, comment: evalComment, trainingId: trainingIdPayload });
      } else {
        await createEvaluation({ type: 'GLOBAL' as any, comment: evalComment, ratings: evalScores as any, sportifId: id, trainingId: trainingIdPayload } as any);
      }
      setEvalScores({ ...defaultScores });
      setEvalComment('');
      setEvalTrainingId('');
      setEditingEvaluation(null);
      setIsEvaluationModalOpen(false);
      setEvaluations(await getEvaluations(id));
    } catch (err) {
      console.error(err);
      alert('Échec de l\'enregistrement.');
    } finally {
      setIsSubmittingEvaluation(false);
    }
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
      if (window.confirm('Supprimer cette évaluation ?')) {
          try {
              await deleteEvaluation(evaluationId);
              setEvaluations(evaluations.filter(e => e.id !== evaluationId));
          } catch (error) {
              console.error('Error deleting evaluation', error);
          }
      }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!sportif) return <div className="text-center py-16 text-muted-foreground">Sportif non trouvé</div>;

  const totalSessions = attendances.length;
  const presentSessions = attendances.filter(a => (editedAttendances[a.id]?.present ?? a.present)).length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  const filteredAttendances = attendances.filter(a => {
    const p = editedAttendances[a.id]?.present ?? a.present;
    if (attendanceFilter === 'present') return p;
    if (attendanceFilter === 'absent') return !p;
    return true;
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/coach/sportifs${sportif.categoryId ? `?category=${sportif.categoryId}` : ''}`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Retour à la catégorie {sportif.category?.name}
      </button>

      {/* Header / Profile Card */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar with optional photo upload */}
          <div className="relative flex-shrink-0 group">
            <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
              {sportif.photoUrl ? (
                <img src={sportif.photoUrl} alt={`${sportif.firstName} ${sportif.lastName}`} className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            {canEdit(sportif.categoryId) && (
              <>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Changer la photo"
                >
                  {uploadingPhoto ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold text-foreground">{sportif.firstName} {sportif.lastName}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {sportif.category?.name}
              </span>
              {sportif.position && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  {sportif.position}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(sportif.birthDate).toLocaleDateString('fr-FR')}</span>
              {sportif.height && <span className="flex items-center gap-1.5"><Ruler className="w-4 h-4" /> {sportif.height} cm</span>}
              {sportif.weight && <span className="flex items-center gap-1.5"><Weight className="w-4 h-4" /> {sportif.weight} kg</span>}
            </div>

            {/* Team assignment */}
            {teams.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Shield size={14} className="text-amber-500 shrink-0" />
                <span className="text-sm text-muted-foreground">Équipe :</span>
                {canEdit(sportif.categoryId) ? (
                  <select
                    value={currentTeamId ?? ''}
                    onChange={e => handleTeamChange(e.target.value || null)}
                    disabled={savingTeam}
                    className="text-sm rounded-md border border-input bg-background text-foreground px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="">— Sans équipe —</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {teams.find(t => t.id === currentTeamId)?.name ?? '—'}
                  </span>
                )}
                {savingTeam && <span className="text-xs text-muted-foreground animate-pulse">Enregistrement…</span>}
              </div>
            )}
          </div>
          {/* KPI présences */}
          <div className="shrink-0 text-center bg-muted/30 rounded-xl px-6 py-4 border border-border">
            <div className="text-3xl font-bold text-primary">{attendanceRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">Taux de présence</div>
            <div className="text-xs text-muted-foreground">{presentSessions}/{totalSessions} séances</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6">
          {([
            { key: 'overview',    label: 'Vue d\'ensemble' },
            { key: 'presences',   label: `Présences (${totalSessions})` },
            { key: 'annotations', label: `Annotations (${annotations.length})` },
            { key: 'evaluations', label: `Évaluations (${evaluations.length})` },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">

        {/* ===== VUE D'ENSEMBLE ===== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card p-5 rounded-xl border border-border text-center">
              <div className="text-3xl font-bold text-green-400">{presentSessions}</div>
              <div className="text-sm text-muted-foreground mt-1">Présences</div>
            </div>
            <div className="bg-card p-5 rounded-xl border border-border text-center">
              <div className="text-3xl font-bold text-red-400">{totalSessions - presentSessions}</div>
              <div className="text-sm text-muted-foreground mt-1">Absences</div>
            </div>
            <div className="bg-card p-5 rounded-xl border border-border text-center">
              <div className="text-3xl font-bold text-primary">{attendanceRate}%</div>
              <div className="text-sm text-muted-foreground mt-1">Taux de présence</div>
            </div>
            <div className="bg-card p-5 rounded-xl border border-border text-center">
              <div className="text-3xl font-bold text-foreground">{evaluations.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Évaluations</div>
            </div>
            {/* 3 dernières séances */}
            {attendances.length > 0 && (
              <div className="col-span-full bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" /> Dernières séances
                </h3>
                <div className="space-y-2">
                  {attendances.slice(0, 5).map(a => {
                    const isPresent = editedAttendances[a.id]?.present ?? a.present;
                    return (
                      <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[a.training.type] ?? 'bg-muted text-muted-foreground border-border'}`}>
                            {a.training.type}
                          </span>
                          <span className="text-sm text-foreground">{new Date(a.training.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          {a.training.opponent && <span className="text-xs text-muted-foreground">🆚 {a.training.opponent}</span>}
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isPresent ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {isPresent ? 'Présent' : 'Absent'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== PRÉSENCES ===== */}
        {activeTab === 'presences' && (
          <div className="space-y-4">
            {/* Filtres */}
            <div className="flex items-center gap-2">
              {([
                { key: 'all',     label: `Toutes (${attendances.length})` },
                { key: 'present', label: `Présent (${attendances.filter(a => editedAttendances[a.id]?.present ?? a.present).length})` },
                { key: 'absent',  label: `Absent (${attendances.filter(a => !(editedAttendances[a.id]?.present ?? a.present)).length})` },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setAttendanceFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    attendanceFilter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredAttendances.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                Aucune séance enregistrée
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {filteredAttendances.map(att => {
                  const edited = editedAttendances[att.id] ?? { present: att.present, reason: att.reason };
                  const isDirty = edited.present !== att.present || (edited.reason ?? '') !== (att.reason ?? '');
                  return (
                    <div key={att.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                      {/* Toggle */}
                      <button
                        onClick={() => togglePresence(att.id)}
                        className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition-all border-2 ${
                          edited.present
                            ? 'bg-green-500/15 border-green-500 text-green-400 hover:bg-green-500/25'
                            : 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {edited.present ? <CheckCircle size={18} /> : <XCircle size={18} />}
                      </button>

                      {/* Date + type */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="bg-muted rounded-md p-2 text-center min-w-[40px] shrink-0">
                          <div className="font-bold text-sm leading-none">{new Date(att.training.date).getDate()}</div>
                          <div className="text-xs uppercase text-muted-foreground">{new Date(att.training.date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[att.training.type] ?? 'bg-muted text-muted-foreground border-border'}`}>
                              {att.training.type}
                            </span>
                            <span className="text-sm text-foreground">
                              {new Date(att.training.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              {att.training.location && ` · 📍 ${att.training.location}`}
                            </span>
                            {att.training.opponent && <span className="text-xs text-muted-foreground">🆚 {att.training.opponent}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Badge statut */}
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        edited.present
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {edited.present ? 'Présent' : 'Absent'}
                      </span>

                      {/* Motif */}
                      {!edited.present && (
                        <input
                          type="text"
                          placeholder="Motif (optionnel)"
                          value={edited.reason ?? ''}
                          onChange={e => setReason(att.id, e.target.value)}
                          className="w-36 text-xs rounded-md border border-input bg-background text-foreground px-2.5 py-1.5 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}

                      {/* Bouton sauvegarder (visible si modifié) */}
                      {isDirty && (
                        <button
                          onClick={() => saveAttendance(att)}
                          disabled={savingAttendance === att.id}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          <Save size={13} />
                          {savingAttendance === att.id ? '...' : 'Sauvegarder'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'annotations' && (
            <div>
               <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-medium text-foreground">Annotations du Coach</h3>
                   <button 
                      onClick={() => setIsAnnotationModalOpen(true)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
                   >
                       <Plus className="h-4 w-4 mr-1" /> Ajouter une note
                   </button>
               </div>
               
               <div className="space-y-4">
                  {annotations.map(annotation => (
                      <div key={annotation.id} className="bg-card p-4 rounded-lg shadow-sm border border-border">
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 mb-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                      ${annotation.type === 'POINT_FORT' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                        annotation.type === 'POINT_FAIBLE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                        annotation.type === 'RECOMMANDATION' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                                      {annotation.type === 'TECHNIQUE' ? 'Technique' : 
                                       annotation.type === 'POINT_FORT' ? 'Point Fort' : 
                                       annotation.type === 'POINT_FAIBLE' ? 'Point Faible' : 
                                       annotation.type === 'RECOMMANDATION' ? 'Recommandation' : annotation.type}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                      {new Date(annotation.createdAt).toLocaleDateString('fr-FR')}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                      par {annotation.coach?.user.name}
                                  </span>
                              </div>
                              <button onClick={() => handleDeleteAnnotation(annotation.id)} className="text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                              </button>
                          </div>
                          <p className="text-foreground whitespace-pre-wrap">{annotation.content}</p>
                      </div>
                  ))}
                  {annotations.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                          Aucune annotation pour le moment.
                      </div>
                  )}
               </div>
            </div>
        )}

        {activeTab === 'evaluations' && (
            <div>
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-medium text-foreground">Évaluations</h3>
                     {canEdit(sportif.categoryId) && user?.role === 'COACH' && (
                       <button
                          onClick={() => setIsEvaluationModalOpen(true)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
                       >
                           <Plus className="h-4 w-4 mr-1" /> Ajouter une évaluation
                       </button>
                     )}
                 </div>

                 <div className="space-y-4">
                    {evaluations.map(evaluation => {
                        let scores: Record<string, number> = {};
                        try { scores = JSON.parse(evaluation.ratings); } catch {}
                        const scoreEntries = Object.entries(scores).filter(([, v]) => typeof v === 'number');
                        const avg = scoreEntries.length > 0 ? scoreEntries.reduce((s, [, v]) => s + v, 0) / scoreEntries.length : null;
                        const labelMap: Record<string, string> = { technique: 'Technique', endurance: 'Endurance', vitesse: 'Vitesse', mental: 'Mental' };
                        const colorMap: Record<string, string> = { technique: 'bg-blue-500', endurance: 'bg-green-500', vitesse: 'bg-orange-500', mental: 'bg-purple-500' };
                        return (
                          <div key={evaluation.id} className="bg-card p-5 rounded-xl shadow-sm border border-border">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                {avg !== null && (
                                  <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0">
                                    <span className="text-lg font-bold text-primary leading-none">{avg.toFixed(1)}</span>
                                    <span className="text-[10px] text-muted-foreground">/10</span>
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-foreground">Évaluation globale</p>
                                    {(evaluation as any).training && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                        {(evaluation as any).training.type}
                                        {(evaluation as any).training.opponent ? ` · vs ${(evaluation as any).training.opponent}` : ''}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{new Date(evaluation.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                  {evaluation.coach && <p className="text-xs text-muted-foreground">par {evaluation.coach.user.name}</p>}
                                </div>
                              </div>
                              {canEdit(sportif.categoryId) && user?.role === 'COACH' && (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => openEditEvaluation(evaluation)} className="text-muted-foreground hover:text-primary p-1 rounded" title="Modifier">
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => handleDeleteEvaluation(evaluation.id)} className="text-muted-foreground hover:text-destructive p-1 rounded" title="Supprimer">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {scoreEntries.length > 0 && (
                              <div className="space-y-2.5 mb-3">
                                {scoreEntries.map(([key, val]) => (
                                  <div key={key}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-medium text-foreground">{labelMap[key] ?? key}</span>
                                      <span className="text-xs font-bold text-foreground">{val}<span className="text-muted-foreground font-normal">/10</span></span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full transition-all ${colorMap[key] ?? 'bg-primary'}`} style={{ width: `${(val / 10) * 100}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {evaluation.comment && (
                              <p className="text-sm text-muted-foreground italic border-t border-border pt-3 mt-3">"{evaluation.comment}"</p>
                            )}
                          </div>
                        );
                    })}
                    {evaluations.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                            Aucune évaluation pour le moment.
                        </div>
                    )}
                 </div>
            </div>
        )}
      </div>

      {/* Annotation Modal */}
      {isAnnotationModalOpen && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-card rounded-lg shadow-xl p-6 w-full max-w-md border border-border">
            <h3 className="text-lg font-medium leading-6 text-foreground mb-4">Ajouter une annotation</h3>
            <form onSubmit={handleAddAnnotation}>
               <div className="mb-4">
                   <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                   <select 
                      className="block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                      value={newAnnotation.type}
                      onChange={e => setNewAnnotation({...newAnnotation, type: e.target.value})}
                   >
                       <option value="TECHNIQUE">Technique</option>
                       <option value="POINT_FORT">Point Fort</option>
                       <option value="POINT_FAIBLE">Point Faible</option>
                       <option value="RECOMMANDATION">Recommandation</option>
                   </select>
               </div>
               <div className="mb-4">
                   <label className="block text-sm font-medium text-foreground mb-1">Contenu</label>
                   <textarea 
                      required
                      rows={4}
                      className="block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                      value={newAnnotation.content}
                      onChange={e => setNewAnnotation({...newAnnotation, content: e.target.value})}
                   />
               </div>
               <div className="flex justify-end gap-3">
                   <button
                     type="button"
                     onClick={() => setIsAnnotationModalOpen(false)}
                     className="px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted"
                     disabled={isSubmittingAnnotation}
                   >
                     Annuler
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                     disabled={isSubmittingAnnotation}
                   >
                     {isSubmittingAnnotation ? 'Enregistrement...' : 'Enregistrer'}
                   </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {isEvaluationModalOpen && (() => {
        const criteria: { key: keyof typeof evalScores; label: string; color: string }[] = [
          { key: 'technique', label: 'Technique', color: '#3b82f6' },
          { key: 'endurance', label: 'Endurance', color: '#22c55e' },
          { key: 'vitesse',   label: 'Vitesse',   color: '#f97316' },
          { key: 'mental',    label: 'Mental',    color: '#a855f7' },
        ];
        const avg = (Object.values(evalScores).reduce((a, b) => a + b, 0) / criteria.length).toFixed(1);
        return (
          <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="relative bg-card rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-1">{editingEvaluation ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}</h3>
              <p className="text-xs text-muted-foreground mb-5">Notez chaque critère de 1 à 10</p>
              <form onSubmit={handleSaveEvaluation}>
                {/* Score global */}
                <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3 mb-5 border border-border">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-primary leading-none">{avg}</span>
                    <span className="text-[10px] text-muted-foreground">/10</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Note globale</p>
                    <p className="text-xs text-muted-foreground">Moyenne des 4 critères</p>
                  </div>
                </div>

                {/* Événement lié */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Événement lié <span className="text-muted-foreground font-normal">(optionnel)</span>
                  </label>
                  <select
                    value={evalTrainingId}
                    onChange={e => setEvalTrainingId(e.target.value)}
                    className="block w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">— Aucun événement —</option>
                    {sportifEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.type}{ev.opponent ? ` · vs ${ev.opponent}` : ''} · {new Date(ev.date).toLocaleDateString('fr-FR')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sliders */}
                <div className="space-y-4 mb-5">
                  {criteria.map(({ key, label, color }) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-sm font-medium text-foreground">{label}</label>
                        <span className="text-sm font-bold" style={{ color }}>{evalScores[key]}<span className="text-xs text-muted-foreground font-normal">/10</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-3">1</span>
                        <input
                          type="range"
                          min={1} max={10} step={1}
                          value={evalScores[key]}
                          onChange={e => setEvalScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                          className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                          style={{ accentColor: color }}
                        />
                        <span className="text-xs text-muted-foreground w-3">10</span>
                      </div>
                      <div className="flex justify-between mt-1 px-5">
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <button key={n} type="button"
                            onClick={() => setEvalScores(prev => ({ ...prev, [key]: n }))}
                            className={`text-[10px] w-5 h-5 rounded-full transition-all ${evalScores[key] === n ? 'font-bold text-white' : 'text-muted-foreground hover:text-foreground'}`}
                            style={evalScores[key] === n ? { backgroundColor: color } : {}}
                          >{n}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Commentaire */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Commentaire <span className="text-muted-foreground font-normal">(optionnel)</span></label>
                  <textarea
                    rows={2}
                    className="block w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Observations, points à travailler..."
                    value={evalComment}
                    onChange={e => setEvalComment(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" disabled={isSubmittingEvaluation}
                    onClick={() => { setIsEvaluationModalOpen(false); setEvalScores({ ...defaultScores }); setEvalComment(''); setEditingEvaluation(null); }}
                    className="px-4 py-2 border border-input rounded-lg text-foreground hover:bg-muted text-sm"
                  >Annuler</button>
                  <button type="submit" disabled={isSubmittingEvaluation}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
                  >{isSubmittingEvaluation ? 'Enregistrement...' : 'Enregistrer'}</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default SportifDetails;
