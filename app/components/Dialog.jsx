'use client';

import React from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Dialog Component for Sabor
 * 
 * @param {boolean} isOpen - Whether dialog is open
 * @param {function} onClose - Callback when closing
 * @param {string} title - Dialog title (main text)
 * @param {string} highlightedText - Text to highlight in orange (appears in title)
 * @param {string} description - Dialog description/subtitle
 * @param {React.ReactNode} children - Dialog body content (buttons, controls, etc)
 * @param {string} size - Dialog size: 'sm' (default, 448px), 'md' (560px), 'lg' (672px)
 * @param {boolean} showCloseButton - Whether to show X button (default: true)
 * 
 * @example
 * <Dialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   title="Remove"
 *   highlightedText="eggs"
 *   description="Are you sure? This will change the dish significantly."
 * >
 *   <div className="flex gap-3">
 *     <button>Cancel</button>
 *     <button>Remove</button>
 *   </div>
 * </Dialog>
 */
export default function Dialog({
  isOpen,
  onClose,
  title,
  highlightedText,
  description,
  children,
  size = 'sm',
  showCloseButton = true,
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className={`bg-white p-8 w-full ${sizeClasses[size]} shadow-lg relative`}
        onClick={(e) => e.stopPropagation()}
        style={{
          border: '1px solid #DADADA',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
          borderRadius: '4px',
        }}
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-1 hover:bg-stone-100 rounded transition-colors text-gray-600 hover:text-gray-900"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}

        {/* Title */}
        {title && (
          <h3
            className="text-base font-bold mb-4 pr-8"
            style={{ color: '#333', fontFamily: 'Karla' }}
          >
            {title}
            {highlightedText && (
              <span style={{ color: '#E07A3F' }}> {highlightedText}</span>
            )}
            {(title.includes('Remove') || title.includes('Substitute')) && '?'}
          </h3>
        )}

        {/* Description */}
        {description && (
          <p
            className="text-sm mb-8"
            style={{ color: '#666', fontFamily: 'Karla', fontSize: '14px', lineHeight: '1.5' }}
          >
            {description}
          </p>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}