import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/axios';
import { CheckCircle, XCircle, Loader2, MailCheck } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(res => {
        setMessage(res.data.message);
        setStatus('success');
      })
      .catch(err => {
        setMessage(err.response?.data?.message || 'Lien invalide ou expiré.');
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-6">

        {/* Logo */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl flex items-center justify-center" style={{ background: '#1e2d45' }}>
            <img src="/logo_G1C_transparent.png" alt="G1Club" className="h-14 w-14 object-contain" style={{ mixBlendMode: 'screen' }} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-10 shadow-sm space-y-5">
          {status === 'loading' && (
            <>
              <Loader2 size={48} className="mx-auto text-primary animate-spin" />
              <h2 className="text-xl font-bold text-foreground">Vérification en cours…</h2>
              <p className="text-sm text-muted-foreground">Veuillez patienter.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-500/15 flex items-center justify-center">
                  <CheckCircle size={36} className="text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground">Email confirmé !</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Link
                to="/login"
                className="inline-block w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90"
              >
                Se connecter
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-red-500/15 flex items-center justify-center">
                  <XCircle size={36} className="text-red-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground">Lien invalide</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
              <p className="text-xs text-muted-foreground">
                Le lien a peut-être expiré ou déjà été utilisé.
              </p>
              <Link
                to="/login"
                className="inline-block w-full py-2.5 rounded-md border border-border text-foreground text-sm hover:bg-muted"
              >
                Retour à la connexion
              </Link>
            </>
          )}

          {status === 'no-token' && (
            <>
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-yellow-500/15 flex items-center justify-center">
                  <MailCheck size={36} className="text-yellow-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground">Confirmez votre email</h2>
              <p className="text-sm text-muted-foreground">
                Vérifiez votre boîte mail et cliquez sur le lien de confirmation reçu lors de votre inscription.
              </p>
              <Link
                to="/login"
                className="inline-block w-full py-2.5 rounded-md border border-border text-foreground text-sm hover:bg-muted"
              >
                Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
