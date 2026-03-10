import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  getContacts, getMessages, sendMessage,
  getCategoryMessages, sendCategoryMessage,
  getTeamMessages, sendTeamMessage,
  getUnreadPerSender,
  Message, ContactsData, CategoryBasic, TeamBasic
} from '../../services/messageService';
import {
  getGroups, createGroup, deleteGroup, updateGroup,
  addMember, getGroupMessages, sendGroupMessage,
  Group, GroupMessage
} from '../../services/groupService';
import { Send, Users, User, Layers, ChevronLeft, Shield, ChevronDown, Plus, Search, X, Trash2, Pencil, UserPlus, UsersRound } from 'lucide-react';

type ThreadType = 'category' | 'team' | 'direct' | 'group';

interface Thread {
  type: ThreadType;
  id: string;
  label: string;
  sublabel?: string;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [coachesOpen, setCoachesOpen] = useState(true);
  const [sportifsOpen, setSportifsOpen] = useState(true);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatUsers, setNewChatUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [newChatSearch, setNewChatSearch] = useState('');

  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
  const [groupMemberSearch, setGroupMemberSearch] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');

  const loadUnread = () => {
    getUnreadPerSender().then(setUnreadMap).catch(() => {});
  };

  const openNewChat = () => {
    if (!contacts) return;
    // Build a flat list from already-loaded contacts (no extra API call needed)
    const all: { id: string; name: string; role: string }[] = [];
    (contacts.admins ?? []).forEach(a => all.push({ id: a.id, name: a.name, role: 'ADMIN' }));
    (contacts.coaches ?? []).filter(c => c.user?.id !== user?.id).forEach(c => all.push({ id: c.user.id, name: c.user.name, role: 'COACH' }));
    (contacts.sportifs ?? []).forEach(s => all.push({ id: s.user.id, name: s.user.name, role: 'SPORTIF' }));
    setNewChatUsers(all);
    setNewChatSearch('');
    setNewChatOpen(true);
  };

  const startDirectChat = (u: { id: string; name: string; role: string }) => {
    setNewChatOpen(false);
    selectThread({ type: 'direct', id: u.id, label: u.name, sublabel: u.role === 'ADMIN' ? 'Dirigeant' : u.role === 'COACH' ? 'Coach' : 'Sportif' });
  };

  const loadGroups = () => getGroups().then(setGroups).catch(() => {});

  useEffect(() => {
    Promise.all([getContacts(), getGroups()])
      .then(([c, g]) => { setContacts(c); setGroups(g); })
      .catch(console.error)
      .finally(() => setLoading(false));
    loadUnread();
  }, []);

  const activeThreadRef = React.useRef<Thread | null>(null);
  activeThreadRef.current = activeThread;

