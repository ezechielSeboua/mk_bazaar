import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { getWhatsAppLink } from '../../config/env';
import Seo from '../../components/Seo';
import AuthLayout, { PasswordInput } from '../../components/shop/AuthLayout';
import { authField, authLabel, shopButton } from '../../components/shop/shopUtils';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuthUser, isAuthenticated, isAdmin } = useAuth();
  const { contactInfo } = useSiteSettings();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(isAdmin ? '/dashboard' : '/compte', { replace: true });
  }, [isAuthenticated, isAdmin, navigate]);

  const change = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name] || errors.submit) setErrors({});
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = 'Adresse e-mail invalide.';
    if (!form.password) found.password = 'Saisissez votre mot de passe.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    const result = await login(form.email.trim(), form.password);
    if (result.success) {
      const user = result.data?.user;
      if (user) setAuthUser(user);
      navigate(user?.is_admin ? '/dashboard' : '/compte');
    } else {
      setErrors({ submit: result.status === 429 ? 'Trop de tentatives. Réessayez dans une minute.' : 'E-mail ou mot de passe incorrect.' });
      setLoading(false);
    }
  };

  const helpLink = getWhatsAppLink('Bonjour, j\'ai oublié le mot de passe de mon compte MK Bazaar.', contactInfo?.whatsapp);

  return (
    <AuthLayout visualTitle="Bon retour parmi nous." visualText="Favoris enregistrés, suivi de livraison et envoi de votre panier sur WhatsApp en un clic.">
      <Seo title="Connexion" noindex path="/login" />
      <h1 className="text-[30px] font-semibold tracking-[-0.02em] mt-10 mb-2">Se connecter</h1>
      <p className="text-[15px] text-[#666] mb-[30px]">Accédez à votre compte MK Bazaar.</p>

      <form onSubmit={submit} noValidate className="space-y-[18px]">
        {errors.submit && <p role="alert" className="text-[13px] text-[#b42318] bg-[#fdeaea] rounded px-3 py-2">{errors.submit}</p>}
        <div>
          <label htmlFor="login-email" className={authLabel}>Adresse e-mail</label>
          <input id="login-email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} placeholder="exemple@mail.com" aria-invalid={Boolean(errors.email)} className={authField(errors.email)} />
          {errors.email && <p className="mt-1.5 text-[12.5px] text-[#b42318]">{errors.email}</p>}
        </div>
        <div>
          <div className="flex justify-between items-center">
            <label htmlFor="login-password" className={authLabel}>Mot de passe</label>
            {helpLink && <a href={helpLink} target="_blank" rel="noopener noreferrer" className="text-[13px] underline mb-1.5">Mot de passe oublié ?</a>}
          </div>
          <PasswordInput id="login-password" name="password" value={form.password} onChange={change} error={errors.password} autoComplete="current-password" />
          {errors.password && <p className="mt-1.5 text-[12.5px] text-[#b42318]">{errors.password}</p>}
        </div>
        <button type="submit" disabled={loading} className={`${shopButton('primary', 'lg')} w-full`}>{loading ? 'Connexion…' : 'Se connecter'}</button>
      </form>

      <p className="text-sm text-[#555] mt-[26px] text-center">
        Pas encore de compte ? <Link to="/register" className="font-semibold underline text-[#111]">Créer un compte</Link>
      </p>
      <p className="text-[13px] text-[#666] mt-3 text-center">
        Vous pouvez aussi <Link to="/products" className="underline">commander sans compte</Link>.
      </p>
    </AuthLayout>
  );
}
