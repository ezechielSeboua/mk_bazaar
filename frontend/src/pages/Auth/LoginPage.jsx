// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { login } from '../../services/auth';
// import { useAuth } from '../../contexts/AuthContext';

// /* ---------- Icône SVG pour les erreurs ---------- */
// function ErrorIcon() {
//     return (
//         <svg className="w-3 h-3 mr-1 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <circle cx="12" cy="12" r="10" />
//             <line x1="15" y1="9" x2="9" y2="15" />
//             <line x1="9" y1="9" x2="15" y2="15" />
//         </svg>
//     );
// }

// export default function LoginPage() {
//     const navigate = useNavigate();
//     const { setAuthUser } = useAuth();
//     const [formData, setFormData] = useState({
//         email: '',
//         password: '',
//     });
//     const [errors, setErrors] = useState({});
//     const [isLoading, setIsLoading] = useState(false);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({
//             ...prev,
//             [name]: value
//         }));
//         if (errors[name]) {
//             setErrors(prev => ({
//                 ...prev,
//                 [name]: ''
//             }));
//         }
//     };

//     const validateForm = () => {
//         const newErrors = {};
        
//         if (!formData.email.trim()) {
//             newErrors.email = "L'email est requis";
//         } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//             newErrors.email = 'Email invalide';
//         }
        
//         if (!formData.password) {
//             newErrors.password = 'Le mot de passe est requis';
//         } else if (formData.password.length < 6) {
//             newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
//         }

//         return newErrors;
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
        
//         const newErrors = validateForm();
//         if (Object.keys(newErrors).length > 0) {
//             setErrors(newErrors);
//             return;
//         }

//         setIsLoading(true);
        
//         const result = await login(formData.email, formData.password);
        
