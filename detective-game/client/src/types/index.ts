export interface Location {
  id: string;
  name: string;
  description: string;
  background?: string;
  mapPosition: { x: number; y: number };
  connections: string[];
  interactions?: Interaction[];
  npcs?: NPC[];
  visited?: boolean;
  locked?: boolean;
  lockCondition?: string;
}

export interface Interaction {
  id: string;
  name: string;
  description: string;
  type: 'examine' | 'take' | 'talk' | 'use';
  result?: ActionResult;
  requiredItems?: string[];
  hidden?: boolean;
  hideAfterUse?: boolean;
}

export interface ActionResult {
  message: string;
  itemsGained?: string[];
  cluesGained?: string[];
  timePassed?: number;
  nextInteractionId?: string;
  conditionMet?: boolean;
}

export interface NPC {
  id: string;
  name: string;
  portrait?: string;
  description: string;
  dialogueTree: DialogueNode;
  locationId: string;
  currentLocationId?: string;
  moved?: boolean;
}

export interface DialogueNode {
  id: string;
  text: string;
  speaker: string;
  choices?: DialogueChoice[];
  onEnter?: DialogueAction;
  cluesGained?: string[];
  itemsGained?: string[];
  timePassed?: number;
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string;
  requiredClues?: string[];
  requiredItems?: string[];
  condition?: string;
  accusation?: {
    suspectId: string;
    requiredClues: string[];
  };
}

export interface DialogueAction {
  type: 'move_npc' | 'unlock_location' | 'give_item' | 'give_clue';
  targetId: string;
  value?: string;
}

export interface Clue {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'photo' | 'audio' | 'document';
  content: string;
  tags: string[];
  obtainedAt: Date;
  sourceLocationId?: string;
  sourceNPCId?: string;
  hidden?: boolean;
  revealed?: boolean;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'key' | 'tool' | 'evidence' | 'consumable';
  icon?: string;
  usable?: boolean;
  consumeOnUse?: boolean;
}

export interface Suspect {
  id: string;
  name: string;
  description: string;
  portrait?: string;
  motive?: string;
  alibi?: string;
  isGuilty: boolean;
  requiredCluesForAccusation: string[];
}

export interface GameState {
  currentLocationId: string;
  inventory: Item[];
  clues: Clue[];
  visitedLocations: string[];
  completedInteractions: string[];
  dialogueStates: Record<string, string>;
  currentTime: number;
  maxTime: number;
  gameStatus: 'playing' | 'won' | 'lost' | 'accusing';
  accusedSuspectId?: string;
  accusationResult?: boolean;
  npcLocations: Record<string, string>;
}

export interface Scenario {
  id: string;
  title: string;
  author: string;
  description: string;
  initialGameState: GameState;
  locations: Location[];
  npcs: NPC[];
  clues: Clue[];
  items: Item[];
  suspects: Suspect[];
  mapImage?: string;
  minCluesForAccusation: number;
}

export interface SaveData {
  id: string;
  scenarioId: string;
  playerName: string;
  gameState: GameState;
  createdAt: Date;
  updatedAt: Date;
}
