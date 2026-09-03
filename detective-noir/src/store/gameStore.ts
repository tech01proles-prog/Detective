import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Scenario, GameState, Clue, NPC, Location, SavedGame } from '../types';

interface GameStore {
  // Сценарий
  currentScenario: Scenario | null;
  
  // Состояние игры
  gameState: GameState | null;
  
  // Загруженные сценарии (метаданные)
  availableScenarios: { id: string; title: string; author: string }[];
  
  // Действия
  loadScenario: (scenario: Scenario) => void;
  initializeGame: (scenarioId: string, startingLocationId: string, startTime: string) => void;
  updateGameState: (updates: Partial<GameState>) => void;
  movePlayer: (locationId: string, timeCost: number) => void;
  addClue: (clueId: string) => void;
  setFlag: (flagName: string, value: boolean) => void;
  advanceTime: (minutes: number) => void;
  giveVerdict: (suspectId: string, supportingClues: string[]) => boolean;
  
  // Сохранения
  saveGame: (name: string) => SavedGame;
  loadSavedGame: (savedGame: SavedGame) => void;
  getSavedGames: () => SavedGame[];
  
  // Сценарии
  uploadScenario: (scenario: Scenario) => void;
  getScenarioById: (id: string) => Scenario | null;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentScenario: null,
      gameState: null,
      availableScenarios: [],
      
      loadScenario: (scenario: Scenario) => {
        set({ currentScenario: scenario });
      },
      
      initializeGame: (scenarioId: string, startingLocationId: string, startTime: string) => {
        const scenario = get().currentScenario;
        if (!scenario) throw new Error('Scenario not loaded');
        
        set({
          gameState: {
            scenarioId,
            currentLocationId: startingLocationId,
            currentTime: startTime,
            collectedClues: [],
            flags: { ...scenario.initialFlags },
            visitedLocations: [startingLocationId],
            npcStates: {},
            locationStates: {},
            isScenarioComplete: false,
          },
        });
      },
      
      updateGameState: (updates: Partial<GameState>) => {
        set((state) => ({
          gameState: state.gameState ? { ...state.gameState, ...updates } : null,
        }));
      },
      
      movePlayer: (locationId: string, timeCost: number) => {
        const state = get().gameState;
        if (!state) return;
        
        const newTime = new Date(state.currentTime);
        newTime.setMinutes(newTime.getMinutes() + timeCost);
        
        const visitedLocations = state.visitedLocations.includes(locationId)
          ? state.visitedLocations
          : [...state.visitedLocations, locationId];
        
        set({
          gameState: {
            ...state,
            currentLocationId: locationId,
            currentTime: newTime.toISOString(),
            visitedLocations,
          },
        });
      },
      
      addClue: (clueId: string) => {
        const state = get().gameState;
        if (!state || state.collectedClues.includes(clueId)) return;
        
        set({
          gameState: {
            ...state,
            collectedClues: [...state.collectedClues, clueId],
          },
        });
      },
      
      setFlag: (flagName: string, value: boolean) => {
        const state = get().gameState;
        if (!state) return;
        
        set({
          gameState: {
            ...state,
            flags: { ...state.flags, [flagName]: value },
          },
        });
      },
      
      advanceTime: (minutes: number) => {
        const state = get().gameState;
        if (!state) return;
        
        const newTime = new Date(state.currentTime);
        newTime.setMinutes(newTime.getMinutes() + minutes);
        
        set({
          gameState: {
            ...state,
            currentTime: newTime.toISOString(),
          },
        });
      },
      
      giveVerdict: (suspectId: string, supportingClues: string[]): boolean => {
        const state = get().gameState;
        const scenario = get().currentScenario;
        
        if (!state || !scenario) return false;
        
        const isCorrect = suspectId === scenario.correctSuspect;
        
        set({
          gameState: {
            ...state,
            isScenarioComplete: true,
            verdictGiven: {
              suspectId,
              supportingClues,
              isCorrect,
            },
          },
        });
        
        return isCorrect;
      },
      
