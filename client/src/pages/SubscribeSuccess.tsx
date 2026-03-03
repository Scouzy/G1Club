import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const SubscribeSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="h-20 w-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={36} className="text-green-400" />
        </div>
        <h1 className="text-3xl font-extrabold mb-3">Abonnement activé !</h1>
        <p className="text-white/50 text-lg mb-8">
          Bienvenue dans la formule <span className="text-white font-semibold">Pro</span>. 
          Votre club bénéficie maintenant de membres illimités et de toutes les fonctionnalités.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30"
        >
          Aller au tableau de bord <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
};

export default SubscribeSuccess;
