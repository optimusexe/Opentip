"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { dismissInstallPrompt, recordHomeVisit } from "@/components/installPrompt";

export default function InstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const { visits, tipped, dismissed } = recordHomeVisit();
    if (dismissed) return;
    if (window.innerWidth >= 768) return;
    // First homepage load stays quiet. Show after a return visit or a tip.
    const eligible = visits >= 2 || tipped;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (eligible) setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      dismissInstallPrompt();
    }
    setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    dismissInstallPrompt();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-modal flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={handleDismiss} />

          <motion.div
            className="relative bg-[#c1c0b6] border rule rounded-sm p-6 w-full max-w-sm space-y-5"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 420, damping: 40, mass: 0.5 }}
          >
            <button onClick={handleDismiss} className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 transition-colors" aria-label="Dismiss">
              <X size={16} />
            </button>

            <div className="flex justify-center">
              <div className="w-20 h-36 rounded-2xl border-2 border-zinc-400 bg-white flex flex-col items-center justify-center gap-2">
                <Image src="/Opentip.png" alt="Opentip" width={36} height={36} className="rounded-lg" />
                <span className="text-[0.55rem] font-medium text-zinc-600 leading-none">Opentip</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="serif text-lg font-semibold">Use Opentip easily from your home screen</h3>
              <p className="text-sm text-zinc-500">Install it as an app for quick access.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={handleInstall} className="flex-1 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-sm hover:bg-zinc-800 transition-colors">
                Install
              </button>
              <button onClick={handleDismiss} className="px-4 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors">
                Not now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
