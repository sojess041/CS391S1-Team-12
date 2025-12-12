"use client";

import { useEffect, useState } from "react";
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from "react-icons/fi";

export type ModalType = "success" | "error" | "info" | "warning";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: ModalType;
  title?: string;
  message: string;
  showCloseButton?: boolean;
  autoClose?: number; // Auto close after milliseconds
}

export default function Modal({
  isOpen,
  onClose,
  type = "info",
  title,
  message,
  showCloseButton = true,
  autoClose,
}: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Trigger fade in after a tiny delay to ensure DOM is ready
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      // Trigger fade out
      setIsVisible(false);
      // Remove from DOM after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose]);

  useEffect(() => {
    if (shouldRender) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  const typeStyles = {
    success: {
      icon: FiCheckCircle,
      iconColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/30",
      borderColor: "border-green-200 dark:border-green-800",
      titleColor: "text-green-900 dark:text-green-300",
    },
    error: {
      icon: FiAlertCircle,
      iconColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/30",
      borderColor: "border-red-200 dark:border-red-800",
      titleColor: "text-red-900 dark:text-red-300",
    },
    warning: {
      icon: FiAlertCircle,
      iconColor: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/30",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      titleColor: "text-yellow-900 dark:text-yellow-300",
    },
    info: {
      icon: FiInfo,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      titleColor: "text-blue-900 dark:text-blue-300",
    },
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      style={{
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        style={{
          opacity: isVisible ? 1 : 0,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-2xl border ${style.borderColor} ${style.bgColor} shadow-xl transition-all duration-300`}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1) translateY(0)" : "scale(0.95) translateY(-10px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 dark:text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        )}

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 ${style.iconColor}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className={`text-lg font-semibold ${style.titleColor} mb-2`}>
                  {title}
                </h3>
              )}
              <p className="text-gray-700 dark:text-slate-300 whitespace-pre-line">{message}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                type === "success"
                  ? "bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-500"
                  : type === "error"
                  ? "bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-500"
                  : type === "warning"
                  ? "bg-yellow-600 text-white hover:bg-yellow-700 dark:hover:bg-yellow-500"
                  : "bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

