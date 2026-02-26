import React, { useEffect, useState } from 'react';
import { useSidebar } from '../context/SidebarContext';
import { useClub } from '../context/ClubContext';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';
import {
  Home,
  MessageSquare,
  Users,
  Layers,
  Calendar,
  User,
  Activity,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  Trophy,
  Settings,
  ClipboardList,
  Building2,
  Globe,
  Check,
  FileText,
  Wallet,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface ClubOption {
  id: string;
  name: string;
  logoUrl?: string | null;
  _count: { users: number; categories: number };
}

interface NavItem {
  label: string;
  path?: string;
  icon: React.ElementType;
  roles?: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Tableau de bord',
    path: '/dashboard',
    icon: Home,
    roles: ['ADMIN', 'COACH', 'SPORTIF'],
  },
  {
    label: 'Gestion Sportive',
    icon: Trophy,
    roles: ['ADMIN'],
    children: [
      { label: 'Coachs',     path: '/admin/coaches',  icon: Users },
      { label: 'Sportifs',   path: '/coach/sportifs', icon: User },
      { label: 'Événements', path: '/coach/events',   icon: Calendar },
    ],
  },
  {
    label: 'Gestion Paiements',
    icon: Wallet,
    roles: ['ADMIN'],
    children: [
      { label: 'Licences', path: '/admin/licences', icon: FileText },
      { label: 'Stages',   path: '/admin/stages',   icon: Calendar },
    ],
  },
  {
    label: 'Gestion Sportive',
    icon: Trophy,
    roles: ['COACH'],
    children: [
      { label: 'Entraîneurs', path: '/coach/team',     icon: Users },
      { label: 'Sportifs',   path: '/coach/sportifs', icon: User },
      { label: 'Événements', path: '/coach/events',   icon: Calendar },
    ],
  },
  {
    label: 'Communication',
    icon: MessageSquare,
    roles: ['COACH'],
    children: [
      { label: 'Messages', path: '/coach/messages', icon: MessageSquare },
    ],
  },
  {
    label: 'Mes Performances',
    icon: ClipboardList,
    roles: ['SPORTIF'],
    children: [
      { label: 'Mon tableau de bord', path: '/sportif',        icon: Activity },
      { label: 'Mes Événements',      path: '/sportif/events', icon: Calendar },
    ],
  },
  {
    label: 'Communication',
    icon: MessageSquare,
    roles: ['ADMIN', 'SPORTIF'],
    children: [
      { label: 'Messages', path: '/messages', icon: MessageSquare },
    ],
  },
  {
    label: 'Administration',
    icon: Settings,
    roles: ['ADMIN'],
    children: [
      { label: 'Utilisateurs', path: '/admin/users',       icon: Users },
      { label: 'Catégories',   path: '/admin/categories',  icon: Layers },
      { label: 'Mon Club',     path: '/admin/club',        icon: Building2 },
    ],
  },
];

