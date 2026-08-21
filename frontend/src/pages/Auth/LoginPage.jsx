import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { login } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';
import Seo from '../../components/Seo';

/* ---------- Icônes ---------- */
function ErrorIcon() {
  return (
    <svg className="w-3 h-3 mr-1 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function MailIcon({ className = '' }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon({ className = '' }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ className = '' }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className = '' }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-[#F9F9F7]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ---------- Variants Framer Motion ---------- */
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const logoVariants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { delay: 0.1, duration: 0.3 } },
};

const errorVariants = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: { opacity: 1, height: 'auto', marginBottom: '0.5rem' },
  exit: { opacity: 0, height: 0, marginBottom: 0 },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuthUser, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsLoading(true);
    const result = await login(formData.email, formData.password);
    if (result.success) {
      const user = result.data?.user;
      if (user) setAuthUser(user);

      navigate(user?.is_admin ? '/dashboard' : '/compte');
    } else {
      setErrors({ submit: result.error || 'Email ou mot de passe incorrect.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F9F7] to-[#f0efea] text-black antialiased flex flex-col">
      <Seo title="Connexion" noindex path="/login" />

      {/* Header minimal avec logo */}
      <div className="px-6 py-6 md:py-8">
        <Link to="/" className="inline-block" aria-label="Retour à l'accueil MK Bazaar">
          <img src="/mk_bazaar_logo.png" alt="MK Bazaar" className="h-16 w-auto hover:opacity-80 transition-opacity" />
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <motion.div
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Carte de connexion */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-stone-200/60 p-8 md:p-10 hover:shadow-2xl transition-shadow duration-300">
            {/* Logo animé + titre */}
            <div className="text-center mb-6">
              <motion.img
                src="/mk_bazaar_logo.png"
                alt="MK Bazaar"
                className="mx-auto w-32 h-32 md:w-44 md:h-44 object-contain drop-shadow-sm"
                variants={logoVariants}
                initial="hidden"
                animate="visible"
              />
              <p className="mt-3 text-[9px] uppercase tracking-[0.3em] text-stone-400 font-medium">
                Connexion
              </p>
            </div>

            {/* Erreur globale */}
            <AnimatePresence mode="wait">
              {errors.submit && (
                <motion.div
                  key="global-error"
                  className="mb-6 p-4 border border-red-300 bg-red-50 text-red-700 text-[11px] uppercase tracking-wide flex items-center rounded-lg"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <ErrorIcon />
                  <span>{errors.submit}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] font-bold block">
                  Adresse email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MailIcon className="text-stone-400 group-focus-within:text-black transition-colors" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="exemple@mail.com"
                    aria-describedby="email-error"
                    className={`w-full pl-10 pr-4 py-3 border text-sm bg-white transition-all duration-200 focus:outline-none rounded-xl ${
                      errors.email
                        ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                        : 'border-stone-300 focus:border-black focus:ring-2 focus:ring-stone-200'
                    }`}
                  />
                </div>
                <AnimatePresence mode="wait">
                  {errors.email && (
                    <motion.p
                      id="email-error"
                      key="email-error"
                      className="text-[10px] text-red-600 uppercase tracking-wide flex items-center"
                      variants={errorVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <ErrorIcon />
                      <span>{errors.email}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Mot de passe */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-[10px] uppercase tracking-[0.2em] font-bold block">
                  Mot de passe
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="text-stone-400 group-focus-within:text-black transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    aria-describedby="password-error"
                    className={`w-full pl-10 pr-12 py-3 border text-sm bg-white transition-all duration-200 focus:outline-none rounded-xl ${
                      errors.password
                        ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                        : 'border-stone-300 focus:border-black focus:ring-2 focus:ring-stone-200'
                    }`}
                  />
                  {/* Bouton afficher/masquer */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-black transition-colors"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <AnimatePresence mode="wait">
                  {errors.password && (
                    <motion.p
                      id="password-error"
                      key="password-error"
                      className="text-[10px] text-red-600 uppercase tracking-wide flex items-center"
                      variants={errorVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <ErrorIcon />
                      <span>{errors.password}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Mot de passe oublié */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => alert('Fonctionnalité à venir')}
                  className="text-[10px] uppercase tracking-wider text-stone-500 hover:text-black transition-colors underline-offset-4 hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Bouton de connexion */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-[#F9F9F7] py-3 px-4 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-black/10"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Connexion…
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>
          </div>

          {/* Lien inscription */}
          <p className="mt-6 text-center text-[10px] text-stone-500 uppercase tracking-wider">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-bold text-black hover:underline underline-offset-4">
              Créer un compte
            </Link>
          </p>
        </motion.div>
      </main>

      {/* Espacement bas */}
      <div className="h-8 md:h-12" />
    </div>
  );
}