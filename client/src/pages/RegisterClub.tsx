import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { Building2, User, Mail, Lock, ChevronRight, MailCheck } from 'lucide-react';

const RegisterClub: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [clubName, setClubName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) { setError('Le nom du club est requis'); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    if (adminPassword.length < 6) { setError('Mot de passe trop court (min 6 caractères)'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/club/register', { clubName, adminName, adminEmail, adminPassword });
      setRegisteredEmail(adminEmail);
      setStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création du club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex items-center justify-center"
            style={{ width: '220px', height: '220px', borderRadius: '36px', background: '#1e2d45' }}
          >
            <img
              src="/logo_G1C_transparent.png"
              alt="G1Club"
              style={{ width: '190px', height: '190px', objectFit: 'contain' }}
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Créer votre club</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inscrivez votre club sur G1Club et gérez vos équipes
          </p>
        </div>

        {/* Steps indicator */}
        {step !== 3 && (
          <div className="flex items-center justify-center gap-3">
            <div className={`h-2 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {step === 3 ? (
            <div className="text-center space-y-5 py-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-500/15 flex items-center justify-center">
                  <MailCheck size={32} className="text-green-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Vérifiez votre email !</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Un email de confirmation a été envoyé à<br />
                  <strong className="text-foreground">{registeredEmail}</strong>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Cliquez sur le lien dans l'email pour activer votre compte, puis connectez-vous.
              </p>
              <Link
                to="/login"
                className="inline-block w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm text-center hover:bg-primary/90"
              >
                Aller à la connexion
              </Link>
            </div>
          ) : step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Étape 1 — Votre club
                </p>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nom du club
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 rounded-md border border-input bg-background text-foreground text-sm"
                    placeholder="Ex: FC Linas, AS Paris..."
                    value={clubName}
                    onChange={e => { setClubName(e.target.value); setError(''); }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Ce nom sera affiché dans l'application et sur la page de connexion.
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90"
              >
                Continuer <ChevronRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Étape 2 — Compte administrateur pour <span className="text-foreground">{clubName}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Votre nom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text" required autoFocus
                    className="w-full pl-9 pr-3 py-2.5 rounded-md border border-input bg-background text-foreground text-sm"
                    placeholder="Prénom Nom"
                    value={adminName}
                    onChange={e => { setAdminName(e.target.value); setError(''); }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email" required
                    className="w-full pl-9 pr-3 py-2.5 rounded-md border border-input bg-background text-foreground text-sm"
                    placeholder="admin@monclub.fr"
                    value={adminEmail}
                    onChange={e => { setAdminEmail(e.target.value); setError(''); }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password" required
                    className="w-full pl-9 pr-3 py-2.5 rounded-md border border-input bg-background text-foreground text-sm"
                    placeholder="Min. 6 caractères"
                    value={adminPassword}
                    onChange={e => { setAdminPassword(e.target.value); setError(''); }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password" required
                    className="w-full pl-9 pr-3 py-2.5 rounded-md border border-input bg-background text-foreground text-sm"
                    placeholder="Répétez le mot de passe"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-md border border-border text-foreground text-sm hover:bg-muted"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer le club'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterClub;
