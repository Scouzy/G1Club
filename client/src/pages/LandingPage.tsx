import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Trophy, Calendar, MessageSquare, BarChart2, Shield,
  ChevronRight, Star, CheckCircle, Menu, X, ArrowRight,
  Layers, Activity, ClipboardList, Building2, Zap, Globe,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Pour qui ?', href: '#audience' },
  { label: 'Avantages', href: '#benefits' },
  { label: 'Témoignages', href: '#testimonials' },
  { label: 'Tarifs', href: '#pricing' },
];

const FEATURES = [
  { icon: Users, title: 'Gestion des membres', desc: 'Gérez vos sportifs, coachs et dirigeants depuis un tableau de bord centralisé. Profils détaillés et suivi personnalisé.', color: 'from-blue-500 to-blue-600' },
  { icon: Trophy, title: 'Suivi des performances', desc: 'Évaluations, annotations et statistiques de progression pour chaque sportif. Identifiez les talents.', color: 'from-yellow-500 to-orange-500' },
  { icon: Calendar, title: 'Planning & Événements', desc: 'Organisez vos entraînements, matchs et événements. Créneaux horaires et gestion des présences.', color: 'from-green-500 to-emerald-600' },
  { icon: MessageSquare, title: 'Messagerie interne', desc: 'Communiquez directement entre coachs, sportifs et dirigeants. Échanges sécurisés au sein de votre club.', color: 'from-purple-500 to-violet-600' },
  { icon: BarChart2, title: 'Statistiques & Rapports', desc: 'Tableau de bord analytique : effectifs, présences, catégories actives et tendances en temps réel.', color: 'from-pink-500 to-rose-600' },
  { icon: Layers, title: 'Gestion des catégories', desc: 'Organisez vos équipes par catégories d\'âge (U6 à Séniors). Affectation automatique et flexible.', color: 'from-cyan-500 to-teal-600' },
  { icon: Shield, title: 'Multi-clubs & Isolation', desc: 'Architecture multi-tenant : chaque club dispose de son espace totalement isolé. Données privées.', color: 'from-indigo-500 to-blue-700' },
  { icon: Activity, title: 'Espace sportif', desc: 'Interface dédiée aux sportifs pour consulter leurs performances, planning et communiquer avec leur coach.', color: 'from-red-500 to-orange-600' },
];

const ROLES = [
  {
    icon: Building2, title: 'Dirigeants de club', gradient: 'from-blue-600 to-indigo-700',
    desc: 'Pilotez votre club depuis un tableau de bord complet. Gérez les utilisateurs, catégories et suivez les indicateurs clés.',
    perks: ['Vue globale du club', 'Gestion des accès', 'Paramètres personnalisés', 'Statistiques avancées'],
  },
  {
    icon: Trophy, title: 'Coachs & Entraîneurs', gradient: 'from-green-600 to-emerald-700',
    desc: 'Concentrez-vous sur l\'essentiel : vos sportifs. Planifiez, évaluez et communiquez efficacement.',
    perks: ['Fiches sportifs détaillées', 'Gestion des entraînements', 'Suivi des présences', 'Annotations & évaluations'],
  },
  {
    icon: ClipboardList, title: 'Sportifs', gradient: 'from-orange-500 to-red-600',
    desc: 'Accédez à votre espace personnel, consultez vos performances et restez connecté avec votre équipe.',
    perks: ['Tableau de bord personnel', 'Historique des performances', 'Planning des entraînements', 'Messagerie avec le coach'],
  },
];

const BENEFITS = [
  { icon: Zap, title: 'Rapide à déployer', desc: 'Créez votre club en quelques minutes. Aucune installation requise.' },
  { icon: Shield, title: 'Données sécurisées', desc: 'Isolation totale entre clubs. Vos données ne sont jamais partagées.' },
  { icon: Globe, title: 'Accessible partout', desc: 'Application web responsive, accessible depuis n\'importe quel appareil.' },
  { icon: Users, title: 'Multi-utilisateurs', desc: 'Invitez autant de coachs et sportifs que nécessaire sans limite.' },
  { icon: BarChart2, title: 'Insights en temps réel', desc: 'Statistiques et rapports mis à jour instantanément.' },
  { icon: MessageSquare, title: 'Communication centralisée', desc: 'Plus besoin de WhatsApp ou email. Tout se passe dans l\'app.' },
];

