import React, { useEffect, useState } from 'react';
import { Training, getTrainings, createTraining, deleteTraining } from '../../services/trainingService';
import { Category, getCategories } from '../../services/categoryService';
import { Plus, Trash2, Calendar, Clock, Layers, LayoutList, LayoutGrid } from 'lucide-react';

const TrainingList: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(
    () => (localStorage.getItem('training_view_mode') as 'list' | 'grid') ?? 'list'
  );

  const changeViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('training_view_mode', mode);
  };

  const [newTraining, setNewTraining] = useState({
    date: '',
    time: '',
    duration: 90,
    type: 'Entraînement',
    objectives: '',
    categoryId: '',
    location: '',
    opponent: '',
    result: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [trainingsData, categoriesData] = await Promise.all([
        getTrainings(), // Should filter by coach eventually?
        getCategories()
      ]);
      setTrainings(trainingsData);
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setNewTraining(prev => ({ ...prev, categoryId: categoriesData[0].id }));
      }
    } catch (error) {
      console.error('Error loading data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const dateTime = new Date(`${newTraining.date}T${newTraining.time}`);
      
      await createTraining({
          date: dateTime.toISOString(),
          duration: newTraining.duration,
          type: newTraining.type,
          objectives: newTraining.objectives,
          categoryId: newTraining.categoryId,
          location: newTraining.location,
          opponent: newTraining.opponent,
          result: newTraining.result
      });
      setIsModalOpen(false);
      setNewTraining({
        date: '', time: '', duration: 90, type: 'Entraînement', objectives: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        location: '', opponent: '', result: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating training', error);
      alert('Échec de la création de l\'entraînement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Supprimer cet entraînement ?')) {
          try {
              await deleteTraining(id);
              setTrainings(trainings.filter(t => t.id !== id));
          } catch (error) {
              console.error('Error deleting', error);
          }
      }
  }

  const selectedCategoryObj = categories.find(c => c.id === selectedCategory) || null;
  const now = new Date();

  const categoryTrainings = selectedCategory
    ? trainings.filter(t => t.categoryId === selectedCategory)
    : [];

  const seances = categoryTrainings.filter(t => t.type === 'Entraînement' || t.type === 'Récupération' || t.type === 'Stage');
  const evenements = categoryTrainings
    .filter(t => t.type === 'Match' || t.type === 'Tournoi')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const evenementsAvenir = evenements.filter(t => new Date(t.date) >= now);
  const evenementsPasses = evenements.filter(t => new Date(t.date) < now);

  if (loading) return <div>Chargement...</div>;

  const renderTrainingGrid = (training: Training) => (
    <div key={training.id} className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
          ${training.type === 'Match' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
            training.type === 'Tournoi' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
            training.type === 'Stage' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
            training.type === 'Récupération' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}`}>
          {training.type}
        </span>
        {new Date(training.date) >= now && <span className="text-xs text-primary font-medium">À venir</span>}
      </div>
      <div className="text-sm space-y-1">
        <p className="flex items-center gap-1 font-medium text-foreground">
          <Calendar size={13} className="text-muted-foreground shrink-0" />
          {new Date(training.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
        </p>
        <p className="flex items-center gap-1 text-muted-foreground">
          <Clock size={13} className="shrink-0" />
          {new Date(training.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {training.duration} min
        </p>
        {training.location && <p className="text-muted-foreground text-xs">📍 {training.location}</p>}
        {training.opponent && <p className="text-muted-foreground text-xs">🆚 {training.opponent}</p>}
        {training.result && <p className="text-xs font-semibold text-primary">🏆 {training.result}</p>}
      </div>
      <div className="flex justify-end pt-1 border-t border-border">
        <button onClick={() => handleDelete(training.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-full hover:bg-muted">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  const renderTrainingCard = (training: Training) => (
    <div key={training.id} className="bg-card rounded-xl border border-border p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary/40 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
            ${training.type === 'Match' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
              training.type === 'Tournoi' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
              training.type === 'Stage' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
              training.type === 'Récupération' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}`}>
            {training.type}
          </span>
          {new Date(training.date) >= now && (
            <span className="text-xs text-primary font-medium">À venir</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-foreground">
          <span className="flex items-center gap-1"><Calendar size={14} className="text-muted-foreground" />{new Date(training.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <span className="flex items-center gap-1"><Clock size={14} className="text-muted-foreground" />{new Date(training.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ({training.duration} min)</span>
        </div>
        {training.location && <p className="text-muted-foreground text-sm mt-1">📍 {training.location}</p>}
        {training.opponent && <p className="text-muted-foreground text-sm mt-1">🆚 vs <span className="font-medium text-foreground">{training.opponent}</span></p>}
        {training.result && <p className="text-sm mt-1 font-semibold text-primary">🏆 {training.result}</p>}
        {training.objectives && <p className="text-muted-foreground text-sm mt-1">Objectif : {training.objectives}</p>}
      </div>
      <button onClick={() => handleDelete(training.id)} className="p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-muted shrink-0">
        <Trash2 size={18} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          {selectedCategoryObj && (
            <button
              onClick={() => setSelectedCategory('')}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← Retour
            </button>
          )}
          <h1 className="text-2xl font-bold text-foreground">
            {selectedCategoryObj ? `Catégorie ${selectedCategoryObj.name}` : 'Entraînements'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-input rounded-lg p-1 bg-background">
            <button onClick={() => changeViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="Vue liste"><LayoutList size={15} /></button>
            <button onClick={() => changeViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="Vue grille"><LayoutGrid size={15} /></button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus size={20} />
            Planifier une séance
          </button>
        </div>
      </div>

      {/* Category Cards — shown only when no category selected */}
      {!selectedCategoryObj && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {categories.map(c => {
              const count = trainings.filter(t => t.categoryId === c.id).length;
              const upcoming = trainings.filter(t => t.categoryId === c.id && new Date(t.date) >= now && (t.type === 'Match' || t.type === 'Tournoi')).length;
              return (
                <button key={c.id} onClick={() => setSelectedCategory(c.id)}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all">
                  <Layers size={24} className="text-primary mb-2" />
                  <span className="text-sm font-bold text-foreground">{c.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">{count} séance{count > 1 ? 's' : ''}</span>
                  {upcoming > 0 && <span className="text-xs text-orange-500 font-medium mt-0.5">{upcoming} événement{upcoming > 1 ? 's' : ''} à venir</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map(c => {
              const count = trainings.filter(t => t.categoryId === c.id).length;
              const upcoming = trainings.filter(t => t.categoryId === c.id && new Date(t.date) >= now && (t.type === 'Match' || t.type === 'Tournoi')).length;
              return (
                <button key={c.id} onClick={() => setSelectedCategory(c.id)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Layers size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{count} séance{count > 1 ? 's' : ''}</p>
                  </div>
                  {upcoming > 0 && (
                    <span className="text-xs text-orange-500 font-semibold shrink-0">{upcoming} événement{upcoming > 1 ? 's' : ''} à venir</span>
                  )}
                </button>
              );
            })}
          </div>
        )
      )}

      {/* Category Detail View */}
      {selectedCategoryObj && (
        <div className="space-y-8">

          {/* Séances d'entraînement */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Séances d'entraînement
            </h2>
            {seances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Aucune séance planifiée.</div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{seances.map(renderTrainingGrid)}</div>
            ) : (
              <div className="space-y-3">{seances.map(renderTrainingCard)}</div>
            )}
          </section>

          {/* Événements à venir */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="text-orange-500">🏆</span> Événements à venir
            </h2>
            {evenementsAvenir.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Aucun match ou tournoi à venir.</div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{evenementsAvenir.map(renderTrainingGrid)}</div>
            ) : (
              <div className="space-y-3">{evenementsAvenir.map(renderTrainingCard)}</div>
            )}
          </section>

          {/* Événements passés */}
          {evenementsPasses.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                Événements passés
              </h2>
              {viewMode === 'grid'
                ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 opacity-70">{evenementsPasses.map(renderTrainingGrid)}</div>
                : <div className="space-y-3 opacity-70">{evenementsPasses.map(renderTrainingCard)}</div>
              }
            </section>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-card rounded-lg shadow-xl p-8 w-full max-w-lg border border-border">
            <h2 className="text-xl font-bold mb-6 text-foreground">Planifier un événement</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground">Date</label>
                    <input type="date" required className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                        value={newTraining.date} onChange={e => setNewTraining({...newTraining, date: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground">Heure</label>
                    <input type="time" required className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                        value={newTraining.time} onChange={e => setNewTraining({...newTraining, time: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-foreground">Durée (min)</label>
                      <input type="number" required className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                          value={newTraining.duration} onChange={e => setNewTraining({...newTraining, duration: parseInt(e.target.value)})} />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-foreground">Type</label>
                      <select className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                          value={newTraining.type} onChange={e => setNewTraining({...newTraining, type: e.target.value})}>
                          <option>Entraînement</option>
                          <option>Match</option>
                          <option>Tournoi</option>
                          <option>Stage</option>
                          <option>Récupération</option>
                      </select>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-foreground">Lieu</label>
                      <input type="text" className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                          value={newTraining.location} onChange={e => setNewTraining({...newTraining, location: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-foreground">Catégorie</label>
                      <select required className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                          value={newTraining.categoryId} onChange={e => setNewTraining({...newTraining, categoryId: e.target.value})}>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                  </div>
              </div>

              {(newTraining.type === 'Match' || newTraining.type === 'Tournoi') && (
                  <div>
                      <label className="block text-sm font-medium text-foreground">Adversaire</label>
                      <input type="text" className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2"
                          value={newTraining.opponent} onChange={e => setNewTraining({...newTraining, opponent: e.target.value})} />
                  </div>
              )}

              <div>
                  <label className="block text-sm font-medium text-foreground">Objectifs</label>
                  <textarea className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary border px-3 py-2" rows={3}
                      value={newTraining.objectives} onChange={e => setNewTraining({...newTraining, objectives: e.target.value})} />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted" disabled={isSubmitting}>Annuler</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50" disabled={isSubmitting}>
                    {isSubmitting ? 'Planification...' : 'Planifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingList;
