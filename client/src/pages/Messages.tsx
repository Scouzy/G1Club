import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Conversation, Message, ContactsData, getConversations, getMessages, sendMessage, UserBasic, getContacts, getUnreadPerSender } from '../services/messageService';
import { getUsers } from '../services/userService';
import { User, Send, Search, Megaphone, X, Users, Shield, ChevronDown } from 'lucide-react';
import ClubBanner from '../components/ClubBanner';
import { createAnnouncement } from '../services/announcementService';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeContact, setActiveContact] = useState<UserBasic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Sportif contacts (sidebar structurée)
  const [sportifContactsData, setSportifContactsData] = useState<ContactsData | null>(null);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [coachesOpen, setCoachesOpen] = useState(true);
  const [teammatesOpen, setTeammatesOpen] = useState(true);

  // For new chat modal/search
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserBasic[]>([]);
  const [sportifContacts, setSportifContacts] = useState<{ coaches: UserBasic[]; teammates: UserBasic[]; admins: UserBasic[] } | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // Global announcement modal (ADMIN only)
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annSending, setAnnSending] = useState(false);
  const [annSuccess, setAnnSuccess] = useState(false);

  const activeContactRef = useRef<UserBasic | null>(null);
  activeContactRef.current = activeContact;

  const loadUnread = () => getUnreadPerSender().then(setUnreadMap).catch(() => {});

  useEffect(() => {
    if (user?.role === 'SPORTIF') {
      getContacts().then(setSportifContactsData).catch(console.error).finally(() => setLoading(false));
      loadUnread();
      const interval = setInterval(loadUnread, 5000);
      return () => clearInterval(interval);
    } else {
      loadConversations();
      const interval = setInterval(loadConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeContact) {
      loadMessages(activeContact.id);
      const interval = setInterval(() => {
        const c = activeContactRef.current;
        if (c) loadMessages(c.id);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeContact?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const data = await getMessages(userId);
      setMessages(data);
      window.dispatchEvent(new CustomEvent('messages-read'));
      setConversations(prev => prev.map(c => c.contact.id === userId ? { ...c, unreadCount: 0 } : c));
      setUnreadMap(prev => ({ ...prev, [userId]: 0 }));
    } catch (error) {
      console.error('Error loading messages', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact || !newMessage.trim()) return;

    try {
      await sendMessage(activeContact.id, newMessage);
      setNewMessage('');
      loadMessages(activeContact.id);
      loadConversations(); // Update last message in sidebar
    } catch (error) {
      console.error('Error sending message', error);
    }
  };

  const openNewChat = async () => {
    try {
      if (user?.role === 'SPORTIF') {
        const contacts = await getContacts();
        setSportifContacts({
          coaches: contacts.coaches.filter(c => c.user).map(c => c.user),
          teammates: contacts.sportifs.filter(s => s.user).map(s => s.user),
          admins: contacts.admins,
        });
      } else {
        const users = await getUsers();
        setAllUsers(users.filter((u: any) => u.id !== user?.id));
      }
      setIsNewChatOpen(true);
    } catch (error) {
      console.error('Error loading users', error);
    }
  }

  const startChat = (contact: UserBasic) => {
      setActiveContact(contact);
      setIsNewChatOpen(false);
      // Check if conversation exists, if not it will be created on first message
      // But we can set empty messages for now
      setMessages([]);
  }

  const filteredUsers = allUsers.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim() || annSending) return;
    setAnnSending(true);
    try {
      await createAnnouncement(annTitle.trim(), annContent.trim());
      setAnnTitle('');
      setAnnContent('');
      setAnnSuccess(true);
      setTimeout(() => { setAnnSuccess(false); setIsAnnouncementOpen(false); }, 1500);
    } catch (error) {
      console.error('Error sending announcement', error);
    } finally {
      setAnnSending(false);
    }
  };

  if (loading) return <div>Chargement des messages...</div>;

  return (
    <>
    <ClubBanner />
    <div className="flex h-[calc(100vh-8rem)] bg-background border border-border rounded-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          <div className="flex items-center gap-1">
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setIsAnnouncementOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 px-2.5 py-1.5 rounded-md border border-amber-500/30 transition-colors"
                title="Envoyer une annonce globale au club"
              >
                <Megaphone size={13} />
                Annonce
              </button>
            )}
            {user?.role !== 'SPORTIF' && (
              <button onClick={openNewChat} className="text-primary hover:bg-muted p-2 rounded-full">
                <PlusIcon />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {user?.role === 'SPORTIF' && sportifContactsData ? (
            <>
              {/* Dirigeants */}
              {(sportifContactsData.admins ?? []).length > 0 && (
                <div>
                  <p className="px-4 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={11} /> Dirigeants
                  </p>
                  {sportifContactsData.admins.map(admin => {
                    const uc = unreadMap[admin.id] ?? 0;
                    return (
                      <div key={admin.id} onClick={() => { setActiveContact(admin); setMessages([]); }}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors ${activeContact?.id === admin.id ? 'bg-primary/10 border-r-2 border-primary' : uc > 0 ? 'bg-primary/5' : ''}`}>
                        <div className="relative shrink-0">
                          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                            <Shield size={14} className="text-purple-600 dark:text-purple-300" />
                          </div>
                          {uc > 0 && <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{uc > 9 ? '9+' : uc}</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm truncate ${uc > 0 ? 'font-bold' : 'font-medium'} text-foreground`}>{admin.name}</p>
                          <p className="text-xs text-muted-foreground">Dirigeant</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Coachs */}
              {(sportifContactsData.coaches ?? []).length > 0 && (
                <div>
                  <button onClick={() => setCoachesOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                    <span className="flex items-center gap-1.5"><Users size={11} /> Coachs ({sportifContactsData.coaches.length})</span>
                    <ChevronDown size={13} className={`transition-transform ${coachesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {coachesOpen && sportifContactsData.coaches.map(coach => {
                    const uc = unreadMap[coach.user.id] ?? 0;
                    return (
                      <div key={coach.id} onClick={() => { setActiveContact(coach.user); setMessages([]); }}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors ${activeContact?.id === coach.user.id ? 'bg-primary/10 border-r-2 border-primary' : uc > 0 ? 'bg-primary/5' : ''}`}>
                        <div className="relative shrink-0">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <Users size={14} className="text-blue-600 dark:text-blue-300" />
                          </div>
                          {uc > 0 && <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{uc > 9 ? '9+' : uc}</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm truncate ${uc > 0 ? 'font-bold' : 'font-medium'} text-foreground`}>{coach.user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{coach.categories.map(c => c.name).join(', ') || 'Coach'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Coéquipiers */}
              {(sportifContactsData.sportifs ?? []).length > 0 && (
                <div>
                  <button onClick={() => setTeammatesOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                    <span className="flex items-center gap-1.5">
                      <User size={11} />
                      {sportifContactsData.teams?.length > 0 ? `Mon équipe (${sportifContactsData.sportifs.length})` : `Coéquipiers (${sportifContactsData.sportifs.length})`}
                    </span>
                    <ChevronDown size={13} className={`transition-transform ${teammatesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {teammatesOpen && sportifContactsData.sportifs.map(sp => {
                    const uc = unreadMap[sp.user.id] ?? 0;
                    return (
                      <div key={sp.id} onClick={() => { setActiveContact(sp.user); setMessages([]); }}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors ${activeContact?.id === sp.user.id ? 'bg-primary/10 border-r-2 border-primary' : uc > 0 ? 'bg-primary/5' : ''}`}>
                        <div className="relative shrink-0">
                          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <User size={14} className="text-green-600 dark:text-green-300" />
                          </div>
                          {uc > 0 && <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{uc > 9 ? '9+' : uc}</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm truncate ${uc > 0 ? 'font-bold' : 'font-medium'} text-foreground`}>{sp.user.name}</p>
                          <p className="text-xs text-muted-foreground">{sp.category.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(sportifContactsData.admins ?? []).length === 0 && (sportifContactsData.coaches ?? []).length === 0 && (sportifContactsData.sportifs ?? []).length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">Aucun contact disponible.</div>
              )}
            </>
          ) : (
            <>
              {conversations.map((conv) => (
                <div key={conv.contact.id} onClick={() => setActiveContact(conv.contact)}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${activeContact?.id === conv.contact.id ? 'bg-muted' : conv.unreadCount > 0 ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>{conv.contact.name}</h3>
                        <span className="text-xs text-muted-foreground shrink-0 ml-1">{new Date(conv.lastMessage.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{conv.lastMessage.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">Aucune conversation pour le moment. Commencez un nouveau chat !</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeContact ? (
          <>
            <div className="p-4 bg-card border-b border-border flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{activeContact.name}</h2>
                <p className="text-xs text-muted-foreground">
                    {activeContact.role === 'ADMIN' ? 'Dirigeant' : 
                     activeContact.role === 'COACH' ? 'Coach' : 'Sportif'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-card text-foreground rounded-bl-none border border-border'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className={`text-xs block mt-1 ${isMe ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-card border-t border-border">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary p-2 border placeholder-muted-foreground"
                  placeholder="Écrivez un message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground bg-background">
            <div className="text-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <p>Sélectionnez une conversation ou commencez-en une nouvelle</p>
            </div>
          </div>
        )}
      </div>

      {/* Announcement Modal — ADMIN only */}
      {isAnnouncementOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Megaphone size={16} className="text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-foreground">Annonce globale</h3>
              </div>
              <button onClick={() => setIsAnnouncementOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
              Cette annonce sera visible par tous les membres du club sur leur Tableau de bord.
            </p>
            {annSuccess ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-semibold text-foreground">Annonce envoyée !</p>
              </div>
            ) : (
              <form onSubmit={handleSendAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Titre</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Ex: Réunion parents d'élèves..."
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                    placeholder="Contenu de l'annonce..."
                    value={annContent}
                    onChange={e => setAnnContent(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAnnouncementOpen(false)}
                    className="px-4 py-2 text-sm border border-input rounded-md text-foreground hover:bg-muted"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={annSending || !annTitle.trim() || !annContent.trim()}
                    className="px-4 py-2 text-sm bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Megaphone size={13} />
                    {annSending ? 'Envoi...' : 'Publier l\'annonce'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-card rounded-lg shadow-xl p-6 w-full max-w-md max-h-[560px] flex flex-col border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-foreground">Nouveau message</h3>
              <button onClick={() => { setIsNewChatOpen(false); setUserSearch(''); }} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-9 pr-3 py-2 border border-input bg-background text-foreground rounded-md placeholder-muted-foreground text-sm"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {user?.role === 'SPORTIF' && sportifContacts ? (
                <>
                  {/* Coaches */}
                  {sportifContacts.coaches.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1">Entraîneurs</p>
                      {sportifContacts.coaches.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                        <div key={u.id} onClick={() => startChat(u)} className="p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3 rounded-lg">
                          <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">{u.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{u.name}</p>
                            <p className="text-xs text-muted-foreground">Entraîneur</p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {/* Teammates */}
                  {sportifContacts.teammates.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1 mt-2">Coéquipiers</p>
                      {sportifContacts.teammates.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                        <div key={u.id} onClick={() => startChat(u)} className="p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3 rounded-lg">
                          <div className="h-9 w-9 bg-muted rounded-full flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-muted-foreground">{u.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{u.name}</p>
                            <p className="text-xs text-muted-foreground">Coéquipier</p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {/* Admins */}
                  {sportifContacts.admins.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1 mt-2">Dirigeants</p>
                      {sportifContacts.admins.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                        <div key={u.id} onClick={() => startChat(u)} className="p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3 rounded-lg">
                          <div className="h-9 w-9 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{u.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{u.name}</p>
                            <p className="text-xs text-muted-foreground">Dirigeant</p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {sportifContacts.coaches.length === 0 && sportifContacts.teammates.length === 0 && sportifContacts.admins.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">Aucun contact disponible.</p>
                  )}
                </>
              ) : (
                filteredUsers.map(u => (
                  <div key={u.id} onClick={() => startChat(u)} className="p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3 rounded-lg">
                    <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{u.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.role === 'ADMIN' ? 'Dirigeant' : u.role === 'COACH' ? 'Coach' : 'Sportif'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
)

export default Messages;
