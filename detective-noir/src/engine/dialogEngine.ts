import type { Scenario, DialogNode, DialogChoice, ScriptAction, GameState, NPC } from '../types';

/**
 * Движок выполнения скриптов и диалогов
 */
export class DialogEngine {
  private scenario: Scenario;
  private gameState: GameState;
  private currentDialogNodeId: string | null = null;
  private allDialogNodes: Map<string, DialogNode> = new Map();

  constructor(scenario: Scenario, gameState: GameState) {
    this.scenario = scenario;
    this.gameState = gameState;
    
    // Индексируем все узлы диалогов для быстрого поиска
    this.indexDialogNodes();
  }

  /**
   * Индексирует все узлы диалогов из всех NPC
   */
  private indexDialogNodes() {
    const queue: DialogNode[] = [];
    
    for (const npc of this.scenario.npcs) {
      queue.push(npc.dialogTree);
    }
    
    while (queue.length > 0) {
      const node = queue.shift()!;
      this.allDialogNodes.set(node.id, node);
      
      for (const choice of node.choices) {
        const nextNode = this.allDialogNodes.get(choice.nextNodeId);
        if (nextNode && !this.allDialogNodes.has(nextNode.id)) {
          queue.push(nextNode);
        }
      }
    }
  }

  /**
   * Начинает диалог с NPC
   */
  startDialog(npcId: string): DialogNode | null {
    const npc = this.scenario.npcs.find(n => n.id === npcId);
    if (!npc) return null;

    this.currentDialogNodeId = npc.dialogTree.id;
    
    // Выполняем действия при входе в диалог
    if (npc.dialogTree.onEnter) {
      this.executeActions(npc.dialogTree.onEnter);
    }

    return npc.dialogTree;
  }

  /**
   * Получает текущий узел диалога
   */
  getCurrentNode(): DialogNode | null {
    if (!this.currentDialogNodeId) return null;
    return this.allDialogNodes.get(this.currentDialogNodeId) || null;
  }

  /**
   * Выбирает опцию в диалоге
   */
  chooseOption(choiceId: string): DialogNode | null {
    const currentNode = this.getCurrentNode();
    if (!currentNode) return null;

    const choice = currentNode.choices.find(c => c.id === choiceId);
    if (!choice) return null;

    // Проверяем требования
    if (choice.requirements && !this.checkRequirements(choice.requirements)) {
      return null;
    }

    // Выполняем действия при выборе
    if (choice.onChoose) {
      this.executeActions(choice.onChoose);
    }

    // Переходим к следующему узлу
    this.currentDialogNodeId = choice.nextNodeId;
    return this.getCurrentNode();
  }

  /**
   * Проверяет требования для выбора опции
   */
  private checkRequirements(requirements: Array<{ type: string; value: string | number }>): boolean {
    for (const req of requirements) {
      switch (req.type) {
        case 'hasClue':
          if (!this.gameState.collectedClues.includes(req.value as string)) {
            return false;
          }
          break;
        case 'hasFlag':
          if (!this.gameState.flags[req.value as string]) {
            return false;
          }
          break;
        case 'timeBefore': {
          const currentTime = new Date(this.gameState.currentTime).getTime();
          const targetTime = new Date(req.value as string).getTime();
          if (currentTime >= targetTime) return false;
          break;
        }
        case 'timeAfter': {
          const currentTime = new Date(this.gameState.currentTime).getTime();
          const targetTime = new Date(req.value as string).getTime();
          if (currentTime <= targetTime) return false;
          break;
        }
      }
    }
    return true;
  }

  /**
   * Выполняет массив действий скрипта
   */
  private executeActions(actions: ScriptAction[]) {
    for (const action of actions) {
      this.executeAction(action);
    }
  }

  /**
   * Выполняет одно действие скрипта
   * Возвращает эффекты, которые должны быть применены к состоянию игры
   */
  private executeAction(action: ScriptAction) {
    // В реальной реализации здесь будут вызовы store методов
    console.log('Executing action:', action);
  }

  /**
   * Проверяет, можно ли вынести вердикт
   */
  canGiveVerdict(): boolean {
    return this.gameState.collectedClues.length >= this.scenario.requiredClueCount;
  }

  /**
   * Получает всех подозреваемых
   */
  getSuspects() {
    return this.scenario.suspects
      .map(id => this.scenario.npcs.find(n => n.id === id))
      .filter((npc): npc is NPC => !!npc);
  }

  /**
   * Получает все собранные улики
   */
  getCollectedClues() {
    const clueIds = this.gameState.collectedClues;
    return this.scenario.clues.filter(clue => 
      clueIds.includes(clue.id) && !clue.isHidden
    );
  }
  
  /**
   * Сбрасывает текущий диалог
   */
  endDialog() {
    this.currentDialogNodeId = null;
  }
}
