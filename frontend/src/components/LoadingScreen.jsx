// components/LoadingScreen.tsx
import { motion, AnimatePresence } from "framer-motion";
import CharacterLoader from "./CharacterLoader";

export default function LoadingScreen({
  isLoading,
  children,
}) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          style={{
            minHeight: "100vh",
            backgroundColor: "#F9F9F7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CharacterLoader
            message="Marie pardon faut te calmer.... les données là sont entrain de charger."
            emojiType="face_in_clouds" // wink, smile, surprised, tongue
          />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
