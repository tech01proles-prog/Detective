import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { Suspect, Clue } from '../types';
import { clsx } from '../utils/api';

interface AccusationModalProps {
  suspects: Suspect[];
  clues: Clue[];
  onAccuse: (suspectId: string, clueIds: string[]) => void;
  onClose: () => void;
}

export function AccusationModal({ suspects, clues, onAccuse, onClose }: AccusationModalProps) {
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [selectedClues, setSelectedClues] = useState<string[]>([]);

  const handleAccuse = () => {
    if (selectedSuspect) {
      onAccuse(selectedSuspect, selectedClues);
    }
  };

  const toggleClue = (clueId: string) => {
    setSelectedClues(prev => 
      prev.includes(clueId) 
        ? prev.filter(id => id !== clueId)
        : [...prev, clueId]
    );
  };

  const suspectObj = suspects.find(s => s.id === selectedSuspect);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-noir-900 border border-accent-blood rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-noir-700 bg-accent-blood/10 flex items-center justify-between">
          <h2 className="text-xl font-serif text-accent-blood">Make Your Accusation</h2>
          <button onClick={onClose} className="p-2 hover:bg-noir-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[65vh]">
          {/* Suspects List */}
          <div className="w-1/3 border-r border-noir-700 overflow-y-auto p-4">
            <h3 className="text-sm text-noir-400 uppercase tracking-wider mb-3">
              Suspects ({suspects.length})
            </h3>
            
            <div className="space-y-2">
              {suspects.map(suspect => (
                <button
                  key={suspect.id}
                  onClick={() => setSelectedSuspect(suspect.id)}
                  className={clsx(
                    "w-full p-3 text-left rounded-lg border transition-all",
                    selectedSuspect === suspect.id
                      ? "bg-accent-blood/10 border-accent-blood"
                      : "bg-noir-800 border-noir-700 hover:border-accent-blood"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {suspect.portrait && (
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-noir-600">
                        <img src={suspect.portrait} alt={suspect.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-accent-gold truncate">{suspect.name}</h4>
                      <p className="text-xs text-noir-500 truncate">{suspect.motive || 'Unknown motive'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Evidence Selection */}
          <div className="flex-1 overflow-y-auto p-6">
            {suspectObj ? (
              <div className="animate-slide-in">
                {/* Suspect Info */}
                <div className="mb-6 noir-card rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {suspectObj.portrait && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-noir-600">
                        <img src={suspectObj.portrait} alt={suspectObj.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-serif text-accent-gold">{suspectObj.name}</h3>
                      <p className="text-noir-300 mt-2">{suspectObj.description}</p>
                      
                      {suspectObj.alibi && (
                        <div className="mt-3 p-3 bg-noir-800 rounded-lg">
                          <h4 className="text-xs text-noir-400 uppercase tracking-wider mb-1">Alibi</h4>
                          <p className="text-sm text-noir-300">{suspectObj.alibi}</p>
                        </div>
                      )}

                      <div className="mt-3 p-3 bg-accent-blood/10 border border-accent-blood/30 rounded-lg">
                        <h4 className="text-xs text-accent-blood uppercase tracking-wider mb-1">
                          Required Evidence ({suspectObj.requiredCluesForAccusation.length})
                        </h4>
                        <ul className="text-sm text-noir-300 space-y-1">
                          {suspectObj.requiredCluesForAccusation.map(clueId => {
                            const clue = clues.find(c => c.id === clueId);
                            const hasClue = !!clue;
                            return (
                              <li key={clueId} className={clsx(
                                "flex items-center gap-2",
                                hasClue ? "text-accent-gold" : "text-noir-500"
                              )}>
                                {hasClue ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                {clue?.name || `Evidence #${clueId}`}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Select Evidence */}
                <h4 className="text-sm text-noir-400 uppercase tracking-wider mb-3">
                  Select Supporting Evidence
                </h4>
                
                {clues.length === 0 ? (
                  <p className="text-noir-500 text-sm italic">No evidence collected yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {clues.map(clue => (
                      <button
                        key={clue.id}
                        onClick={() => toggleClue(clue.id)}
                        className={clsx(
                          "evidence-card rounded-lg text-left",
                          selectedClues.includes(clue.id) && "border-accent-blood bg-noir-700"
                        )}
                      >
                        <span className="font-serif text-accent-gold text-sm">{clue.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Accuse Button */}
                <button
                  onClick={handleAccuse}
                  disabled={selectedClues.length === 0}
                  className={clsx(
                    "w-full py-3 px-4 rounded-lg font-serif text-lg transition-all",
                    selectedClues.length > 0
                      ? "bg-accent-blood hover:bg-red-700 text-white"
                      : "bg-noir-800 text-noir-500 cursor-not-allowed"
                  )}
                >
                  Make Accusation
                </button>

                <p className="text-xs text-noir-500 mt-3 text-center">
                  Choose carefully. Your accusation is final.
                </p>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-noir-500">
                <p>Select a suspect to accuse</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
