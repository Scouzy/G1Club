import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/axios';
import { useRefresh } from '../../context/RefreshContext';
import { ChevronLeft, CheckCircle, XCircle, Clock, MapPin, Users, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AttendanceRecord {
  id: string;
  present: boolean;
  reason?: string;
  sportifId: string;
  sportif: {
    id: string;
    firstName: string;
    lastName: string;
    position?: string;
  };
}

interface Training {
  id: string;
  date: string;
  duration: number;
  type: string;
  location?: string;
  opponent?: string;
  category: { name: string };
  attendances: AttendanceRecord[];
}

const AttendancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { invalidateAttendance } = useRefresh();
  const categoryId = searchParams.get('categoryId');
  const [training, setTraining] = useState<Training | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/trainings/${id}`)
      .then(res => {
        setTraining(res.data);
        setAttendances(res.data.attendances ?? []);
      })
      .catch(() => setError('Impossible de charger la séance'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggle = (sportifId: string) => {
    setAttendances(prev =>
      prev.map(a => a.sportifId === sportifId ? { ...a, present: !a.present } : a)
    );
    setSaved(false);
  };

  const setReason = (sportifId: string, reason: string) => {
    setAttendances(prev =>
      prev.map(a => a.sportifId === sportifId ? { ...a, reason } : a)
    );
    setSaved(false);
  };

  const markAll = (present: boolean) => {
    setAttendances(prev => prev.map(a => ({ ...a, present })));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/trainings/${id}/attendance`, {
        attendances: attendances.map(a => ({
          id: a.id,
          sportifId: a.sportifId,
          present: a.present,
          reason: a.reason,
        }))
      });
      setSaved(true);
      invalidateAttendance();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = attendances.filter(a => a.present).length;
  const total = attendances.length;
  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!training) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>{error || 'Séance introuvable'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(categoryId ? `/coach/events?categoryId=${categoryId}` : '/coach/events')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} /> Retour
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feuille de présence</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: (training.category as any).color || '#3b82f6' }} />
            {training.category.name} · {training.type}
          </p>
        </div>
      </div>

      {/* Séance info */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock size={15} className="text-primary" />
          <span className="font-medium text-foreground">
            {format(parseISO(training.date), 'EEEE dd MMMM yyyy', { locale: fr })}
          </span>
          <span>· {format(parseISO(training.date), 'HH:mm')} ({training.duration} min)</span>
        </div>
        {training.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={15} className="text-primary" />
            <span>{training.location}</span>
          </div>
        )}
        {training.opponent && (
          <div className="text-sm text-muted-foreground">
            🆚 <span className="font-medium text-foreground">{training.opponent}</span>
          </div>
        )}
      </div>

      {/* KPI + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{total} sportif{total > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-sm font-semibold text-green-400">{presentCount} présent{presentCount > 1 ? 's' : ''}</span>
          </div>
          <div className="text-2xl font-bold text-primary">{rate}%</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => markAll(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
          >
            Tous présents
          </button>
          <button
            onClick={() => markAll(false)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Tous absents
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Save size={15} />
            {saving ? 'Enregistrement...' : saved ? '✅ Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Liste des sportifs */}
      {attendances.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucun sportif dans cette catégorie</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {[...attendances]
            .sort((a, b) => a.sportif.lastName.localeCompare(b.sportif.lastName))
            .map(att => (
              <div key={att.sportifId} className="flex items-center gap-4 px-5 py-4">
                {/* Toggle présence */}
                <button
                  onClick={() => toggle(att.sportifId)}
                  className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-all border-2 ${
                    att.present
                      ? 'bg-green-500/15 border-green-500 text-green-400 hover:bg-green-500/25'
                      : 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  {att.present
                    ? <CheckCircle size={20} />
                    : <XCircle size={20} />}
                </button>

                {/* Nom */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    {att.sportif.lastName} {att.sportif.firstName}
                  </p>
                  {att.sportif.position && (
                    <p className="text-xs text-muted-foreground">{att.sportif.position}</p>
                  )}
                </div>

                {/* Badge statut */}
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  att.present
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {att.present ? 'Présent' : 'Absent'}
                </span>

                {/* Motif d'absence */}
                {!att.present && (
                  <input
                    type="text"
                    placeholder="Motif (optionnel)"
                    value={att.reason ?? ''}
                    onChange={e => setReason(att.sportifId, e.target.value)}
                    className="w-40 text-xs rounded-md border border-input bg-background text-foreground px-2.5 py-1.5 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>
            ))}
        </div>
      )}

      {/* Bouton save bas de page */}
      {attendances.length > 0 && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Save size={15} />
            {saving ? 'Enregistrement...' : saved ? '✅ Présences enregistrées' : 'Enregistrer les présences'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
