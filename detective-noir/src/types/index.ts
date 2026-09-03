// ==========================================
// БАЗОВЫЕ ТИПЫ ДАННЫХ
// ==========================================

export interface Location {
  id: string;
  name: string;
  description: string;
  backgroundImage?: string; // URL или путь к изображению
  mapPoints: MapPoint[];   // Кликабельные точки на карте
  availableActions: LocationAction[];
  isUnlocked: boolean;
  state?: Record<string, any>; // Динамическое состояние локации
}

export interface MapPoint {
  id: string;
  x: number; // Процент от ширины (0-100)
  y: number; // Процент от высоты (0-100)
  type: 'npc' | 'clue' | 'interactive' | 'exit';
  targetId?: string; // ID NPC, улики или действия
  label?: string;
  isDiscovered: boolean;
}

export interface LocationAction {
  id: string;
  name: string;
  description: string;
  timeCost: number; // Минуты
  requirements?: Requirement[];
  result?: ActionResult;
  isAvailable: boolean;
}

export interface NPC {
  id: string;
  name: string;
  portrait?: string;
  description: string;
  currentLocationId: string;
  dialogTree: DialogNode;
  trustLevel?: number;
  state?: Record<string, any>;
}

export interface DialogNode {
  id: string;
  text: string;
  speakerId: string;
  choices: DialogChoice[];
  onEnter?: ScriptAction[];
  cluesGranted?: string[];
  flagsSet?: Record<string, boolean>;
}

export interface DialogChoice {
  id: string;
  text: string;
  nextNodeId: string;
  requirements?: Requirement[];
  onChoose?: ScriptAction[];
}

export interface Clue {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'photo' | 'audio';
  content: string; // Текст, URL изображения или аудио
  tags: string[];
  obtainedAt?: string;
  sourceLocationId?: string;
  isHidden: boolean;
  hiddenUntil?: string[]; // IDs улик или флагов, которые должны быть получены
}

export interface Requirement {
  type: 'hasClue' | 'hasFlag' | 'locationState' | 'timeBefore' | 'timeAfter';
  value: string | number;
}

export interface ScriptAction {
  type: 'setFlag' | 'addClue' | 'moveNPC' | 'changeLocationState' | 'advanceTime';
  target: string;
  value?: any;
}

export interface ActionResult {
  cluesGranted?: string[];
  flagsSet?: Record<string, boolean>;
  message: string;
  timeCost: number;
}

export interface Scenario {
  id: string;
  title: string;
  author: string;
  description: string;
  startingLocationId: string;
  startingTime: string; // ISO формат
  timeLimit?: number; // Минуты до нового преступления
  locations: Location[];
  npcs: NPC[];
  clues: Clue[];
  initialFlags: Record<string, boolean>;
  suspects: string[]; // IDs подозреваемых (для финального выбора)
  correctSuspect: string;
  requiredClueCount: number; // Минимум улик для вынесения вердикта
}

export interface GameState {
  scenarioId: string;
  currentLocationId: string;
  currentTime: string;
  collectedClues: string[]; // IDs
  flags: Record<string, boolean>;
  visitedLocations: string[];
  npcStates: Record<string, any>;
  locationStates: Record<string, any>;
  isScenarioComplete: boolean;
  verdictGiven?: Verdict;
}

export interface Verdict {
  suspectId: string;
  supportingClues: string[];
  isCorrect: boolean;
}

export interface SavedGame {
  id: string;
  name: string;
  scenarioId: string;
  gameState: GameState;
  savedAt: string;
}

// ==========================================
// ТИПЫ ДЛЯ РЕДАКТОРА СЦЕНАРИЕВ
// ==========================================

export interface EditorState {
  isEditing: boolean;
  currentScenario: Scenario | null;
  unsavedChanges: boolean;
}
