import { motion } from 'framer-motion';

// Animations réutilisables
export const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
};

export const fadeInDown = {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
};

export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6 }
};

export const slideInLeft = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
};

export const slideInRight = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
};

export const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: "easeOut" }
};

// Conteneur pour animer les enfants
export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

export const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    },
};

// Hover animations
export const hoverScale = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
};

export const hoverLift = {
    whileHover: { y: -5 },
    transition: { duration: 0.3 }
};

// Composant réutilisable pour les sections
export function AnimatedSection({ children, className, ...props }) {
    return (
        <motion.section
            className={className}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
            {...props}
        >
            {children}
        </motion.section>
    );
}

// Composant pour les éléments avec animation de texte
export function AnimatedText({ children, className, variant = fadeInUp }) {
    return (
        <motion.h2
            className={className}
            initial={variant.initial}
            whileInView={variant.animate}
            viewport={{ once: true, amount: 0.5 }}
            transition={variant.transition}
        >
            {children}
        </motion.h2>
    );
}

// Composant pour les cartes avec animation
export function AnimatedCard({ children, className, delay = 0 }) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
        >
            {children}
        </motion.div>
    );
}
