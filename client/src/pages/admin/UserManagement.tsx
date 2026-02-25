import React, { useEffect, useState } from 'react';
import { User } from '../../services/authService';
import { getUsers, deleteUser, createUser } from '../../services/userService';
import { Trash2, UserPlus, Search } from 'lucide-react';
import ClubBanner from '../../components/ClubBanner';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/axios';

const UserManagement: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'SPORTIF' });
  const [allClubsUsers, setAllClubsUsers] = useState<{ clubId: string; clubName: string; logoUrl?: string | null; users: User[] }[]>([]);
  const activeClubId = localStorage.getItem('activeClubId');

  useEffect(() => {
    loadUsers();
  }, [activeClubId]);

  const loadUsers = async () => {
    try {
      if (isSuperAdmin && !activeClubId) {
        // Load all clubs with their users for global view
        const clubsRes = await api.get<{ id: string; name: string; logoUrl?: string | null; users: User[] }[]>('/club/all-with-users');
        setAllClubsUsers(clubsRes.data.map(c => ({ clubId: c.id, clubName: c.name, logoUrl: c.logoUrl, users: c.users })));
        setUsers([]);
      } else {
        const data = await getUsers();
        setUsers(data);
        setAllClubsUsers([]);
      }
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (error) {
        console.error('Failed to delete user', error);
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createUser(newUser);
      setIsModalOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'SPORTIF' });
      loadUsers();
    } catch (error) {
      console.error('Failed to create user', error);
      alert('Échec de la création de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Chargement des utilisateurs...</div>;

  const roleLabel = (role: string) => role === 'ADMIN' ? 'Dirigeant' : role === 'COACH' ? 'Coach' : 'Sportif';
  const roleBadge = (role: string) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
      ${role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
        role === 'COACH' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}`}>
      {roleLabel(role)}
    </span>
  );

  return (
    <div>
      <ClubBanner />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestion des utilisateurs</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          <UserPlus size={20} />
          Ajouter un utilisateur
        </button>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-input rounded-md leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="Rechercher des utilisateurs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Super admin global view: grouped by club */}
      {isSuperAdmin && !activeClubId && allClubsUsers.length > 0 ? (
        <div className="space-y-6">
          {allClubsUsers.map(clubGroup => {
            const filtered = clubGroup.users.filter(u =>
              u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return (
              <div key={clubGroup.clubId} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                {/* Club header */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30">
                  <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center bg-white shadow-sm border border-border shrink-0">
                    <img
                      src={clubGroup.logoUrl || '/logo_G1C_transparent.png'}
                      alt={clubGroup.clubName}
                      className="h-7 w-7 object-contain"
                    />
                  </div>
                  <span className="font-semibold text-foreground">{clubGroup.clubName}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto">{clubGroup.users.length} utilisateurs</span>
                </div>
                <ul className="divide-y divide-border">
                  {filtered.map(u => (
                    <li key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        {roleBadge(u.role)}
                      </div>
                      <button onClick={() => handleDelete(u.id)} className="text-destructive hover:text-destructive/80" title="Supprimer">
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                  {filtered.length === 0 && (
                    <li className="px-6 py-4 text-center text-muted-foreground">Aucun utilisateur trouvé</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card shadow overflow-hidden rounded-md border border-border">
          <ul className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <li key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {roleBadge(user.role)}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-destructive hover:text-destructive/80"
                    title="Supprimer l'utilisateur"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </li>
            ))}
            {filteredUsers.length === 0 && (
              <li className="px-6 py-4 text-center text-muted-foreground">Aucun utilisateur trouvé</li>
            )}
          </ul>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative bg-card rounded-lg shadow-xl p-8 w-full max-w-md border border-border">
            <h2 className="text-xl font-bold mb-4 text-foreground">Ajouter un nouvel utilisateur</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Nom</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Mot de passe</label>
                <input
                  type="password"
                  required
                  className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Rôle</label>
                <select
                  className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="SPORTIF">Sportif</option>
                  <option value="COACH">Coach</option>
                  <option value="ADMIN">Dirigeant</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  disabled={isSubmitting}
                >
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

export default UserManagement;
