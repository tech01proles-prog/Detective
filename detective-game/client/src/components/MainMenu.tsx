import { useRef } from 'react';
import { FileText, Upload, Download, Plus } from 'lucide-react';


interface MainMenuProps {
  onNewGame: (scenarioId?: string) => void;
  onLoadGame: (saveId: string) => void;
  onImportScenario: (file: File) => void;
  scenarios: Array<{ id: string; title: string; author: string; description: string }>;
  saves: Array<{ id: string; scenario_id: string; player_name: string; updated_at: string }>;
  scenarioTitles: Record<string, string>;
}

export function MainMenu({ 
  onNewGame, 
  onLoadGame, 
  onImportScenario,
  scenarios, 
  saves,
  scenarioTitles 
}: MainMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportScenario(file);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Title */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl font-serif text-accent-gold mb-4 tracking-tight">
            Detective Noir
          </h1>
          <p className="text-noir-400 text-lg">
            A mystery awaits in the shadows of the city
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* New Game / Scenarios */}
          <div className="noir-card rounded-lg p-6 animate-slide-in">
            <h2 className="text-xl font-serif text-accent-gold mb-4 flex items-center gap-2">
              <FileText size={20} />
              Scenarios
            </h2>

            <button
              onClick={() => onNewGame()}
              className="w-full mb-4 py-3 px-4 bg-accent-gold hover:bg-yellow-600 text-noir-900 rounded-lg font-serif transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              New Game
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full mb-4 py-3 px-4 bg-noir-800 hover:bg-noir-700 border border-noir-600 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              Import Scenario
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {scenarios.length === 0 ? (
                <p className="text-noir-500 text-sm text-center py-4">
                  No scenarios available. Import one to start playing.
                </p>
              ) : (
                scenarios.map(scenario => (
                  <button
                    key={scenario.id}
                    onClick={() => onNewGame(scenario.id)}
                    className="w-full p-3 text-left bg-noir-800 hover:bg-noir-700 rounded-lg border border-noir-700 hover:border-accent-gold transition-all group"
                  >
                    <h3 className="font-serif text-accent-gold group-hover:text-yellow-400">
                      {scenario.title}
                    </h3>
                    <p className="text-xs text-noir-500 mt-1">by {scenario.author}</p>
                    {scenario.description && (
                      <p className="text-sm text-noir-400 mt-2 line-clamp-2">
                        {scenario.description}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Load Game */}
          <div className="noir-card rounded-lg p-6 animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-xl font-serif text-accent-gold mb-4 flex items-center gap-2">
              <Download size={20} />
              Continue Investigation
            </h2>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {saves.length === 0 ? (
                <p className="text-noir-500 text-sm text-center py-8">
                  No saved games found
                </p>
              ) : (
                saves.map(save => (
                  <button
                    key={save.id}
                    onClick={() => onLoadGame(save.id)}
                    className="w-full p-4 text-left bg-noir-800 hover:bg-noir-700 rounded-lg border border-noir-700 hover:border-accent-gold transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-accent-gold">
                          {scenarioTitles[save.scenario_id] || 'Unknown Scenario'}
                        </h3>
                        <p className="text-sm text-noir-400 mt-1">
                          Detective: {save.player_name || 'Anonymous'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-noir-500">
                          {new Date(save.updated_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-noir-600">
                          {new Date(save.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-noir-500 text-sm">
          <p>Create your own scenarios using JSON format or import from the server.</p>
          <p className="mt-2">Travel between locations, gather evidence, interrogate suspects, and solve the case.</p>
        </div>
      </div>
    </div>
  );
}
