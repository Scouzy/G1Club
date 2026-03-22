import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import api from '../lib/axios';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        <div>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} /> Retour à la connexion
          </Link>
        </div>

        <div className="text-center">
          <img src="/G1C.png" alt="G1Club" className="mx-auto mb-4" style={{ width: '280px', height: '280px', objectFit: 'contain' }} />
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Mot de passe oublié</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                  <MailCheck size={28} className="text-green-400" />
                </div>
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Email envoyé !</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Si un compte existe pour <strong className="text-foreground">{email}</strong>, vous recevrez un lien valable <strong>1 heure</strong>.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Pensez à vérifier vos spams.</p>
              <Link to="/login" className="inline-block text-sm font-medium text-primary hover:underline">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  Adresse email
                </label>
                <input
                  id="email" type="email" required autoFocus
                  className="block w-full rounded-md border border-input bg-background text-foreground px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit" disabled={loading || !email.trim()}
                className="w-full flex justify-center rounded-md bg-primary py-2.5 px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
