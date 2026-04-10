"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({ children, content, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case "bottom":
        return "top-full mt-2 left-1/2 -translate-x-1/2";
      case "left":
        return "right-full mr-2 top-1/2 -translate-y-1/2";
      case "right":
        return "left-full ml-2 top-1/2 -translate-y-1/2";
      case "top":
      default:
        return "bottom-full mb-2 left-1/2 -translate-x-1/2";
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case "bottom":
        return "bottom-full left-1/2 -translate-x-1/2 border-b-slate-800";
      case "left":
        return "left-full top-1/2 -translate-y-1/2 border-l-slate-800";
      case "right":
        return "right-full top-1/2 -translate-y-1/2 border-r-slate-800";
      case "top":
      default:
        return "top-full left-1/2 -translate-x-1/2 border-t-slate-800";
    }
  };

  const getInitialAnimation = () => {
    switch (position) {
      case "bottom": return { opacity: 0, y: -5 };
      case "left": return { opacity: 0, x: 5 };
      case "right": return { opacity: 0, x: -5 };
      case "top": default: return { opacity: 0, y: 5 };
    }
  };

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={getInitialAnimation()}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={getInitialAnimation()}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-max max-w-[250px] bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl ${getPositionClasses()}`}
            style={{ pointerEvents: "none" }}
          >
            <div className="flex gap-2">
              <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <p className="leading-snug font-medium whitespace-pre-wrap">{content}</p>
            </div>
            <div className={`absolute border-4 border-transparent ${getArrowClasses()}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
