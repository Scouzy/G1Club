import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Conversation, Message, getConversations, getMessages, sendMessage, UserBasic } from '../services/messageService';
import { getUsers } from '../services/userService';
import { getContacts } from '../services/messageService';
import { User, Send, Search, Megaphone, X } from 'lucide-react';
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

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeContact) {
      loadMessages(activeContact.id);
      // Ideally setup websocket or polling here
      const interval = setInterval(() => loadMessages(activeContact.id), 5000);
      return () => clearInterval(interval);
    }
  }, [activeContact]);

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
            <button onClick={openNewChat} className="text-primary hover:bg-muted p-2 rounded-full">
              <PlusIcon />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.contact.id}
              onClick={() => setActiveContact(conv.contact)}
              className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                activeContact?.id === conv.contact.id ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-medium text-foreground truncate">{conv.contact.name}</h3>
                    <span className="text-xs text-muted-foreground">
                        {new Date(conv.lastMessage.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage.content}</p>
                </div>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">Aucune conversation pour le moment. Commencez un nouveau chat !</div>
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
