import { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameLayout } from './components/GameLayout';
import { GameState, Scenario, Clue } from './types';
import { fetchScenarios, fetchScenario, loadGameSave, importScenarioFile } from './utils/api';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Array<{ id: string; title: string; author: string; description: string }>>([]);
  const [saves, setSaves] = useState<Array<{ id: string; scenario_id: string; player_name: string; updated_at: string }>>([]);
  const [scenarioTitles, setScenarioTitles] = useState<Record<string, string>>({});

  // Загрузка списка сценариев и сохранений
  useEffect(() => {
    const loadData = async () => {
      try {
        const [scenariosData, savesData] = await Promise.all([
          fetchScenarios(),
          loadGameSave('list') // Получаем список сохранений
        ]);
        
        setScenarios(scenariosData);
        setSaves(savesData);
        
        // Создаем маппинг ID сценариев к названиям
        const titles: Record<string, string> = {};
        scenariosData.forEach((s: { id: string; title: string }) => {
          titles[s.id] = s.title;
        });
        // Добавляем названия из сохранений
        savesData.forEach((save: { scenario_id: string; scenario?: { title: string } }) => {
          if (save.scenario && !titles[save.scenario_id]) {
            titles[save.scenario_id] = save.scenario.title;
          }
        });
        setScenarioTitles(titles);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Попытка загрузить последнее сохранение из localStorage
  useEffect(() => {
    const savedGameId = localStorage.getItem('lastSaveId');
    if (savedGameId && !gameState) {
      loadGameSave(savedGameId)
        .then((saveData) => {
          setGameState(saveData.state as GameState);
          setScenario(saveData.scenario as Scenario);
        })
        .catch((err) => {
          console.warn('Failed to load saved game:', err);
        });
    }
  }, []);

  const handleImportScenario = async (file: File) => {
    try {
      await importScenarioFile(file);
      // После импорта обновляем список сценариев
      const scenariosData = await fetchScenarios();
      setScenarios(scenariosData);
      
      const titles: Record<string, string> = {};
      scenariosData.forEach((s: { id: string; title: string }) => {
        titles[s.id] = s.title;
      });
      setScenarioTitles(titles);
      
      alert('Scenario imported successfully!');
    } catch (err) {
      alert('Failed to import scenario.');
      console.error(err);
    }
  };

  const startNewGame = async (scenarioId?: string) => {
    if (!scenarioId) {
      alert('Please select a scenario from the list.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const scenarioData = await fetchScenario(scenarioId);
      
      const initialState: GameState = {
        currentLocationId: scenarioData.initialGameState.currentLocationId,
        inventory: scenarioData.initialGameState.inventory || [],
        clues: [],
        visitedLocations: [],
        completedInteractions: [],
        dialogueStates: {},
        currentTime: 0,
        maxTime: scenarioData.initialGameState.maxTime || 480,
        gameStatus: 'playing',
        npcLocations: {},
      };

      setScenario(scenarioData);
      setGameState(initialState);
      localStorage.setItem('lastScenarioId', scenarioId);
    } catch (err) {
      setError('Failed to load scenario. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  const saveGame = async () => {
    if (!gameState || !scenario) return;
    
    try {
      const saveData = {
        scenarioId: scenario.id,
        scenario,
        state: gameState,
      };
      
      // Сохраняем в localStorage для быстрого доступа
      const saveId = `save_${Date.now()}`;
      localStorage.setItem(saveId, JSON.stringify(saveData));
      localStorage.setItem('lastSaveId', saveId);
      
      alert('Game saved successfully!');
    } catch (err) {
      alert('Failed to save game.');
      console.error(err);
    }
  };

  const updateGameState = (newState: Partial<GameState>) => {
    if (!gameState) return;
    setGameState({ ...gameState, ...newState });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-noir-950 text-noir-100 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-serif text-accent-gold mb-4">Detective Noir</h1>
          <p className="text-noir-400 mb-6">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-noir-950 text-noir-100 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-serif text-accent-gold mb-4">Error</h1>
          <p className="text-red-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-accent-gold text-noir-950 rounded hover:bg-opacity-80"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return <MainMenu 
      onNewGame={startNewGame}
      onLoadGame={(saveId) => loadGameSave(saveId).then((saveData) => {
        setGameState(saveData.state as GameState);
        setScenario(saveData.scenario as Scenario);
      })}
      onImportScenario={handleImportScenario}
      scenarios={scenarios}
      saves={saves}
      scenarioTitles={scenarioTitles}
    />;
  }

  const location = scenario?.locations.find(loc => loc.id === gameState.currentLocationId);

  return (
    <GameLayout 
      currentTime={gameState.currentTime}
      maxTime={gameState.maxTime}
      locationName={location?.name || 'Unknown Location'}
      clueCount={gameState.clues.length}
      inventoryCount={gameState.inventory.length}
      onSave={saveGame}
      onShowMap={() => {}}
      onShowClues={() => {}}
      onShowInventory={() => {}}
      onShowDialogue={() => {}}
      hasActiveDialogue={false}
    >
      <div className="p-4">
        <h2 className="text-2xl font-serif text-accent-gold mb-4">{location?.name}</h2>
        <p className="text-noir-300">{location?.description}</p>
      </div>
    </GameLayout>
  );
}

export default App;
