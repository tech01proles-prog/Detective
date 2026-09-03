import React from 'react';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { clsx } from '../utils/api';

interface GameOverModalProps {
  won: boolean;
  onRestart: () => void;
  onClose: () => void;
}

export function GameOverModal({ won, onRestart, onClose }: GameOverModalProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-noir-900 border rounded-lg max-w-md w-full p-8 text-center animate-fade-in noir-card"
        style={{ borderColor: won ? '#c9a959' : '#8b0000' }}
      >
        {/* Icon */}
        <div className="mb-6">
          {won ? (
            <CheckCircle size={64} className="mx-auto text-accent-gold" />
          ) : (
            <XCircle size={64} className="mx-auto text-accent-blood" />
          )}
        </div>

        {/* Title */}
        <h2 className={clsx(
          "text-3xl font-serif mb-4",
          won ? "text-accent-gold" : "text-accent-blood"
        )}>
          {won ? 'Case Closed!' : 'Justice Denied'}
        </h2>

        {/* Message */}
        <p className="text-noir-300 mb-8 leading-relaxed">
          {won 
            ? "You've successfully identified the culprit and brought them to justice. Another case solved in the dark streets of this city."
            : "Your accusation was incorrect. The real criminal walks free, and an innocent person may suffer for your mistake."
          }
        </p>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-noir-800 hover:bg-noir-700 border border-noir-600 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={onRestart}
            className={clsx(
              "flex-1 py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2",
              won 
                ? "bg-accent-gold hover:bg-yellow-600 text-noir-900"
                : "bg-accent-blood hover:bg-red-700 text-white"
            )}
          >
            <RotateCcw size={18} />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
