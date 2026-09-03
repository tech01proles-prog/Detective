import type { Scenario, Location, NPC, Clue } from '../types';

/**
 * Валидатор сценариев
 * Проверяет корректность загруженного сценария
 */
export class ScenarioValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Валидирует сценарий и возвращает отчет
   */
  validate(scenario: Scenario): { valid: boolean; errors: string[]; warnings: string[] } {
    this.errors = [];
    this.warnings = [];

    // Проверка обязательных полей
    if (!scenario.id) this.addError('Отсутствует ID сценария');
    if (!scenario.title) this.addError('Отсутствует название сценария');
    if (!scenario.author) this.addError('Отсутствует автор сценария');
    if (!scenario.description) this.addWarning('Отсутствует описание сценария');
    if (!scenario.startingLocationId) this.addError('Не указана стартовая локация');
    if (!scenario.locations || scenario.locations.length === 0) {
      this.addError('Нет локаций в сценарии');
    }
    if (!scenario.npcs || scenario.npcs.length === 0) {
      this.addWarning('Нет NPC в сценарии');
    }
    if (!scenario.clues || scenario.clues.length === 0) {
      this.addWarning('Нет улик в сценарии');
    }
    if (!scenario.suspects || scenario.suspects.length === 0) {
      this.addError('Нет подозреваемых в сценарии');
    }
    if (!scenario.correctSuspect) {
      this.addError('Не указан правильный подозреваемый');
    }
    if (!scenario.requiredClueCount || scenario.requiredClueCount < 1) {
      this.addError('Некорректное количество улик для вердикта');
    }

    // Проверка стартовой локации
    if (scenario.startingLocationId && scenario.locations.length > 0) {
      const startingLocation = scenario.locations.find(l => l.id === scenario.startingLocationId);
      if (!startingLocation) {
        this.addError(`Стартовая локация "${scenario.startingLocationId}" не найдена`);
      }
    }

    // Проверка локаций
    const locationIds = new Set<string>();
    for (const location of scenario.locations) {
      this.validateLocation(location, scenario);
      if (locationIds.has(location.id)) {
        this.addError(`Дублируется ID локации: ${location.id}`);
      }
      locationIds.add(location.id);
    }

    // Проверка NPC
    const npcIds = new Set<string>();
    for (const npc of scenario.npcs) {
      this.validateNPC(npc, scenario);
      if (npcIds.has(npc.id)) {
        this.addError(`Дублируется ID NPC: ${npc.id}`);
      }
      npcIds.add(npc.id);

      // Проверка что NPC находится в существующей локации
      if (!locationIds.has(npc.currentLocationId)) {
        this.addError(`NPC "${npc.name}" находится в несуществующей локации "${npc.currentLocationId}"`);
      }
    }

    // Проверка что correctSuspect существует
    if (scenario.correctSuspect && !npcIds.has(scenario.correctSuspect)) {
      this.addError(`Правильный подозреваемый "${scenario.correctSuspect}" не найден среди NPC`);
    }

    // Проверка что все подозреваемые существуют
    for (const suspectId of scenario.suspects) {
      if (!npcIds.has(suspectId)) {
        this.addError(`Подозреваемый "${suspectId}" не найден среди NPC`);
      }
    }

    // Проверка улик
    const clueIds = new Set<string>();
    for (const clue of scenario.clues) {
      this.validateClue(clue, scenario);
      if (clueIds.has(clue.id)) {
        this.addError(`Дублируется ID улики: ${clue.id}`);
      }
      clueIds.add(clue.id);
    }

    // Проверка что requiredClueCount не превышает количество улик
    if (scenario.requiredClueCount > scenario.clues.length) {
      this.addWarning(
        `Требуемое количество улик (${scenario.requiredClueCount}) превышает общее число улик (${scenario.clues.length})`
      );
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  private validateLocation(location: Location, scenario: Scenario) {
    if (!location.id) {
      this.addError('Локация без ID');
      return;
    }

    if (!location.name) {
      this.addError(`Локация ${location.id} без названия`);
    }

    // Проверка точек на карте
    const pointIds = new Set<string>();
    for (const point of location.mapPoints || []) {
      if (pointIds.has(point.id)) {
        this.addError(`Дублируется ID точки на карте в локации ${location.id}: ${point.id}`);
      }
      pointIds.add(point.id);

      if (point.x < 0 || point.x > 100) {
        this.addError(`Точка ${point.id} в локации ${location.id} имеет некорректную X координату (${point.x})`);
      }

      if (point.y < 0 || point.y > 100) {
        this.addError(`Точка ${point.id} в локации ${location.id} имеет некорректную Y координату (${point.y})`);
      }
    }

    // Проверка действий
    for (const action of location.availableActions || []) {
      if (!action.id) {
        this.addError(`Действие в локации ${location.id} без ID`);
      }
      if (!action.name) {
        this.addError(`Действие ${action.id} в локации ${location.id} без названия`);
      }
    }
  }

  private validateNPC(npc: NPC, scenario: Scenario) {
    if (!npc.id) {
      this.addError('NPC без ID');
      return;
    }

    if (!npc.name) {
      this.addError(`NPC ${npc.id} без имени`);
    }

    // Проверка диалогового дерева
    if (npc.dialogTree) {
      this.validateDialogNode(npc.dialogTree, scenario, npc.id);
    }
  }

  private validateDialogNode(node: any, scenario: Scenario, npcId: string, visited = new Set<string>()) {
    if (!node.id) {
      this.addError(`Узел диалога NPC ${npcId} без ID`);
      return;
    }

    if (visited.has(node.id)) {
      // Циклическая ссылка - это допустимо, но стоит предупредить
      this.addWarning(`Циклическая ссылка в диалоге NPC ${npcId} на узле ${node.id}`);
      return;
    }

    visited.add(node.id);

    if (!node.text) {
      this.addError(`Узел диалога ${node.id} NPC ${npcId} без текста`);
    }

    // Проверка выборов
    for (const choice of node.choices || []) {
      if (!choice.id) {
        this.addError(`Выбор в узле ${node.id} NPC ${npcId} без ID`);
      }
      if (!choice.text) {
        this.addError(`Выбор ${choice.id} в узле ${node.id} NPC ${npcId} без текста`);
      }
      if (!choice.nextNodeId) {
        this.addError(`Выбор ${choice.id} в узле ${node.id} NPC ${npcId} не указывает следующий узел`);
      }
    }

    // Рекурсивная проверка следующих узлов (если они есть в дереве)
    // В полной реализации нужно проверять все достижимые узлы
  }

  private validateClue(clue: Clue, scenario: Scenario) {
    if (!clue.id) {
      this.addError('Улика без ID');
      return;
    }

    if (!clue.name) {
      this.addError(`Улика ${clue.id} без названия`);
    }

    if (!clue.description) {
      this.addWarning(`Улика ${clue.id} без описания`);
    }

    if (!clue.type || !['text', 'photo', 'audio'].includes(clue.type)) {
      this.addError(`Улика ${clue.id} имеет некорректный тип: ${clue.type}`);
    }

    if (!clue.content) {
      this.addError(`Улика ${clue.id} без контента`);
    }
  }

  private addError(message: string) {
    this.errors.push(message);
  }

  private addWarning(message: string) {
    this.warnings.push(message);
  }
}

/**
 * Хук для валидации сценариев
 */
export const useScenarioValidator = () => {
  const validator = new ScenarioValidator();
  
  const validate = (scenario: any) => {
    return validator.validate(scenario);
  };

  return { validate };
};
