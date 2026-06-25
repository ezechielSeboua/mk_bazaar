import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { containerVariants, itemVariants } from '../components/AnimationVariants';
import Seo from '../components/Seo';
import { getWhatsAppLink } from '../config/env'; // lien WhatsApp préconfiguré

/* ---------- Icônes SVG ---------- */
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

// function CheckIcon() {
//   return (
//     <svg className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <polyline points="20 6 9 17 4 12" />
//     </svg>
//   );
// }

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 inline-block" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ---------- Variants d'animation ---------- */
const sectionFadeIn = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function AboutPage() {
  const whatsappLink = getWhatsAppLink(); // récupère le lien configuré (ex: https://wa.me/225...)

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-black antialiased selection:bg-black selection:text-[#F9F9F7]">
      <Seo
        title="À propos – MK BAZAAR"
        description="Découvrez MK BAZAAR, la mode minimaliste premium. Commandez facilement via WhatsApp."
        path="/about"
      />
      <Header />

      <main className="space-y-24 md:space-y-32">
        {/* 1. Hero Section – Présentation + CTA WhatsApp */}
        <motion.section
          className="max-w-7xl mx-auto px-6 pt-20 md:pt-32"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionFadeIn}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <motion.span
                className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-4"
                variants={heroItemVariants}
              >
                Mode minimaliste • Livraison Côte d'Ivoire
              </motion.span>
              <motion.div variants={heroItemVariants} className="mb-6">
                <img
                  src="/mk_bazaar_logo.png"
                  alt="MK Bazaar"
                  className="h-16 md:h-24 w-auto object-contain"
                />
              </motion.div>
              <motion.p
                className="text-lg text-stone-600 leading-relaxed mb-6"
                variants={heroItemVariants}
              >
                Des pièces intemporelles, sélectionnées avec soin pour leur qualité et leur design épuré. 
                Commandez directement via WhatsApp, sans intermédiaire, et recevez votre commande rapidement.
              </motion.p>
              <motion.div variants={heroItemVariants}>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 text-[11px] uppercase tracking-wider font-medium hover:bg-green-700 transition-colors rounded-full shadow-lg"
                >
                  <WhatsAppIcon />
                  Commander sur WhatsApp
                </a>
              </motion.div>
            </div>
            <motion.div
              className="aspect-square bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg flex items-center justify-center shadow-xl"
              variants={heroItemVariants}
              whileHover={{ scale: 1.02 }}
            >
              <img
                src="/mk_bazaar_logo.png"
                alt="MK Bazaar"
                className="w-3/4 h-auto object-contain opacity-90"
              />
            </motion.div>
          </div>
        </motion.section>

        {/* 2. Comment ça marche – Processus WhatsApp */}
        <motion.section
          className="max-w-7xl mx-auto px-6"
          variants={sectionFadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className="space-y-16">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-4">
                Simple et rapide
              </span>
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
                Commandez en <span className="font-normal">quelques clics</span>
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
                {
                  step: '1',
                  title: 'Explorez',
                  description: 'Parcourez notre collection et notez les références qui vous plaisent.',
                },
                {
                  step: '2',
                  title: 'Contactez-nous',
                  description: 'Envoyez-nous un message WhatsApp avec les articles souhaités.',
                  hasWhatsapp: true,
                },
                {
                  step: '3',
                  title: 'Confirmez',
                  description: 'Nous vérifions le stock, vous réglez facilement par mobile money.',
                },
                {
                  step: '4',
                  title: 'Recevez',
                  description: 'Livraison rapide partout en Côte d’Ivoire.',
                },
              ].map((item, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <ProcessStep {...item} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* 3. Pourquoi MK BAZAAR ? */}
        <motion.section
          className="bg-white border-y border-stone-200 py-20 md:py-32"
          variants={sectionFadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-4">
                Pourquoi nous choisir
              </span>
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
                L’essence du <span className="font-normal">minimalisme</span>
              </h2>
            </div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.div variants={itemVariants}>
                <ValueCard
                  title="Minimalisme"
                  description="Des lignes épurées, des couleurs neutres. Chaque pièce est pensée pour durer et s'adapter à votre style."
                  icon={<TargetIcon />}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <ValueCard
                  title="Qualité premium"
                  description="Tissus sélectionnés, finitions impeccables. Nous garantissons des vêtements qui résistent au temps."
                  icon={<StarIcon />}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <ValueCard
                  title="Circuit court"
                  description="Pas d'intermédiaire. Vous échangez directement avec nous sur WhatsApp pour un service personnalisé."
                  icon={<LeafIcon />}
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* 4. Chiffres clés */}
        <motion.section
          className="max-w-7xl mx-auto px-6"
          variants={sectionFadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className="text-center space-y-12">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-4">
                Ils nous font confiance
              </span>
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
                Quelques <span className="font-normal">chiffres</span>
              </h2>
            </div>

            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.div variants={itemVariants}><StatBox number="300+" label="Clients satisfaits" /></motion.div>
              <motion.div variants={itemVariants}><StatBox number="50+" label="Modèles disponibles" /></motion.div>
              <motion.div variants={itemVariants}><StatBox number="98%" label="Avis positifs" /></motion.div>
              <motion.div variants={itemVariants}><StatBox number="24h" label="Réponse WhatsApp" /></motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* 5. Équipe (optionnel, peut être retiré) */}
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
                Derrière MK BAZAAR
              </span>
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
                Une équipe à votre <span className="font-normal">écoute</span>
              </h2>
            </div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.div variants={itemVariants}>
                <TeamMember
                  name="Marie Dagua"
                  role="Fondatrice & Styliste"
                  bio="Passionnée de mode et de data, Marie sélectionne chaque pièce avec une exigence rare."
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <TeamMember
                  name="Adingra Martial"
                  role="Service client"
                  bio="Votre interlocuteur privilégié sur WhatsApp. Réactif et toujours de bonne humeur."
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* 6. Appel à l'action final */}
        <motion.section
          className="max-w-7xl mx-auto px-6 pb-20 md:pb-32 text-center space-y-6"
          variants={sectionFadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
            Prêt(e) à passer commande ?
          </h2>
          <p className="text-stone-600 max-w-xl mx-auto">
            Envoyez-nous un message WhatsApp dès maintenant. Nous vous répondons en moins de 24h.
          </p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 text-[11px] uppercase tracking-wider font-medium hover:bg-green-700 transition-colors rounded-full shadow-lg"
          >
            <WhatsAppIcon />
            Discuter sur WhatsApp
          </a>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}

/* ---------- Composants réutilisables ---------- */
function ValueCard({ title, description, icon }) {
  return (
    <div className="border border-stone-200 rounded-lg p-8 hover:border-black hover:shadow-xl transition-all duration-300 space-y-4 group">
      <div className="w-12 h-12 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-lg font-medium uppercase tracking-wider">{title}</h3>
      <p className="text-sm text-stone-600 leading-relaxed">{description}</p>
    </div>
  );
}

function ProcessStep({ step, title, description, hasWhatsapp }) {
  return (
    <div className="border border-stone-200 rounded-lg p-6 space-y-4 hover:border-black hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium uppercase tracking-wider">{title}</h3>
        <span className="text-3xl font-light text-stone-300">{step}</span>
      </div>
      <p className="text-sm text-stone-600">{description}</p>
      {hasWhatsapp && (
        <div className="flex items-center gap-1 text-green-700">
          <WhatsAppIcon />
          <span className="text-[10px] uppercase tracking-widest">WhatsApp</span>
        </div>
      )}
    </div>
  );
}

function TeamMember({ name, role, bio }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-center bg-white border border-stone-200 rounded-lg p-6 hover:shadow-lg transition-all">
      <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
        <svg className="w-10 h-10 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
        </svg>
      </div>
      <div className="text-center md:text-left">
        <h3 className="text-sm font-bold uppercase tracking-wider">{name}</h3>
        <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-medium mb-2">{role}</p>
        <p className="text-sm text-stone-600">{bio}</p>
      </div>
    </div>
  );
}

function StatBox({ number, label }) {
  return (
    <div className="border border-stone-200 rounded-lg p-6 text-center space-y-2 hover:border-black hover:shadow-md transition-all duration-300">
      <p className="text-3xl md:text-4xl font-light text-black">{number}</p>
      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold">{label}</p>
    </div>
  );
}