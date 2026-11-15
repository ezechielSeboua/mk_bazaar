import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Camera, ChevronLeft, ChevronRight, Heart, LogOut, MessageCircle, Package, RotateCcw, User } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Seo from "../../components/Seo";
import { PasswordInput } from "../../components/shop/AuthLayout";
import { useAuth } from "../../contexts/AuthContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";
import { getWhatsAppLink, resolveMediaUrl } from "../../config/env";
import { updatePassword, updateProfile, uploadAvatar } from "../../services/auth";
import { getMyOrders } from "../../services/order";
import { getProductById, getVariant } from "../../services/product";
import { addToCart, promotionLabel, authField, authLabel, formatFCFA, productImage, shopButton, wrapClass } from "../../components/shop/shopUtils";

/*
 * Espace client (maquettes « 07 · Mon profil » et « 07b · Mes commandes ») :
 * profil, sécurité, suivi des commandes étape par étape.
 */

const ORDER_TABS = [
  { id: "all", label: "Toutes", match: () => true },
  { id: "pending", label: "À valider", match: (s) => s === "pending" },
  { id: "progress", label: "En traitement", match: (s) => s === "confirmed" || s === "shipping" },
  { id: "delivered", label: "Livrées", match: (s) => s === "delivered" },
  { id: "cancelled", label: "Annulées", match: (s) => s === "cancelled" },
];

const STATUS = {
  pending: { label: "En attente de validation", tone: "bg-[#fff4e0] text-[#8a4b00]", step: 0 },
  confirmed: { label: "Validée", tone: "bg-[#e8f0fe] text-[#1d4ed8]", step: 1 },
  shipping: { label: "En livraison", tone: "bg-[#f1ebfd] text-[#5b21b6]", step: 2 },
  delivered: { label: "Livrée", tone: "bg-[#e7f6ec] text-[#166534]", step: 3 },
  cancelled: { label: "Annulée", tone: "bg-[#fdeaea] text-[#b42318]", step: -1 },
};
const STEPS = ["Envoyée", "Validée", "En livraison", "Livrée"];
const PER_PAGE = 5;

const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
const formatLongDate = (value) => new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/* ------------------------------------------------------------------ Profil */

