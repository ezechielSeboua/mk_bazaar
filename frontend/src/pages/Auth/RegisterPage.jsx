import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';
import Seo from '../../components/Seo';
import AuthLayout, { PasswordInput } from '../../components/shop/AuthLayout';
import { authField, authLabel, shopButton } from '../../components/shop/shopUtils';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const change = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.name.trim()) found.name = 'Indiquez votre nom.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = 'Adresse e-mail invalide.';
    if (form.password.length < 8) found.password = '8 caractères minimum.';
    if (form.password !== form.password_confirmation) found.password_confirmation = 'Les mots de passe ne correspondent pas.';
    if (!accepted) found.terms = 'Acceptez les conditions pour créer votre compte.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    const result = await register({ ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null });
    if (result.success) {
      if (result.data?.user) setAuthUser(result.data.user);
      navigate('/compte');
      return;
    }
    const apiErrors = result.data?.errors ?? {};
    const mapped = Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
    setErrors(Object.keys(mapped).length ? mapped : { submit: result.error || "L'inscription a échoué." });
    setLoading(false);
  };

  const error = (key) => errors[key] && <p className="mt-1.5 text-[12.5px] text-[#b42318]">{errors[key]}</p>;

  return (
    <AuthLayout visualTitle="Créez votre compte et suivez vos commandes." visualText="Favoris enregistrés, suivi de livraison et envoi de votre panier sur WhatsApp en un clic.">
      <Seo title="Créer un compte" noindex path="/register" />
      <h1 className="text-[30px] font-semibold tracking-[-0.02em] mt-10 mb-2">Créer un compte</h1>
      <p className="text-[15px] text-[#666] mb-[30px]">Quelques informations suffisent.</p>

      <form onSubmit={submit} noValidate className="space-y-[18px]">
        {errors.submit && <p role="alert" className="text-[13px] text-[#b42318] bg-[#fdeaea] rounded px-3 py-2">{errors.submit}</p>}
        <div>
          <label htmlFor="reg-name" className={authLabel}>Nom complet</label>
          <input id="reg-name" name="name" autoComplete="name" value={form.name} onChange={change} placeholder="Prénom Nom" aria-invalid={Boolean(errors.name)} className={authField(errors.name)} />
          {error('name')}
        </div>
        <div>
          <label htmlFor="reg-email" className={authLabel}>Adresse e-mail</label>
          <input id="reg-email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} placeholder="exemple@mail.com" aria-invalid={Boolean(errors.email)} className={authField(errors.email)} />
          {error('email')}
        </div>
        <div>
          <label htmlFor="reg-phone" className={authLabel}>Téléphone WhatsApp <span className="font-normal text-[#6b6b6b]">(facultatif)</span></label>
          <input id="reg-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={change} placeholder="+225 07 00 00 00 00" className={authField(errors.phone)} />
          {error('phone')}
        </div>
        <div>
          <label htmlFor="reg-password" className={authLabel}>Mot de passe</label>
          <PasswordInput id="reg-password" name="password" value={form.password} onChange={change} error={errors.password} autoComplete="new-password" />
          {errors.password ? error('password') : <p className="mt-1.5 text-[12.5px] text-[#6b6b6b]">8 caractères minimum.</p>}
        </div>
        <div>
          <label htmlFor="reg-confirm" className={authLabel}>Confirmer le mot de passe</label>
          <PasswordInput id="reg-confirm" name="password_confirmation" value={form.password_confirmation} onChange={change} error={errors.password_confirmation} autoComplete="new-password" />
          {error('password_confirmation')}
        </div>
        <div>
          <label className="flex gap-2.5 text-[13.5px] text-[#444] leading-[1.45] cursor-pointer">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#111] shrink-0" />
            <span>J'accepte les <Link to="/about#cgv" className="underline">conditions générales de vente</Link> et la <Link to="/about#confidentialite" className="underline">politique de confidentialité</Link>.</span>
          </label>
          {error('terms')}
        </div>
        <button type="submit" disabled={loading} className={`${shopButton('primary', 'lg')} w-full`}>{loading ? 'Création…' : 'Créer mon compte'}</button>
      </form>

      <p className="text-sm text-[#555] mt-[26px] text-center">
        Déjà un compte ? <Link to="/login" className="font-semibold underline text-[#111]">Se connecter</Link>
      </p>
    </AuthLayout>
  );
}
