import { useState } from 'react';
import { X } from 'lucide-react';
import { Clue } from '../types';
import { clsx } from '../utils/api';

interface CluesModalProps {
  clues: Clue[];
  onClose: () => void;
}

export function CluesModal({ clues, onClose }: CluesModalProps) {
  const [selectedClue, setSelectedClue] = useState<Clue | null>(null);

  const getTypeIcon = (type: Clue['type']) => {
    switch (type) {
      case 'photo': return '📷';
      case 'audio': return '🎵';
      case 'document': return '📄';
      default: return '📝';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-noir-900 border border-noir-700 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-noir-700 flex items-center justify-between">
          <h2 className="text-xl font-serif text-accent-gold">Evidence Board</h2>
          <button onClick={onClose} className="p-2 hover:bg-noir-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[60vh]">
          {/* Clue List */}
          <div className="w-1/3 border-r border-noir-700 overflow-y-auto p-4">
            <h3 className="text-sm text-noir-400 mb-3 uppercase tracking-wider">
              Collected Evidence ({clues.length})
            </h3>
            
            {clues.length === 0 ? (
              <p className="text-noir-500 text-sm italic">No evidence collected yet.</p>
            ) : (
              <div className="space-y-2">
                {clues.map(clue => (
                  <div
                    key={clue.id}
                    onClick={() => setSelectedClue(clue)}
                    className={clsx(
                      "evidence-card rounded-lg",
                      selectedClue?.id === clue.id && "border-accent-gold bg-noir-700"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getTypeIcon(clue.type)}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-accent-gold truncate">{clue.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {clue.tags.slice(0, 3).map(tag => (
                            <span 
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-noir-700 text-noir-400 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clue Detail */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedClue ? (
              <div className="animate-slide-in">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{getTypeIcon(selectedClue.type)}</span>
                  <div>
                    <h3 className="text-2xl font-serif text-accent-gold">{selectedClue.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedClue.tags.map(tag => (
                        <span 
                          key={tag}
                          className="text-xs px-3 py-1 bg-noir-800 text-accent-gold rounded-full border border-noir-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  {selectedClue.type === 'photo' && selectedClue.content.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="mb-4 rounded-lg overflow-hidden border border-noir-700">
                      <img 
                        src={selectedClue.content} 
                        alt={selectedClue.name}
                        className="w-full h-auto max-h-64 object-contain bg-noir-950"
                      />
                    </div>
                  ) : selectedClue.type === 'audio' ? (
                    <div className="mb-4">
                      <audio controls className="w-full">
                        <source src={selectedClue.content} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ) : null}

                  <div className="noir-card rounded-lg p-4">
                    <h4 className="text-sm text-noir-400 uppercase tracking-wider mb-2">Description</h4>
                    <p className="text-noir-200 leading-relaxed whitespace-pre-wrap">
                      {selectedClue.description}
                    </p>
                  </div>

                  {selectedClue.sourceLocationId && (
                    <div className="mt-4 text-sm text-noir-500">
                      Found at location ID: {selectedClue.sourceLocationId}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-noir-500">
                <p>Select an evidence item to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
