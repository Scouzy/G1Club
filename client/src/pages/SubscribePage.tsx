import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Zap, ArrowRight, X, Shield, CreditCard } from 'lucide-react';
import { createCheckoutSession } from '../services/stripeService';
import { useAuth } from '../hooks/useAuth';

const PRO_FEATURES = [
  'Membres illimités',
  'Toutes les fonctionnalités',
  'Gestion licences & renouvellements',
  'Stages & suivi paiements',
  'Statistiques avancées',
  'Support prioritaire',
];

const SubscribePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const cancelled = searchParams.get('cancelled') === '1';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    try {
      const url = await createCheckoutSession();
      window.location.href = url;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center px-6 py-16">
      {/* Back */}
      <div className="w-full max-w-2xl mb-8">
        <Link to="/dashboard" className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-2">
          ← Retour au tableau de bord
        </Link>
      </div>

      {/* Cancelled banner */}
      {cancelled && (
        <div className="w-full max-w-2xl mb-6 flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-xl px-5 py-4 text-sm">
          <X size={16} className="shrink-0" />
          Paiement annulé. Vous pouvez réessayer à tout moment.
        </div>
      )}

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <Zap size={12} />
            Formule Pro
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Passez au Pro</h1>
          <p className="text-white/50 text-lg">
            Votre club dépasse la limite de 20 membres de la formule Starter.<br />
            Passez au Pro pour continuer à grandir sans limite.
          </p>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl border border-blue-500/40 bg-blue-600/10 p-8 mb-6">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
            Recommandé
          </div>

          <div className="flex items-end gap-2 mb-6">
            <span className="text-5xl font-extrabold">39€</span>
            <span className="text-white/40 mb-1">/ mois · sans engagement</span>
          </div>

          <ul className="space-y-3 mb-8">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/80">
                <CheckCircle size={16} className="text-blue-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
              <X size={15} className="shrink-0" />
              {error}
            </div>
          )}

          {user ? (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all text-base shadow-lg shadow-blue-600/30"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirection vers le paiement…
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Souscrire maintenant — 39€/mois
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          ) : (
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all text-base"
            >
              Se connecter pour souscrire <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {/* Trust indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/30 text-xs">
          <div className="flex items-center gap-1.5">
            <Shield size={13} />
            Paiement sécurisé via Stripe
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle size={13} />
            Sans engagement — résiliable à tout moment
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard size={13} />
            CB, Visa, Mastercard acceptés
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscribePage;