const TESTIMONIALS = [
  { name: 'Marc Dupont', role: 'Président, FC Linas', avatar: 'M', color: 'bg-blue-500', stars: 5, text: 'G1Club a transformé la gestion de notre club. En quelques clics, je visualise l\'ensemble de nos effectifs et l\'activité des coachs. Un gain de temps considérable !' },
  { name: 'Sophie Martin', role: 'Coach U14, AS Montlhéry', avatar: 'S', color: 'bg-green-500', stars: 5, text: 'La gestion des présences et les fiches sportifs sont excellentes. Je peux annoter les performances de chaque joueur directement après l\'entraînement.' },
  { name: 'Karim Benali', role: 'Directeur sportif, Club Évry', avatar: 'K', color: 'bg-purple-500', stars: 5, text: 'L\'isolation des données entre clubs est parfaite. La messagerie interne a remplacé nos groupes WhatsApp. Interface claire et intuitive.' },
];

const PRICING = [
  {
    name: 'Starter', price: 'Gratuit', period: '', highlight: false,
    desc: 'Pour démarrer et tester la plateforme',
    features: ['1 club', 'Jusqu\'à 30 membres', 'Gestion des catégories', 'Planning basique', 'Messagerie interne'],
    cta: 'Créer mon club',
  },
  {
    name: 'Pro', price: '29€', period: '/ mois', highlight: true,
    desc: 'Pour les clubs en pleine croissance',
    features: ['1 club', 'Membres illimités', 'Toutes les fonctionnalités', 'Statistiques avancées', 'Support prioritaire', 'Personnalisation du club'],
    cta: 'Commencer l\'essai',
  },
  {
    name: 'Multi-clubs', price: '79€', period: '/ mois', highlight: false,
    desc: 'Pour les fédérations et groupements',
    features: ['Clubs illimités', 'Membres illimités', 'Dashboard super admin', 'Vue consolidée', 'API disponible', 'Support dédié'],
    cta: 'Nous contacter',
  },
];

