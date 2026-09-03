import { useState, useEffect } from 'react';
import MainMenu from './components/MainMenu';
import GameLayout from './components/GameLayout';
import { GameState, Scenario, Clue } from './types';
import { fetchScenarios, fetchScenario, loadGameSave } from './utils/api';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Попытка загрузить последнее сохранение из localStorage
    const savedGameId = localStorage.getItem('lastSaveId');
    if (savedGameId) {
      loadGameSave(savedGameId)
        .then((saveData) => {
          setGameState(saveData.state as GameState);
          setScenario(saveData.scenario as Scenario);
          setLoading(false);
        })
        .catch((err) => {
          console.warn('Failed to load saved game:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const startNewGame = async (scenarioId: string) => {
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
    return <MainMenu onStartGame={startNewGame} />;
  }

  return (
    <GameLayout 
      gameState={gameState}
      scenario={scenario}
      onUpdateState={updateGameState}
      onSaveGame={saveGame}
    />
  );
}

export default App;
