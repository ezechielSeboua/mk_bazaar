import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, ShoppingBag, Heart, CheckCircle, AlertCircle,
    Eye, EyeOff, Package, Camera, Loader2,
    ChevronLeft, ChevronRight, LogOut, ShoppingCart, Menu, X, ArrowRight
} from "lucide-react";
import Seo from "../../components/Seo";
import { useAuth } from "../../contexts/AuthContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { updateProfile, uploadAvatar, profile as refreshProfile } from "../../services/auth";
import { changePassword } from "../../services/users";
import { getMyOrders } from "../../services/order";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../../config/env";

/* ─────────────────────────────────────────
   Config
───────────────────────────────────────── */
const TABS = [
    { id: "profile",   label: "Mon profil",     icon: User },
    { id: "orders",    label: "Mes commandes",   icon: ShoppingBag },
    { id: "favorites", label: "Mes favoris",     icon: Heart },
];

const STATUS_LABELS = {
    pending:    { label: "En attente",    color: "bg-amber-50 text-amber-700 border-amber-200" },
    processing: { label: "En traitement", color: "bg-sky-50 text-sky-700 border-sky-200" },
    shipped:    { label: "Expédié",       color: "bg-violet-50 text-violet-700 border-violet-200" },
    completed:  { label: "Livré",         color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    cancelled:  { label: "Annulé",        color: "bg-rose-50 text-rose-600 border-rose-200" },
};

/* ─────────────────────────────────────────
   Indicateur de force du mot de passe
───────────────────────────────────────── */
function PasswordStrength({ password }) {
    if (!password) return null;
    const hasUpper   = /[A-Z]/.test(password);
    const hasNumber  = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = (password.length >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
    const levels = [
        { label: "Faible",  color: "bg-rose-400",    width: "w-1/4" },
        { label: "Moyen",   color: "bg-amber-400",   width: "w-2/4" },
        { label: "Bon",     color: "bg-sky-400",     width: "w-3/4" },
        { label: "Fort",    color: "bg-emerald-500", width: "w-full" },
    ];
    const lvl = levels[Math.max(0, score - 1)];
    return (
        <div className="mt-1.5 space-y-1">
            <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${lvl.color} ${lvl.width}`} />
            </div>
            <p className={`text-[10px] font-medium ${score <= 1 ? "text-rose-500" : score === 2 ? "text-amber-500" : score === 3 ? "text-sky-500" : "text-emerald-600"}`}>
                {lvl.label}
            </p>
        </div>
    );
}

/* ─────────────────────────────────────────
   Onglet Profil
───────────────────────────────────────── */
function ProfileTab({ user, onUpdate }) {
    const [form, setForm]     = useState({ name: user?.name || "", phone: user?.phone || "" });
    const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm: "" });
    const [showPwSection, setShowPwSection] = useState(false);
    const [showPw, setShowPw]   = useState(false);
    const [saving, setSaving]   = useState(false);
    const [savingPw, setSavingPw] = useState(false);
    const [msg, setMsg]         = useState(null);
    const [pwMsg, setPwMsg]     = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarError, setAvatarError]         = useState(null);
    const fileInputRef = useRef(null);

    const currentAvatar = avatarPreview || (user?.avatar ? resolveMediaUrl(user.avatar) : null);
    const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

    useEffect(() => {
        setForm({ name: user?.name || "", phone: user?.phone || "" });
    }, [user]);

    useEffect(() => {
        if (!msg) return;
        const t = setTimeout(() => setMsg(null), 4000);
        return () => clearTimeout(t);
    }, [msg]);
    useEffect(() => {
        if (!pwMsg) return;
        const t = setTimeout(() => setPwMsg(null), 4000);
        return () => clearTimeout(t);
    }, [pwMsg]);

    const isDirty = form.name !== (user?.name || "") || form.phone !== (user?.phone || "");
    const validatePhone = (v) => !v || /^[\d\s+().-]{6,20}$/.test(v);

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setAvatarPreview(preview);
        setAvatarUploading(true);
        setAvatarError(null);
        const res = await uploadAvatar(file);
        setAvatarUploading(false);
        if (res.success) {
            onUpdate();
        } else {
            setAvatarError(res.error || "Impossible d'uploader la photo.");
            URL.revokeObjectURL(preview);
            setAvatarPreview(null);
        }
        e.target.value = "";
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!validatePhone(form.phone)) {
            setMsg({ type: "error", text: "Numéro de téléphone invalide." });
            return;
        }
        setSaving(true);
        setMsg(null);
        const res = await updateProfile({ name: form.name, phone: form.phone });
        setSaving(false);
        if (res.success) {
            setMsg({ type: "success", text: "Profil mis à jour." });
            onUpdate();
        } else {
            setMsg({ type: "error", text: res.error || "Erreur lors de la mise à jour." });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwForm.new_password !== pwForm.confirm) {
            setPwMsg({ type: "error", text: "Les mots de passe ne correspondent pas." });
            return;
        }
        if (pwForm.new_password.length < 8) {
            setPwMsg({ type: "error", text: "8 caractères minimum." });
            return;
        }
        setSavingPw(true);
        setPwMsg(null);
        const res = await changePassword(pwForm.old_password, pwForm.new_password);
        setSavingPw(false);
        if (res.success) {
            setPwMsg({ type: "success", text: "Mot de passe modifié." });
            setPwForm({ old_password: "", new_password: "", confirm: "" });
            setShowPwSection(false);
        } else {
            setPwMsg({ type: "error", text: res.error || "Mot de passe actuel incorrect." });
        }
    };

    const inputCls = "w-full px-4 py-2.5 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition";

    return (
        <div className="space-y-5 max-w-lg w-full">
            {/* Photo de profil */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center gap-4 sm:gap-5">
                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden group focus:outline-none"
                        aria-label="Changer la photo de profil"
                    >
                        {currentAvatar ? (
                            <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-stone-950 text-white flex items-center justify-center text-xl sm:text-2xl font-bold uppercase select-none">
                                {initials}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                            {avatarUploading
                                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                                : <Camera className="w-5 h-5 text-white" />
                            }
                        </div>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{user?.name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">Cliquez sur la photo pour la modifier</p>
                    {avatarError && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />{avatarError}
                        </p>
                    )}
                    {avatarUploading && <p className="text-[11px] text-stone-400 mt-1">Upload en cours…</p>}
                </div>
            </div>

            {/* Infos personnelles */}
            <form onSubmit={handleSaveProfile} className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">Informations personnelles</h2>

                <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-1 block">Nom complet</label>
                    <input
                        className={inputCls}
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        required
                    />
                </div>

                <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-1 block">Email</label>
                    <input className={`${inputCls} bg-stone-50 text-stone-400 cursor-not-allowed`} value={user?.email || ""} readOnly />
                    <p className="text-[10px] text-stone-400 mt-1">L'adresse email ne peut pas être modifiée.</p>
                </div>

                <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-1 block">Téléphone</label>
                    <input
                        className={`${inputCls} ${form.phone && !validatePhone(form.phone) ? "border-rose-400 focus:ring-rose-300" : ""}`}
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+225 07 00 00 00 00"
                    />
                    {form.phone && !validatePhone(form.phone) && (
                        <p className="text-[10px] text-rose-500 mt-1">Format invalide.</p>
                    )}
                </div>

                <AnimatePresence>
                    {msg && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={`flex items-center gap-1.5 text-xs font-medium ${msg.type === "success" ? "text-emerald-700" : "text-rose-600"}`}>
                            {msg.type === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            {msg.text}
                        </motion.p>
                    )}
                </AnimatePresence>

                <button
                    type="submit"
                    disabled={saving || !isDirty || (form.phone && !validatePhone(form.phone))}
                    className="w-full py-2.5 bg-stone-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-stone-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {saving ? "Enregistrement…" : "Enregistrer les modifications"}
                </button>
            </form>

            {/* Mot de passe — toggle */}
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => { setShowPwSection(p => !p); setPwMsg(null); }}
                    className="w-full flex items-center justify-between px-5 sm:px-6 py-4 text-left hover:bg-stone-50 transition"
                >
                    <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Changer le mot de passe</span>
                    <motion.span animate={{ rotate: showPwSection ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                    </motion.span>
                </button>

                <AnimatePresence initial={false}>
                    {showPwSection && (
                        <motion.form
                            key="pw-form"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            style={{ overflow: "hidden" }}
                            onSubmit={handleChangePassword}
                            className="px-5 sm:px-6 pb-6 space-y-4 border-t border-stone-100 pt-4"
                        >
                            <div>
                                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-1 block">Mot de passe actuel</label>
                                <div className="relative">
                                    <input
                                        type={showPw ? "text" : "password"}
                                        className={`${inputCls} pr-10`}
                                        value={pwForm.old_password}
                                        onChange={e => setPwForm(p => ({ ...p, old_password: e.target.value }))}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPw(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-1 block">Nouveau mot de passe</label>
                                <input
                                    type="password"
                                    className={inputCls}
                                    value={pwForm.new_password}
                                    onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                                    required
                                />
                                <PasswordStrength password={pwForm.new_password} />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-1 block">Confirmer le nouveau</label>
                                <input
                                    type="password"
                                    className={`${inputCls} ${pwForm.confirm && pwForm.confirm !== pwForm.new_password ? "border-rose-400" : ""}`}
                                    value={pwForm.confirm}
                                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                                    required
                                />
                                {pwForm.confirm && pwForm.confirm !== pwForm.new_password && (
                                    <p className="text-[10px] text-rose-500 mt-1">Ne correspond pas.</p>
                                )}
                            </div>

                            <AnimatePresence>
                                {pwMsg && (
                                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className={`flex items-center gap-1.5 text-xs font-medium ${pwMsg.type === "success" ? "text-emerald-700" : "text-rose-600"}`}>
                                        {pwMsg.type === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                        {pwMsg.text}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            <button type="submit" disabled={savingPw}
                                className="w-full py-2.5 bg-stone-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-stone-800 transition disabled:opacity-50">
                                {savingPw ? "Modification…" : "Modifier le mot de passe"}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Onglet Commandes
───────────────────────────────────────── */
function OrdersTab() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        getMyOrders().then(res => {
            if (res.success) setOrders(res.data?.data || res.data || []);
            else setError(res.error || "Impossible de charger vos commandes.");
            setLoading(false);
        });
    }, []);

    if (loading) return (
        <div className="space-y-3 max-w-3xl">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-stone-200 rounded-2xl p-5 animate-pulse">
                    <div className="h-4 w-32 bg-stone-100 rounded mb-3" />
                    <div className="h-3 w-48 bg-stone-100 rounded" />
                </div>
            ))}
        </div>
    );

    if (error) return (
        <div className="max-w-3xl bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
            <AlertCircle className="w-6 h-6 text-rose-400 mx-auto mb-2" />
            <p className="text-sm text-rose-700">{error}</p>
        </div>
    );

    if (orders.length === 0) return (
        <div className="max-w-3xl bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-3">
            <Package className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-medium text-stone-500">Aucune commande pour le moment.</p>
            <Link to="/products" className="inline-block text-xs uppercase tracking-wider font-bold text-[#c07b5a] hover:underline">
                Découvrir nos produits
            </Link>
        </div>
    );

    return (
        <div className="space-y-4 max-w-3xl">
            {orders.map(order => {
                const status = STATUS_LABELS[order.status] || { label: order.status, color: "bg-stone-50 text-stone-600 border-stone-200" };
                const itemCount = order.items?.length || 0;
                return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                        {/* Header commande */}
                        <div className="flex items-start sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-stone-100">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-stone-900 font-mono">{order.order_number}</p>
                                <p className="text-[11px] text-stone-400 mt-0.5 flex flex-wrap gap-x-2">
                                    <span>{new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                                    <span>· {itemCount} article{itemCount > 1 ? "s" : ""}</span>
                                    <span>· <strong className="text-stone-600">{order.total_price?.toLocaleString()} FCFA</strong></span>
                                </p>
                            </div>
                            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${status.color}`}>
                                {status.label}
                            </span>
                        </div>

                        {/* Articles */}
                        {order.items?.length > 0 && (
                            <ul className="divide-y divide-stone-50">
                                {order.items.map(item => {
                                    const name  = item.variant?.product?.name || item.product?.name || "Produit";
                                    const attrs = item.variant?.attributes
                                        ? Object.values(item.variant.attributes).join(" · ")
                                        : null;
                                    const image = item.variant?.product?.image_path?.[0]
                                        || item.product?.image_path?.[0]
                                        || null;
                                    return (
                                        <li key={item.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                                            {image ? (
                                                <img src={resolveMediaUrl(image)} alt={name}
                                                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-stone-100" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-stone-100 shrink-0" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-stone-800 truncate">{name}</p>
                                                {attrs && <p className="text-[10px] text-stone-400">{attrs}</p>}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-bold text-stone-800">{item.price?.toLocaleString()} FCFA</p>
                                                <p className="text-[10px] text-stone-400">×{item.quantity}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {/* Zone de livraison */}
                        <div className="px-4 sm:px-5 py-3 bg-stone-50/60 flex items-center justify-between text-[10px] text-stone-400 uppercase tracking-wider">
                            <span>Livraison · {order.delivery_location}</span>
                            <span className="font-semibold">{order.delivery_fee?.toLocaleString()} FCFA</span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

/* ─────────────────────────────────────────
   Carte favori
───────────────────────────────────────── */
function FavoriteCard({ item, onRemove }) {
    const handleRemove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove(item);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.2 } }}
            transition={{ duration: 0.22 }}
            className="group bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all duration-300 flex flex-col"
        >
            {/* Image */}
            <Link to={`/products/${item.slug}`} className="relative block aspect-[3/4] bg-stone-100 overflow-hidden shrink-0">
                <img
                    src={item.image ? resolveMediaUrl(item.image) : DEFAULT_PLACEHOLDER_IMAGE}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Catégorie */}
                {item.category && (
                    <span className="absolute top-2 left-2 bg-black/55 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        {item.category}
                    </span>
                )}

                {/* Bouton cœur — retirer */}
                <button
                    onClick={handleRemove}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all"
                    aria-label="Retirer des favoris"
                >
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                </button>

                {/* Overlay hover subtil */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors duration-300 pointer-events-none" />
            </Link>

            {/* Infos */}
            <div className="flex flex-col flex-1 p-3 sm:p-4 gap-3">
                <div className="flex-1 min-w-0">
                    {item.category && (
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold truncate mb-0.5">
                            {item.category}
                        </p>
                    )}
                    <h3 className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                        {item.name}
                    </h3>
                </div>

                <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-stone-950 tabular-nums">
                        {item.price?.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-medium text-stone-400">FCFA</span>
                </div>

                <Link
                    to={`/products/${item.slug}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-stone-950 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl hover:bg-stone-700 transition-colors"
                >
                    Voir le produit
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   Onglet Favoris
───────────────────────────────────────── */
function FavoritesTab() {
    const { wishlist, toggleWishlist } = useWishlist();

    if (wishlist.length === 0) return (
        <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-sm mx-auto flex flex-col items-center gap-4 py-16 text-center"
        >
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
                <Heart className="w-7 h-7 text-rose-300" />
            </div>
            <div>
                <p className="text-base font-bold text-stone-800 mb-1">Aucun favori pour le moment</p>
                <p className="text-sm text-stone-400">Explorez le catalogue et sauvegardez vos coups de cœur.</p>
            </div>
            <Link
                to="/products"
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-stone-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-stone-800 transition-colors"
            >
                Parcourir le catalogue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
        </motion.div>
    );

    return (
        <div>
            <p className="text-xs text-stone-400 mb-4 font-medium">
                {wishlist.length} article{wishlist.length > 1 ? "s" : ""} sauvegardé{wishlist.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                <AnimatePresence mode="popLayout">
                    {wishlist.map(item => (
                        <FavoriteCard key={item.id} item={item} onRemove={toggleWishlist} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Sidebar Navigation (bureau + drawer)
───────────────────────────────────────── */
function SidebarNav({ activeTab, setTab, user, wishlistCount, collapsed, onToggle, onLogout, onClose }) {
    const userInitials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

    return (
        <>
            {/* En-tête : user card + toggle collapse */}
            <div className={`flex items-center border-b border-stone-800 ${collapsed ? "flex-col gap-3 px-2 py-4" : "justify-between gap-3 px-4 py-5"}`}>
                {/* Avatar + infos */}
                <div className={`flex items-center gap-3 min-w-0 ${collapsed ? "flex-col" : ""}`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-700 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0 select-none">
                        {user?.avatar
                            ? <img src={resolveMediaUrl(user.avatar)} alt={user?.name} className="w-full h-full object-cover" />
                            : userInitials
                        }
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name}</p>
                            <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
                        </div>
                    )}
                </div>

                {/* Bouton collapse — intégré dans la sidebar */}
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="shrink-0 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                        aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
                    >
                        {collapsed
                            ? <ChevronRight className="w-4 h-4" />
                            : <ChevronLeft  className="w-4 h-4" />
                        }
                    </button>
                )}
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {TABS.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    const badge = id === "favorites" && wishlistCount > 0 ? wishlistCount : null;
                    return (
                        <button
                            key={id}
                            onClick={() => { setTab(id); onClose?.(); }}
                            title={collapsed ? label : undefined}
                            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                                isActive
                                    ? "bg-stone-700 text-white"
                                    : "text-stone-400 hover:text-white hover:bg-stone-800/80"
                            } ${collapsed ? "justify-center" : ""}`}
                        >
                            <Icon className="w-[18px] h-[18px] shrink-0" />
                            {!collapsed && (
                                <>
                                    <span className="font-medium flex-1 text-left">{label}</span>
                                    {badge && (
                                        <span className="bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                            {badge > 9 ? "9+" : badge}
                                        </span>
                                    )}
                                </>
                            )}
                            {collapsed && badge && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Actions bas */}
            <div className="px-2 py-3 border-t border-stone-800 space-y-1">
                <Link
                    to="/products"
                    onClick={onClose}
                    title={collapsed ? "Boutique" : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-400 hover:text-white hover:bg-stone-800/80 transition-all ${collapsed ? "justify-center" : ""}`}
                >
                    <ShoppingCart className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && <span className="font-medium">Boutique</span>}
                </Link>
                <button
                    onClick={onLogout}
                    title={collapsed ? "Déconnexion" : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-400 hover:text-red-400 hover:bg-stone-800/80 transition-all ${collapsed ? "justify-center" : ""}`}
                >
                    <LogOut className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && <span className="font-medium">Déconnexion</span>}
                </button>
            </div>
        </>
    );
}

/* ─────────────────────────────────────────
   Page principale
───────────────────────────────────────── */
export default function AccountPage() {
    const { user, isLoading, isAuthenticated, setAuthUser, handleLogout: logoutFromCtx } = useAuth();
    const { wishlist } = useWishlist();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab  = searchParams.get("tab") || "profile";
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed]           = useState(false);
    const [cartCount, setCartCount]           = useState(0);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) navigate("/login", { replace: true });
    }, [isLoading, isAuthenticated, navigate]);

    useEffect(() => {
        const calc = () => {
            try {
                const items = JSON.parse(localStorage.getItem("mk_bazaar_cart") || "[]");
                setCartCount(items.reduce((s, i) => s + (i.quantity || 0), 0));
            } catch { setCartCount(0); }
        };
        calc();
        window.addEventListener("storage", calc);
        window.addEventListener("cart-updated", calc);
        return () => {
            window.removeEventListener("storage", calc);
            window.removeEventListener("cart-updated", calc);
        };
    }, []);

    const handleUpdate = async () => {
        const res = await refreshProfile();
        if (res.success && res.data) setAuthUser(res.data);
    };

    const handleLogout = async () => {
        setMobileMenuOpen(false);
        await logoutFromCtx();
        navigate("/login");
    };

    if (isLoading || !user) return null;

    const setTab = (id) => setSearchParams({ tab: id });
    const activeTabInfo = TABS.find(t => t.id === activeTab) || TABS[0];
    const ActiveIcon = activeTabInfo.icon;

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F9F7] text-black antialiased">
            <Seo title="Mon compte" noindex path="/compte" />

            <div className="flex flex-1 min-h-0">

                {/* ── SIDEBAR BUREAU ── */}
                <aside className={`hidden md:flex flex-col bg-stone-950 text-white shrink-0 transition-all duration-300 ${collapsed ? "w-16" : "w-56 lg:w-64"}`}>
                    <SidebarNav
                        activeTab={activeTab}
                        setTab={setTab}
                        user={user}
                        wishlistCount={wishlist.length}
                        collapsed={collapsed}
                        onToggle={() => setCollapsed(p => !p)}
                        onLogout={handleLogout}
                    />
                </aside>

                {/* ── DRAWER MOBILE (backdrop + panneau) ── */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <>
                            <motion.div
                                className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setMobileMenuOpen(false)}
                            />
                            <motion.aside
                                className="fixed top-0 left-0 h-full w-[280px] bg-stone-950 text-white z-50 md:hidden flex flex-col shadow-2xl"
                                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                                transition={{ type: "spring", stiffness: 350, damping: 35 }}
                            >
                                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
                                    <span className="text-xs font-bold uppercase tracking-widest text-stone-300">Mon espace</span>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                                        aria-label="Fermer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <SidebarNav
                                    activeTab={activeTab}
                                    setTab={setTab}
                                    user={user}
                                    wishlistCount={wishlist.length}
                                    collapsed={false}
                                    onLogout={handleLogout}
                                    onClose={() => setMobileMenuOpen(false)}
                                />
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* ── ZONE DE CONTENU ── */}
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

                    {/* Topbar interne — visible sur tous les écrans */}
                    <div className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm">
                        <div className="flex items-center gap-3 px-4 py-3">
                            {/* Hamburger mobile */}
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="md:hidden p-1.5 -ml-1 text-stone-600 hover:text-black hover:bg-stone-100 rounded-lg transition-colors shrink-0"
                                aria-label="Menu"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            {/* Logo — desktop uniquement */}
                            <Link
                                to="/accueil"
                                className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
                                aria-label="Retour à l'accueil"
                            >
                                <img src="/mk_bazaar_logo.png" alt="MK Bazaar" className="h-8 w-auto object-contain" />
                            </Link>

                            {/* Séparateur desktop */}
                            <div className="hidden md:block h-5 w-px bg-stone-200 mx-1" />

                            {/* Onglet actif */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <ActiveIcon className="w-4 h-4 text-stone-400 shrink-0" />
                                <span className="text-sm font-semibold text-stone-800 truncate">{activeTabInfo.label}</span>
                            </div>

                            {/* Droite : panier + favoris + nom utilisateur */}
                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                {/* Panier */}
                                <Link
                                    to="/panier"
                                    className="relative p-2 rounded-full text-[#c07b5a] hover:bg-[#c07b5a]/10 transition-all"
                                    aria-label="Mon panier"
                                    title="Mon panier"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    <AnimatePresence>
                                        {cartCount > 0 && (
                                            <motion.span
                                                key={cartCount}
                                                initial={{ scale: 0.6, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.6, opacity: 0 }}
                                                className="absolute -top-0.5 -right-0.5 bg-[#c07b5a] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white"
                                            >
                                                {cartCount}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Link>

                                {/* Icône favoris avec badge */}
                                <button
                                    onClick={() => setTab("favorites")}
                                    className={`relative p-2 rounded-full transition-all ${
                                        activeTab === "favorites"
                                            ? "text-rose-500 bg-rose-50"
                                            : "text-stone-400 hover:text-rose-500 hover:bg-rose-50"
                                    }`}
                                    aria-label="Mes favoris"
                                    title="Mes favoris"
                                >
                                    <Heart className="w-5 h-5" />
                                    <AnimatePresence>
                                        {wishlist.length > 0 && (
                                            <motion.span
                                                key={wishlist.length}
                                                initial={{ scale: 0.6, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.6, opacity: 0 }}
                                                className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white"
                                            >
                                                {wishlist.length > 9 ? "9+" : wishlist.length}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>

                                {/* Nom utilisateur — desktop */}
                                <span className="hidden lg:block text-xs text-stone-500 font-medium truncate max-w-[120px]">
                                    {user.name?.split(" ")[0]}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contenu de l'onglet */}
                    <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === "profile"   && <ProfileTab user={user} onUpdate={handleUpdate} />}
                                {activeTab === "orders"    && <OrdersTab />}
                                {activeTab === "favorites" && <FavoritesTab />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
