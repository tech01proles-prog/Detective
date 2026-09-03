import { X, MessageCircle } from 'lucide-react';
import { NPC, DialogueNode } from '../types';

interface DialogueModalProps {
  npc: NPC;
  dialogue: DialogueNode;
  onChoose: (choiceId: string) => void;
  onClose: () => void;
}

export function DialogueModal({ npc, dialogue, onChoose, onClose }: DialogueModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-4">
      <div className="bg-noir-900 border border-noir-700 rounded-t-lg max-w-3xl w-full max-h-[70vh] overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b border-noir-700 flex items-center justify-between bg-noir-800">
          <div className="flex items-center gap-3">
            {npc.portrait && (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-accent-gold">
                <img src={npc.portrait} alt={npc.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h3 className="font-serif text-accent-gold">{npc.name}</h3>
              <p className="text-xs text-noir-400">{npc.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-noir-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Dialogue Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {/* Current dialogue text */}
          <div className="mb-6">
            <div className="flex items-start gap-3">
              {npc.portrait && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-noir-600 flex-shrink-0">
                  <img src={npc.portrait} alt={npc.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="noir-card rounded-lg p-4 flex-1">
                <p className="text-noir-200 leading-relaxed">{dialogue.text}</p>
              </div>
            </div>
          </div>

          {/* Choices */}
          {dialogue.choices && dialogue.choices.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm text-noir-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MessageCircle size={16} />
                Choose your response
              </h4>
              
              {dialogue.choices.map(choice => {
                const isAvailable = (!choice.requiredClues || choice.requiredClues.length === 0);
                
                return (
                  <button
                    key={choice.id}
                    onClick={() => isAvailable && onChoose(choice.id)}
                    disabled={!isAvailable}
                    className={`w-full p-3 text-left rounded-lg border transition-all ${
                      isAvailable
                        ? 'bg-noir-800 border-noir-600 hover:border-accent-gold hover:bg-noir-700'
                        : 'bg-noir-900 border-noir-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-noir-200">{choice.text}</span>
                    {!isAvailable && (
                      <span className="ml-2 text-xs text-noir-500">(Requires evidence)</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!dialogue.choices || dialogue.choices.length === 0 ? (
            <button
              onClick={onClose}
              className="w-full p-3 btn-noir rounded-lg mt-4"
            >
              End Conversation
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
