import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import {
  Plus, X, Pencil, Trash2, Search, ChevronRight, ChevronDown,
  Calendar, Clock, MapPin, Users, CheckCircle, AlertTriangle,
  XCircle, Wallet, UserPlus, Zap
} from 'lucide-react';

interface Category { id: string; name: string; color?: string | null; }
interface Sportif { id: string; firstName: string; lastName: string; photoUrl?: string | null; category: Category; }
interface StagePayment {
  id: string; installment: number; amount: number;
  dueDate: string; paidDate?: string | null;
  status: string; method?: string | null; reference?: string | null;
}
interface Participant { id: string; sportifId: string; sportif: Sportif; payments: StagePayment[]; }
interface Stage {
  id: string; name: string; description?: string | null;
  startDate: string; endDate: string; startTime: string; endTime: string;
  location?: string | null; price: number; maxSpots?: number | null;
  status: string; notes?: string | null;
  _count?: { participants: number };
  participants?: Participant[];
}
const STAGE_STATUSES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  OPEN:      { label: 'Inscriptions ouvertes', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', icon: CheckCircle },
  FULL:      { label: 'Complet',               color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', icon: Users },
  CANCELLED: { label: 'Annulé',                color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: XCircle },
  COMPLETED: { label: 'Terminé',               color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: CheckCircle },
};
const PAY_STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'En attente', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', icon: Clock },
  PAID:    { label: 'Payé',       color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', icon: CheckCircle },
  LATE:    { label: 'En retard',  color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: AlertTriangle },
};
const METHODS = ['Espèces', 'Chèque', 'Virement', 'CB', 'PayPal'];
const emptyStageForm = {
  name: '', description: '', startDate: '', endDate: '',
  startTime: '09:00', endTime: '17:00', location: '',
  price: '', maxSpots: '', status: 'OPEN', notes: '',
};

const StageManagement: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [sportifs, setSportifs] = useState<Sportif[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [stageDetails, setStageDetails] = useState<Record<string, Stage>>({});
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [stageForm, setStageForm] = useState({ ...emptyStageForm });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
  const [showAddParticipant, setShowAddParticipant] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ sportifId: '', installmentCount: '1', totalAmount: '', firstDueDate: new Date().toISOString().slice(0, 10) });
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [editingPayment, setEditingPayment] = useState<{ participantId: string; payment: StagePayment; stageId: string } | null>(null);
  const [payForm, setPayForm] = useState({ status: 'PAID', paidDate: new Date().toISOString().slice(0, 10), method: '', reference: '' });
  const [savingPay, setSavingPay] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stagesRes, sportifsRes] = await Promise.all([api.get<Stage[]>('/stages'), api.get<Sportif[]>('/sportifs')]);
      setStages(stagesRes.data);
      setSportifs(sportifsRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadStageDetail = async (id: string) => {
    try {
      const res = await api.get<Stage>(`/stages/${id}`);
      setStageDetails(prev => ({ ...prev, [id]: res.data }));
    } catch (e) { console.error(e); }
  };

  const toggleExpand = async (id: string) => {
    if (expandedStage === id) { setExpandedStage(null); return; }
    setExpandedStage(id);
    if (!stageDetails[id]) await loadStageDetail(id);
  };

  const openCreateStage = () => { setEditingStage(null); setStageForm({ ...emptyStageForm }); setError(''); setShowStageModal(true); };
  const openEditStage = (s: Stage) => {
    setEditingStage(s);
    setStageForm({ name: s.name, description: s.description || '', startDate: s.startDate.slice(0, 10), endDate: s.endDate.slice(0, 10), startTime: s.startTime, endTime: s.endTime, location: s.location || '', price: s.price.toString(), maxSpots: s.maxSpots?.toString() ?? '', status: s.status, notes: s.notes || '' });
    setError(''); setShowStageModal(true);
  };

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageForm.name || !stageForm.startDate || !stageForm.endDate || !stageForm.price) { setError('Champs obligatoires manquants.'); return; }
    setSubmitting(true); setError('');
    try {
      if (editingStage) {
        const res = await api.put<Stage>(`/stages/${editingStage.id}`, stageForm);
        setStages(prev => prev.map(s => s.id === editingStage.id ? res.data : s));
        if (stageDetails[editingStage.id]) await loadStageDetail(editingStage.id);
      } else {
        const res = await api.post<Stage>('/stages', stageForm);
        setStages(prev => [res.data, ...prev]);
      }
      setShowStageModal(false);
    } catch (err: any) { setError(err?.response?.data?.message || 'Erreur.'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteStage = async (id: string) => {
    try {
      await api.delete(`/stages/${id}`);
      setStages(prev => prev.filter(s => s.id !== id));
      setDeleteStageId(null);
      if (expandedStage === id) setExpandedStage(null);
    } catch { alert('Erreur lors de la suppression.'); }
  };

  const handleAddParticipant = async (stageId: string) => {
    if (!addForm.sportifId) return;
    setAddingParticipant(true);
    try {
      await api.post(`/stages/${stageId}/participants`, { sportifId: addForm.sportifId, installmentCount: addForm.installmentCount !== '1' ? addForm.installmentCount : undefined, totalAmount: addForm.totalAmount || undefined, firstDueDate: addForm.firstDueDate || undefined });
      await loadStageDetail(stageId);
      setStages(prev => prev.map(s => s.id === stageId ? { ...s, _count: { participants: (s._count?.participants ?? 0) + 1 } } : s));
      setShowAddParticipant(null);
      setAddForm({ sportifId: '', installmentCount: '1', totalAmount: '', firstDueDate: new Date().toISOString().slice(0, 10) });
    } catch (err: any) { alert(err?.response?.data?.message || 'Erreur.'); }
    finally { setAddingParticipant(false); }
  };

  const handleRemoveParticipant = async (stageId: string, participantId: string) => {
    if (!confirm('Retirer ce participant ?')) return;
    try {
      await api.delete(`/stages/${stageId}/participants/${participantId}`);
      setStageDetails(prev => ({ ...prev, [stageId]: { ...prev[stageId], participants: prev[stageId].participants?.filter(p => p.id !== participantId) } }));
      setStages(prev => prev.map(s => s.id === stageId ? { ...s, _count: { participants: Math.max(0, (s._count?.participants ?? 1) - 1) } } : s));
    } catch { alert('Erreur.'); }
  };

  const openEditPayment = (stageId: string, participantId: string, payment: StagePayment) => {
    setEditingPayment({ stageId, participantId, payment });
    setPayForm({ status: payment.status, paidDate: payment.paidDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10), method: payment.method || '', reference: payment.reference || '' });
  };

  const handleSavePayment = async () => {
    if (!editingPayment) return;
    setSavingPay(true);
    try {
      const res = await api.put<StagePayment>(`/stages/${editingPayment.stageId}/participants/${editingPayment.participantId}/payments/${editingPayment.payment.id}`, { ...payForm, paidDate: payForm.status === 'PAID' ? payForm.paidDate : null });
      setStageDetails(prev => ({ ...prev, [editingPayment.stageId]: { ...prev[editingPayment.stageId], participants: prev[editingPayment.stageId].participants?.map(p => p.id === editingPayment.participantId ? { ...p, payments: p.payments.map(pay => pay.id === res.data.id ? res.data : pay) } : p) } }));
      setEditingPayment(null);
    } catch { alert('Erreur.'); }
    finally { setSavingPay(false); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const filtered = stages.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.location?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des stages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Organisez vos stages et suivez les paiements des participants</p>
        </div>
        <button onClick={openCreateStage} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Nouveau stage
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Rechercher un stage…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Aucun stage pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(stage => {
            const sc = STAGE_STATUSES[stage.status] ?? STAGE_STATUSES.OPEN;
            const StatusIcon = sc.icon;
            const isExpanded = expandedStage === stage.id;
            const detail = stageDetails[stage.id];
            return (
              <div key={stage.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="bg-primary/10 rounded-xl p-3 text-center min-w-[56px] shrink-0">
                    <div className="text-lg font-bold text-primary leading-none">{new Date(stage.startDate).getDate()}</div>
                    <div className="text-xs uppercase text-primary/70">{new Date(stage.startDate).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground">{stage.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.color}`}>
                        <StatusIcon size={10} /> {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(stage.startDate)} → {fmtDate(stage.endDate)}</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {stage.startTime} – {stage.endTime}</span>
                      {stage.location && <span className="flex items-center gap-1"><MapPin size={11} /> {stage.location}</span>}
                      <span className="flex items-center gap-1"><Users size={11} /> {stage._count?.participants ?? 0}{stage.maxSpots ? `/${stage.maxSpots}` : ''} participant(s)</span>
                      <span className="flex items-center gap-1 font-semibold text-foreground"><Wallet size={11} /> {stage.price.toFixed(2)} €</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditStage(stage)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteStageId(stage.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                    <button onClick={() => toggleExpand(stage.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium ml-1">
                      Participants {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border">
                    <div className="px-5 py-3 bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{detail?.participants?.length ?? 0} participant(s)</p>
                      <button onClick={() => { setShowAddParticipant(stage.id); setAddForm({ sportifId: '', installmentCount: '1', totalAmount: stage.price.toString(), firstDueDate: stage.startDate.slice(0, 10) }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                        <UserPlus size={13} /> Inscrire un sportif
                      </button>
                    </div>

                    {showAddParticipant === stage.id && (
                      <div className="px-5 py-4 bg-muted/10 border-b border-border">
                        <div className="flex items-end gap-3 flex-wrap">
                          <div className="flex-1 min-w-[180px]">
                            <label className="block text-xs font-medium text-foreground mb-1">Sportif</label>
                            <select value={addForm.sportifId} onChange={e => setAddForm(f => ({ ...f, sportifId: e.target.value }))}
                              className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                              <option value="">— Sélectionner —</option>
                              {sportifs.filter(sp => !detail?.participants?.some(p => p.sportifId === sp.id)).map(sp => (
                                <option key={sp.id} value={sp.id}>{sp.firstName} {sp.lastName} ({sp.category?.name})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Versements</label>
                            <select value={addForm.installmentCount} onChange={e => setAddForm(f => ({ ...f, installmentCount: e.target.value }))}
                              className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}x</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Montant (€)</label>
                            <input type="number" step="0.01" value={addForm.totalAmount} onChange={e => setAddForm(f => ({ ...f, totalAmount: e.target.value }))}
                              placeholder={stage.price.toString()}
                              className="w-28 rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">1er versement</label>
                            <input type="date" value={addForm.firstDueDate} onChange={e => setAddForm(f => ({ ...f, firstDueDate: e.target.value }))}
                              className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setShowAddParticipant(null)} className="px-3 py-2 text-sm border border-input rounded-lg hover:bg-muted">Annuler</button>
                            <button onClick={() => handleAddParticipant(stage.id)} disabled={!addForm.sportifId || addingParticipant}
                              className="flex items-center gap-1 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                              <Zap size={13} /> {addingParticipant ? 'Inscription…' : 'Inscrire'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!detail ? (
                      <div className="px-5 py-6 text-sm text-muted-foreground text-center">Chargement…</div>
                    ) : !detail.participants?.length ? (
                      <div className="px-5 py-8 text-sm text-muted-foreground text-center">Aucun participant inscrit.</div>
                    ) : (
                      <div className="divide-y divide-border">
                        {detail.participants.map(p => {
                          const totalPaid = p.payments.filter(pay => pay.status === 'PAID').reduce((s, pay) => s + pay.amount, 0);
                          const totalDue  = p.payments.reduce((s, pay) => s + pay.amount, 0);
                          return (
                            <div key={p.id} className="px-5 py-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                  {p.sportif.firstName[0]}{p.sportif.lastName[0]}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-foreground">{p.sportif.firstName} {p.sportif.lastName}</p>
                                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={p.sportif.category?.color ? { backgroundColor: `${p.sportif.category.color}20`, color: p.sportif.category.color } : {}}>
                                    {p.sportif.category?.name}
                                  </span>
                                </div>
                                {totalDue > 0 && (
                                  <div className="text-right text-xs shrink-0 mr-2">
                                    <span className="font-semibold text-foreground">{totalPaid.toFixed(2)} / {totalDue.toFixed(2)} €</span>
                                    <div className="w-20 bg-muted rounded-full h-1.5 mt-1">
                                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${totalDue > 0 ? Math.min((totalPaid / totalDue) * 100, 100) : 0}%` }} />
                                    </div>
                                  </div>
                                )}
                                <button onClick={() => handleRemoveParticipant(stage.id, p.id)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"><X size={14} /></button>
                              </div>
                              {p.payments.length > 0 && (
                                <div className="ml-12 space-y-1.5">
                                  {p.payments.map(pay => {
                                    const ps = PAY_STATUS[pay.status] ?? PAY_STATUS.PENDING;
                                    const PayIcon = ps.icon;
                                    const isLate = pay.status === 'PENDING' && new Date(pay.dueDate) < new Date();
                                    if (editingPayment?.payment.id === pay.id) {
                                      return (
                                        <div key={pay.id} className="border border-primary/30 rounded-lg p-3 bg-primary/5 space-y-2">
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            <select value={payForm.status} onChange={e => setPayForm(f => ({ ...f, status: e.target.value }))}
                                              className="rounded-lg border border-input bg-background text-foreground px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                                              <option value="PENDING">En attente</option>
                                              <option value="PAID">Payé</option>
                                              <option value="LATE">En retard</option>
                                            </select>
                                            {payForm.status === 'PAID' && (
                                              <input type="date" value={payForm.paidDate} onChange={e => setPayForm(f => ({ ...f, paidDate: e.target.value }))}
                                                className="rounded-lg border border-input bg-background text-foreground px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                                            )}
                                            <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}
                                              className="rounded-lg border border-input bg-background text-foreground px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                                              <option value="">Mode</option>
                                              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            <input type="text" value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                                              placeholder="Référence" className="rounded-lg border border-input bg-background text-foreground px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                                          </div>
                                          <div className="flex gap-2 justify-end">
                                            <button onClick={() => setEditingPayment(null)} className="px-2.5 py-1 text-xs border border-input rounded-lg hover:bg-muted">Annuler</button>
                                            <button onClick={handleSavePayment} disabled={savingPay}
                                              className="px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                                              {savingPay ? 'Sauvegarde…' : 'Enregistrer'}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div key={pay.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isLate && pay.status === 'PENDING' ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800' : 'bg-muted/30'}`}>
                                        <span className="text-xs font-bold text-muted-foreground w-5 text-center">{pay.installment}</span>
                                        <span className="font-semibold text-foreground">{pay.amount.toFixed(2)} €</span>
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${isLate && pay.status === 'PENDING' ? PAY_STATUS.LATE.color : ps.color}`}>
                                          <PayIcon size={9} /> {isLate && pay.status === 'PENDING' ? 'En retard' : ps.label}
                                        </span>
                                        <span className="text-xs text-muted-foreground">Éch. {new Date(pay.dueDate).toLocaleDateString('fr-FR')}</span>
                                        {pay.paidDate && <span className="text-xs text-green-600 dark:text-green-400">Payé {new Date(pay.paidDate).toLocaleDateString('fr-FR')}</span>}
                                        {pay.method && <span className="text-xs text-muted-foreground border border-border px-1.5 py-0.5 rounded">{pay.method}</span>}
                                        <button onClick={() => openEditPayment(stage.id, p.id, pay)}
                                          className="ml-auto flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 border border-green-200 dark:border-green-800">
                                          <CheckCircle size={11} /> {pay.status === 'PAID' ? 'Modifier' : 'Marquer payé'}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stage Create/Edit Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">{editingStage ? 'Modifier le stage' : 'Nouveau stage'}</h3>
              <button onClick={() => setShowStageModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleStageSubmit} className="px-6 py-5 space-y-4">
              {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nom du stage *</label>
                <input type="text" value={stageForm.name} onChange={e => setStageForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ex: Stage vacances été U13"
                  className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea value={stageForm.description} onChange={e => setStageForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Description du stage…"
                  className="w-full resize-none rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date de début *</label>
                  <input type="date" value={stageForm.startDate} onChange={e => setStageForm(f => ({ ...f, startDate: e.target.value }))} required
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date de fin *</label>
                  <input type="date" value={stageForm.endDate} onChange={e => setStageForm(f => ({ ...f, endDate: e.target.value }))} required
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Heure début *</label>
                  <input type="time" value={stageForm.startTime} onChange={e => setStageForm(f => ({ ...f, startTime: e.target.value }))} required
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Heure fin *</label>
                  <input type="time" value={stageForm.endTime} onChange={e => setStageForm(f => ({ ...f, endTime: e.target.value }))} required
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Prix (€) *</label>
                  <input type="number" step="0.01" min="0" value={stageForm.price} onChange={e => setStageForm(f => ({ ...f, price: e.target.value }))} required placeholder="150.00"
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Places max</label>
                  <input type="number" min="1" value={stageForm.maxSpots} onChange={e => setStageForm(f => ({ ...f, maxSpots: e.target.value }))} placeholder="Illimité"
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Lieu</label>
                  <input type="text" value={stageForm.location} onChange={e => setStageForm(f => ({ ...f, location: e.target.value }))} placeholder="Gymnase, stade…"
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Statut</label>
                  <select value={stageForm.status} onChange={e => setStageForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {Object.entries(STAGE_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
                <textarea value={stageForm.notes} onChange={e => setStageForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Remarques éventuelles…"
                  className="w-full resize-none rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowStageModal(false)} className="px-4 py-2 text-sm border border-input rounded-lg text-foreground hover:bg-muted transition-colors">Annuler</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {submitting ? 'Enregistrement…' : editingStage ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteStageId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-foreground mb-2">Supprimer ce stage ?</h3>
            <p className="text-sm text-muted-foreground mb-5">Tous les participants et paiements associés seront supprimés.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteStageId(null)} className="px-4 py-2 text-sm border border-input rounded-lg text-foreground hover:bg-muted transition-colors">Annuler</button>
              <button onClick={() => handleDeleteStage(deleteStageId)} className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StageManagement;