const Sidebar: React.FC = () => {
  const { user, logout, originalRole, impersonateRole, isSuperAdmin } = useAuth();
  const { club, setClub } = useClub();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, setCollapsed } = useSidebar();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showClubSwitcher, setShowClubSwitcher] = useState(false);
  const [allClubs, setAllClubs] = useState<ClubOption[]>([]);
  const [activeClubId, setActiveClubId] = useState<string | null>(
    () => localStorage.getItem('activeClubId')
  );
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isSuperAdmin) {
      api.get('/club/all').then(r => setAllClubs(r.data)).catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      api.get<{ count: number }>('/messages/unread-count')
        .then(r => setUnreadCount(r.data.count))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    window.addEventListener('messages-read', fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener('messages-read', fetchUnread);
    };
  }, [user]);

  const switchClub = (c: ClubOption | null) => {
    if (c) {
      localStorage.setItem('activeClubId', c.id);
      setActiveClubId(c.id);
      setClub({ id: c.id, clubName: c.name, logoUrl: c.logoUrl ?? undefined });
    } else {
      localStorage.removeItem('activeClubId');
      setActiveClubId(null);
      setClub({ id: '', clubName: 'G1Club — Tous les clubs' });
    }
    setShowClubSwitcher(false);
    // Reload page to refresh all data with new club context
    window.location.reload();
  };

  const activeClub = allClubs.find(c => c.id === activeClubId) ?? null;

  const filtered = navItems.filter(
    item => !item.roles || (user && item.roles.includes(user.role))
  );

  const isActive = (path?: string) => !!path && location.pathname === path;
  const groupHasActive = (item: NavItem) => !!item.children?.some(c => isActive(c.path));

  useEffect(() => {
    const activeGroups = filtered
      .filter(item => item.children && groupHasActive(item))
      .map(item => item.label);
    setExpanded(prev => Array.from(new Set([...prev, ...activeGroups])));
  }, [location.pathname]);

  const toggleCollapsed = () => {
    if (!collapsed) setExpanded([]);
    setCollapsed(!collapsed);
  };

  const toggle = (label: string) =>
    setExpanded(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );

  const closeMobile = () => setMobileOpen(false);

  const sidebarWidth = collapsed ? 'w-16' : 'w-64';

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md shadow-lg border border-white/10"
        style={{ background: 'hsl(222, 47%, 9%)' }}
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          border-r border-white/10
          ${sidebarWidth} transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
        style={{ background: 'hsl(222, 47%, 9%)' }}
      >
        {/* Logo + collapse toggle */}
        <div className="border-b border-white/10 shrink-0 relative">
          <div className="h-16 flex items-center px-4">
            <div className="h-9 w-9 rounded-lg shrink-0 overflow-hidden flex items-center justify-center" style={{ background: '#1e2d45' }}>
              <img
                src={club.logoUrl || '/logo_G1C_transparent.png'}
                alt={club.clubName || 'G1Club'}
                className="h-8 w-8 object-contain"
              />
            </div>
            {!collapsed && (
              <span className="ml-3 text-white font-bold text-lg tracking-tight truncate flex-1">{club.clubName || 'G1Club'}</span>
            )}
            {/* Desktop collapse button */}
            <button
              onClick={toggleCollapsed}
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary items-center justify-center shadow-md hover:bg-primary/90 transition-colors z-10"
              title={collapsed ? 'Agrandir' : 'Réduire'}
            >
              <ChevronLeft size={13} className={`text-primary-foreground transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Club switcher — super admin only, expanded mode */}
          {isSuperAdmin && !collapsed && (
            <div className="px-4 pb-3">
              <button
                onClick={() => setShowClubSwitcher(s => !s)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left"
              >
                <Globe size={13} className="text-primary shrink-0" />
                <span className="text-xs text-white/70 truncate flex-1">
                  {activeClub ? activeClub.name : 'Tous les clubs'}
                </span>
                <ChevronDown size={12} className={`text-white/40 transition-transform ${showClubSwitcher ? 'rotate-180' : ''}`} />
              </button>

              {showClubSwitcher && (
                <div className="mt-1 rounded-md border border-white/10 bg-[hsl(222,47%,7%)] overflow-hidden shadow-xl">
                  {/* All clubs option */}
                  <button
                    onClick={() => switchClub(null)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/8 transition-colors text-left border-b border-white/10"
                  >
                    <div className="h-6 w-6 rounded flex items-center justify-center bg-primary/20 shrink-0">
                      <Globe size={12} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">Tous les clubs</p>
                      <p className="text-[10px] text-white/40">Vue globale</p>
                    </div>
                    {!activeClubId && <Check size={12} className="text-primary shrink-0" />}
                  </button>

                  {/* Individual clubs */}
                  {allClubs.map(c => (
                    <button
                      key={c.id}
                      onClick={() => switchClub(c)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/8 transition-colors text-left"
                    >
                      <div className="h-6 w-6 rounded shrink-0 overflow-hidden flex items-center justify-center" style={{ background: '#1e2d45' }}>
                        <img
                          src={c.logoUrl || '/logo_G1C_transparent.png'}
                          alt={c.name}
                          className="h-5 w-5 object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{c.name}</p>
                        <p className="text-[10px] text-white/40">{c._count.users} utilisateurs · {c._count.categories} catégories</p>
                      </div>
                      {activeClubId === c.id && <Check size={12} className="text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User block */}
        <div className={`border-b border-white/10 shrink-0 ${collapsed ? 'py-3 flex justify-center' : 'px-4 py-3'}`}>
          {collapsed ? (
            <div className="relative group">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm cursor-default">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-white/10">
                {user?.name} — {user?.role === 'ADMIN' ? 'Dirigeant' : user?.role === 'COACH' ? 'Entraîneur' : 'Sportif'}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-white/50 truncate">
                    {user?.role === 'ADMIN' ? 'Dirigeant' : user?.role === 'COACH' ? 'Entraîneur' : 'Sportif'}
                  </p>
                </div>
                {originalRole === 'ADMIN' && user?.email === 'admin@sportemergence.com' && (
                  <button
                    onClick={() => setShowRoleSwitcher(s => !s)}
                    className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded hover:bg-primary/30 transition-colors shrink-0"
                  >
                    Vue
                  </button>
                )}
              </div>
              {originalRole === 'ADMIN' && user?.email === 'admin@sportemergence.com' && showRoleSwitcher && (
                <div className="mt-2 p-2 bg-white/5 border border-white/10 rounded-md">
                  <p className="text-xs font-semibold mb-1.5 text-white/40 uppercase tracking-wide">Voir en tant que</p>
                  {(['ADMIN', 'COACH', 'SPORTIF'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => { impersonateRole(role); setShowRoleSwitcher(false); }}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded mb-0.5 transition-colors ${
                        user?.role === role
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {role === 'ADMIN' ? 'Dirigeant (Admin)' : role === 'COACH' ? 'Entraîneur' : 'Sportif'}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto py-4 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
          {!collapsed && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 pb-2 pt-1">
              Navigation
            </p>
          )}

          {filtered.map(item => {
            const isExpanded = expanded.includes(item.label);
            const hasActive = groupHasActive(item);

            // Collapsed mode: show icon only with tooltip, link to first child or path
            if (collapsed) {
              const target = item.path || item.children?.[0]?.path || '/';
              const active = isActive(item.path) || hasActive;
              return (
                <div key={item.label} className="relative group">
                  <Link
                    to={target}
                    onClick={closeMobile}
                    className={`flex items-center justify-center h-10 w-10 mx-auto rounded-md transition-colors ${
                      active ? 'bg-primary text-primary-foreground' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon size={19} />
                  </Link>
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-white/10 pointer-events-none">
                    {item.label}
                  </div>
                </div>
              );
            }

            // Expanded mode: full labels
            if (!item.children) {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path!}
                  onClick={closeMobile}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    active ? 'bg-primary text-primary-foreground' : 'text-white/70 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <item.icon size={18} className={active ? 'text-primary-foreground' : 'text-white/50'} />
                  {item.label}
                </Link>
              );
            }

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggle(item.label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                    hasActive && !isExpanded ? 'text-white bg-white/8' : 'text-white/80 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={hasActive ? 'text-primary' : 'text-white/50'} />
                    {item.label}
                  </div>
                  <ChevronDown
                    size={15}
                    className={`text-white/40 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-0.5 mb-1 ml-4 pl-4 border-l border-white/10 space-y-0.5">
                    {item.children.map(sub => {
                      const active = isActive(sub.path);
                      const isMessages = sub.label === 'Messages';
                      return (
                        <Link
                          key={sub.label}
                          to={sub.path!}
                          onClick={closeMobile}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                            active ? 'bg-primary text-primary-foreground font-medium' : 'text-white/60 hover:bg-white/8 hover:text-white'
                          }`}
                        >
                          <sub.icon size={15} className={active ? 'text-primary-foreground' : 'text-white/40'} />
                          <span className="flex-1">{sub.label}</span>
                          {isMessages && unreadCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`border-t border-white/10 shrink-0 ${collapsed ? 'py-3 flex flex-col items-center gap-2' : 'px-4 py-3 space-y-1'}`}>
          {collapsed ? (
            <>
              <div className="relative group">
                <div className="flex items-center justify-center h-10 w-10 rounded-md text-white/40 hover:bg-white/10 hover:text-white cursor-pointer transition-colors">
                  <ThemeToggle />
                </div>
              </div>
              <div className="relative group">
                <button
                  onClick={logout}
                  className="flex items-center justify-center h-10 w-10 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={18} />
                </button>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-white/10 pointer-events-none">
                  Déconnexion
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs text-white/40">Thème</span>
                <ThemeToggle />
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
              >
                <LogOut size={17} />
                Déconnexion
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={closeMobile}
        />
      )}
    </>
  );
};

export default Sidebar;