  useEffect(() => {
    if (!activeThread) return;
    loadMessages(activeThread);

    const interval = setInterval(() => {
      const t = activeThreadRef.current;
      if (!t) return;
      // Silent poll: load messages without resetting unread (already 0 for active)
      (async () => {
        try {
          if (t.type === 'group') {
            try { setGroupMessages(await getGroupMessages(t.id)); } catch { }
            return;
          }
          let msgs: Message[];
          if (t.type === 'category') msgs = await getCategoryMessages(t.id);
          else if (t.type === 'team') msgs = await getTeamMessages(t.id);
          else msgs = await getMessages(t.id);
          setMessages(msgs);
        } catch { /* silent */ }
      })();
      // Also refresh unread for other contacts
      loadUnread();
    }, 4000);

    return () => clearInterval(interval);
  }, [activeThread?.id, activeThread?.type]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (thread: Thread) => {
    try {
      if (thread.type === 'group') {
        setGroupMessages(await getGroupMessages(thread.id));
        return;
      }
      let msgs: Message[];
      if (thread.type === 'category') msgs = await getCategoryMessages(thread.id);
      else if (thread.type === 'team') msgs = await getTeamMessages(thread.id);
      else msgs = await getMessages(thread.id);
      setMessages(msgs);
      if (thread.type === 'direct') {
        window.dispatchEvent(new CustomEvent('messages-read'));
        setUnreadMap(prev => ({ ...prev, [thread.id]: 0 }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || creatingGroup) return;
    setCreatingGroup(true);
    try {
      await createGroup(newGroupName.trim(), newGroupMembers);
      await loadGroups();
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupMembers([]);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur création groupe');
    } finally { setCreatingGroup(false); }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Supprimer ce groupe ?')) return;
    try { await deleteGroup(id); await loadGroups(); if (activeThread?.id === id) setActiveThread(null); }
    catch { alert('Erreur suppression'); }
  };

  const handleRenameGroup = async (id: string) => {
    if (!editingGroupName.trim()) return;
    try { await updateGroup(id, editingGroupName.trim()); await loadGroups(); setEditingGroupId(null); }
    catch { alert('Erreur renommage'); }
  };

  const handleAddMember = async (groupId: string, userId: string) => {
    try { await addMember(groupId, userId); await loadGroups(); setShowAddMember(false); }
    catch (e: any) { alert(e?.response?.data?.message || 'Erreur ajout membre'); }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeThread || sending) return;
    setSending(true);
    try {
      if (activeThread.type === 'group') {
        await sendGroupMessage(activeThread.id, input.trim());
      } else if (activeThread.type === 'category') {
        await sendCategoryMessage(activeThread.id, input.trim());
      } else if (activeThread.type === 'team') {
        await sendTeamMessage(activeThread.id, input.trim());
      } else {
        await sendMessage(activeThread.id, input.trim());
      }
      setInput('');
      await loadMessages(activeThread);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectThread = (thread: Thread) => {
    setActiveThread(thread);
    setMessages([]);
    setInput('');
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const categories: CategoryBasic[] = contacts?.categories ?? [];
  const teams: TeamBasic[] = contacts?.teams ?? [];
  const coaches = (contacts?.coaches ?? []).filter(c => c.user?.id !== user?.id);
  const admins = contacts?.admins ?? [];
  const sportifs = contacts?.sportifs ?? [];

  // Group teams by category for display
  const teamsByCategory = teams.reduce((acc, t) => {
    const key = t.categoryId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, TeamBasic[]>);

  return (
    <>
    <div className="flex h-[calc(100vh-8rem)] bg-card border border-border rounded-xl overflow-hidden shadow-sm">

      {/* ── SIDEBAR CONTACTS ── */}
      <div className={`w-72 shrink-0 border-r border-border flex flex-col ${activeThread ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Messages</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Communiquez avec votre équipe</p>
          </div>
          <button onClick={openNewChat} className="p-1.5 rounded-full hover:bg-muted text-primary" title="Nouvelle conversation">
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Catégories + Équipes — broadcast */}
          {categories.length > 0 && (
            <div>
              {categories.map(cat => (
                <div key={`cat-${cat.id}`}>
                  {/* Catégorie entière */}
                  <p className="px-4 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={11} /> {cat.name}
                  </p>
                  <button
                    onClick={() => selectThread({ type: 'category', id: cat.id, label: cat.name, sublabel: 'Toute la catégorie' })}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left ${
                      activeThread?.type === 'category' && activeThread.id === cat.id ? 'bg-primary/10 border-r-2 border-primary' : ''
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Layers size={14} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">Toute la catégorie</p>
                      <p className="text-xs text-muted-foreground">Message groupé</p>
                    </div>
                  </button>

                  {/* Équipes de cette catégorie */}
                  {(teamsByCategory[cat.id] ?? []).map(team => (
                    <button
                      key={`team-${team.id}`}
                      onClick={() => selectThread({ type: 'team', id: team.id, label: team.name, sublabel: cat.name })}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left ${
                        activeThread?.type === 'team' && activeThread.id === team.id ? 'bg-primary/10 border-r-2 border-primary' : ''
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                        <Shield size={14} className="text-amber-600 dark:text-amber-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{team.name}</p>
                        <p className="text-xs text-muted-foreground">Équipe · {cat.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Dirigeants — section */}
          {admins.length > 0 && (
            <div>
              <p className="px-4 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={11} /> Dirigeants
              </p>
              {admins.map(admin => {
                const uc = unreadMap[admin.id] ?? 0;
                return (
                <button
                  key={`admin-${admin.id}`}
                  onClick={() => selectThread({ type: 'direct', id: admin.id, label: admin.name, sublabel: 'Dirigeant' })}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left ${
                    activeThread?.type === 'direct' && activeThread.id === admin.id ? 'bg-primary/10 border-r-2 border-primary' : uc > 0 ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <Shield size={14} className="text-purple-600 dark:text-purple-300" />
                    </div>
                    {uc > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {uc > 9 ? '9+' : uc}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${uc > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>{admin.name}</p>
                    <p className="text-xs text-muted-foreground">Dirigeant</p>
                  </div>
                </button>
                );
              })}
            </div>
          )}

          {/* Coachs — accordéon */}
          {coaches.length > 0 && (
            <div>
              <button
                onClick={() => setCoachesOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5"><Users size={11} /> Coachs ({coaches.length})</span>
                <ChevronDown size={13} className={`transition-transform ${coachesOpen ? 'rotate-180' : ''}`} />
              </button>
              {coachesOpen && (
                <div>
                  {coaches.map(coach => {
                    const uc = unreadMap[coach.user.id] ?? 0;
                    return (
                    <button
                      key={`coach-${coach.id}`}
                      onClick={() => selectThread({ type: 'direct', id: coach.user.id, label: coach.user.name, sublabel: 'Coach' })}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left ${
                        activeThread?.type === 'direct' && activeThread.id === coach.user.id ? 'bg-primary/10 border-r-2 border-primary' : uc > 0 ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Users size={14} className="text-blue-600 dark:text-blue-300" />
                        </div>
                        {uc > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {uc > 9 ? '9+' : uc}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${uc > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>{coach.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {coach.categories.map(c => c.name).join(', ') || 'Coach'}
                        </p>
                      </div>
                    </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sportifs — accordéon */}
          {sportifs.length > 0 && (
            <div>
              <button
                onClick={() => setSportifsOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5"><User size={11} /> Sportifs ({sportifs.length})</span>
                <ChevronDown size={13} className={`transition-transform ${sportifsOpen ? 'rotate-180' : ''}`} />
              </button>
              {sportifsOpen && (
                <div>
                  {sportifs.map(sp => {
                    const uc = unreadMap[sp.user.id] ?? 0;
                    return (
                    <button
                      key={`sp-${sp.id}`}
                      onClick={() => selectThread({ type: 'direct', id: sp.user.id, label: sp.user.name, sublabel: sp.category.name })}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left ${
                        activeThread?.type === 'direct' && activeThread.id === sp.user.id ? 'bg-primary/10 border-r-2 border-primary' : uc > 0 ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <User size={14} className="text-green-600 dark:text-green-300" />
                        </div>
                        {uc > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {uc > 9 ? '9+' : uc}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${uc > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>{sp.user.name}</p>
                        <p className="text-xs text-muted-foreground">{sp.category.name}</p>
                      </div>
                    </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── GROUPES DE DISCUSSION ── */}
          <div>
            <div className="w-full flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UsersRound size={11} /> Groupes ({groups.length}/20)
              </span>
              <button
                onClick={() => {
                  if (!contacts) return;
                  const all: { id: string; name: string; role: string }[] = [];
                  (contacts.admins ?? []).forEach(a => all.push({ id: a.id, name: a.name, role: 'ADMIN' }));
                  (contacts.coaches ?? []).filter(c => c.user?.id !== user?.id).forEach(c => all.push({ id: c.user.id, name: c.user.name, role: 'COACH' }));
                  (contacts.sportifs ?? []).forEach(s => all.push({ id: s.user.id, name: s.user.name, role: 'SPORTIF' }));
                  setNewChatUsers(all);
                  setShowCreateGroup(true);
                  setNewGroupName('');
                  setNewGroupMembers([]);
                  setGroupMemberSearch('');
                }}
                className="p-1 rounded hover:bg-muted text-primary"
                title="Créer un groupe"
              >
                <Plus size={13} />
              </button>
            </div>
            {groups.map(grp => (
              <div key={grp.id} className="group/grp">
                {editingGroupId === grp.id ? (
                  <form onSubmit={e => { e.preventDefault(); handleRenameGroup(grp.id); }} className="flex items-center gap-1 px-3 py-1.5">
                    <input
                      autoFocus
                      value={editingGroupName}
                      onChange={e => setEditingGroupName(e.target.value)}
                      className="flex-1 text-sm rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button type="submit" className="text-primary hover:text-primary/80"><Send size={12} /></button>
                    <button type="button" onClick={() => setEditingGroupId(null)} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
                  </form>
                ) : (
                  <button
                    onClick={() => { selectThread({ type: 'group', id: grp.id, label: grp.name, sublabel: `${grp.members.length} membres` }); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left ${
                      activeThread?.type === 'group' && activeThread.id === grp.id ? 'bg-primary/10 border-r-2 border-primary' : ''
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                      <UsersRound size={14} className="text-violet-600 dark:text-violet-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{grp.name}</p>
                      <p className="text-xs text-muted-foreground">{grp.members.length} membre{grp.members.length > 1 ? 's' : ''}</p>
                    </div>
                    {grp.creatorId === user?.id && (
                      <div className="hidden group-hover/grp:flex items-center gap-1 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); setEditingGroupId(grp.id); setEditingGroupName(grp.name); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        ><Pencil size={11} /></button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteGroup(grp.id); }}
                          className="p-1 rounded hover:bg-muted text-red-400 hover:text-red-600"
                        ><Trash2 size={11} /></button>
                      </div>
                    )}
                  </button>
                )}
              </div>
            ))}
            {groups.length === 0 && (
              <p className="px-4 pb-3 text-xs text-muted-foreground">Aucun groupe. Créez-en un !</p>
            )}
          </div>

          {categories.length === 0 && coaches.length === 0 && admins.length === 0 && sportifs.length === 0 && groups.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Aucun contact disponible.
            </div>
          )}
        </div>
      </div>

      {/* ── CONVERSATION PANEL ── */}
      <div className={`flex-1 flex flex-col ${!activeThread ? 'hidden md:flex' : 'flex'}`}>
        {!activeThread ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Send size={40} className="opacity-20" />
            <p className="text-sm">Sélectionnez une conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
              <button
                className="md:hidden p-1 rounded hover:bg-muted"
                onClick={() => setActiveThread(null)}
              >
                <ChevronLeft size={18} />
              </button>
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                activeThread.type === 'category' ? 'bg-primary/10' :
                activeThread.type === 'team' ? 'bg-amber-100 dark:bg-amber-900' :
                activeThread.type === 'group' ? 'bg-violet-100 dark:bg-violet-900' :
                activeThread.sublabel === 'Coach' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
              }`}>
                {activeThread.type === 'category'
                  ? <Layers size={16} className="text-primary" />
                  : activeThread.type === 'group'
                    ? <UsersRound size={16} className="text-violet-600 dark:text-violet-300" />
                  : activeThread.type === 'team'
                    ? <Shield size={16} className="text-amber-600 dark:text-amber-300" />
                    : activeThread.sublabel === 'Coach'
                      ? <Users size={16} className="text-blue-600 dark:text-blue-300" />
                      : <User size={16} className="text-green-600 dark:text-green-300" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{activeThread.label}</p>
                <p className="text-xs text-muted-foreground">
                  {activeThread.type === 'category'
                    ? 'Message visible par tous les membres de la catégorie'
                    : activeThread.type === 'team'
                      ? `Message visible par tous les membres de l'${activeThread.label} (${activeThread.sublabel})`
                      : activeThread.type === 'group'
                        ? activeThread.sublabel
                        : activeThread.sublabel}
                </p>
              </div>
              {/* Group actions: add member */}
              {activeThread.type === 'group' && groups.find(g => g.id === activeThread.id)?.creatorId === user?.id && (
                <button
                  onClick={() => {
                    if (contacts && newChatUsers.length === 0) {
                      const all: { id: string; name: string; role: string }[] = [];
                      (contacts.admins ?? []).forEach(a => all.push({ id: a.id, name: a.name, role: 'ADMIN' }));
                      (contacts.coaches ?? []).filter(c => c.user?.id !== user?.id).forEach(c => all.push({ id: c.user.id, name: c.user.name, role: 'COACH' }));
                      (contacts.sportifs ?? []).forEach(s => all.push({ id: s.user.id, name: s.user.name, role: 'SPORTIF' }));
                      setNewChatUsers(all);
                    }
                    setShowAddMember(true);
                    setAddMemberSearch('');
                  }}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Ajouter un membre"
                >
                  <UserPlus size={15} />
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeThread.type === 'group' ? (
                <>
                  {groupMessages.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">Aucun message. Soyez le premier à écrire !</div>
                  )}
                  {groupMessages.map(msg => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                          {!isMe && <span className="text-xs text-muted-foreground px-1">{msg.senderName}</span>}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                          }`}>{msg.content}</div>
                          <span className="text-xs text-muted-foreground px-1">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  {messages.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Aucun message. Soyez le premier à écrire !
                    </div>
                  )}
                  {messages.map(msg => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                          {!isMe && (
                            <span className="text-xs text-muted-foreground px-1">{msg.sender.name}</span>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-xs text-muted-foreground px-1">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-background">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activeThread.type === 'category'
                      ? `Message à la catégorie ${activeThread.label}…`
                      : activeThread.type === 'team'
                        ? `Message à l'${activeThread.label}…`
                        : `Message à ${activeThread.label}…`
                  }
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-input bg-background text-foreground px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[42px] max-h-32"
                  style={{ height: 'auto' }}
                  onInput={e => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = 'auto';
                    t.style.height = Math.min(t.scrollHeight, 128) + 'px';
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="h-[42px] w-[42px] shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 px-1">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
            </div>
          </>
        )}
      </div>
    </div>

    {/* ── MODALE CRÉER UN GROUPE ── */}
    {showCreateGroup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-sm flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Créer un groupe</h2>
            <button onClick={() => setShowCreateGroup(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom du groupe</label>
              <input
                autoFocus
                type="text"
                placeholder="Ex: Équipe seniors…"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                className="w-full text-sm rounded-lg border border-input bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Membres ({newGroupMembers.length + 1}/20 — vous êtes inclus)
              </label>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher…"
                  value={groupMemberSearch}
                  onChange={e => setGroupMemberSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {newChatUsers
                  .filter(u => u.name.toLowerCase().includes(groupMemberSearch.toLowerCase()))
                  .map(u => {
                    const checked = newGroupMembers.includes(u.id);
                    const limitReached = newGroupMembers.length >= 19 && !checked;
                    return (
                      <label key={u.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-muted/50 ${limitReached ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={limitReached}
                          onChange={() => setNewGroupMembers(prev =>
                            checked ? prev.filter(id => id !== u.id) : [...prev, u.id]
                          )}
                          className="accent-primary"
                        />
                        <span className="text-sm text-foreground">{u.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{u.role === 'ADMIN' ? 'Dirigeant' : u.role === 'COACH' ? 'Coach' : 'Sportif'}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-border flex justify-end gap-2">
            <button onClick={() => setShowCreateGroup(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Annuler</button>
            <button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || creatingGroup}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {creatingGroup ? 'Création…' : 'Créer le groupe'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── MODALE AJOUTER UN MEMBRE ── */}
    {showAddMember && activeThread?.type === 'group' && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-sm flex flex-col max-h-[70vh]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Ajouter un membre</h2>
            <button onClick={() => setShowAddMember(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Rechercher…"
                value={addMemberSearch}
                onChange={e => setAddMemberSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(() => {
              const grp = groups.find(g => g.id === activeThread.id);
              const existingIds = new Set(grp?.members.map(m => m.userId) ?? []);
              return newChatUsers
                .filter(u => !existingIds.has(u.id) && u.name.toLowerCase().includes(addMemberSearch.toLowerCase()))
                .map(u => (
                  <button key={u.id} onClick={() => handleAddMember(activeThread.id, u.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      u.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900' :
                      u.role === 'COACH' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
                    }`}>
                      {u.role === 'ADMIN' ? <Shield size={14} className="text-purple-600 dark:text-purple-300" /> :
                       u.role === 'COACH' ? <Users size={14} className="text-blue-600 dark:text-blue-300" /> :
                       <User size={14} className="text-green-600 dark:text-green-300" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.role === 'ADMIN' ? 'Dirigeant' : u.role === 'COACH' ? 'Coach' : 'Sportif'}</p>
                    </div>
                    <UserPlus size={14} className="text-primary shrink-0" />
                  </button>
                ));
            })()}
          </div>
        </div>
      </div>
    )}

    {/* ── MODALE NOUVELLE CONVERSATION ── */}
    {newChatOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-sm flex flex-col max-h-[70vh]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Nouveau message</h2>
            <button onClick={() => setNewChatOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                autoFocus
                value={newChatSearch}
                onChange={e => setNewChatSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {newChatUsers
              .filter(u => u.name.toLowerCase().includes(newChatSearch.toLowerCase()))
              .map(u => (
                <button key={u.id} onClick={() => startDirectChat(u)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    u.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900' :
                    u.role === 'COACH' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
                  }`}>
                    {u.role === 'ADMIN' ? <Shield size={14} className="text-purple-600 dark:text-purple-300" /> :
                     u.role === 'COACH' ? <Users size={14} className="text-blue-600 dark:text-blue-300" /> :
                     <User size={14} className="text-green-600 dark:text-green-300" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.role === 'ADMIN' ? 'Dirigeant' : u.role === 'COACH' ? 'Coach' : 'Sportif'}</p>
                  </div>
                </button>
              ))
            }
            {newChatUsers.filter(u => u.name.toLowerCase().includes(newChatSearch.toLowerCase())).length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">Aucun résultat</p>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default MessagesPage;
