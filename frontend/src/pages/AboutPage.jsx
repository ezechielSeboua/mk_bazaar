import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { containerVariants, itemVariants } from '../components/AnimationVariants';
import Seo from '../components/Seo';

/* ---------- Icônes SVG ---------- */
function GarmentIcon() {
    return (
        <svg className="w-16 h-16 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6z" />
            <path d="M9 6V4a3 3 0 0 1 6 0v2" />
            <path d="M3 9v9a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V9" />
        </svg>
    );
}

function TargetIcon() {
    return (
        <svg className="w-12 h-12 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}

function StarIcon() {
    return (
        <svg className="w-12 h-12 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

function LeafIcon() {
    return (
        <svg className="w-12 h-12 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 8c-1-3-5-6-9-6-4 0-6 3-6 7 0 5 3 9 8 11 2 1 4-1 4-3V10" />
            <path d="M17 8c3 0 7 2 7 6 0 4-4 8-7 8-1 0-2-1-2-2" />
        </svg>
    );
}

function AvatarPlaceholderIcon() {
    return (
        <svg className="w-16 h-16 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
        </svg>
    );
}

// Variantes locales pour les sections
const sectionFadeIn = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#F9F9F7] text-black antialiased selection:bg-black selection:text-[#F9F9F7]">
            <Seo
                title="À propos"
                description="L'histoire de MK BAZAAR : mode minimaliste, qualité premium et engagement durable en Côte d'Ivoire."
                path="/about"
            />
            <Header />

            <main>
                {/* Hero Section (déjà animée) */}
                <motion.section
                    className="max-w-7xl mx-auto px-6 py-20 md:py-32"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            <motion.span
                                className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-4"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                            >
                                Notre histoire
                            </motion.span>
                            <motion.h1
                                className="text-3xl md:text-5xl font-light uppercase tracking-tight leading-tight mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                            >
                                MK <span className="font-normal">BAZAAR</span>
                            </motion.h1>
                            <motion.p
                                className="text-lg text-stone-600 leading-relaxed mb-8"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                            >
                                Fondée en 2022, MK BAZAAR est née d'une vision simple mais ambitieuse : démocratiser la mode minimaliste haut de gamme. Nous croyons que la qualité, l'authenticité et la simplicité ne doivent pas être des luxes inaccessibles.
                            </motion.p>
                            <motion.p
                                className="text-sm text-stone-500 leading-relaxed"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                            >
                                Chaque pièce est soigneusement sélectionnée pour son design intemporel, sa qualité de fabrication et son impact minimal sur l'environnement. Nous collaborons avec des artisans de confiance pour créer des vêtements qui durent au-delà des tendances.
                            </motion.p>
                        </motion.div>
                        <motion.div
                            className="aspect-square bg-gradient-to-br from-stone-200 to-stone-300 rounded-lg flex items-center justify-center shadow-lg"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="text-center space-y-3">
                                <GarmentIcon />
                                <p className="text-stone-600 text-sm uppercase tracking-widest">
                                    Depuis 2022
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Valeurs (déjà animée) */}
                <motion.section
                    className="bg-white border-y border-stone-200 py-20 md:py-32"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <div className="max-w-7xl mx-auto px-6 space-y-16">
                        <div>
                            <motion.span
                                className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-4"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                            >
                                Nos principes
                            </motion.span>
                            <motion.h2
                                className="text-2xl md:text-3xl font-light uppercase tracking-tight"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                            >
                                Les valeurs qui nous <span className="font-normal">définissent</span>
                            </motion.h2>
                        </div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={containerVariants}
                        >
                            <motion.div variants={itemVariants}>
                                <ValueCard
                                    title="Minimalisme"
                                    description="Chaque détail compte. Nous éliminons l'superflu pour révéler l'essentiel. Nos designs épurés transcendent les tendances."
                                    icon={<TargetIcon />}
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <ValueCard
                                    title="Qualité"
                                    description="Nous n'acceptons aucun compromis. Matériaux premium, coutures précises et durabilité garantie pour chaque pièce."
                                    icon={<StarIcon />}
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <ValueCard
                                    title="Responsabilité"
                                    description="Mode durable et éthique. Nous travaillons avec des partenaires qui partagent notre engagement envers l'environnement."
                                    icon={<LeafIcon />}
                                />
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Processus (nouvelle animation) */}
                <motion.section
                    className="max-w-7xl mx-auto px-6 py-20 md:py-32"
                    variants={sectionFadeIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                >
                    <div className="space-y-16">
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-4">
                                Comment ça marche
                            </span>
                            <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
                                Notre processus de <span className="font-normal">sélection</span>
                            </h2>
                        </div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            {[ 
                                { step: "1", title: "Recherche", description: "Exploration minutieuse des meilleurs designers et manufacturiers mondiaux" },
                                { step: "2", title: "Évaluation", description: "Analyse rigoureuse de la qualité, de la fabrication et de l'impact environnemental" },
                                { step: "3", title: "Curation", description: "Sélection finale des pièces qui correspondent à nos standards minimalistes" },
                                { step: "4", title: "Engagement", description: "Accompagnement client avant, pendant et après chaque achat" }
                            ].map((item, idx) => (
                                <motion.div key={idx} variants={itemVariants}>
                                    <ProcessStep step={item.step} title={item.title} description={item.description} />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </motion.section>

                {/* Équipe (nouvelle animation) */}
                <motion.section
                    className="bg-stone-50 border-y border-stone-200 py-20 md:py-32"
                    variants={sectionFadeIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                >
                    <div className="max-w-7xl mx-auto px-6 space-y-16">
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-4">
                                Notre collectif
                            </span>
                            <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
                                Les visages derrière <span className="font-normal">MK BAZAAR</span>
                            </h2>
                        </div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            <motion.div variants={itemVariants}>
                                <TeamMember
                                    name="Marie Dagua"
                                    role="Fondatrice & Analyst de données"
                                    bio="Passionnée par la data, Marie a étudiée je ne sais où mais à SIPOREX avant de lancer MK BAZAAR."
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <TeamMember
                                    name="Adingra Martial"
                                    role="Le fils de la fondatrice"
                                    bio="Ohhhh Yesu."
                                />
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Chiffres clés (nouvelle animation) */}
                <motion.section
                    className="max-w-7xl mx-auto px-6 py-20 md:py-32"
                    variants={sectionFadeIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                >
                    <div className="space-y-16">
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-4">
                                Par les nombres
                            </span>
                            <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
                                Notre impact en <span className="font-normal">chiffres</span>
                            </h2>
                        </div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-4 gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            <motion.div variants={itemVariants}><StatBox number="50K+" label="Clients satisfaits" /></motion.div>
                            <motion.div variants={itemVariants}><StatBox number="200+" label="Pièces curatées" /></motion.div>
                            <motion.div variants={itemVariants}><StatBox number="25+" label="Partenaires mondiaux" /></motion.div>
                            <motion.div variants={itemVariants}><StatBox number="100%" label="Satisfaction garantie" /></motion.div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Engagement environnemental (nouvelle animation + suppression emoji) */}
                <motion.section
                    className="bg-black text-[#F9F9F7] py-20 md:py-32"
                    variants={sectionFadeIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                >
                    <div className="max-w-7xl mx-auto px-6 space-y-12">
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-4">
                                Notre responsabilité
                            </span>
                            <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
                                Engagement pour la <span className="font-normal">planète</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium uppercase tracking-wider">
                                    Nos initiatives
                                </h3>
                                <ul className="space-y-4 text-sm text-stone-300">
                                    <li>✓ Émballages 100% recyclables et biodégradables</li>
                                    <li>✓ Compensation carbone pour chaque expédition</li>
                                    <li>✓ Partenariat avec des organisations de reforestation</li>
                                    <li>✓ Transparence complète de notre chaîne d'approvisionnement</li>
                                    <li>✓ Programme de reprise et recyclage des vêtements</li>
                                    <li>✓ Salaires équitables pour tous nos artisans</li>
                                </ul>
                            </div>
                            <div className="bg-stone-900 rounded-lg p-8 flex flex-col justify-center space-y-4">
                                <p className="text-lg leading-relaxed">
                                    "Chaque achat chez MK BAZAAR contribue à un avenir plus durable. Nous plantons un arbre pour chaque commande."
                                </p>
                                <p className="text-stone-400 text-sm uppercase tracking-widest font-bold">
                                    — Yasmine Tazi, Responsable Durabilité
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* CTA (nouvelle animation) */}
                <motion.section
                    className="max-w-7xl mx-auto px-6 py-20 md:py-32 text-center space-y-6"
                    variants={sectionFadeIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                >
                    <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
                        Rejoignez notre <span className="font-normal">communauté</span>
                    </h2>
                    <p className="text-stone-600 max-w-2xl mx-auto">
                        Découvrez comment nos clients redéfinissent la mode minimaliste et durable au quotidien.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <button className="bg-black text-[#F9F9F7] px-8 py-3 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 transition-colors">
                            Parcourir les collections
                        </button>
                        <button className="border border-black px-8 py-3 text-[11px] uppercase tracking-wider font-medium hover:bg-black hover:text-[#F9F9F7] transition-colors">
                            S'inscrire à la newsletter
                        </button>
                    </div>
                </motion.section>
            </main>

            <Footer />
        </div>
    );
}

function ValueCard({ title, description, icon }) {
    return (
        <div className="border border-stone-200 rounded-lg p-8 hover:border-black hover:shadow-lg transition-all space-y-4">
            <div className="w-12 h-12">{icon}</div>
            <h3 className="text-lg font-medium uppercase tracking-wider">{title}</h3>
            <p className="text-sm text-stone-600 leading-relaxed">{description}</p>
        </div>
    );
}

function ProcessStep({ step, title, description }) {
    return (
        <div className="border border-stone-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium uppercase tracking-wider">{title}</h3>
                <span className="text-3xl font-light text-stone-300">{step}</span>
            </div>
            <p className="text-sm text-stone-600">{description}</p>
        </div>
    );
}

function TeamMember({ name, role, bio }) {
    return (
        <div className="space-y-4">
            <div className="aspect-square bg-stone-200 rounded-lg flex items-center justify-center">
                <AvatarPlaceholderIcon />
            </div>
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">{name}</h3>
                <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-medium mb-3">{role}</p>
                <p className="text-sm text-stone-600 leading-relaxed">{bio}</p>
            </div>
        </div>
    );
}

function StatBox({ number, label }) {
    return (
        <div className="border border-stone-200 rounded-lg p-8 text-center space-y-2">
            <p className="text-4xl font-light text-black">{number}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold">{label}</p>
        </div>
    );
}