const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans">

      {/* NAVBAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0f1e]/95 backdrop-blur border-b border-white/10 shadow-xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: '#1e2d45' }}>
              <img src="/logo_G1C_transparent.png" alt="G1Club" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight">G1Club</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)} className="text-sm text-white/60 hover:text-white transition-colors">
                {l.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2">Connexion</Link>
            <Link to="/register-club" className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg transition-colors">
              Créer mon club
            </Link>
          </div>

          <button className="md:hidden text-white/70 hover:text-white" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#0d1526] border-t border-white/10 px-6 py-4 space-y-3">
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)} className="block w-full text-left text-sm text-white/70 hover:text-white py-1.5">
                {l.label}
              </button>
            ))}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link to="/login" className="text-sm text-center text-white/70 py-2">Connexion</Link>
              <Link to="/register-club" className="text-sm font-semibold text-center bg-blue-600 text-white px-5 py-2.5 rounded-lg">Créer mon club</Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/15 blur-[120px]" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-purple-600/10 blur-[100px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Logo centré en grand */}
          <div className="flex justify-center mb-8">
            <img
              src="/logo_G1C_transparent.png"
              alt="G1Club"
              className="h-44 w-44 md:h-64 md:w-64 object-contain"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>

          <div className="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
            <Zap size={12} />
            Plateforme de gestion sportive tout-en-un
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Gérez votre club<br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">comme un pro</span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            G1Club centralise la gestion de vos sportifs, coachs, entraînements et communications.
            Une plateforme moderne, sécurisée et multi-clubs pour les clubs de football et sports collectifs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/register-club" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-blue-600/30 hover:-translate-y-0.5">
              Créer mon club gratuitement <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 text-white font-medium px-8 py-4 rounded-xl text-base transition-all">
              Se connecter <ChevronRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[{ value: '500+', label: 'Clubs actifs' }, { value: '15 000+', label: 'Sportifs suivis' }, { value: '98%', label: 'Satisfaction' }].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold">{s.value}</p>
                <p className="text-xs text-white/40 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Fonctionnalités</p>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Tout ce dont votre club a besoin</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">Une suite complète d'outils pensés pour simplifier la gestion quotidienne de votre club sportif.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="group bg-white/4 hover:bg-white/7 border border-white/8 hover:border-white/15 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1">
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section id="audience" className="py-24 px-6 bg-white/2">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Pour qui ?</p>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Une plateforme pour tous les acteurs</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">Chaque rôle dispose d'une interface adaptée à ses besoins spécifiques.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROLES.map(r => (
              <div key={r.title} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 p-8 flex flex-col">
                <div className={`absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br ${r.gradient} opacity-10 blur-2xl -translate-y-1/2 translate-x-1/2`} />
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                  <r.icon size={22} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{r.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-6">{r.desc}</p>
                <ul className="space-y-2 mt-auto">
                  {r.perks.map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckCircle size={14} className="text-green-400 shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Avantages</p>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                Pourquoi choisir<br />
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">G1Club ?</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed mb-8">Conçu par des passionnés de sport, G1Club répond aux vrais besoins des clubs modernes. Simple à utiliser, puissant sous le capot.</p>
              <Link to="/register-club" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30">
                Démarrer gratuitement <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BENEFITS.map(b => (
                <div key={b.title} className="bg-white/4 border border-white/8 rounded-xl p-5 hover:bg-white/7 hover:border-white/15 transition-all">
                  <div className="h-9 w-9 rounded-lg bg-blue-600/20 flex items-center justify-center mb-3">
                    <b.icon size={17} className="text-blue-400" />
                  </div>
                  <h4 className="font-bold text-sm mb-1">{b.title}</h4>
                  <p className="text-xs text-white/50 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 px-6 bg-white/2">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Témoignages</p>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Ils nous font confiance</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">Des clubs de toutes tailles utilisent G1Club au quotidien.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white/4 border border-white/8 rounded-2xl p-7 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-white/70 text-sm leading-relaxed flex-1 mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Tarifs</p>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Simple et transparent</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">Commencez gratuitement, évoluez selon vos besoins. Sans engagement.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PRICING.map(p => (
              <div key={p.name} className={`relative rounded-2xl border p-8 flex flex-col transition-all ${p.highlight ? 'bg-blue-600/15 border-blue-500/50 shadow-2xl shadow-blue-600/20 scale-105' : 'bg-white/4 border-white/10'}`}>
                {p.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">Populaire</div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-1">{p.name}</h3>
                  <p className="text-white/50 text-sm mb-4">{p.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold">{p.price}</span>
                    {p.period && <span className="text-white/40 text-sm mb-1">{p.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                      <CheckCircle size={15} className={p.highlight ? 'text-blue-400' : 'text-green-400'} />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/register-club" className={`text-center font-bold py-3 rounded-xl transition-all text-sm ${p.highlight ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30' : 'bg-white/8 hover:bg-white/15 border border-white/15 text-white'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative rounded-3xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/10 p-16">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-blue-600/20 blur-[80px]" />
            </div>
            <div className="relative z-10">
              <div className="h-36 w-36 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{ background: '#1e2d45' }}>
                <img src="/logo_G1C_transparent.png" alt="G1Club" className="h-28 w-28 object-contain" style={{ mixBlendMode: 'screen' }} />
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Prêt à transformer<br />votre club ?</h2>
              <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
                Rejoignez des centaines de clubs qui font confiance à G1Club pour gérer leurs équipes au quotidien.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register-club" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-blue-600/30 hover:-translate-y-0.5">
                  Créer mon club gratuitement <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="flex items-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 text-white font-medium px-8 py-4 rounded-xl text-base transition-all">
                  J'ai déjà un compte <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/8 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#1e2d45' }}>
              <img src="/logo_G1C_transparent.png" alt="G1Club" className="h-6 w-6 object-contain" />
            </div>
            <span className="font-bold text-white">G1Club</span>
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} G1Club — Plateforme de gestion sportive. Tous droits réservés.</p>
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-xs text-white/40 hover:text-white/70 transition-colors">Connexion</Link>
            <Link to="/register-club" className="text-xs text-white/40 hover:text-white/70 transition-colors">Créer un club</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
