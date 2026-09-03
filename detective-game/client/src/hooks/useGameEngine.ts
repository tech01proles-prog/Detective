import { useState, useCallback } from 'react';
import { Scenario, GameState, NPC, Interaction, DialogueNode } from '../types';

interface UseGameEngineProps {
  scenario: Scenario;
  onSave?: (gameState: GameState) => void;
}

export function useGameEngine({ scenario, onSave }: UseGameEngineProps) {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem(`detective_save_${scenario.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return scenario.initialGameState;
      }
    }
    return scenario.initialGameState;
  });

  const [currentDialogue, setCurrentDialogue] = useState<DialogueNode | null>(null);
  const [messageLog, setMessageLog] = useState<string[]>([]);
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);

  const currentLocation = scenario.locations.find(l => l.id === gameState.currentLocationId);

  const addMessage = useCallback((message: string) => {
    setMessageLog(prev => [...prev.slice(-9), message]);
  }, []);

  const moveToLocation = useCallback((locationId: string) => {
    const location = scenario.locations.find(l => l.id === locationId);
    if (!location || location.locked) return false;

    setGameState(prev => ({
      ...prev,
      currentLocationId: locationId,
      visitedLocations: prev.visitedLocations.includes(locationId) 
        ? prev.visitedLocations 
        : [...prev.visitedLocations, locationId],
      currentTime: prev.currentTime + 15 // 15 minutes to travel
    }));

    addMessage(`You arrived at ${location.name}.`);
    return true;
  }, [scenario.locations, addMessage]);

  const performInteraction = useCallback((interaction: Interaction) => {
    if (!interaction.result) return;

    const result = interaction.result;
    
    // Check conditions
    if (result.conditionMet !== undefined && !result.conditionMet) {
      addMessage(result.message);
      return;
    }

    setGameState(prev => {
      const newState = { ...prev };
      
      // Add items
      if (result.itemsGained) {
        result.itemsGained.forEach(itemId => {
          const item = scenario.items.find(i => i.id === itemId);
          if (item && !newState.inventory.find(i => i.id === itemId)) {
            newState.inventory = [...newState.inventory, item];
          }
        });
      }

      // Add clues
      if (result.cluesGained) {
        result.cluesGained.forEach(clueId => {
          const clue = scenario.clues.find(c => c.id === clueId);
          if (clue && !newState.clues.find(c => c.id === clueId)) {
            newState.clues = [...newState.clues, { ...clue, obtainedAt: new Date() }];
          }
        });
      }

      // Mark interaction as completed
      if (!newState.completedInteractions.includes(interaction.id)) {
        newState.completedInteractions = [...newState.completedInteractions, interaction.id];
      }

      // Advance time
      if (result.timePassed) {
        newState.currentTime = prev.currentTime + result.timePassed;
      }

      return newState;
    });

    addMessage(result.message);
  }, [scenario.items, scenario.clues, addMessage]);

  const startDialogue = useCallback((npc: NPC) => {
    setActiveNPC(npc);
    setCurrentDialogue(npc.dialogueTree);
    
    if (npc.dialogueTree.onEnter) {
      // Handle dialogue enter actions
      const action = npc.dialogueTree.onEnter;
      setGameState(prev => {
        const newState = { ...prev };
        
        if (action.type === 'move_npc') {
          newState.npcLocations = { ...newState.npcLocations, [action.targetId]: action.value || '' };
        } else if (action.type === 'give_item') {
          const item = scenario.items.find(i => i.id === action.value);
          if (item && !newState.inventory.find(i => i.id === item.id)) {
            newState.inventory = [...newState.inventory, item];
          }
        } else if (action.type === 'give_clue') {
          const clue = scenario.clues.find(c => c.id === action.value);
          if (clue && !newState.clues.find(c => c.id === clue.id)) {
            newState.clues = [...newState.clues, { ...clue, obtainedAt: new Date() }];
          }
        }
        
        return newState;
      });
    }

    if (npc.dialogueTree.timePassed) {
      setGameState(prev => ({ ...prev, currentTime: prev.currentTime + npc.dialogueTree.timePassed! }));
    }

    if (npc.dialogueTree.cluesGained) {
      setGameState(prev => {
        const newState = { ...prev };
        npc.dialogueTree.cluesGained!.forEach(clueId => {
          const clue = scenario.clues.find(c => c.id === clueId);
          if (clue && !newState.clues.find(c => c.id === clue.id)) {
            newState.clues = [...newState.clues, { ...clue, obtainedAt: new Date() }];
          }
        });
        return newState;
      });
    }
  }, [scenario.items, scenario.clues]);

  const chooseDialogue = useCallback((choiceId: string) => {
    if (!currentDialogue || !currentDialogue.choices) return;

    const choice = currentDialogue.choices.find(c => c.id === choiceId);
    if (!choice) return;

    // Handle accusation
    if (choice.accusation) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'accusing',
        accusedSuspectId: choice.accusation!.suspectId
      }));
      setCurrentDialogue(null);
      setActiveNPC(null);
      return;
    }

    const nextNode = scenario.npcs
      .flatMap(npc => getDialogueNodes(npc.dialogueTree))
      .find(node => node.id === choice.nextNodeId);

    if (nextNode) {
      setCurrentDialogue(nextNode);
      
      if (nextNode.timePassed) {
        setGameState(prev => ({ ...prev, currentTime: prev.currentTime + nextNode.timePassed! }));
      }

      if (nextNode.cluesGained) {
        setGameState(prev => {
          const newState = { ...prev };
          nextNode.cluesGained!.forEach(clueId => {
            const clue = scenario.clues.find(c => c.id === clueId);
            if (clue && !newState.clues.find(c => c.id === clue.id)) {
              newState.clues = [...newState.clues, { ...clue, obtainedAt: new Date() }];
            }
          });
          return newState;
        });
      }
    } else {
      // End dialogue
      setCurrentDialogue(null);
      setActiveNPC(null);
    }
  }, [currentDialogue, scenario.npcs, scenario.clues]);

  const endDialogue = useCallback(() => {
    setCurrentDialogue(null);
    setActiveNPC(null);
  }, []);

  const makeAccusation = useCallback((suspectId: string, selectedClueIds: string[]) => {
    const suspect = scenario.suspects.find(s => s.id === suspectId);
    if (!suspect) return false;

    const isCorrect = suspect.isGuilty;
    const hasRequiredClues = suspect.requiredCluesForAccusation.every(
      clueId => selectedClueIds.includes(clueId)
    );

    const success = isCorrect && hasRequiredClues;

    setGameState(prev => ({
      ...prev,
      gameStatus: success ? 'won' : 'lost',
      accusationResult: success
    }));

    return success;
  }, [scenario.suspects]);

  const saveGame = useCallback(() => {
    localStorage.setItem(`detective_save_${scenario.id}`, JSON.stringify(gameState));
    onSave?.(gameState);
  }, [gameState, scenario.id, onSave]);

  const resetGame = useCallback(() => {
    localStorage.removeItem(`detective_save_${scenario.id}`);
    setGameState(scenario.initialGameState);
    setCurrentDialogue(null);
    setActiveNPC(null);
    setMessageLog([]);
  }, [scenario.initialGameState, scenario.id]);

  const canAccuse = gameState.clues.length >= scenario.minCluesForAccusation;

  const npcsInCurrentLocation = scenario.npcs.filter(
    npc => (npc.currentLocationId || npc.locationId) === gameState.currentLocationId
  );

  const availableInteractions = currentLocation?.interactions?.filter(
    interaction => !gameState.completedInteractions.includes(interaction.id)
  ) || [];

  return {
    gameState,
    currentLocation,
    npcsInCurrentLocation,
    availableInteractions,
    currentDialogue,
    activeNPC,
    messageLog,
    canAccuse,
    moveToLocation,
    performInteraction,
    startDialogue,
    chooseDialogue,
    endDialogue,
    makeAccusation,
    saveGame,
    resetGame
  };
}

function getDialogueNodes(node: DialogueNode): DialogueNode[] {
  const nodes = [node];
  if (node.choices) {
    node.choices.forEach(() => {
      // We would need to traverse the full dialogue tree here
      // For now, we'll just return the current nodes
    });
  }
  return nodes;
}
