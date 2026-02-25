import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Coach, getCoachProfile, getCurrentCoachProfile, updateCoachProfile, updateCoachCategories } from '../../services/coachService';
import { Category, getCategories } from '../../services/categoryService';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Phone, MapPin, Award, Book, Edit, Save, X, Layers, Plus } from 'lucide-react';

const CoachProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories management
  const [editingCategories, setEditingCategories] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [savingCategories, setSavingCategories] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    qualifications: '',
    experience: '',
    bio: '',
    specialties: ''
  });

  useEffect(() => {
    loadProfile();
  }, [id, user]);

  const loadProfile = async () => {
    try {
      let data;
      if (id) {
        data = await getCoachProfile(id);
      } else if (user?.role === 'COACH' || user?.role === 'ADMIN') {
        data = await getCurrentCoachProfile();
      } else {
        return;
      }
      setCoach(data);
      setFormData({
        phone: data.phone || '',
        address: data.address || '',
        qualifications: data.qualifications || '',
        experience: data.experience || '',
        bio: data.bio || '',
        specialties: data.specialties || ''
      });
      setSelectedCategoryIds((data.categories || []).map((c: Category) => c.id));

      // Load all categories for admin editing
      if (user?.role === 'ADMIN') {
        const cats = await getCategories();
        setAllCategories(cats);
      }
    } catch (error) {
      console.error('Error loading coach profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategories = async () => {
    if (!coach) return;
    setSavingCategories(true);
    try {
      const updated = await updateCoachCategories(coach.id, selectedCategoryIds);
      setCoach(prev => prev ? { ...prev, categories: updated.categories } : prev);
      setEditingCategories(false);
    } catch (error) {
      console.error('Error updating categories', error);
    } finally {
      setSavingCategories(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coach) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const updated = await updateCoachProfile(coach.id, formData);
      setCoach(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!coach) return <div className="text-center py-16 text-muted-foreground">Profil non trouvé</div>;

  const isOwnProfile = user?.role === 'COACH' && (!id || id === coach.id);
  const canEdit = isOwnProfile || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Fiche Coach</h1>
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            <Edit size={18} /> Modifier
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Basic Info + Catégories */}
        <div className="space-y-4">
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <div className="flex flex-col items-center mb-6">
              <div className="h-28 w-28 bg-muted rounded-full flex items-center justify-center mb-4 overflow-hidden">
                {coach.photoUrl ? (
                  <img src={coach.photoUrl} alt={coach.user.name} className="h-full w-full object-cover" />
                ) : (
                  <User size={56} className="text-muted-foreground" />
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground text-center">{coach.user.name}</h2>
              <p className="text-sm text-muted-foreground">Entraîneur</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Mail className="text-muted-foreground shrink-0" size={16} />
                <span className="truncate">{coach.user.email}</span>
              </div>
              {coach.phone && (
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <Phone className="text-muted-foreground shrink-0" size={16} />
                  <span>{coach.phone}</span>
                </div>
              )}
              {coach.address && (
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <MapPin className="text-muted-foreground shrink-0" size={16} />
                  <span>{coach.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* ===== CATÉGORIES ===== */}
          <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Layers size={16} className="text-primary" /> Catégories
              </h3>
              {isAdmin && !editingCategories && (
                <button
                  onClick={() => setEditingCategories(true)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Edit size={12} /> Modifier
                </button>
              )}
            </div>

            {editingCategories ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Cochez les catégories à assigner :</p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {allCategories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveCategories}
                    disabled={savingCategories}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Save size={12} /> {savingCategories ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategories(false);
                      setSelectedCategoryIds((coach.categories || []).map(c => c.id));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X size={12} /> Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {(coach.categories || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Aucune catégorie assignée</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(coach.categories || []).map(cat => (
                      <span key={cat.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}
                {isAdmin && (coach.categories || []).length === 0 && (
                  <button
                    onClick={() => setEditingCategories(true)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Plus size={12} /> Assigner des catégories
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Info / Edit Form */}
        <div className="md:col-span-2 bg-card p-6 rounded-lg shadow-sm border border-border">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Téléphone</label>
                  <input
                    type="text"
                    className="w-full rounded-md border-input bg-background text-foreground border px-3 py-2"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Adresse</label>
                  <input
                    type="text"
                    className="w-full rounded-md border-input bg-background text-foreground border px-3 py-2"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Qualifications / Diplômes</label>
                <textarea
                  className="w-full rounded-md border-input bg-background text-foreground border px-3 py-2"
                  rows={3}
                  value={formData.qualifications}
                  onChange={e => setFormData({...formData, qualifications: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Expérience</label>
                <textarea
                  className="w-full rounded-md border-input bg-background text-foreground border px-3 py-2"
                  rows={3}
                  value={formData.experience}
                  onChange={e => setFormData({...formData, experience: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Spécialités</label>
                <input
                  type="text"
                  className="w-full rounded-md border-input bg-background text-foreground border px-3 py-2"
                  value={formData.specialties}
                  onChange={e => setFormData({...formData, specialties: e.target.value})}
                  placeholder="Ex: Préparation physique, Gardiens..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Biographie</label>
                <textarea
                  className="w-full rounded-md border-input bg-background text-foreground border px-3 py-2"
                  rows={4}
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted"
                  disabled={isSubmitting}
                >
                  <X size={18} />
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <Save size={18} />
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Award className="text-primary" size={20} />
                  Qualifications
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {coach.qualifications || "Aucune qualification renseignée."}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Book className="text-primary" size={20} />
                  Expérience
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {coach.experience || "Aucune expérience renseignée."}
                </p>
              </div>

              {coach.specialties && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Spécialités</h3>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.split(',').map((spec, i) => (
                      <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                        {spec.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Biographie</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {coach.bio || "Aucune biographie disponible."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachProfile;
