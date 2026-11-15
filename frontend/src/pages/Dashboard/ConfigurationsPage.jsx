import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Tabs } from '../../components/admin/AdminUI';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import dashboardService from '../../services/dashboard';
import appSettingsService from '../../services/appSettings';
import { DashboardPageLoader } from '../../components/DashboardSkeletons';
import { DEFAULT_SHIPPING_ZONES, validateShippingZones } from '../../utils/shippingZones';
import { setCatalogShippingZones } from '../../utils/catalogCache';
import { resolveMediaUrl } from '../../config/env';
import { HERO_DEFAULTS, FALLBACK_CAROUSEL, DEFAULT_TESTIMONIALS } from '../../constants/siteDefaults';

/* ---------- Icônes ---------- */
function TruckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg className="w-8 h-8 text-[#bbb]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

/* ---------- Helpers UI ---------- */
const inputCls = 'w-full h-10 px-3.5 border border-[#d9d9d9] rounded bg-white text-[13.5px] text-[#111] outline-none focus:border-[#111] transition-colors';
const labelCls = 'block text-[13px] font-medium text-[#222] mb-1.5';
const sectionTitle = 'text-[15px] font-semibold tracking-[-0.02em] text-[#111] flex items-center gap-2';
const saveBtnCls = 'w-full sm:w-auto inline-flex items-center justify-center h-10 px-4 rounded bg-[#111] text-white text-[13px] font-semibold hover:bg-[#333] transition-colors disabled:opacity-50';


function ConfigBadge({ configured }) {
  return (
    <span className={`hidden sm:inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full border shrink-0 ${
      configured
        ? 'bg-[#e7f6ec] text-[#166534] border-transparent'
        : 'bg-[#fff4e0] text-[#8a4b00] border-transparent'
    }`}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
      {configured ? 'Personnalisé' : 'Contenu par défaut'}
    </span>
  );
}

function StatusBadge({ msg }) {
  if (!msg?.text) return null;
  return (
    <AnimatePresence>
      <motion.span
        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
        className={`text-xs font-medium px-3 py-1.5 rounded border ${msg.type === 'success' ? 'bg-[#e7f6ec] text-[#166534] border-transparent' : 'bg-[#fdeaea] text-[#b42318] border-transparent'}`}
      >
        {msg.text}
      </motion.span>
    </AnimatePresence>
  );
}

