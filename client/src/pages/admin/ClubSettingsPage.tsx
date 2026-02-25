import React, { useEffect, useRef, useState } from 'react';
import { useClub } from '../../context/ClubContext';
import { updateClubSettings } from '../../services/clubService';
import { Camera, Save, X, Globe, Facebook, Instagram, Twitter, Youtube, Linkedin, MapPin, Mail, Phone } from 'lucide-react';

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
    if (file.size > 2 * 1024 * 1024) { setError('Image trop lourde (max 2 Mo)'); return; }
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
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
        logoUrl: logoUrl || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        email: contactEmail.trim() || undefined,
        phone: phone.trim() || undefined,
        ...Object.fromEntries(
          (Object.entries(socials) as [SocialKey, string][]).map(([k, v]) => [k, v.trim() || undefined])
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

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Paramètres du club</h1>

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
