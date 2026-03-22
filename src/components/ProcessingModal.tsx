import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ProcessingModalProps {
  isOpen: boolean;
  message?: string;
}

const ProcessingModal = ({ isOpen, message = "Đang xử lý..." }: ProcessingModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4"
        >
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="font-semibold text-foreground">{message}</p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ProcessingModal;
