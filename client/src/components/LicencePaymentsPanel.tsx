import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { X, CheckCircle, Clock, AlertTriangle, Pencil, Trash2, Zap } from 'lucide-react';

interface Payment {
  id: string;
  installment: number;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: string;
  method?: string | null;
  reference?: string | null;
  notes?: string | null;
}

interface Licence {
  id: string;
  number: string;
  totalAmount?: number | null;
  sportif: { firstName: string; lastName: string };
}

interface Props {
  licence: Licence;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'En attente', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',    icon: Clock },
  PAID:    { label: 'Payé',       color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', icon: CheckCircle },
  LATE:    { label: 'En retard',  color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',         icon: AlertTriangle },
};

const METHODS = ['Espèces', 'Chèque', 'Virement', 'CB', 'PayPal'];

const emptyEditForm = { status: 'PAID', paidDate: new Date().toISOString().slice(0, 10), method: '', reference: '', notes: '' };

const LicencePaymentsPanel: React.FC<Props> = ({ licence, onClose }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyEditForm });
  const [showGenModal, setShowGenModal] = useState(false);
  const [genForm, setGenForm] = useState({
    installmentCount: '2',
    totalAmount: licence.totalAmount?.toString() ?? '',
    firstDueDate: new Date().toISOString().slice(0, 10),
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadPayments(); }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get<Payment[]>(`/licences/${licence.id}/payments`);
      setPayments(res.data);
    } catch { setPayments([]); }
    finally { setLoading(false); }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true); setError('');
    try {
      const res = await api.post<Payment[]>(`/licences/${licence.id}/payments/generate`, {
        installmentCount: parseInt(genForm.installmentCount),
        totalAmount: parseFloat(genForm.totalAmount),
        firstDueDate: genForm.firstDueDate,
      });
      setPayments(res.data);
      setShowGenModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la génération.');
    } finally { setGenerating(false); }
  };

  const openEdit = (p: Payment) => {
    setEditingPayment(p);
    setEditForm({
      status: p.status,
      paidDate: p.paidDate ? p.paidDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      method: p.method || '',
      reference: p.reference || '',
      notes: p.notes || '',
    });
    setError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setSaving(true); setError('');
    try {
      const res = await api.put<Payment>(`/licences/${licence.id}/payments/${editingPayment.id}`, {
        ...editForm,
        paidDate: editForm.status === 'PAID' ? editForm.paidDate : null,
      });
      setPayments(prev => prev.map(p => p.id === editingPayment.id ? res.data : p));
      setEditingPayment(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce versement ?')) return;
    try {
      await api.delete(`/licences/${licence.id}/payments/${id}`);
      setPayments(prev => prev.filter(p => p.id !== id));
    } catch { alert('Erreur lors de la suppression.'); }
  };

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const totalDue  = payments.reduce((s, p) => s + p.amount, 0);
  const paidCount = payments.filter(p => p.status === 'PAID').length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Suivi des paiements — {licence.sportif.firstName} {licence.sportif.lastName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Licence n° {licence.number}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        {/* Summary bar */}
        {payments.length > 0 && (
          <div className="px-6 py-3 bg-muted/30 border-b border-border flex items-center gap-6 shrink-0 flex-wrap">
            <div className="text-sm">
              <span className="text-muted-foreground">Payé : </span>
              <span className="font-semibold text-green-600 dark:text-green-400">{totalPaid.toFixed(2)} €</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Restant : </span>
              <span className="font-semibold text-foreground">{(totalDue - totalPaid).toFixed(2)} €</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Total : </span>
              <span className="font-semibold text-foreground">{totalDue.toFixed(2)} €</span>
            </div>
            <div className="ml-auto">
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: totalDue > 0 ? `${Math.min((totalPaid / totalDue) * 100, 100)}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{paidCount}/{payments.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => { setShowGenModal(true); setError(''); }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Zap size={14} /> Générer les versements
            </button>
          </div>

          {/* Generate modal (inline) */}
          {showGenModal && (
            <div className="border border-border rounded-xl p-5 bg-muted/20">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-semibold text-foreground">Générer les versements automatiquement</h4>
                <button onClick={() => setShowGenModal(false)} className="text-muted-foreground hover:text-foreground"><X size={15} /></button>
              </div>
              <form onSubmit={handleGenerate} className="space-y-3">
                {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Nombre de versements</label>
                    <select
                      value={genForm.installmentCount}
                      onChange={e => setGenForm(f => ({ ...f, installmentCount: e.target.value }))}
                      className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {[1,2,3,4,5,6,8,10,12].map(n => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Montant total (€)</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={genForm.totalAmount}
                      onChange={e => setGenForm(f => ({ ...f, totalAmount: e.target.value }))}
                      required
                      placeholder="Ex: 150.00"
                      className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Date du 1er versement</label>
                    <input
                      type="date"
                      value={genForm.firstDueDate}
                      onChange={e => setGenForm(f => ({ ...f, firstDueDate: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                {genForm.installmentCount && genForm.totalAmount && (
                  <p className="text-xs text-muted-foreground">
                    → {genForm.installmentCount} versement(s) de{' '}
                    <strong>{(parseFloat(genForm.totalAmount || '0') / parseInt(genForm.installmentCount || '1')).toFixed(2)} €</strong>
                    {' '}espacés d'un mois
                  </p>
                )}
                <div className="flex gap-3 justify-end pt-1">
                  <button type="button" onClick={() => setShowGenModal(false)} className="px-3 py-1.5 text-sm border border-input rounded-lg text-foreground hover:bg-muted">Annuler</button>
                  <button type="submit" disabled={generating} className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                    {generating ? 'Génération…' : 'Générer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payments list */}
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Chargement…</p>
          ) : payments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Clock size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun versement configuré.</p>
              <p className="text-xs mt-1">Utilisez "Générer les versements" pour créer un échéancier.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map(p => {
                const sc = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.PENDING;
                const StatusIcon = sc.icon;
                const isLate = p.status === 'PENDING' && new Date(p.dueDate) < new Date();

                if (editingPayment?.id === p.id) {
                  return (
                    <div key={p.id} className="border-2 border-primary/30 rounded-xl p-4 bg-primary/5">
                      <form onSubmit={handleSaveEdit} className="space-y-3">
                        {error && <p className="text-xs text-destructive">{error}</p>}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Statut</label>
                            <select
                              value={editForm.status}
                              onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                              className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="PENDING">En attente</option>
                              <option value="PAID">Payé</option>
                              <option value="LATE">En retard</option>
                            </select>
                          </div>
                          {editForm.status === 'PAID' && (
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Date de paiement</label>
                              <input type="date" value={editForm.paidDate} onChange={e => setEditForm(f => ({ ...f, paidDate: e.target.value }))}
                                className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Mode de paiement</label>
                            <select value={editForm.method} onChange={e => setEditForm(f => ({ ...f, method: e.target.value }))}
                              className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                              <option value="">— Choisir —</option>
                              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Référence</label>
                            <input type="text" value={editForm.reference} onChange={e => setEditForm(f => ({ ...f, reference: e.target.value }))}
                              placeholder="N° chèque, virement…"
                              className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Notes</label>
                          <input type="text" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="Remarques…"
                            className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditingPayment(null)} className="px-3 py-1.5 text-sm border border-input rounded-lg hover:bg-muted">Annuler</button>
                          <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                            {saving ? 'Sauvegarde…' : 'Enregistrer'}
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                }

                return (
                  <div key={p.id} className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${isLate && p.status === 'PENDING' ? 'border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20' : 'border-border bg-card'} transition-colors`}>
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
                      {p.installment}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{p.amount.toFixed(2)} €</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isLate && p.status === 'PENDING' ? STATUS_CONFIG.LATE.color : sc.color}`}>
                          <StatusIcon size={10} />
                          {isLate && p.status === 'PENDING' ? 'En retard' : sc.label}
                        </span>
                        {p.method && <span className="text-xs text-muted-foreground border border-border px-1.5 py-0.5 rounded">{p.method}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                        <span>Échéance : {new Date(p.dueDate).toLocaleDateString('fr-FR')}</span>
                        {p.paidDate && <span className="text-green-600 dark:text-green-400">Payé le : {new Date(p.paidDate).toLocaleDateString('fr-FR')}</span>}
                        {p.reference && <span>Réf. : {p.reference}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {p.status !== 'PAID' && (
                        <button
                          onClick={() => openEdit(p)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                          title="Marquer payé"
                        >
                          <CheckCircle size={12} /> Marquer payé
                        </button>
                      )}
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Modifier">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors" title="Supprimer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-input rounded-lg text-foreground hover:bg-muted transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default LicencePaymentsPanel;
