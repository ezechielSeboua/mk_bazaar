import { useState, useEffect } from 'react';
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
    <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

/* ---------- Helpers UI ---------- */
const inputCls = 'w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none bg-white';
const labelCls = 'text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-1';
const sectionTitle = 'text-base font-medium flex items-center gap-2';
const saveBtnCls = 'w-full sm:w-auto px-5 py-2.5 bg-stone-900 text-white font-medium text-sm rounded-lg hover:bg-black transition-colors shadow-sm disabled:opacity-50';

function StatusBadge({ msg }) {
  if (!msg?.text) return null;
  return (
    <AnimatePresence>
      <motion.span
        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
        className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}
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
      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
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
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors">Annuler</button>
        <button type="submit" className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors">{initial ? 'Modifier' : 'Ajouter'}</button>
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
      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
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
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors">Annuler</button>
        <button type="submit" className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors">{initial ? 'Modifier' : 'Ajouter'}</button>
      </div>
    </form>
  );
}

/* ---------- Page principale ---------- */
export default function ConfigurationsPage() {
  const { shippingZones, setShippingZones, isLoading } = useDashboardData();

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

  if (isLoading) {
    return <DashboardLayout><DashboardPageLoader label="Chargement des configurations…" /></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* En-tête */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight text-black">Configurations</h1>
          <p className="text-stone-600 text-sm mt-1">Personnalisez le contenu affiché sur la boutique.</p>
        </motion.div>

        <div className="max-w-4xl space-y-6">

          {/* ═══════════════════════════════════════
              SECTION HERO
          ═══════════════════════════════════════ */}
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-100">
              <h3 className={sectionTitle}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                Hero de la page d'accueil
              </h3>
              <StatusBadge msg={status.hero} />
            </div>
            <div className="p-4 sm:p-6 space-y-4">
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
                  <div className="w-24 h-32 bg-stone-100 border border-stone-200 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                    {heroImagePreview
                      ? <img src={heroImagePreview} alt="Hero preview" className="w-full h-full object-cover" />
                      : <ImageIcon />
                    }
                  </div>
                  <div className="flex-1">
                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleHeroImageChange}
                      className="w-full text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-[10px] file:uppercase file:tracking-wider file:font-bold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 file:cursor-pointer cursor-pointer" />
                    <p className="text-[10px] text-stone-400 mt-1">JPEG, PNG ou WebP — max 4 Mo</p>
                    {hero.image_url && !heroImageFile && (
                      <p className="text-[10px] text-emerald-600 mt-1 truncate">Image actuelle : {hero.image_url}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-stone-100 flex justify-end">
              <button onClick={saveHero} disabled={isSavingHero} className={saveBtnCls}>
                {isSavingHero ? 'Enregistrement…' : 'Enregistrer le Hero'}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════
              SECTION CARROUSEL
          ═══════════════════════════════════════ */}
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-100">
              <h3 className={sectionTitle}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="2" y="7" width="20" height="10" rx="1" /><path d="M17 7V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2M7 17v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" /></svg>
                Carrousel (galerie éditoriale)
              </h3>
              <StatusBadge msg={status.carousel} />
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {carouselImages.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-6 border border-dashed border-stone-200 rounded-lg">Aucune image — ajoutez-en ci-dessous.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {carouselImages.map((url, i) => (
                    <div key={i} className="relative group aspect-video bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                      <img src={url.startsWith('/storage') ? resolveMediaUrl(url) : url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setCarouselImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                      >×</button>
                      <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded">{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <span className={`px-4 py-2 border border-stone-200 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors flex items-center gap-1.5 ${isUploadingImg ? 'opacity-50 pointer-events-none' : ''}`}>
                    <PlusIcon /> {isUploadingImg ? 'Upload en cours…' : 'Ajouter une image'}
                  </span>
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleCarouselUpload} className="hidden" disabled={isUploadingImg} />
                </label>
                <p className="text-[10px] text-stone-400 mt-1">JPEG, PNG ou WebP — max 4 Mo par image</p>
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-stone-100 flex justify-end">
              <button onClick={saveCarousel} disabled={isSavingCarousel} className={saveBtnCls}>
                {isSavingCarousel ? 'Enregistrement…' : 'Enregistrer le carrousel'}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════
              SECTION TÉMOIGNAGES
          ═══════════════════════════════════════ */}
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6 border-b border-stone-100">
              <h3 className={sectionTitle}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                Témoignages ({testimonials.length})
              </h3>
              <div className="flex items-center gap-3">
                <StatusBadge msg={status.testimonials} />
                <button
                  onClick={() => { setEditingTestimonial(null); setShowTestimonialForm(true); }}
                  className="px-3 py-2 bg-stone-100 text-stone-900 border border-stone-200 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors flex items-center gap-1.5"
                >
                  <PlusIcon /> Ajouter
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showTestimonialForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-stone-100 bg-stone-50">
                    <p className="text-xs font-medium text-stone-600 mb-3">
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
              <p className="text-sm text-stone-400 text-center py-8">Aucun témoignage — ajoutez-en via le bouton ci-dessus.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {testimonials.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 sm:p-6 hover:bg-stone-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900">{t.name}
                        {t.role && <span className="text-[10px] font-normal text-stone-400 ml-2 uppercase tracking-wider">{t.role}</span>}
                      </p>
                      <p className="text-xs text-stone-600 mt-1 italic line-clamp-2">« {t.comment} »</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditingTestimonial(i); setShowTestimonialForm(true); }}
                        className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors">
                        <EditIcon />
                      </button>
                      <button onClick={() => setTestimonials(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 sm:p-6 border-t border-stone-100 flex justify-end">
              <button onClick={saveTestimonials} disabled={isSavingTestimonials || testimonials.length === 0} className={saveBtnCls}>
                {isSavingTestimonials ? 'Enregistrement…' : 'Enregistrer les témoignages'}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════
              SECTION LIVRAISON
          ═══════════════════════════════════════ */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2"><PlusIcon /> Nouvelle zone</h3>
                  <ZoneForm initial={null} onSave={handleAddZone} onCancel={() => setShowAddForm(false)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {editingZone && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2"><EditIcon /> Modifier la zone</h3>
                  <ZoneForm initial={editingZone} onSave={handleUpdateZone} onCancel={() => setEditingZone(null)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6 border-b border-stone-100">
              <h3 className={sectionTitle}><TruckIcon /> Zones de livraison ({shippingZones.length})</h3>
              <div className="flex items-center gap-2">
                <StatusBadge msg={status.zones} />
                <button onClick={loadDefaultZones} className="px-3 sm:px-4 py-2 border border-stone-200 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors">Zones par défaut</button>
                <button onClick={() => setShowAddForm(true)} className="px-3 sm:px-4 py-2 bg-stone-100 text-stone-900 border border-stone-200 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors flex items-center gap-1.5">
                  <PlusIcon /> Ajouter
                </button>
              </div>
            </div>

            {shippingZones.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-10">Aucune zone configurée.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="text-left py-3 px-4 sm:px-6 font-bold uppercase text-[10px] tracking-wider text-stone-500">Zone</th>
                      <th className="text-right py-3 px-4 sm:px-6 font-bold uppercase text-[10px] tracking-wider text-stone-500">Tarif</th>
                      <th className="text-center py-3 px-4 sm:px-6 font-bold uppercase text-[10px] tracking-wider text-stone-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {shippingZones.map(zone => (
                      <tr key={zone.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-4 sm:px-6 font-medium text-stone-800">{zone.name}</td>
                        <td className="py-3 px-4 sm:px-6 text-right tabular-nums">{zone.price.toLocaleString()} FCFA</td>
                        <td className="py-3 px-4 sm:px-6">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => setEditingZone(zone)} className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"><EditIcon /></button>
                            <button onClick={() => handleDeleteZone(zone.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 sm:p-6 border-t border-stone-100 flex justify-end">
              <button onClick={saveShippingTariffs} disabled={isSavingZones || shippingZones.length === 0} className={saveBtnCls}>
                {isSavingZones ? 'Enregistrement…' : 'Enregistrer les tarifs'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