function ProfileTab({ user, setAuthUser }) {
  const [form, setForm] = useState({ name: user.name ?? "", phone: user.phone ?? "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [avatarState, setAvatarState] = useState({ uploading: false, error: null });

  const [showPassword, setShowPassword] = useState(false);
  const [pw, setPw] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [pwState, setPwState] = useState({ saving: false, message: null, error: null });

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setMessage({ error: true, text: "Le nom est obligatoire." }); return; }
    setSaving(true);
    const res = await updateProfile({ name: form.name.trim(), phone: form.phone.trim() || null });
    setSaving(false);
    if (res?.success) { setAuthUser(res.data); setMessage({ text: "Modifications enregistrées." }); }
    else setMessage({ error: true, text: res?.error || "L'enregistrement a échoué." });
  };

  const changeAvatar = async (file) => {
    if (!file) return;
    setAvatarState({ uploading: true, error: null });
    const res = await uploadAvatar(file);
    if (res?.success) { setAuthUser(res.data); setAvatarState({ uploading: false, error: null }); }
    else setAvatarState({ uploading: false, error: res?.data?.errors?.avatar?.[0] || "La photo n'a pas pu être enregistrée (2 Mo maximum)." });
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.password.length < 8) { setPwState({ saving: false, error: "Le nouveau mot de passe doit contenir au moins 8 caractères." }); return; }
    if (pw.password !== pw.password_confirmation) { setPwState({ saving: false, error: "Les mots de passe ne correspondent pas." }); return; }
    setPwState({ saving: true });
    const res = await updatePassword(pw);
    if (res?.success) {
      setAuthUser(res.data);
      setPw({ current_password: "", password: "", password_confirmation: "" });
      setShowPassword(false);
      setPwState({ saving: false, message: "Mot de passe modifié." });
    } else {
      const first = res?.data?.errors ? Object.values(res.data.errors)[0]?.[0] : null;
      setPwState({ saving: false, error: first || res?.error || "La modification a échoué." });
    }
  };

  return (
    <div className="space-y-8">
      <section className="border border-[#ececec] rounded">
        <h2 className="text-base font-semibold px-6 py-4 border-b border-[#ececec]">Informations personnelles</h2>
        <form onSubmit={save} className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img src={resolveMediaUrl(user.avatar)} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="w-16 h-16 rounded-full bg-[#111] text-white grid place-items-center text-lg font-semibold" aria-hidden="true">{initials(user.name)}</span>
            )}
            <label className={`${shopButton("secondary", "sm")} cursor-pointer`}>
              <Camera className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
              {avatarState.uploading ? "Envoi…" : "Changer la photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => changeAvatar(e.target.files?.[0])} />
            </label>
          </div>
          {avatarState.error && <p className="text-[13px] text-[#b42318]">{avatarState.error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-name" className={authLabel}>Nom complet</label>
              <input id="p-name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={authField()} />
            </div>
            <div>
              <label htmlFor="p-phone" className={authLabel}>Téléphone WhatsApp</label>
              <input id="p-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+225 07 00 00 00 00" className={authField()} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="p-email" className={authLabel}>Adresse e-mail</label>
              <input id="p-email" value={user.email} disabled className={`${authField()} bg-[#f5f5f5] text-[#666]`} />
              <p className="mt-1.5 text-[12.5px] text-[#666]">L'adresse e-mail ne peut pas être modifiée.</p>
            </div>
          </div>

          {message && <p role={message.error ? "alert" : "status"} className={`text-[13px] ${message.error ? "text-[#b42318]" : "text-[#166534]"}`}>{message.text}</p>}
          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={() => { setForm({ name: user.name ?? "", phone: user.phone ?? "" }); setMessage(null); }} className={shopButton("secondary")}>Annuler</button>
            <button type="submit" disabled={saving} className={shopButton("primary")}>{saving ? "Enregistrement…" : "Enregistrer les modifications"}</button>
          </div>
        </form>
      </section>

      <section className="border border-[#ececec] rounded">
        <h2 className="text-base font-semibold px-6 py-4 border-b border-[#ececec]">Sécurité</h2>
        <div className="p-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="font-medium">Mot de passe</p>
              <p className="text-[13px] text-[#666] mt-0.5">
                {user.password_changed_at ? `Dernière modification : ${formatLongDate(user.password_changed_at)}` : "Jamais modifié depuis la création du compte"}
              </p>
            </div>
            {!showPassword && <button type="button" onClick={() => { setShowPassword(true); setPwState({}); }} className={shopButton("secondary")}>Changer le mot de passe</button>}
          </div>
          {pwState.message && <p role="status" className="mt-3 text-[13px] text-[#166534]">{pwState.message}</p>}
          {showPassword && (
            <form onSubmit={savePassword} className="mt-5 grid gap-4 max-w-[420px]">
              <div>
                <label htmlFor="pw-current" className={authLabel}>Mot de passe actuel</label>
                <PasswordInput id="pw-current" name="current_password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} autoComplete="current-password" />
              </div>
              <div>
                <label htmlFor="pw-new" className={authLabel}>Nouveau mot de passe</label>
                <PasswordInput id="pw-new" name="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} autoComplete="new-password" />
              </div>
              <div>
                <label htmlFor="pw-confirm" className={authLabel}>Confirmer le nouveau mot de passe</label>
                <PasswordInput id="pw-confirm" name="password_confirmation" value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} autoComplete="new-password" />
              </div>
              {pwState.error && <p role="alert" className="text-[13px] text-[#b42318]">{pwState.error}</p>}
              <div className="flex gap-2.5">
                <button type="button" onClick={() => setShowPassword(false)} className={shopButton("secondary")}>Annuler</button>
                <button type="submit" disabled={pwState.saving} className={shopButton("primary")}>{pwState.saving ? "Enregistrement…" : "Enregistrer"}</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

/* --------------------------------------------------------------- Commandes */

function Tracker({ status }) {
  const step = STATUS[status]?.step ?? 0;
  if (step < 0) return <p className="text-sm text-[#b42318] px-5 py-4">Commande annulée</p>;
  return (
    <ol className="grid grid-cols-4 gap-2 px-5 py-4" aria-label="Avancement de la commande">
      {STEPS.map((label, index) => (
        <li key={label} className="text-center">
          <span className={`block h-1 rounded-full ${index <= step ? "bg-[#111]" : "bg-[#e5e5e5]"}`} aria-hidden="true" />
          <span className={`block mt-2 text-[12px] ${index <= step ? "text-[#111] font-medium" : "text-[#767676]"}`}>
            {label}{index === step && <span className="sr-only"> (étape actuelle)</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

function OrderCard({ order, whatsappNumber }) {
  const navigate = useNavigate();
  const [reordering, setReordering] = useState(false);
  const status = STATUS[order.status] ?? STATUS.pending;
  const support = getWhatsAppLink(`Bonjour, je vous contacte au sujet de ma commande ${order.order_number}.`, whatsappNumber);

  const reorder = async () => {
    setReordering(true);
    for (const item of order.items ?? []) {
      try {
        if (item.product_variant_id) {
          const res = await getVariant(item.product_variant_id);
          if (res?.success && res.data.product && res.data.is_active !== false && res.data.stock > 0) {
            addToCart({ product: res.data.product, variant: res.data, quantity: Math.min(item.quantity, res.data.stock) });
          }
        } else if (item.product_id) {
          const res = await getProductById(item.product_id);
          if (res?.success && res.data.stock > 0) addToCart({ product: res.data, quantity: Math.min(item.quantity, res.data.stock) });
        }
      } catch { /* article ignoré */ }
    }
    setReordering(false);
    navigate("/panier");
  };

  return (
    <article className="border border-[#ececec] rounded">
      <header className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-4 bg-[#fafafa] border-b border-[#ececec] text-sm">
        <div><p className="text-[12px] text-[#767676]">Commande</p><p className="font-medium mt-0.5 break-all">{order.order_number}</p></div>
        <div><p className="text-[12px] text-[#767676]">Date</p><p className="mt-0.5">{formatLongDate(order.created_at)}</p></div>
        <div><p className="text-[12px] text-[#767676]">Total</p><p className="font-semibold tabular-nums mt-0.5">{formatFCFA(order.total_price)}</p></div>
        <div><p className="text-[12px] text-[#767676]">Livraison</p><p className="mt-0.5">{order.delivery_location}</p></div>
      </header>

      <div className="flex items-center justify-between px-5 pt-4">
        <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium ${status.tone}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />{status.label}
        </span>
      </div>
      <Tracker status={order.status} />

      <ul className="divide-y divide-[#f0f0f0] border-t border-[#f0f0f0]">
        {(order.items ?? []).map((item) => {
          const product = item.variant?.product ?? item.product;
          const options = Object.values(item.variant?.attributes ?? {}).filter(Boolean).join(" · ");
          const image = item.variant?.image_path ? resolveMediaUrl(item.variant.image_path) : product ? productImage(product) : null;
          return (
            <li key={item.id} className="flex gap-4 px-5 py-4">
              {image ? <img src={image} alt="" className="w-14 h-[70px] object-cover rounded-sm bg-[#f3f3f3] shrink-0" /> : <span className="w-14 h-[70px] rounded-sm bg-[#f3f3f3] shrink-0" aria-hidden="true" />}
              <div className="min-w-0 flex-1 text-sm">
                {product ? (
                  <Link to={`/products/${product.slug}`} className="font-medium hover:underline">{product.name}</Link>
                ) : (
                  <p className="font-medium">Article indisponible <span className="font-normal text-[#666]">· plus au catalogue</span></p>
                )}
                {options && <p className="text-[13px] text-[#666] mt-0.5">{options}</p>}
                {item.discount > 0 && <p className="text-[12.5px] text-[#166534] mt-0.5">Remise{promotionLabel(item.promotion?.name) ? ` · ${promotionLabel(item.promotion.name)}` : ""}</p>}
              </div>
              <div className="text-right text-sm tabular-nums shrink-0">
                <p className="font-medium">{formatFCFA(item.price)}</p>
                <p className="text-[13px] text-[#666]">Qté {item.quantity}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="flex flex-wrap items-center gap-3 justify-between px-5 py-4 border-t border-[#ececec] text-sm">
        <span className="text-[#555]">
          Frais de livraison : {formatFCFA(order.delivery_fee)}
          {order.discount_total > 0 && <> · Remises : <span className="text-[#166534]">−{formatFCFA(order.discount_total)}</span></>}
        </span>
        <div className="flex flex-wrap gap-2">
          {support && (
            <a href={support} target="_blank" rel="noopener noreferrer" className={shopButton("secondary", "sm")}>
              <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" /> Contacter le service client
            </a>
          )}
          {order.status === "delivered" && (
            <button type="button" onClick={reorder} disabled={reordering} className={shopButton("primary", "sm")}>
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" /> {reordering ? "Ajout…" : "Commander à nouveau"}
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}

function OrdersTab({ orders, loading, error, whatsappNumber }) {
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const current = ORDER_TABS.find((t) => t.id === tab);
  const filtered = orders.filter((o) => current.match(o.status));
  const lastPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) return <p className="text-sm text-[#666]">Chargement de vos commandes…</p>;
  if (error) return <p role="alert" className="text-sm text-[#b42318]">{error}</p>;
  if (!orders.length) {
    return (
      <div className="text-center py-16 border border-[#ececec] rounded">
        <Package className="w-10 h-10 mx-auto text-[#bbb]" strokeWidth={1.2} aria-hidden="true" />
        <p className="text-[17px] font-medium mt-4">Aucune commande pour le moment</p>
        <Link to="/products" className={`${shopButton("primary")} mt-6`}>Découvrir la boutique</Link>
      </div>
    );
  }

  return (
    <div>
      <div role="tablist" aria-label="Filtrer mes commandes" className="flex gap-1 border-b border-[#ececec] mb-6 overflow-x-auto">
        {ORDER_TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); setPage(1); }} className={`px-3.5 py-2.5 -mb-px text-sm whitespace-nowrap border-b-2 ${tab === t.id ? "border-[#111] font-semibold" : "border-transparent text-[#666] hover:text-[#111]"}`}>
            {t.label} ({orders.filter((o) => t.match(o.status)).length})
          </button>
        ))}
      </div>
      <div className="space-y-5">
        {shown.map((order) => <OrderCard key={order.id} order={order} whatsappNumber={whatsappNumber} />)}
        {shown.length === 0 && <p className="text-sm text-[#666] py-8 text-center">Aucune commande dans cette catégorie.</p>}
      </div>
      {lastPage > 1 && (
        <nav className="flex items-center justify-between mt-6 text-[13px] text-[#666]" aria-label="Pagination">
          <span>Affichage de {(page - 1) * PER_PAGE + 1} à {Math.min(page * PER_PAGE, filtered.length)} sur {filtered.length} commandes</span>
          <div className="flex gap-1.5">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="w-9 h-9 grid place-items-center rounded border border-[#e0e0e0] disabled:opacity-40" aria-label="Page précédente"><ChevronLeft className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" /></button>
            <button type="button" disabled={page >= lastPage} onClick={() => setPage(page + 1)} className="w-9 h-9 grid place-items-center rounded border border-[#e0e0e0] disabled:opacity-40" aria-label="Page suivante"><ChevronRight className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" /></button>
          </div>
        </nav>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- Page */

export default function AccountPage() {
  const { user, isLoading, isAuthenticated, setAuthUser, handleLogout } = useAuth();
  const { wishlist } = useWishlist();
  const { contactInfo } = useSiteSettings();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "orders" ? "orders" : "profile";
  const [orders, setOrders] = useState({ loading: true, list: [], error: null });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login", { replace: true });
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    getMyOrders().then((res) => {
      if (cancelled) return;
      setOrders(res?.success
        ? { loading: false, list: Array.isArray(res.data) ? res.data : res.data?.data ?? [], error: null }
        : { loading: false, list: [], error: "Vos commandes n'ont pas pu être chargées." });
    });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const ordersCount = useMemo(() => orders.list.length, [orders.list]);

  const logout = async () => {
    await handleLogout();
    navigate("/");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-white font-admin">
        <Header />
        <p className={`${wrapClass} py-20 text-sm text-[#666]`}>Chargement…</p>
      </div>
    );
  }

  const navItem = (id, label, Icon, count) => (
    <button
      type="button"
      onClick={() => setParams(id === "profile" ? {} : { tab: id })}
      aria-current={tab === id ? "page" : undefined}
      className={`w-full flex items-center gap-3 h-11 px-3 rounded text-sm text-left ${tab === id ? "bg-[#f1f1f1] font-semibold text-[#111]" : "text-[#444] hover:bg-[#fafafa]"}`}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.6} aria-hidden="true" />
      {label}
      {count !== undefined && <span className="ml-auto text-[12.5px] text-[#767676] tabular-nums">{count}</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-white text-[#111] font-admin antialiased">
      <Seo title="Mon compte" path="/compte" noindex />
      <Header />

      <main className={wrapClass}>
        <nav className="text-[13px] text-[#777] py-[22px]" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:underline">Accueil</Link> / <b className="font-medium text-[#111]">Mon compte</b>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-12 items-start">
          <aside className="lg:sticky lg:top-28 border border-[#ececec] rounded p-4">
            <div className="flex items-center gap-3 px-1 pb-4 mb-3 border-b border-[#ececec]">
              {user.avatar ? (
                <img src={resolveMediaUrl(user.avatar)} alt="" className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <span className="w-11 h-11 rounded-full bg-[#111] text-white grid place-items-center text-sm font-semibold shrink-0" aria-hidden="true">{initials(user.name)}</span>
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-[12.5px] text-[#666] truncate">{user.email}</p>
              </div>
            </div>
            <nav className="space-y-1" aria-label="Mon compte">
              {navItem("profile", "Mon profil", User)}
              {navItem("orders", "Mes commandes", Package, ordersCount)}
              <Link to="/favoris" className="w-full flex items-center gap-3 h-11 px-3 rounded text-sm text-[#444] hover:bg-[#fafafa]">
                <Heart className="w-[18px] h-[18px]" strokeWidth={1.6} aria-hidden="true" /> Mes favoris
                <span className="ml-auto text-[12.5px] text-[#767676] tabular-nums">{wishlist.length}</span>
              </Link>
              {user.is_admin && (
                <Link to="/dashboard" className="w-full flex items-center gap-3 h-11 px-3 rounded text-sm text-[#444] hover:bg-[#fafafa]">
                  <Package className="w-[18px] h-[18px]" strokeWidth={1.6} aria-hidden="true" /> Espace admin
                </Link>
              )}
              <button type="button" onClick={logout} className="w-full flex items-center gap-3 h-11 px-3 rounded text-sm text-[#444] hover:bg-[#fafafa]">
                <LogOut className="w-[18px] h-[18px]" strokeWidth={1.6} aria-hidden="true" /> Déconnexion
              </button>
            </nav>
          </aside>

          <div className="min-w-0">
            <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-[-0.02em] mb-1">{tab === "orders" ? "Mes commandes" : "Mon profil"}</h1>
            {tab === "orders" && <p className="text-[15px] text-[#666] mb-6">{ordersCount} commande{ordersCount > 1 ? "s" : ""}</p>}
            {tab === "profile" && <div className="mb-6" />}
            {tab === "orders"
              ? <OrdersTab orders={orders.list} loading={orders.loading} error={orders.error} whatsappNumber={contactInfo?.whatsapp} />
              : <ProfileTab key={user.id} user={user} setAuthUser={setAuthUser} />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
