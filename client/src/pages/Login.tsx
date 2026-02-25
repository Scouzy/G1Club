import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useClub } from '../context/ClubContext';
import api from '../lib/axios';
import { Search, ChevronRight, ArrowLeft, MailCheck } from 'lucide-react';

interface ClubResult {
  id: string;
  name: string;
  logoUrl?: string;
}

const Login: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [clubSearch, setClubSearch] = useState('');
  const [clubResults, setClubResults] = useState<ClubResult[]>([]);
  const [selectedClub, setSelectedClub] = useState<ClubResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { login } = useAuth();
  const { setClub } = useClub();
  const navigate = useNavigate();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (clubSearch.trim().length < 2) { setClubResults([]); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/club/search?name=${encodeURIComponent(clubSearch)}`);
        setClubResults(res.data);
      } catch {}
      setSearching(false);
    }, 300);
  }, [clubSearch]);

  const handleSelectClub = (c: ClubResult) => {
    setSelectedClub(c);
    setClub({ id: c.id, clubName: c.name, logoUrl: c.logoUrl });
    setClubResults([]);
    setClubSearch('');
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.emailNotVerified) {
        setEmailNotVerified(true);
      }
      setError(err.response?.data?.message || 'Identifiants invalides');
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du renvoi');
    } finally {
      setResendLoading(false);
    }
  };

  const logoSrc = selectedClub?.logoUrl || '/logo_G1C_transparent.png';
  const logoLabel = selectedClub?.name || 'G1Club';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex items-center justify-center"
            style={{ width: '220px', height: '220px', borderRadius: '36px', background: '#1e2d45' }}
          >
            <img
              src={logoSrc}
              alt={logoLabel}
              style={{ width: '190px', height: '190px', objectFit: 'contain' }}
            />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            {selectedClub ? selectedClub.name : 'G1Club'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 1 ? 'Sélectionnez votre club pour continuer' : 'Connectez-vous à votre espace'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">

          {/* STEP 1 — Club search */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Étape 1 — Votre club
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  autoFocus
                  className="block w-full pl-9 pr-3 py-2.5 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Rechercher votre club..."
                  value={clubSearch}
                  onChange={e => setClubSearch(e.target.value)}
                />
              </div>

              {/* Results */}
              {searching && (
                <p className="text-xs text-muted-foreground text-center">Recherche...</p>
              )}
              {clubResults.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                  {clubResults.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectClub(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-9 w-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#1e2d45' }}>
                        <img
                          src={c.logoUrl || '/logo_G1C_transparent.png'}
                          alt={c.name}
                          className="h-8 w-8 object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                      </div>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
              {clubSearch.trim().length >= 2 && !searching && clubResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Aucun club trouvé pour "<span className="font-medium">{clubSearch}</span>"
                </p>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          {/* STEP 2 — Credentials */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => { setStep(1); setSelectedClub(null); setError(''); }}
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Étape 2 — Connexion à <span className="text-foreground">{selectedClub?.name}</span>
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  id="email" type="email" autoComplete="email" required autoFocus
                  className="block w-full rounded-md border border-input bg-background text-foreground px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Mot de passe</label>
                <input
                  id="password" type="password" autoComplete="current-password" required
                  className="block w-full rounded-md border border-input bg-background text-foreground px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {error && !emailNotVerified && <p className="text-destructive text-sm">{error}</p>}

              {emailNotVerified && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <MailCheck size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-300">Email non confirmé</p>
                      <p className="text-xs text-yellow-400/80 mt-0.5">{error}</p>
                    </div>
                  </div>
                  {resendSuccess ? (
                    <p className="text-xs text-green-400 font-medium">✅ Email renvoyé ! Vérifiez votre boîte mail.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="text-xs font-semibold text-yellow-300 hover:text-yellow-200 underline disabled:opacity-50"
                    >
                      {resendLoading ? 'Envoi...' : 'Renvoyer l\'email de confirmation'}
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit" disabled={isLoading}
                className="w-full flex justify-center rounded-md bg-primary py-2.5 px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Votre club n'est pas encore inscrit ?{' '}
          <Link to="/register-club" className="font-medium text-primary hover:underline">
            Créer un club
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
