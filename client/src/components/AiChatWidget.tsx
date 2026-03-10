import React, { useEffect, useRef, useState } from 'react';
import api from '../lib/axios';
import { Bot, X, Send, Minimize2, Maximize2, Trash2, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'ai_chat_history';

const AiChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const [model, setModel] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check Ollama status on open
  useEffect(() => {
    if (!open) return;
    api.get('/chat/status').then(r => {
      setOllamaAvailable(r.data.available);
      setModel(r.data.activeModel || '');
    }).catch(() => setOllamaAvailable(false));
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50))); } catch { }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', { messages: newMessages });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Erreur de connexion au chatbot.';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* Bouton flottant */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          title="Assistant IA"
        >
          <Bot size={24} />
        </button>
      )}

      {/* Panneau chat */}
      {open && (
        <div className={`fixed bottom-5 right-5 z-50 flex flex-col bg-card border border-border rounded-2xl shadow-2xl transition-all duration-200 ${
          minimized ? 'h-14 w-72 overflow-hidden' : 'h-[520px] w-[360px] sm:w-[400px]'
        }`}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5 rounded-t-2xl shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Assistant IA</p>
              {!minimized && (
                <p className="text-xs text-muted-foreground truncate">
                  {ollamaAvailable === null ? 'Connexion…'
                    : ollamaAvailable ? `${model} · En ligne`
                    : 'Hors ligne'}
                  <span className={`inline-block ml-1 h-1.5 w-1.5 rounded-full ${
                    ollamaAvailable === null ? 'bg-yellow-400' : ollamaAvailable ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!minimized && messages.length > 0 && (
                <button onClick={clearHistory} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Effacer">
                  <Trash2 size={13} />
                </button>
              )}
              <button onClick={() => setMinimized(v => !v)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X size={13} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Offline banner */}
              {ollamaAvailable === false && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400 shrink-0">
                  <AlertCircle size={13} /> Ollama indisponible sur le serveur
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
                    <Bot size={36} className="opacity-20" />
                    <div>
                      <p className="text-sm font-medium">Assistant sportif IA</p>
                      <p className="text-xs mt-1 opacity-70">Posez une question sur la gestion d'équipe, les entraînements, les performances…</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {['Conseils entraînement', 'Gestion d\'équipe', 'Suivi performance'].map(q => (
                        <button key={q} onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                          className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                        <Bot size={12} className="text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <Bot size={12} className="text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border bg-background rounded-b-2xl shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Posez votre question…"
                    rows={1}
                    disabled={ollamaAvailable === false}
                    className="flex-1 resize-none rounded-xl border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[38px] max-h-24 disabled:opacity-50"
                    style={{ height: 'auto' }}
                    onInput={e => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = 'auto';
                      t.style.height = Math.min(t.scrollHeight, 96) + 'px';
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading || ollamaAvailable === false}
                    className="h-[38px] w-[38px] shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 px-1">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AiChatWidget;
