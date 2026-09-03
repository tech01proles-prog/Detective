import React from 'react';
import { Map, Clock, Backpack, Scroll, Users } from 'lucide-react';
import { clsx } from '../utils/api';

interface GameLayoutProps {
  children: React.ReactNode;
  currentTime: number;
  maxTime: number;
  locationName: string;
  clueCount: number;
  inventoryCount: number;
  onSave: () => void;
  onShowMap: () => void;
  onShowClues: () => void;
  onShowInventory: () => void;
  onShowDialogue: () => void;
  hasActiveDialogue: boolean;
}

export function GameLayout({
  children,
  currentTime,
  maxTime,
  locationName,
  clueCount,
  inventoryCount,
  onSave,
  onShowMap,
  onShowClues,
  onShowInventory,
  onShowDialogue,
  hasActiveDialogue
}: GameLayoutProps) {
  const timeProgress = (currentTime / maxTime) * 100;
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-noir-900/95 border-b border-noir-700 z-50 backdrop-blur-sm">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-serif text-accent-gold">Detective Noir</h1>
            <div className="hidden md:flex items-center gap-2 text-sm text-noir-400">
              <Map size={16} />
              <span>{locationName}</span>
            </div>
          </div>

          {/* Time Display */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-accent-gold" />
              <div className="w-32 hidden sm:block">
                <div className="flex justify-between text-xs mb-1">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-noir-500">{formatTime(maxTime)}</span>
                </div>
                <div className="h-2 bg-noir-800 rounded-full overflow-hidden">
                  <div 
                    className={clsx(
                      "h-full transition-all duration-500",
                      timeProgress > 80 ? 'bg-accent-blood' : 'bg-accent-gold'
                    )}
                    style={{ width: `${timeProgress}%` }}
                  />
                </div>
              </div>
              <span className="sm:hidden text-accent-gold">{formatTime(currentTime)}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onShowMap}
                className="p-2 hover:bg-noir-800 rounded-lg transition-colors"
                title="Map"
              >
                <Map size={20} />
              </button>
              <button
                onClick={onShowClues}
                className="p-2 hover:bg-noir-800 rounded-lg transition-colors relative"
                title="Clues"
              >
                <Scroll size={20} />
                {clueCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-gold text-noir-900 text-xs rounded-full flex items-center justify-center">
                    {clueCount}
                  </span>
                )}
              </button>
              <button
                onClick={onShowInventory}
                className="p-2 hover:bg-noir-800 rounded-lg transition-colors relative"
                title="Inventory"
              >
                <Backpack size={20} />
                {inventoryCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-gold text-noir-900 text-xs rounded-full flex items-center justify-center">
                    {inventoryCount}
                  </span>
                )}
              </button>
              {hasActiveDialogue && (
                <button
                  onClick={onShowDialogue}
                  className="p-2 hover:bg-noir-800 rounded-lg transition-colors"
                  title="Dialogue"
                >
                  <Users size={20} className="text-accent-gold" />
                </button>
              )}
              <button
                onClick={onSave}
                className="px-3 py-1.5 btn-noir text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}
