import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Plus, X, Pencil, Trash2, Search, AlertTriangle, CheckCircle, Clock, XCircle, FileText, Wallet, RefreshCw } from 'lucide-react';
import LicencePaymentsPanel from '../../components/LicencePaymentsPanel';

interface Sportif {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  category: { id: string; name: string; color?: string | null };
}

interface Licence {
  id: string;
  number: string;
  type: string;
  status: string;
  startDate: string;
  expiryDate: string;
  federation?: string | null;
  notes?: string | null;
  totalAmount?: number | null;
  sportif: Sportif;
}

interface LicenceStats {
  total: number;
  active: number;
  expired: number;
  suspended: number;
  expiringSoon: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE:    { label: 'Active',    color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',    icon: CheckCircle },
  EXPIRED:   { label: 'Expirée',   color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',            icon: XCircle },
  SUSPENDED: { label: 'Suspendue', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', icon: AlertTriangle },
  PENDING:   { label: 'En attente', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',        icon: Clock },
};

const LICENCE_TYPES = ['Compétition', 'Loisir', 'Dirigeant', 'Arbitre'];
const LICENCE_STATUSES = ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'PENDING'];

const emptyForm = {
  sportifId: '',
  number: '',
  type: 'Compétition',
  status: 'ACTIVE',
  startDate: '',
  expiryDate: '',
  federation: '',
  notes: '',
  totalAmount: '',
};

const LicenseManagement: React.FC = () => {
  const [licences, setLicences] = useState<Licence[]>([]);
  const [stats, setStats] = useState<LicenceStats | null>(null);
  const [sportifs, setSportifs] = useState<Sportif[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLicence, setEditingLicence] = useState<Licence | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [paymentsLicence, setPaymentsLicence] = useState<Licence | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [licRes, statsRes, sportifsRes, catsRes] = await Promise.all([
        api.get<Licence[]>('/licences'),
        api.get<LicenceStats>('/licences/stats'),
        api.get<any[]>('/sportifs'),
        api.get<any[]>('/categories'),
      ]);
      setLicences(licRes.data);
      setStats(statsRes.data);
      setSportifs(sportifsRes.data);
      setCategories(catsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingLicence(null);
    setForm({ ...emptyForm });
    setError('');
    setShowModal(true);
  };

  const openRenew = (l: Licence) => {
    setEditingLicence(null);
    const today = new Date();
    const year = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
    const nextSeason = year + 1;
    const newStart = new Date(nextSeason, 8, 1);   // 1er septembre saison N+1
    const newExpiry = new Date(nextSeason + 1, 5, 30); // 30 juin saison N+2
    setForm({
      sportifId: l.sportif.id,
      number: l.number,
      type: l.type,
      status: 'ACTIVE',
      startDate: newStart.toISOString().slice(0, 10),
      expiryDate: newExpiry.toISOString().slice(0, 10),
      federation: l.federation || '',
      notes: l.notes || '',
      totalAmount: l.totalAmount?.toString() ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (l: Licence) => {
    setEditingLicence(l);
    setForm({
      sportifId: l.sportif.id,
      number: l.number,
      type: l.type,
      status: l.status,
      startDate: l.startDate.slice(0, 10),
      expiryDate: l.expiryDate.slice(0, 10),
      federation: l.federation || '',
      notes: l.notes || '',
      totalAmount: l.totalAmount?.toString() ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sportifId || !form.number || !form.startDate || !form.expiryDate) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (editingLicence) {
        const res = await api.put<Licence>(`/licences/${editingLicence.id}`, form);
        setLicences(prev => prev.map(l => l.id === editingLicence.id ? res.data : l));
      } else {
        const res = await api.post<Licence>('/licences', form);
        setLicences(prev => [res.data, ...prev]);
      }
      const statsRes = await api.get<LicenceStats>('/licences/stats');
      setStats(statsRes.data);
      setShowModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/licences/${id}`);
      setLicences(prev => prev.filter(l => l.id !== id));
      const statsRes = await api.get<LicenceStats>('/licences/stats');
      setStats(statsRes.data);
      setDeleteId(null);
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const exp = new Date(expiryDate);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    return exp <= in30 && exp >= new Date();
  };

  const filtered = licences.filter(l => {
    const fullName = `${l.sportif.firstName} ${l.sportif.lastName}`.toLowerCase();
    const matchSearch = !search || fullName.includes(search.toLowerCase()) || l.number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || l.status === filterStatus;
    const matchCat = !filterCategory || l.sportif.category.id === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des licences</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez les licences de tous les sportifs du club</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Nouvelle licence
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <FileText size={16} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Actives</p>
              <p className="text-xl font-bold text-foreground">{stats.active}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <XCircle size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expirées</p>
              <p className="text-xl font-bold text-foreground">{stats.expired}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Suspendues</p>
              <p className="text-xl font-bold text-foreground">{stats.suspended}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
              <Clock size={16} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expirent bientôt</p>
              <p className="text-xl font-bold text-foreground">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom ou numéro…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Tous les statuts</option>
          {LICENCE_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Sportif</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Catégorie</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">N° Licence</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Type</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Statut</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Début</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Expiration</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Fédération</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-muted-foreground">
                    Aucune licence trouvée.
                  </td>
                </tr>
              ) : filtered.map(l => {
                const sc = STATUS_CONFIG[l.status] ?? STATUS_CONFIG.ACTIVE;
                const StatusIcon = sc.icon;
                const expiring = isExpiringSoon(l.expiryDate) && l.status === 'ACTIVE';
                return (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                          {l.sportif.firstName[0]}{l.sportif.lastName[0]}
                        </div>
                        <span className="font-medium text-foreground">{l.sportif.firstName} {l.sportif.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={l.sportif.category.color
                          ? { backgroundColor: `${l.sportif.category.color}20`, color: l.sportif.category.color }
                          : {}}
                      >
                        {l.sportif.category.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-foreground">{l.number}</td>
                    <td className="px-5 py-3 text-foreground">{l.type}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.color}`}>
                        <StatusIcon size={11} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(l.startDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3">
                      <span className={expiring ? 'text-orange-500 font-semibold' : 'text-muted-foreground'}>
                        {expiring && <AlertTriangle size={12} className="inline mr-1" />}
                        {new Date(l.expiryDate).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{l.federation || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openRenew(l)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/60 text-xs font-medium transition-colors border border-green-200 dark:border-green-800"
                          title="Renouveler la licence"
                        >
                          <RefreshCw size={13} /> Renouveler
                        </button>
                        <button
                          onClick={() => setPaymentsLicence(l)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-medium transition-colors border border-blue-200 dark:border-blue-800"
                        >
                          <Wallet size={13} /> Paiements
                        </button>
                        <button
                          onClick={() => openEdit(l)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(l.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-base font-bold text-foreground">
                {editingLicence ? 'Modifier la licence' : 'Nouvelle licence'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Sportif <span className="text-destructive">*</span></label>
                <select
                  value={form.sportifId}
                  onChange={e => setForm(f => ({ ...f, sportifId: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— Sélectionner un sportif —</option>
                  {sportifs.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.category?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">N° Licence <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    value={form.number}
                    onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                    required
                    placeholder="Ex: 2024-001234"
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {LICENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date de début <span className="text-destructive">*</span></label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date d'expiration <span className="text-destructive">*</span></label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Statut</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {LICENCE_STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Fédération</label>
                  <input
                    type="text"
                    value={form.federation}
                    onChange={e => setForm(f => ({ ...f, federation: e.target.value }))}
                    placeholder="Ex: FFF, FFR…"
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Montant total (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.totalAmount}
                  onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                  placeholder="Ex: 150.00"
                  className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Optionnel — utilisé pour générer l'échéancier de paiements</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Remarques éventuelles…"
                  className="w-full resize-none rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-input rounded-lg text-foreground hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Enregistrement…' : editingLicence ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payments Panel */}
      {paymentsLicence && (
        <LicencePaymentsPanel
          licence={paymentsLicence}
          onClose={() => setPaymentsLicence(null)}
        />
      )}

      {/* Confirm Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-foreground mb-2">Supprimer la licence ?</h3>
            <p className="text-sm text-muted-foreground mb-5">Cette action est irréversible.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm border border-input rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseManagement;