/* ---------- Formulaire zone livraison ---------- */
function ZoneForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [price, setPrice] = useState(initial?.price || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Le nom de la zone est obligatoire.'); return; }
    if (!price || Number(price) < 0) { setError('Un tarif valide est requis.'); return; }
    onSave({ id: initial?.id || Date.now(), name: name.trim(), price: Number(price) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className={labelCls}>Nom de la zone</label>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="Ex: Cocody, Yopougon..." className={inputCls} />
        </div>
        <div className="sm:w-40">
          <label className={labelCls}>Tarif (FCFA)</label>
          <input type="number" min="0" value={price} onChange={(e) => { setPrice(e.target.value); setError(''); }} className={inputCls} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-[#e0e0e0] text-[#555] rounded text-xs font-medium hover:bg-[#fafafa] transition-colors">Annuler</button>
        <button type="submit" className="px-4 py-2 bg-[#111] text-white rounded text-xs font-medium hover:bg-[#333] transition-colors">{initial ? 'Modifier' : 'Ajouter'}</button>
      </div>
    </form>
  );
}

/* ---------- Formulaire témoignage ---------- */
function TestimonialForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [role, setRole] = useState(initial?.role || '');
  const [comment, setComment] = useState(initial?.comment || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) { setError('Nom et commentaire sont obligatoires.'); return; }
    onSave({ name: name.trim(), role: role.trim(), comment: comment.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nom *</label>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="Amina K." className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Rôle</label>
          <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Cliente fidèle" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Commentaire *</label>
        <textarea value={comment} onChange={(e) => { setComment(e.target.value); setError(''); }} rows="3" placeholder="Son témoignage..." className={`${inputCls} resize-none`} />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-[#e0e0e0] text-[#555] rounded text-xs font-medium hover:bg-[#fafafa] transition-colors">Annuler</button>
        <button type="submit" className="px-4 py-2 bg-[#111] text-white rounded text-xs font-medium hover:bg-[#333] transition-colors">{initial ? 'Modifier' : 'Ajouter'}</button>
      </div>
    </form>
  );
}

/* ---------- Page principale ---------- */
export default function ConfigurationsPage() {
  const { shippingZones, setShippingZones, isLoading } = useDashboardData();

  const [activeTab, setActiveTab] = useState('hero');

  // Messages de statut par section
  const [status, setStatus] = useState({});
  const showStatus = (section, type, text) => {
    setStatus(prev => ({ ...prev, [section]: { type, text } }));
    setTimeout(() => setStatus(prev => ({ ...prev, [section]: null })), 4000);
  };

  /* ── Livraison ── */
  const [isSavingZones, setIsSavingZones] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  /* ── Hero ── */
  const [hero, setHero] = useState(HERO_DEFAULTS);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState(HERO_DEFAULTS.image_url);
  const [isSavingHero, setIsSavingHero] = useState(false);

  /* ── Carrousel ── */
  const [carouselImages, setCarouselImages] = useState(FALLBACK_CAROUSEL);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [isSavingCarousel, setIsSavingCarousel] = useState(false);

  /* ── Témoignages ── */
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);
  const [editingTestimonial, setEditingTestimonial] = useState(null); // index ou null
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [isSavingTestimonials, setIsSavingTestimonials] = useState(false);

  /* ── Logo ── */
  const [logo, setLogo] = useState({ url: null });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  /* ── Contact & Réseaux sociaux ── */
  const [contactInfo, setContactInfo] = useState({ whatsapp: '', email: '', address: '' });
  const [socialLinks, setSocialLinks] = useState({ instagram: '', facebook: '', tiktok: '', pinterest: '' });
  const [isSavingContact, setIsSavingContact] = useState(false);

  /* ── Bannière promotionnelle ── */

  /* ── Chargement initial des settings ── */
  useEffect(() => {
    appSettingsService.getSetting('hero')
      .then(data => {
        if (data && !Array.isArray(data) && Object.keys(data).length) {
          setHero(prev => ({ ...prev, ...data }));
          if (data.image_url) {
            setHeroImagePreview(data.image_url.startsWith('/storage') ? resolveMediaUrl(data.image_url) : data.image_url);
          }
        }
      }).catch(() => {});

    appSettingsService.getSetting('carousel')
      .then(data => { if (Array.isArray(data) && data.length) setCarouselImages(data); })
      .catch(() => {});

    appSettingsService.getSetting('testimonials')
      .then(data => { if (Array.isArray(data) && data.length) setTestimonials(data); })
      .catch(() => {});

    appSettingsService.getSetting('logo')
      .then(data => {
        if (data && !Array.isArray(data) && data.url) {
          setLogo(data);
          setLogoPreview(resolveMediaUrl(data.url));
        }
      }).catch(() => {});

    appSettingsService.getSetting('contact_info')
      .then(data => { if (data && !Array.isArray(data)) setContactInfo(prev => ({ ...prev, ...data })); })
      .catch(() => {});

    appSettingsService.getSetting('social_links')
      .then(data => { if (data && !Array.isArray(data)) setSocialLinks(prev => ({ ...prev, ...data })); })
      .catch(() => {});

  }, []);

  /* ── Handlers livraison (existants) ── */
  const handleAddZone = (z) => { setShippingZones(prev => [z, ...prev]); setShowAddForm(false); };
  const handleUpdateZone = (z) => { setShippingZones(prev => prev.map(x => x.id === z.id ? z : x)); setEditingZone(null); };
  const handleDeleteZone = (id) => { setShippingZones(prev => prev.filter(z => z.id !== id)); if (editingZone?.id === id) setEditingZone(null); };
  const loadDefaultZones = () => setShippingZones(DEFAULT_SHIPPING_ZONES.map(z => ({ ...z })));

  const saveShippingTariffs = async () => {
    const err = validateShippingZones(shippingZones);
    if (err) { showStatus('zones', 'error', err); return; }
    const payload = shippingZones.map(({ id, name, price }) => ({ id, name: name.trim(), price: Number(price) }));
    try {
      setIsSavingZones(true);
      await dashboardService.updateShippingZones(payload);
      setShippingZones(payload);
      setCatalogShippingZones(payload);
      showStatus('zones', 'success', 'Tarifs enregistrés.');
    } catch { showStatus('zones', 'error', 'Erreur de sauvegarde.'); }
    finally { setIsSavingZones(false); }
  };

  /* ── Handlers Hero ── */
  const handleHeroImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setHeroImageFile(file);
    setHeroImagePreview(URL.createObjectURL(file));
  };

  const saveHero = async () => {
    // S-03 : valider que le lien CTA est une URL relative (pas d'open redirect)
    if (hero.cta_link && !/^\/[^/]/.test(hero.cta_link)) {
      showStatus('hero', 'error', 'Le lien CTA doit être une URL relative commençant par / (ex: /products)');
      return;
    }
    setIsSavingHero(true);
    try {
      let imageUrl = hero.image_url;
      if (heroImageFile) {
        imageUrl = await appSettingsService.uploadImage(heroImageFile);
        setHeroImageFile(null);
      }
      const payload = { ...hero, image_url: imageUrl };
      await appSettingsService.updateSetting('hero', payload);
      setHero(payload);
      showStatus('hero', 'success', 'Hero enregistré.');
    } catch { showStatus('hero', 'error', 'Erreur de sauvegarde.'); }
    finally { setIsSavingHero(false); }
  };

  /* ── Handlers Carrousel ── */
  const handleCarouselUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingImg(true);
    try {
      const url = await appSettingsService.uploadImage(file);
      setCarouselImages(prev => [...prev, url]);
    } catch { showStatus('carousel', 'error', "Erreur d'upload."); }
    finally { setIsUploadingImg(false); e.target.value = ''; }
  };

  const saveCarousel = async () => {
    setIsSavingCarousel(true);
    try {
      await appSettingsService.updateSetting('carousel', carouselImages);
      showStatus('carousel', 'success', 'Carrousel enregistré.');
    } catch { showStatus('carousel', 'error', 'Erreur de sauvegarde.'); }
    finally { setIsSavingCarousel(false); }
  };

  /* ── Handlers Témoignages ── */
  const handleSaveTestimonial = (t) => {
    if (editingTestimonial !== null) {
      setTestimonials(prev => prev.map((x, i) => i === editingTestimonial ? t : x));
    } else {
      setTestimonials(prev => [...prev, t]);
    }
    setEditingTestimonial(null);
    setShowTestimonialForm(false);
  };

  const saveTestimonials = async () => {
    setIsSavingTestimonials(true);
    try {
      await appSettingsService.updateSetting('testimonials', testimonials);
      showStatus('testimonials', 'success', 'Témoignages enregistrés.');
    } catch { showStatus('testimonials', 'error', 'Erreur de sauvegarde.'); }
    finally { setIsSavingTestimonials(false); }
  };

  /* ── Handlers Logo ── */
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const saveLogo = async () => {
    setIsSavingLogo(true);
    try {
      let url = logo.url;
      if (logoFile) {
        url = await appSettingsService.uploadImage(logoFile);
        setLogoFile(null);
      }
      const payload = { url };
      await appSettingsService.updateSetting('logo', payload);
      setLogo(payload);
      showStatus('logo', 'success', 'Logo enregistré.');
    } catch { showStatus('logo', 'error', 'Erreur de sauvegarde.'); }
    finally { setIsSavingLogo(false); }
  };

  /* ── Handlers Contact & Social ── */
  const saveContact = async () => {
    setIsSavingContact(true);
    try {
      await Promise.all([
        appSettingsService.updateSetting('contact_info', contactInfo),
        appSettingsService.updateSetting('social_links', socialLinks),
      ]);
      showStatus('contact', 'success', 'Coordonnées enregistrées.');
    } catch { showStatus('contact', 'error', 'Erreur de sauvegarde.'); }
    finally { setIsSavingContact(false); }
  };

  if (isLoading) {
    return <DashboardLayout><DashboardPageLoader label="Chargement des configurations…" /></DashboardLayout>;
  }

  const TABS = [
    { id: 'hero',         label: "Bannière d'accueil" },
    { id: 'carousel',     label: 'Carrousel' },
    { id: 'testimonials', label: 'Avis clients' },
    { id: 'logo',         label: 'Logo' },
    { id: 'banner',       label: 'Bandeau' },
    { id: 'contact',      label: 'Contact' },
    { id: 'zones',        label: 'Livraison' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <PageHeader title="Contenu du site" subtitle="Personnalisez ce qui s'affiche sur la boutique." />

        <div className="max-w-4xl bg-white border border-[#ececec] rounded-t border-b-0">
          <Tabs label="Rubriques du contenu" items={TABS.map(({ id, label }) => ({ value: id, label }))} value={activeTab} onChange={setActiveTab} />
        </div>

        <div className="max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'hero' && (
                <div className="bg-white border border-[#ececec] rounded overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#ececec]">
                    <h3 className={sectionTitle}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                      Hero de la page d'accueil
                    </h3>
                    <div className="flex items-center gap-2">
                      <ConfigBadge configured={hero.image_url !== HERO_DEFAULTS.image_url} />
                      <StatusBadge msg={status.hero} />
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Badge (petit texte au-dessus)</label>
                        <input type="text" value={hero.badge} onChange={e => setHero(p => ({ ...p, badge: e.target.value }))} className={inputCls} placeholder="Drop 01 / Édition Limitée" />
                      </div>
                      <div>
                        <label className={labelCls}>Lien du bouton CTA</label>
                        <input type="text" value={hero.cta_link} onChange={e => setHero(p => ({ ...p, cta_link: e.target.value }))} className={inputCls} placeholder="/products" />
                      </div>
                      <div>
                        <label className={labelCls}>Titre (partie fine)</label>
                        <input type="text" value={hero.title} onChange={e => setHero(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Formes brutes." />
                      </div>
                      <div>
                        <label className={labelCls}>Titre (partie grasse)</label>
                        <input type="text" value={hero.title_bold} onChange={e => setHero(p => ({ ...p, title_bold: e.target.value }))} className={inputCls} placeholder="Teintes neutres." />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Sous-titre</label>
                      <textarea value={hero.subtitle} onChange={e => setHero(p => ({ ...p, subtitle: e.target.value }))} rows="2" className={`${inputCls} resize-none`} />
                    </div>
                    <div>
                      <label className={labelCls}>Texte du bouton CTA</label>
                      <input type="text" value={hero.cta_text} onChange={e => setHero(p => ({ ...p, cta_text: e.target.value }))} className={inputCls} placeholder="Explorer les pièces" />
                    </div>
                    <div>
                      <label className={labelCls}>Image principale</label>
                      <div className="flex items-start gap-4">
                        <div className="w-40 h-52 bg-[#f1f1f1] border border-[#e0e0e0] rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                          {heroImagePreview
                            ? <img src={heroImagePreview} alt="Hero preview" className="w-full h-full object-cover" />
                            : <ImageIcon />
                          }
                        </div>
                        <div className="flex-1">
                          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleHeroImageChange}
                            className="w-full text-xs text-[#555] file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:rounded file:bg-[#f1f1f1] file:text-[#444] hover:file:bg-[#e8e8e8] file:cursor-pointer cursor-pointer" />
                          <p className="text-[12.5px] text-[#666] mt-1">JPEG, PNG ou WebP — max 4 Mo</p>
                          {hero.image_url && !heroImageFile && (
                            <p className="text-[10px] text-[#444] mt-1 truncate">Image actuelle : {hero.image_url}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 border-t border-[#ececec] flex justify-end">
                    <button onClick={saveHero} disabled={isSavingHero} className={saveBtnCls}>
                      {isSavingHero ? 'Enregistrement…' : 'Enregistrer le Hero'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'carousel' && (
                <div className="bg-white border border-[#ececec] rounded overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#ececec]">
                    <h3 className={sectionTitle}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="2" y="7" width="20" height="10" rx="1" /><path d="M17 7V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2M7 17v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" /></svg>
                      Carrousel (galerie éditoriale)
                    </h3>
                    <div className="flex items-center gap-2">
                      <ConfigBadge configured={carouselImages.some(u => !u.includes('unsplash.com'))} />
                      <StatusBadge msg={status.carousel} />
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    {carouselImages.length === 0 ? (
                      <p className="text-sm text-[#767676] text-center py-6 border border-dashed border-[#e0e0e0] rounded">Aucune image — ajoutez-en ci-dessous.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {carouselImages.map((url, i) => (
                          <div key={i} className="relative group aspect-video bg-[#f1f1f1] rounded overflow-hidden border border-[#e0e0e0]">
                            <img src={url.startsWith('/storage') ? resolveMediaUrl(url) : url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => setCarouselImages(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 bg-black/70 hover:bg-[#333] text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                            >×</button>
                            <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded">{i + 1}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <span className={`px-4 py-2 border border-[#e0e0e0] rounded text-xs font-medium hover:bg-[#fafafa] transition-colors flex items-center gap-1.5 ${isUploadingImg ? 'opacity-50 pointer-events-none' : ''}`}>
                          <PlusIcon /> {isUploadingImg ? 'Upload en cours…' : 'Ajouter une image'}
                        </span>
                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleCarouselUpload} className="hidden" disabled={isUploadingImg} />
                      </label>
                      <p className="text-[12.5px] text-[#666] mt-1">JPEG, PNG ou WebP — max 4 Mo par image</p>
                    </div>
                  </div>
                  <div className="px-5 py-4 border-t border-[#ececec] flex justify-end">
                    <button onClick={saveCarousel} disabled={isSavingCarousel} className={saveBtnCls}>
                      {isSavingCarousel ? 'Enregistrement…' : 'Enregistrer le carrousel'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'testimonials' && (
                <div className="bg-white border border-[#ececec] rounded overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-[#ececec]">
                    <h3 className={sectionTitle}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      Témoignages ({testimonials.length})
                    </h3>
                    <div className="flex items-center gap-3">
                      <ConfigBadge configured={testimonials.some(t => !DEFAULT_TESTIMONIALS.find(d => d.name === t.name))} />
                      <StatusBadge msg={status.testimonials} />
                      <button
                        onClick={() => { setEditingTestimonial(null); setShowTestimonialForm(true); }}
                        className="px-3 py-2 bg-[#f1f1f1] text-[#111] border border-[#e0e0e0] rounded text-xs font-medium hover:bg-[#e8e8e8] transition-colors flex items-center gap-1.5"
                      >
                        <PlusIcon /> Ajouter
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {showTestimonialForm && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#ececec] bg-[#fafafa]">
                          <p className="text-xs font-medium text-[#555] mb-3">
                            {editingTestimonial !== null ? 'Modifier le témoignage' : 'Nouveau témoignage'}
                          </p>
                          <TestimonialForm
                            initial={editingTestimonial !== null ? testimonials[editingTestimonial] : null}
                            onSave={handleSaveTestimonial}
                            onCancel={() => { setShowTestimonialForm(false); setEditingTestimonial(null); }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {testimonials.length === 0 ? (
                    <p className="text-sm text-[#767676] text-center py-8">Aucun témoignage — ajoutez-en via le bouton ci-dessus.</p>
                  ) : (
                    <div className="divide-y divide-[#f0f0f0]">
                      {testimonials.map((t, i) => (
                        <div key={i} className="flex items-start gap-3 px-5 py-4 hover:bg-[#fafafa] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#111]">{t.name}
                              {t.role && <span className="text-[10px] font-normal text-[#767676] ml-2 uppercase tracking-wider">{t.role}</span>}
                            </p>
                            <p className="text-xs text-[#555] mt-1 italic line-clamp-2">« {t.comment} »</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => { setEditingTestimonial(i); setShowTestimonialForm(true); }}
                              className="p-1.5 text-[#767676] hover:text-[#222] hover:bg-[#f1f1f1] rounded transition-colors">
                              <EditIcon />
                            </button>
                            <button onClick={() => setTestimonials(prev => prev.filter((_, idx) => idx !== i))}
                              className="p-1.5 text-[#767676] hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-5 py-4 border-t border-[#ececec] flex justify-end">
                    <button onClick={saveTestimonials} disabled={isSavingTestimonials || testimonials.length === 0} className={saveBtnCls}>
                      {isSavingTestimonials ? 'Enregistrement…' : 'Enregistrer les témoignages'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'logo' && (
                <div className="bg-white border border-[#ececec] rounded overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#ececec]">
                    <h3 className={sectionTitle}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 12l2 2 4-4" /></svg>
                      Logo de la boutique
                    </h3>
                    <div className="flex items-center gap-2">
                      <ConfigBadge configured={!!logo.url} />
                      <StatusBadge msg={status.logo} />
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    <p className="text-xs text-[#666]">Remplace le logo statique affiché dans la navigation et le footer.</p>
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-20 bg-[#f1f1f1] border border-[#e0e0e0] rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                        {logoPreview
                          ? <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                          : <ImageIcon />
                        }
                      </div>
                      <div className="flex-1">
                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleLogoChange}
                          className="w-full text-xs text-[#555] file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:rounded file:bg-[#f1f1f1] file:text-[#444] hover:file:bg-[#e8e8e8] file:cursor-pointer cursor-pointer" />
                        <p className="text-[12.5px] text-[#666] mt-1">PNG ou WebP recommandé, fond transparent — max 4 Mo</p>
                        {logo.url && !logoFile && (
                          <p className="text-[10px] text-[#444] mt-1 truncate">Logo actuel : {logo.url}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 border-t border-[#ececec] flex justify-end">
                    <button onClick={saveLogo} disabled={isSavingLogo || (!logoFile && !logo.url)} className={saveBtnCls}>
                      {isSavingLogo ? 'Enregistrement…' : 'Enregistrer le logo'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'banner' && (
                <div className="bg-white border border-[#ececec] rounded overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#ececec]">
                    <h3 className={sectionTitle}>Bandeaux d'annonce</h3>
                  </div>
                  <div className="px-5 py-5 space-y-4 text-sm text-[#444]">
                    <p>
                      Les messages en haut du site sont désormais gérés comme des <b>bandeaux d'annonce</b> : plusieurs messages
                      affichés à tour de rôle, avec un lien et des dates de début et de fin.
                    </p>
                    <Link to="/dashboard/promotions" className="inline-flex items-center h-10 px-4 rounded bg-[#111] text-white text-[13px] font-semibold hover:bg-[#333]">
                      Gérer les bandeaux
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="bg-white border border-[#ececec] rounded overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#ececec]">
                    <h3 className={sectionTitle}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      Contact & Réseaux sociaux
                    </h3>
                    <div className="flex items-center gap-2">
                      <ConfigBadge configured={!!(contactInfo.whatsapp || contactInfo.email)} />
                      <StatusBadge msg={status.contact} />
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#767676] mb-3">Coordonnées</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>WhatsApp Business (sans +)</label>
                          <input type="text" value={contactInfo.whatsapp} onChange={e => setContactInfo(p => ({ ...p, whatsapp: e.target.value }))} className={inputCls} placeholder="22507XXXXXXX" />
                        </div>
                        <div>
                          <label className={labelCls}>Email de contact</label>
                          <input type="email" value={contactInfo.email} onChange={e => setContactInfo(p => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="contact@mk-bazaar.com" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Adresse du showroom</label>
                          <input type="text" value={contactInfo.address} onChange={e => setContactInfo(p => ({ ...p, address: e.target.value }))} className={inputCls} placeholder="Abidjan, Cocody Angré" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#767676] mb-3">Réseaux sociaux (URLs complètes)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { key: 'instagram', placeholder: 'https://instagram.com/mk_bazaar' },
                          { key: 'facebook',  placeholder: 'https://facebook.com/mkbazaar' },
                          { key: 'tiktok',    placeholder: 'https://tiktok.com/@mk_bazaar' },
                          { key: 'pinterest', placeholder: 'https://pinterest.com/mkbazaar' },
                        ].map(({ key, placeholder }) => (
                          <div key={key}>
                            <label className={labelCls}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                            <input
                              type="url"
                              value={socialLinks[key]}
                              onChange={e => setSocialLinks(p => ({ ...p, [key]: e.target.value }))}
                              className={inputCls}
                              placeholder={placeholder}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 border-t border-[#ececec] flex justify-end">
                    <button onClick={saveContact} disabled={isSavingContact} className={saveBtnCls}>
                      {isSavingContact ? 'Enregistrement…' : 'Enregistrer le contact'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'zones' && (
                <div className="bg-white border border-[#ececec] rounded overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-[#ececec]">
                    <h3 className={sectionTitle}><TruckIcon /> Zones de livraison ({shippingZones.length})</h3>
                    <div className="flex items-center gap-2">
                      <ConfigBadge configured={shippingZones.length > 0} />
                      <StatusBadge msg={status.zones} />
                      <button onClick={loadDefaultZones} className="px-3 sm:px-4 py-2 border border-[#e0e0e0] text-[#444] rounded text-xs font-medium hover:bg-[#fafafa] transition-colors">Zones par défaut</button>
                      <button onClick={() => { setEditingZone(null); setShowAddForm(true); }} className="px-3 sm:px-4 py-2 bg-[#f1f1f1] text-[#111] border border-[#e0e0e0] rounded text-xs font-medium hover:bg-[#e8e8e8] transition-colors flex items-center gap-1.5">
                        <PlusIcon /> Ajouter
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {(showAddForm || editingZone) && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#ececec] bg-[#fafafa]">
                          <p className="text-xs font-medium text-[#555] mb-3">
                            {editingZone ? 'Modifier la zone' : 'Nouvelle zone'}
                          </p>
                          <ZoneForm
                            initial={editingZone || null}
                            onSave={editingZone ? handleUpdateZone : handleAddZone}
                            onCancel={() => { setShowAddForm(false); setEditingZone(null); }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {shippingZones.length === 0 ? (
                    <p className="text-sm text-[#767676] text-center py-10">Aucune zone configurée.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#fafafa] border-b border-[#e0e0e0]">
                          <tr>
                            <th className="text-left py-3 px-4 sm:px-6 text-[12.5px] font-medium text-[#666]">Zone</th>
                            <th className="text-right py-3 px-4 sm:px-6 text-[12.5px] font-medium text-[#666]">Tarif</th>
                            <th className="text-center py-3 px-4 sm:px-6 text-[12.5px] font-medium text-[#666]">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f0f0]">
                          {shippingZones.map(zone => (
                            <tr key={zone.id} className="hover:bg-[#fafafa] transition-colors">
                              <td className="py-3 px-4 sm:px-6 font-medium text-[#222]">{zone.name}</td>
                              <td className="py-3 px-4 sm:px-6 text-right tabular-nums">{zone.price.toLocaleString()} FCFA</td>
                              <td className="py-3 px-4 sm:px-6">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => { setShowAddForm(false); setEditingZone(zone); }} className="p-1.5 text-[#666] hover:text-[#222] hover:bg-[#f1f1f1] rounded transition-colors"><EditIcon /></button>
                                  <button onClick={() => handleDeleteZone(zone.id)} className="p-1.5 text-[#767676] hover:text-red-600 hover:bg-red-50 rounded transition-colors"><TrashIcon /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="px-5 py-4 border-t border-[#ececec] flex justify-end">
                    <button onClick={saveShippingTariffs} disabled={isSavingZones || shippingZones.length === 0} className={saveBtnCls}>
                      {isSavingZones ? 'Enregistrement…' : 'Enregistrer les tarifs'}
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
