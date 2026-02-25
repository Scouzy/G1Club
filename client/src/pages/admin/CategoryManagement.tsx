import React, { useEffect, useState } from 'react';
import { Category, getCategories, createCategory, deleteCategory, updateCategory } from '../../services/categoryService';
import { Trash2, Plus, Pencil, Check, X, Shield } from 'lucide-react';
import ClubBanner from '../../components/ClubBanner';

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [isAdding, setIsAdding] = useState(false);
  const [createError, setCreateError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadError('');
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error: any) {
      console.error('Failed to load categories', error);
      const msg = error?.response?.data?.message || error?.message || 'Erreur inconnue';
      setLoadError(`Impossible de charger les catégories : ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsAdding(true);
    setCreateError('');
    try {
      await createCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
      loadCategories();
    } catch (error: any) {
      console.error('Failed to create category', error);
      const msg = error?.response?.data?.message || error?.message || 'Erreur inconnue';
      setCreateError(msg);
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setEditingColor(cat.color || '#3b82f6');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await updateCategory(id, editingName.trim(), editingColor);
      setCategories(categories.map(c => c.id === id ? { ...c, name: editingName.trim(), color: editingColor } : c));
      cancelEdit();
    } catch (error) {
      console.error('Failed to update category', error);
      alert('Échec de la modification');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete category', error);
      alert('Impossible de supprimer cette catégorie (des sportifs y sont peut-être rattachés).');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">Chargement...</div>
  );

  if (loadError) return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-4">Catégories</h1>
      <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4">
        {loadError}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <ClubBanner />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Catégories</h1>
        <span className="text-sm text-muted-foreground">{categories.length} catégorie{categories.length > 1 ? 's' : ''}</span>
      </div>

      {/* Add Form */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Ajouter une catégorie</h2>
        <form onSubmit={handleCreate} className="flex gap-3 items-center">
          <input
            type="color"
            value={newCategoryColor}
            onChange={e => setNewCategoryColor(e.target.value)}
            className="h-9 w-10 rounded cursor-pointer border border-input bg-background p-0.5"
            title="Choisir une couleur"
          />
          <input
            type="text"
            placeholder="Ex : U20, Vétérans..."
            className="flex-1 rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={newCategoryName}
            onChange={(e) => { setNewCategoryName(e.target.value); setCreateError(''); }}
          />
          <button
            type="submit"
            disabled={isAdding || !newCategoryName.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus size={16} />
            {isAdding ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
        {createError && (
          <p className="mt-2 text-sm text-destructive">{createError}</p>
        )}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-3 group hover:border-primary/50 transition-colors"
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: (category.color || '#3b82f6') + '22', color: category.color || '#3b82f6' }}
            >
              <Shield size={18} />
            </div>

            <div className="flex-1 min-w-0">
              {editingId === category.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingColor}
                    onChange={e => setEditingColor(e.target.value)}
                    className="h-7 w-8 rounded cursor-pointer border border-input bg-background p-0.5 shrink-0"
                  />
                  <input
                    autoFocus
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleUpdate(category.id); if (e.key === 'Escape') cancelEdit(); }}
                    className="w-full rounded border border-primary bg-background text-foreground px-2 py-1 text-sm focus:outline-none"
                  />
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: category.color || '#3b82f6' }} />
                    {category.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {category._count?.sportifs ?? 0} sportif{(category._count?.sportifs ?? 0) > 1 ? 's' : ''}
                    {' · '}
                    {category._count?.coaches ?? 0} entraîneur{(category._count?.coaches ?? 0) > 1 ? 's' : ''}
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {editingId === category.id ? (
                <>
                  <button onClick={() => handleUpdate(category.id)} className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900 text-green-600" title="Valider">
                    <Check size={15} />
                  </button>
                  <button onClick={cancelEdit} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Annuler">
                    <X size={15} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(category)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" title="Modifier">
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    disabled={deletingId === category.id}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManagement;
