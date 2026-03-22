import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../lib/axios';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lien invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <p className="text-destructive font-semibold">Lien invalide ou manquant.</p>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">Redemander un lien</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        <div>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} /> Retour à la connexion
          </Link>
        </div>

        <div className="text-center">
          <img src="/Emblème stylisé avec médaille dorée.png" alt="G1Club" className="mx-auto mb-4" style={{ width: '280px', height: '280px', objectFit: 'contain' }} />
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Nouveau mot de passe</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choisissez un nouveau mot de passe pour votre compte</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle size={28} className="text-green-400" />
                </div>
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Mot de passe modifié !</p>
                <p className="text-sm text-muted-foreground mt-1">Vous allez être redirigé vers la connexion…</p>
              </div>
              <Link to="/login" className="inline-block text-sm font-medium text-primary hover:underline">
                Se connecter maintenant
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} required autoFocus
                    className="block w-full rounded-md border border-input bg-background text-foreground px-3 py-2.5 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Au moins 6 caractères"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'} required
                    className="block w-full rounded-md border border-input bg-background text-foreground px-3 py-2.5 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Répétez le mot de passe"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p className="text-xs text-destructive mt-1">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit" disabled={loading || !password || !confirm}
                className="w-full flex justify-center rounded-md bg-primary py-2.5 px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
