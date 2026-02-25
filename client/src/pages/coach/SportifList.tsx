import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sportif, getSportifs, createSportif, deleteSportif } from '../../services/sportifService';
import { Category, getCategories } from '../../services/categoryService';
import { useCoachCategories } from '../../hooks/useCoachCategories';
import { Team, getTeamsByCategory, createTeam, deleteTeam, assignSportifToTeam } from '../../services/teamService';
import { Search, Plus, User, Trash2, Lock, Users } from 'lucide-react';

type CategoryTab = 'sportifs' | 'equipes';

const AssignDropdown: React.FC<{
  sportifs: Sportif[];
  onAssign: (sportifId: string) => void;
  assigning: string | null;
}> = ({ sportifs, onAssign, assigning }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary border border-dashed border-border rounded-lg px-3 py-1.5 hover:border-primary/40 transition-colors"
      >
        <Plus size={12} /> Ajouter un sportif
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {sportifs.map(sp => (
            <button
              key={sp.id}
              type="button"
              disabled={assigning === sp.id}
              onClick={() => { onAssign(sp.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left disabled:opacity-50"
            >
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{sp.firstName.charAt(0)}</span>
              </div>
              {sp.firstName} {sp.lastName}
              {sp.position && <span className="text-xs text-muted-foreground ml-auto">{sp.position}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SportifList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { canEdit, coachCategoryIds } = useCoachCategories();
  const [sportifs, setSportifs] = useState<Sportif[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('sportifs');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Teams state
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // New Sportif Form State
  const [newSportif, setNewSportif] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    height: '',
    weight: '',
    position: '',
    categoryId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      getTeamsByCategory(selectedCategory).then(setTeams).catch(console.error);
    } else {
      setTeams([]);
    }
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      const [sportifsData, categoriesData] = await Promise.all([
        getSportifs(),
        getCategories()
      ]);
      setSportifs(sportifsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data', error);
    } finally {
      setLoading(false);
    }
  };

  const reloadTeams = async () => {
    if (selectedCategory) {
      const t = await getTeamsByCategory(selectedCategory);
      setTeams(t);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !selectedCategory || creatingTeam) return;
    setCreatingTeam(true);
    try {
      await createTeam(selectedCategory, newTeamName.trim());
      setNewTeamName('');
      setShowTeamForm(false);
      await reloadTeams();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Supprimer cette équipe ? Les sportifs seront désassignés.')) return;
    await deleteTeam(teamId);
    await reloadTeams();
    await loadData();
  };

  const handleAssign = async (sportifId: string, teamId: string | null) => {
    setAssigningId(sportifId);
    try {
      await assignSportifToTeam(sportifId, teamId);
      await reloadTeams();
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setAssigningId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createSportif({
          ...newSportif,
          height: newSportif.height ? parseFloat(newSportif.height) : undefined,
          weight: newSportif.weight ? parseFloat(newSportif.weight) : undefined,
      });
      setIsModalOpen(false);
      setNewSportif({
        firstName: '', lastName: '', birthDate: '', height: '', weight: '', position: '', 
        categoryId: categories.length > 0 ? categories[0].id : ''
      });
      loadData(); // Refresh list
    } catch (error) {
      console.error('Error creating sportif', error);
      alert('Échec de la création du sportif');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Supprimer ce sportif ?')) {
          try {
              await deleteSportif(id);
              setSportifs(sportifs.filter(s => s.id !== id));
          } catch (error) {
              console.error('Error deleting', error);
          }
      }
  }

  const selectedCategoryObj = categories.find(c => c.id === selectedCategory) || null;

  const filteredSportifs = sportifs.filter(s => {
    const matchesSearch =
      s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? s.categoryId === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const catSportifs = sportifs.filter(s => s.categoryId === selectedCategory);
  const unassignedSportifs = catSportifs.filter(s => !(s as any).teamId);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          {selectedCategoryObj && (
            <button
              onClick={() => { setSelectedCategory(''); setSearchTerm(''); }}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Retour aux catégories"
            >
              ← Retour
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedCategoryObj ? `Catégorie ${selectedCategoryObj.name}` : 'Sportifs'}
            </h1>
            {!selectedCategoryObj && (
              <p className="text-sm text-muted-foreground mt-0.5">Sélectionnez une catégorie pour consulter et gérer les sportifs inscrits.</p>
            )}
            {selectedCategoryObj && (
              <span className="text-sm text-muted-foreground">{filteredSportifs.length} sportif{filteredSportifs.length > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedCategoryObj && !canEdit(selectedCategoryObj.id) ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-3 py-2">
              <Lock size={12} /> Lecture seule
            </span>
          ) : (
            <>
              {categoryTab === 'equipes' && canEdit(selectedCategoryObj?.id ?? '') && (
                <button
                  onClick={() => setShowTeamForm(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-foreground text-sm hover:bg-muted"
                >
                  <Plus size={16} /> Nouvelle équipe
                </button>
              )}
              {categoryTab === 'sportifs' && canEdit(selectedCategoryObj?.id ?? '') && (
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                    setNewSportif(prev => ({
                      ...prev,
                      categoryId: selectedCategoryObj?.id ?? coachCategoryIds[0] ?? ''
                    }));
                  }}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2"
                >
                  <Plus size={20} /> Ajouter un Sportif
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Category Cards — shown only when no category selected */}
      {!selectedCategoryObj && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {categories.map(c => {
            const count = sportifs.filter(s => s.categoryId === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 bg-card hover:shadow-md transition-all ${
                  canEdit(c.id) ? 'border-border hover:shadow-md' : 'border-border/50 opacity-70 hover:opacity-90'
                }`}
                style={canEdit(c.id) && c.color ? { borderColor: c.color + '55' } : undefined}
              >
                {!canEdit(c.id) && (
                  <span className="absolute top-2 right-2"><Lock size={11} className="text-muted-foreground" /></span>
                )}
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: (c.color || '#3b82f6') + '22', color: c.color || '#3b82f6' }}
                >
                  <User size={20} />
                </div>
                <span className="text-sm font-bold text-foreground">{c.name}</span>
                <span className="text-xs text-muted-foreground mt-1">{count} sportif{count > 1 ? 's' : ''}</span>
                {!canEdit(c.id) && (
                  <span className="text-xs text-muted-foreground mt-1 italic">Lecture seule</span>
                )}
                {canEdit(c.id) && c.color && (
                  <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tabs — shown only when a category is selected */}
      {selectedCategoryObj && (
        <div className="flex gap-1 border-b border-border">
          <button
            onClick={() => setCategoryTab('sportifs')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              categoryTab === 'sportifs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User size={14} /> Sportifs ({filteredSportifs.length})
          </button>
          <button
            onClick={() => setCategoryTab('equipes')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              categoryTab === 'equipes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users size={14} /> Équipes ({teams.length})
          </button>
        </div>
      )}

      {/* ── SPORTIFS TAB ── */}
      {selectedCategoryObj && categoryTab === 'sportifs' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              className="pl-9 block w-full md:w-72 rounded-md border border-input bg-background text-foreground py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSportifs.map((sportif) => {
              const spTeam = teams.find(t => t.sportifs.some(s => s.id === sportif.id));
              return (
                <div key={sportif.id} className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md hover:border-primary/40 transition-all">
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-11 w-11 rounded-full overflow-hidden border border-border bg-primary/10 flex items-center justify-center shrink-0">
                        {sportif.photoUrl ? (
                          <img src={sportif.photoUrl} alt={`${sportif.firstName} ${sportif.lastName}`} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          <Link to={`/coach/sportifs/${sportif.id}?category=${sportif.categoryId || ''}`} className="hover:text-primary">
                            {sportif.firstName} {sportif.lastName}
                          </Link>
                        </h3>
                        <p className="text-xs text-muted-foreground">{sportif.position || 'Poste non défini'}</p>
                      </div>
                    </div>
                    {spTeam && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                          <Users size={10} /> {spTeam.name}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <Link
                        to={`/coach/sportifs/${sportif.id}?category=${sportif.categoryId || ''}`}
                        className="text-sm font-medium text-primary hover:text-primary/80"
                      >
                        Voir le profil →
                      </Link>
                      {canEdit(selectedCategoryObj!.id) && (
                        <button
                          onClick={() => handleDelete(sportif.id)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredSportifs.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                Aucun sportif dans cette catégorie.
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ÉQUIPES TAB ── */}
      {selectedCategoryObj && categoryTab === 'equipes' && (
        <div className="space-y-5">

          {/* Formulaire nouvelle équipe */}
          {showTeamForm && canEdit(selectedCategoryObj.id) && (
            <form onSubmit={handleCreateTeam} className="flex items-center gap-3 bg-card border border-primary/30 rounded-xl p-4">
              <input
                type="text"
                placeholder="Nom de l'équipe (ex: Équipe A)"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <button type="submit" disabled={creatingTeam || !newTeamName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {creatingTeam ? '...' : 'Créer'}
              </button>
              <button type="button" onClick={() => { setShowTeamForm(false); setNewTeamName(''); }}
                className="px-3 py-2 border border-border rounded-md text-sm text-muted-foreground hover:bg-muted">
                Annuler
              </button>
            </form>
          )}

          {teams.length === 0 && !showTeamForm && (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              Aucune équipe créée. Cliquez sur "Nouvelle équipe" pour commencer.
            </div>
          )}

          {/* Colonnes équipes */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {teams.map(team => (
              <div key={team.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Header équipe */}
                <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-primary" />
                    <span className="font-semibold text-foreground">{team.name}</span>
                    <span className="text-xs text-muted-foreground">({team.sportifs.length})</span>
                  </div>
                  {canEdit(selectedCategoryObj.id) && (
                    <button onClick={() => handleDeleteTeam(team.id)}
                      className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-muted transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Membres */}
                <div className="divide-y divide-border">
                  {team.sportifs.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Aucun sportif assigné</p>
                  )}
                  {team.sportifs.map(sp => (
                    <div key={sp.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{sp.firstName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{sp.firstName} {sp.lastName}</p>
                          {sp.position && <p className="text-xs text-muted-foreground">{sp.position}</p>}
                        </div>
                      </div>
                      {canEdit(selectedCategoryObj.id) && (
                        <button
                          onClick={() => handleAssign(sp.id, null)}
                          disabled={assigningId === sp.id}
                          className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-muted transition-colors disabled:opacity-50"
                          title="Retirer de l'équipe"
                        >
                          {assigningId === sp.id ? '...' : '✕'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Ajouter un sportif non assigné */}
                {canEdit(selectedCategoryObj.id) && unassignedSportifs.length > 0 && (
                  <div className="px-4 py-3 border-t border-border bg-muted/10">
                    <AssignDropdown
                      sportifs={unassignedSportifs}
                      onAssign={(sportifId) => handleAssign(sportifId, team.id)}
                      assigning={assigningId}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Non assignés */}
          {catSportifs.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <User size={14} className="text-muted-foreground" />
                Sans équipe ({unassignedSportifs.length})
              </p>
              {unassignedSportifs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Tous les sportifs sont assignés à une équipe.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {unassignedSportifs.map(sp => (
                    <span key={sp.id} className="inline-flex items-center gap-1.5 text-sm bg-muted text-foreground px-3 py-1.5 rounded-full border border-border">
                      {sp.firstName} {sp.lastName}
                      {sp.position && <span className="text-xs text-muted-foreground">· {sp.position}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state when no category selected and no sportifs */}
      {!selectedCategoryObj && sportifs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
          Aucun sportif enregistré. Sélectionnez une catégorie pour en ajouter.
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-card rounded-lg shadow-xl p-8 w-full max-w-lg border border-border">
            <h2 className="text-xl font-bold mb-6 text-foreground">Ajouter un nouveau sportif</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground">Prénom</label>
                    <input type="text" required className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                        value={newSportif.firstName} onChange={e => setNewSportif({...newSportif, firstName: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground">Nom</label>
                    <input type="text" required className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                        value={newSportif.lastName} onChange={e => setNewSportif({...newSportif, lastName: e.target.value})} />
                </div>
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-foreground">Date de naissance</label>
                  <input type="date" required className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                      value={newSportif.birthDate} onChange={e => setNewSportif({...newSportif, birthDate: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-foreground">Taille (cm)</label>
                      <input type="number" className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                          value={newSportif.height} onChange={e => setNewSportif({...newSportif, height: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-foreground">Poids (kg)</label>
                      <input type="number" className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                          value={newSportif.weight} onChange={e => setNewSportif({...newSportif, weight: e.target.value})} />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-foreground">Poste</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                      value={newSportif.position} onChange={e => setNewSportif({...newSportif, position: e.target.value})} />
              </div>

              <div>
                  <label className="block text-sm font-medium text-foreground">Catégorie</label>
                  <select required className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                      value={newSportif.categoryId} onChange={e => setNewSportif({...newSportif, categoryId: e.target.value})}>
                      {categories.filter(c => canEdit(c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted" disabled={isSubmitting}>Annuler</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50" disabled={isSubmitting}>
                    {isSubmitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportifList;
