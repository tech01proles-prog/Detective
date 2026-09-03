import React from 'react';
import { MapPin, Hand, MessageCircle } from 'lucide-react';
import { Location, NPC, Interaction } from '../types';
import { clsx } from '../utils/api';

interface LocationViewProps {
  location: Location;
  npcs: NPC[];
  interactions: Interaction[];
  onInteract: (interaction: Interaction) => void;
  onTalk: (npc: NPC) => void;
}

export function LocationView({ location, npcs, interactions, onInteract, onTalk }: LocationViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Location Header */}
        <div className="noir-card rounded-lg p-6 animate-fade-in">
          <div className="flex items-start gap-3 mb-4">
            <MapPin size={24} className="text-accent-gold flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-serif text-accent-gold">{location.name}</h2>
              <p className="text-noir-400 mt-2 leading-relaxed">{location.description}</p>
            </div>
          </div>

          {/* Background Image if available */}
          {location.background && (
            <div className="mt-4 rounded-lg overflow-hidden border border-noir-700">
              <img 
                src={location.background} 
                alt={location.name}
                className="w-full h-48 object-cover opacity-80"
              />
            </div>
          )}
        </div>

        {/* NPCs Section */}
        {npcs.length > 0 && (
          <div className="animate-slide-in">
            <h3 className="text-sm text-noir-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageCircle size={18} />
              People Present
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {npcs.map(npc => (
                <button
                  key={npc.id}
                  onClick={() => onTalk(npc)}
                  className="noir-card rounded-lg p-4 text-left hover:border-accent-gold transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {npc.portrait ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-noir-600 group-hover:border-accent-gold transition-colors">
                        <img src={npc.portrait} alt={npc.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-noir-700 flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-accent-gold truncate">{npc.name}</h4>
                      <p className="text-xs text-noir-500 truncate">{npc.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interactions Section */}
        {interactions.length > 0 && (
          <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm text-noir-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Hand size={18} />
              Available Actions
            </h3>
            
            <div className="space-y-2">
              {interactions.map(interaction => (
                <button
                  key={interaction.id}
                  onClick={() => onInteract(interaction)}
                  className={clsx(
                    "w-full noir-card rounded-lg p-4 text-left hover:border-accent-gold transition-all",
                    interaction.hidden && "opacity-70"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      interaction.type === 'examine' && "bg-blue-900/30 text-blue-400",
                      interaction.type === 'take' && "bg-green-900/30 text-green-400",
                      interaction.type === 'talk' && "bg-yellow-900/30 text-yellow-400",
                      interaction.type === 'use' && "bg-purple-900/30 text-purple-400"
                    )}>
                      {interaction.type === 'examine' && '🔍'}
                      {interaction.type === 'take' && '📦'}
                      {interaction.type === 'talk' && '💬'}
                      {interaction.type === 'use' && '🔧'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif text-noir-200">{interaction.name}</h4>
                      <p className="text-sm text-noir-500 mt-1">{interaction.description}</p>
                      {interaction.requiredItems && interaction.requiredItems.length > 0 && (
                        <p className="text-xs text-accent-blood mt-2">
                          Requires: {interaction.requiredItems.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No interactions message */}
        {npcs.length === 0 && interactions.length === 0 && (
          <div className="text-center py-12 text-noir-500">
            <p>This place seems quiet... for now.</p>
            <p className="text-sm mt-2">Check the map to travel to other locations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