//         if (result.success) {
//             const user = result.data?.user;
//             if (user) {
//                 setAuthUser(user);
//             }
//             navigate('/dashboard');
//         } else {
//             setErrors({
//                 submit: result.error || 'Email ou mot de passe incorrect.'
//             });
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-[#F9F9F7] text-black antialiased">
//             <main className="flex items-center justify-center min-h-screen px-6">
//                 <div className="w-full max-w-md">
                    
//                     {/* En-tête */}
//                     <div className="mb-12 text-center space-y-3">
//                         <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
//                             Connexion
//                         </h1>
//                         <p className="text-sm text-stone-500">
//                             Accédez à votre compte MK BAZAAR
//                         </p>
//                     </div>

//                     {/* Message d'erreur global */}
//                     {errors.submit && (
//                         <div className="mb-6 p-4 border border-red-300 bg-red-50 text-red-700 text-[11px] uppercase tracking-wide flex items-center">
//                             <ErrorIcon />
//                             <span>{errors.submit}</span>
//                         </div>
//                     )}

//                     {/* Formulaire */}
//                     <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                        
//                         {/* Email */}
//                         <div className="space-y-2">
//                             <label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] font-bold block">
//                                 Adresse email
//                             </label>
//                             <input
//                                 type="email"
//                                 id="email"
//                                 name="email"
//                                 value={formData.email}
//                                 onChange={handleChange}
//                                 placeholder="exemple@mail.com"
//                                 className={`w-full px-4 py-3 border text-sm bg-white transition-colors focus:outline-none ${
//                                     errors.email 
//                                         ? 'border-red-400 focus:border-red-600' 
//                                         : 'border-stone-300 focus:border-black'
//                                 }`}
//                             />
//                             {errors.email && (
//                                 <p className="text-[10px] text-red-600 uppercase tracking-wide flex items-center">
//                                     <ErrorIcon />
//                                     <span>{errors.email}</span>
//                                 </p>
//                             )}
//                         </div>

//                         {/* Mot de passe */}
//                         <div className="space-y-2">
//                             <label htmlFor="password" className="text-[10px] uppercase tracking-[0.2em] font-bold block">
//                                 Mot de passe
//                             </label>
//                             <input
//                                 type="password"
//                                 id="password"
//                                 name="password"
//                                 value={formData.password}
//                                 onChange={handleChange}
//                                 placeholder="••••••••"
//                                 className={`w-full px-4 py-3 border text-sm bg-white transition-colors focus:outline-none ${
//                                     errors.password 
//                                         ? 'border-red-400 focus:border-red-600' 
//                                         : 'border-stone-300 focus:border-black'
//                                 }`}
//                             />
//                             {errors.password && (
//                                 <p className="text-[10px] text-red-600 uppercase tracking-wide flex items-center">
//                                     <ErrorIcon />
//                                     <span>{errors.password}</span>
//                                 </p>
//                             )}
//                         </div>

//                         {/* Bouton connexion */}
//                         <button
//                             type="submit"
//                             disabled={isLoading}
//                             className="w-full bg-black text-[#F9F9F7] py-3 px-4 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             {isLoading ? 'Connexion en cours...' : 'Se connecter'}
//                         </button>
//                     </form>

//                     {/* Divider */}
//                     <div className="mb-8">
//                         <div className="h-px bg-stone-200" />
//                     </div>

//                     {/* Mentions légales */}
//                     <p className="text-center text-[9px] text-stone-400 uppercase tracking-[0.15em]">
//                         Connectez-vous pour accéder à votre compte MK BAZAAR.
//                     </p>
//                 </div>
//             </main>
//         </div>
//     );
// }


import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';
import Seo from '../../components/Seo';

/* ---------- Icône SVG pour les erreurs ---------- */
function ErrorIcon() {
    return (
        <svg className="w-3 h-3 mr-1 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    );
}

export default function LoginPage() {
    const navigate = useNavigate();
    const { setAuthUser } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
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
            if (user) {
                setAuthUser(user);
            }
            navigate('/dashboard');
        } else {
            setErrors({
                submit: result.error || 'Email ou mot de passe incorrect.'
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F9F7] text-black antialiased flex flex-col">
            <Seo title="Connexion" noindex path="/login" />
            {/* Lien vers la boutique (logo) */}
            <div className="px-6 py-6 md:py-8">
                <Link to="/" className="text-xl font-black tracking-[0.25em] uppercase text-black">
                    MK BAZAAR
                </Link>
            </div>

            <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
                <div className="w-full max-w-md">
                    
                    {/* En-tête */}
                    <div className="mb-10 text-center space-y-3">
                        <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
                            Connexion
                        </h1>
                        <p className="text-sm text-stone-500">
                            Accédez à votre compte MK BAZAAR
                        </p>
                    </div>

                    {/* Message d'erreur global */}
                    {errors.submit && (
                        <div className="mb-6 p-4 border border-red-300 bg-red-50 text-red-700 text-[11px] uppercase tracking-wide flex items-center rounded-lg">
                            <ErrorIcon />
                            <span>{errors.submit}</span>
                        </div>
                    )}

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                        
                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] font-bold block">
                                Adresse email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="exemple@mail.com"
                                className={`w-full px-4 py-3 border text-sm bg-white transition-colors focus:outline-none rounded-md ${
                                    errors.email 
                                        ? 'border-red-400 focus:border-red-600' 
                                        : 'border-stone-300 focus:border-black'
                                }`}
                            />
                            {errors.email && (
                                <p className="text-[10px] text-red-600 uppercase tracking-wide flex items-center">
                                    <ErrorIcon />
                                    <span>{errors.email}</span>
                                </p>
                            )}
                        </div>

                        {/* Mot de passe */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-[10px] uppercase tracking-[0.2em] font-bold block">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className={`w-full px-4 py-3 border text-sm bg-white transition-colors focus:outline-none rounded-md ${
                                    errors.password 
                                        ? 'border-red-400 focus:border-red-600' 
                                        : 'border-stone-300 focus:border-black'
                                }`}
                            />
                            {errors.password && (
                                <p className="text-[10px] text-red-600 uppercase tracking-wide flex items-center">
                                    <ErrorIcon />
                                    <span>{errors.password}</span>
                                </p>
                            )}
                        </div>

                        {/* Bouton connexion */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-black text-[#F9F9F7] py-3 px-4 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                        >
                            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mb-8">
                        <div className="h-px bg-stone-200" />
                    </div>

                    {/* Mentions légales */}
                    <p className="text-center text-[9px] text-stone-400 uppercase tracking-[0.15em] px-4">
                        Connectez-vous pour accéder à votre compte MK BAZAAR.
                    </p>
                </div>
            </main>

            {/* Espacement supplémentaire en bas sur mobile pour éviter d'être collé au bas de l'écran */}
            <div className="h-8 md:h-12" />
        </div>
    );
}