import React, { useEffect, useRef, useState } from 'react';
import { getCoaches, createCoach, deleteCoach, updateCoachProfile, updateCoachCategories, Coach, CreateCoachData } from '../../services/coachService';
import { getCategories, Category } from '../../services/categoryService';
import { User, Phone, MapPin, Star, Plus, Trash2, X, Pencil, Camera, Layers } from 'lucide-react';
import ClubBanner from '../../components/ClubBanner';

const EMPTY_FORM: CreateCoachData = {
  name: '', email: '', password: '',
  phone: '', address: '', qualifications: '', experience: '', bio: '', specialties: ''
};

interface EditForm {
  phone: string; address: string; qualifications: string;
  experience: string; bio: string; specialties: string; photoUrl: string;
}

const EMPTY_EDIT: EditForm = { phone: '', address: '', qualifications: '', experience: '', bio: '', specialties: '', photoUrl: '' };

const CoachList: React.FC = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCoachData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [newCategoryIds, setNewCategoryIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT);
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCoaches();
    getCategories().then(setAllCategories).catch(() => {});
  }, []);

  const loadCoaches = async () => {
    try {
      const data = await getCoaches();
      setCoaches(data);
    } catch (error) {
      console.error('Erreur lors du chargement des coachs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const coach = await createCoach(form);
      // Assign categories if any selected
      if (newCategoryIds.length > 0) {
        const updated = await updateCoachCategories(coach.id, newCategoryIds);
        setCoaches(prev => [...prev, { ...coach, categories: updated.categories }]);
      } else {
        setCoaches(prev => [...prev, coach]);
      }
      setForm(EMPTY_FORM);
      setNewCategoryIds([]);
      setShowForm(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (coach: Coach) => {
    setEditingCoach(coach);
    setEditForm({
      phone: coach.phone || '',
      address: coach.address || '',
      qualifications: coach.qualifications || '',
      experience: coach.experience || '',
      bio: coach.bio || '',
      specialties: coach.specialties || '',
      photoUrl: coach.photoUrl || '',
    });
    setEditCategoryIds((coach.categories || []).map(c => c.id));
    setEditError('');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setEditError('Photo trop lourde (max 2 Mo)'); return; }
    const reader = new FileReader();
    reader.onload = () => setEditForm(p => ({ ...p, photoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoach) return;
    setEditSaving(true);
    setEditError('');
    try {
      const [updated, updatedCats] = await Promise.all([
        updateCoachProfile(editingCoach.id, editForm),
        updateCoachCategories(editingCoach.id, editCategoryIds),
      ]);
      setCoaches(prev => prev.map(c =>
        c.id === editingCoach.id
          ? { ...c, ...updated, user: c.user, categories: updatedCats.categories }
          : c
      ));
      setEditingCoach(null);
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCoach(id);
      setCoaches(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const field = (key: keyof CreateCoachData, label: string, type = 'text', required = false) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        type={type}
        required={required}
        className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
        value={form[key] || ''}
        onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setFormError(''); }}
      />
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <ClubBanner />
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Coachs</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{coaches.length} entraîneur{coaches.length > 1 ? 's' : ''}</span>
          <button
            onClick={() => { setShowForm(true); setFormError(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} /> Ajouter un coach
          </button>
        </div>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Nouveau coach</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-muted-foreground hover:text-foreground rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Compte</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field('name', 'Nom complet', 'text', true)}
                  {field('email', 'Email', 'email', true)}
                  {field('password', 'Mot de passe', 'password', true)}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Profil (optionnel)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field('phone', 'Téléphone')}
                  {field('address', 'Adresse')}
                  {field('qualifications', 'Qualifications')}
                  {field('experience', 'Expérience')}
                  {field('specialties', 'Spécialités')}
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Bio</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm resize-none"
                    value={form.bio || ''}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  />
                </div>
              </div>
              {/* Catégories */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Layers size={12} /> Catégories assignées
                </p>
                {allCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Aucune catégorie disponible</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {allCategories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={newCategoryIds.includes(cat.id)}
                          onChange={() => setNewCategoryIds(prev =>
                            prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                          )}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <button type="button" onClick={() => { setShowForm(false); setNewCategoryIds([]); }} disabled={saving}
                  className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {saving ? 'Création...' : 'Créer le coach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Modifier — {editingCoach.user?.name}</h2>
              <button onClick={() => setEditingCoach(null)} className="p-1 text-muted-foreground hover:text-foreground rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="p-5 space-y-5">
              {/* Photo */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Photo de profil</p>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border-2 border-border">
                    {editForm.photoUrl ? (
                      <img src={editForm.photoUrl} alt="photo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-2xl">{editingCoach.user?.name?.charAt(0) || 'C'}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <button type="button" onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border text-foreground hover:bg-muted">
                      <Camera size={15} /> Choisir une photo
                    </button>
                    {editForm.photoUrl && (
                      <button type="button" onClick={() => setEditForm(p => ({ ...p, photoUrl: '' }))}
                        className="text-xs text-destructive hover:underline">
                        Supprimer la photo
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">JPG, PNG — max 2 Mo</p>
                  </div>
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
              </div>

              {/* Profile fields */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Informations</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['phone', 'address', 'qualifications', 'experience', 'specialties'] as (keyof EditForm)[]).map(key => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-muted-foreground mb-1 capitalize">
                        {key === 'phone' ? 'Téléphone' : key === 'address' ? 'Adresse' : key === 'qualifications' ? 'Qualifications' : key === 'experience' ? 'Expérience' : 'Spécialités'}
                      </label>
                      <input type="text" className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                        value={editForm[key]} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Bio</label>
                  <textarea rows={3} className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm resize-none"
                    value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} />
                </div>
              </div>

              {/* Catégories */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Layers size={12} /> Catégories assignées
                </p>
                {allCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Aucune catégorie disponible</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {allCategories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={editCategoryIds.includes(cat.id)}
                          onChange={() => setEditCategoryIds(prev =>
                            prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                          )}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <button type="button" onClick={() => setEditingCoach(null)} disabled={editSaving}
                  className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50">
                  Annuler
                </button>
                <button type="submit" disabled={editSaving}
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {editSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coach list */}
      {coaches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
          Aucun coach enregistré. Cliquez sur "Ajouter un coach" pour commencer.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((coach) => (
            <div key={coach.id} className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative">
              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex items-center gap-1">
                {deletingId === coach.id ? (
                  <>
                    <span className="text-xs text-muted-foreground">Supprimer ?</span>
                    <button onClick={() => handleDelete(coach.id)}
                      className="px-2 py-0.5 text-xs rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium">
                      Oui
                    </button>
                    <button onClick={() => setDeletingId(null)}
                      className="px-2 py-0.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted">
                      Non
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openEdit(coach)}
                      className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-muted">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeletingId(coach.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-muted">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 mb-4 pr-16">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden text-primary font-bold text-lg shrink-0">
                  {coach.photoUrl ? (
                    <img src={coach.photoUrl} alt={coach.user?.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{coach.user?.name?.charAt(0) || 'C'}</span>
                  )}
                </div>
                <div className="overflow-hidden">
                  <h2 className="font-semibold text-foreground truncate">{coach.user?.name}</h2>
                  <p className="text-sm text-muted-foreground truncate">{coach.user?.email}</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                {coach.specialties && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star size={13} className="text-primary shrink-0" />
                    <span className="truncate">{coach.specialties}</span>
                  </div>
                )}
                {coach.experience && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User size={13} className="text-primary shrink-0" />
                    <span className="truncate">{coach.experience}</span>
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
              </div>

              {coach.categories && coach.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {coach.categories.map((cat) => (
                    <span key={cat.id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachList;
