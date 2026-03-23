import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClub } from '../../context/ClubContext';
import { updateClubSettings } from '../../services/clubService';
import { createPortalSession } from '../../services/stripeService';
import { Camera, Save, X, Globe, Facebook, Instagram, Twitter, Youtube, Linkedin, MapPin, Mail, Phone, Zap, ArrowRight, CreditCard } from 'lucide-react';

const TikTokIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
);

const SOCIAL_FIELDS = [
  { key: 'website',   label: 'Site web',   placeholder: 'https://www.monclub.fr',             Icon: Globe },
  { key: 'facebook',  label: 'Facebook',   placeholder: 'https://facebook.com/monclub',        Icon: Facebook },
  { key: 'instagram', label: 'Instagram',  placeholder: 'https://instagram.com/monclub',       Icon: Instagram },
  { key: 'twitter',   label: 'X / Twitter',placeholder: 'https://twitter.com/monclub',         Icon: Twitter },
  { key: 'youtube',   label: 'YouTube',    placeholder: 'https://youtube.com/@monclub',        Icon: Youtube },
  { key: 'tiktok',    label: 'TikTok',     placeholder: 'https://tiktok.com/@monclub',         Icon: TikTokIcon },
  { key: 'linkedin',  label: 'LinkedIn',   placeholder: 'https://linkedin.com/company/monclub',Icon: Linkedin },
] as const;

type SocialKey = typeof SOCIAL_FIELDS[number]['key'];

const ClubSettingsPage: React.FC = () => {
  const { club, setClub } = useClub();
  const [clubName, setClubName] = useState(club.clubName);
  const [logoUrl, setLogoUrl] = useState(club.logoUrl || '');
  const [address, setAddress] = useState(club.address || '');
  const [city, setCity] = useState(club.city || '');
  const [contactEmail, setContactEmail] = useState(club.email || '');
  const [phone, setPhone] = useState(club.phone || '');
  const [socials, setSocials] = useState<Record<SocialKey, string>>({
    website: club.website || '',
    facebook: club.facebook || '',
    instagram: club.instagram || '',
    twitter: club.twitter || '',
    youtube: club.youtube || '',
    tiktok: club.tiktok || '',
    linkedin: club.linkedin || '',
  });

  // Sync when context loads from API
  useEffect(() => {
    setClubName(club.clubName);
    setLogoUrl(club.logoUrl || '');
    setAddress(club.address || '');
    setCity(club.city || '');
    setContactEmail(club.email || '');
    setPhone(club.phone || '');
    setSocials({
      website: club.website || '',
      facebook: club.facebook || '',
      instagram: club.instagram || '',
      twitter: club.twitter || '',
      youtube: club.youtube || '',
      tiktok: club.tiktok || '',
      linkedin: club.linkedin || '',
    });
  }, [club.id]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image trop lourde (max 5 Mo)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 256;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setLogoUrl(canvas.toDataURL('image/png', 0.85));
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) { setError('Le nom du club est requis'); return; }
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const updated = await updateClubSettings({
        clubName: clubName.trim(),
        logoUrl: logoUrl || null,
        address: address.trim() || null,
        city: city.trim() || null,
        email: contactEmail.trim() || null,
        phone: phone.trim() || null,
        ...Object.fromEntries(
          (Object.entries(socials) as [SocialKey, string][]).map(([k, v]) => [k, v.trim() || null])
        ),
      });
      setClub(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.response?.data || err?.message || 'Erreur inconnue';
      console.error('Club save error:', status, msg);
      setError(`[${status || 'ERR'}] ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const [portalLoading, setPortalLoading] = useState(false);
  const isPro = club.plan === 'PRO';
  const isNearLimit = !isPro && (club.memberCount ?? 0) >= 15;
  const isOverLimit = !isPro && (club.memberCount ?? 0) >= 20;

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch { /* ignore */ } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Paramètres du club</h1>

      {/* Plan banner */}
      {isPro ? (
        <div className="flex items-center justify-between bg-blue-600/10 border border-blue-500/30 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Zap size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-300">Formule Pro</p>
              <p className="text-xs text-white/40">Membres illimités · Toutes les fonctionnalités</p>
            </div>
          </div>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/40 hover:border-blue-400 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5"
          >
            <CreditCard size={13} />
            {portalLoading ? 'Chargement…' : 'Gérer l\'abonnement'}
          </button>
        </div>
      ) : (
        <div className={`rounded-xl border px-5 py-4 ${
          isOverLimit
            ? 'bg-red-500/10 border-red-500/40'
            : isNearLimit
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-white/4 border-white/10'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold mb-0.5">
                Formule Starter — gratuite
                <span className={`ml-2 text-xs font-normal ${
                  isOverLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-white/40'
                }`}>
                  {club.memberCount ?? 0} / 20 membres
                </span>
              </p>
              {isOverLimit ? (
                <p className="text-xs text-red-300">Limite atteinte — passez en Pro pour ajouter des membres sans restriction.</p>
              ) : isNearLimit ? (
                <p className="text-xs text-yellow-300">Vous approchez de la limite. Passez en Pro avant d'atteindre 21 membres.</p>
              ) : (
                <p className="text-xs text-white/40">Jusqu'à 20 membres inclus. Passez en Pro pour une croissance sans limite.</p>
              )}
            </div>
            <Link
              to="/subscribe"
              className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              <Zap size={12} /> Passer au Pro <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Logo */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Logo du club</p>
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-border shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {clubName?.charAt(0) || 'G'}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border text-foreground hover:bg-muted"
              >
                <Camera size={15} /> Choisir un logo
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="flex items-center gap-1.5 text-xs text-destructive hover:underline"
                >
                  <X size={13} /> Supprimer le logo
                </button>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG — max 2 Mo</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
        </div>

        {/* Club name */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Nom du club</p>
          <input
            type="text"
            required
            className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
            value={clubName}
            onChange={e => { setClubName(e.target.value); setError(''); }}
            placeholder="Ex: G1Club"
          />
          <p className="text-xs text-muted-foreground mt-1">Ce nom s'affiche dans la sidebar et sur la page de connexion.</p>
        </div>

        {/* Coordonnées */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Coordonnées du club</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                <MapPin size={15} />
              </div>
              <input
                type="text"
                placeholder="Adresse (ex: 12 rue des Sports)"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background text-foreground px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground w-20 shrink-0">Adresse</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                <MapPin size={15} />
              </div>
              <input
                type="text"
                placeholder="Ville (ex: Paris)"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background text-foreground px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground w-20 shrink-0">Ville</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                <Mail size={15} />
              </div>
              <input
                type="email"
                placeholder="contact@monclub.fr"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background text-foreground px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground w-20 shrink-0">Mail</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                <Phone size={15} />
              </div>
              <input
                type="tel"
                placeholder="+33 1 23 45 67 89"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background text-foreground px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground w-20 shrink-0">Téléphone</span>
            </div>
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Réseaux sociaux & site web</p>
          <div className="space-y-3">
            {SOCIAL_FIELDS.map(({ key, label, placeholder, Icon }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                  <Icon size={15} />
                </div>
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder={placeholder}
                    value={socials[key]}
                    onChange={e => setSocials(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background text-foreground px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-500">Paramètres sauvegardés ✓</p>}

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClubSettingsPage;