      saveGame: (name: string): SavedGame => {
        const state = get().gameState;
        const scenario = get().currentScenario;
        
        if (!state || !scenario) throw new Error('No active game to save');
        
        const savedGame: SavedGame = {
          id: crypto.randomUUID(),
          name,
          scenarioId: scenario.id,
          gameState: { ...state },
          savedAt: new Date().toISOString(),
        };
        
        // Сохраняем в localStorage
        const existingSaves = getSavedGamesFromStorage();
        localStorage.setItem(
          `detective_save_${savedGame.id}`,
          JSON.stringify(savedGame)
        );
        localStorage.setItem(
          'detective_saves_index',
          JSON.stringify([...existingSaves, savedGame])
        );
        
        return savedGame;
      },
      
      loadSavedGame: (savedGame: SavedGame) => {
        const scenario = get().getScenarioById(savedGame.scenarioId);
        if (!scenario) throw new Error('Scenario not found');
        
        set({
          currentScenario: scenario,
          gameState: savedGame.gameState,
        });
      },
      
      getSavedGames: () => {
        return getSavedGamesFromStorage();
      },
      
      uploadScenario: (scenario: Scenario) => {
        // Сохраняем сценарий в localStorage
        localStorage.setItem(
          `detective_scenario_${scenario.id}`,
          JSON.stringify(scenario)
        );
        
        // Обновляем индекс сценариев
        const existingIndex = getScenarioIndexFromStorage();
        const newIndex = existingIndex.filter(s => s.id !== scenario.id);
        newIndex.push({ id: scenario.id, title: scenario.title, author: scenario.author });
        localStorage.setItem('detective_scenarios_index', JSON.stringify(newIndex));
        
        set({ 
          currentScenario: scenario,
          availableScenarios: newIndex,
        });
      },
      
      getScenarioById: (id: string): Scenario | null => {
        const data = localStorage.getItem(`detective_scenario_${id}`);
        return data ? JSON.parse(data) : null;
      },
    }),
    {
      name: 'detective-noir-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        availableScenarios: state.availableScenarios 
      }),
    }
  )
);

// Вспомогательные функции для работы с localStorage
function getSavedGamesFromStorage(): SavedGame[] {
  const index = localStorage.getItem('detective_saves_index');
  if (!index) return [];
  
  try {
    const parsed = JSON.parse(index);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getScenarioIndexFromStorage(): { id: string; title: string; author: string }[] {
  const index = localStorage.getItem('detective_scenarios_index');
  if (!index) return [];
  
  try {
    const parsed = JSON.parse(index);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Хелперы для получения данных
export const useClues = () => {
  const gameState = useGameStore((state) => state.gameState);
  const scenario = useGameStore((state) => state.currentScenario);
  
  if (!gameState || !scenario) return [];
  
  return scenario.clues.filter(clue => 
    gameState.collectedClues.includes(clue.id) && !clue.isHidden
  );
};

export const useCurrentLocation = () => {
  const gameState = useGameStore((state) => state.gameState);
  const scenario = useGameStore((state) => state.currentScenario);
  
  if (!gameState || !scenario) return null;
  
  return scenario.locations.find(loc => loc.id === gameState.currentLocationId) || null;
};

export const useCurrentNPCs = () => {
  const currentLocation = useCurrentLocation();
  const scenario = useGameStore((state) => state.currentScenario);
  
  if (!currentLocation || !scenario) return [];
  
  return scenario.npcs.filter(npc => npc.currentLocationId === currentLocation.id);
};

export const useCanGiveVerdict = () => {
  const gameState = useGameStore((state) => state.gameState);
  const scenario = useGameStore((state) => state.currentScenario);
  
  if (!gameState || !scenario) return false;
  
  return gameState.collectedClues.length >= scenario.requiredClueCount;
};
