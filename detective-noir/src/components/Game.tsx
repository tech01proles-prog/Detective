import { useState, useEffect } from 'react';
import { useGameStore, useCurrentLocation, useCurrentNPCs, useClues, useCanGiveVerdict } from '../store/gameStore';
import { DialogEngine } from '../engine/dialogEngine';
import { sampleScenario } from '../utils/sampleScenario';
import './Game.css';

export function Game() {
  const { 
    currentScenario, 
    gameState, 
    loadScenario, 
    initializeGame,
    movePlayer,
    addClue,
    setFlag,
    advanceTime,
    giveVerdict,
    saveGame,
  } = useGameStore();
  
  const currentLocation = useCurrentLocation();
  const currentNPCs = useCurrentNPCs();
  const collectedClues = useClues();
  const canGiveVerdict = useCanGiveVerdict();
  
  const [activeDialog, setActiveDialog] = useState<{ npcId: string; engine: DialogEngine } | null>(null);
  const [currentDialogNode, setCurrentDialogNode] = useState<any>(null);
  const [showVerdictModal, setShowVerdictModal] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [selectedClues, setSelectedClues] = useState<string[]>([]);
  const [verdictResult, setVerdictResult] = useState<{ correct: boolean; message: string } | null>(null);

  // Initialize game with sample scenario on mount
  useEffect(() => {
    if (!currentScenario) {
      loadScenario(sampleScenario);
    }
    
    if (currentScenario && !gameState) {
      initializeGame(
        currentScenario.id,
        currentScenario.startingLocationId,
        currentScenario.startingTime
      );
    }
  }, [currentScenario, gameState, loadScenario, initializeGame]);

  // Handle dialog start
  const startDialog = (npcId: string) => {
    if (!gameState || !currentScenario) return;
    
    const engine = new DialogEngine(currentScenario, gameState);
    const startNode = engine.startDialog(npcId);
    
    setActiveDialog({ npcId, engine });
    setCurrentDialogNode(startNode);
  };

  // Handle dialog choice
  const handleDialogChoice = (choiceId: string) => {
    if (!activeDialog) return;
    
    const nextNode = activeDialog.engine.chooseOption(choiceId);
    setCurrentDialogNode(nextNode);
    
    // Если диалог закончен (нет следующих узлов)
    if (!nextNode) {
      activeDialog.engine.endDialog();
      setActiveDialog(null);
    }
  };

  // Handle location action
  const handleLocationAction = (actionId: string) => {
    if (!currentLocation || !gameState) return;
    
    const action = currentLocation.availableActions?.find(a => a.id === actionId);
    if (!action || !action.result) return;
    
    // Применяем результаты действия
    if (action.result.cluesGranted) {
      action.result.cluesGranted.forEach(clueId => addClue(clueId));
    }
    if (action.result.flagsSet) {
      Object.entries(action.result.flagsSet).forEach(([flag, value]) => {
        setFlag(flag, value);
      });
    }
    if (action.result.timeCost) {
      advanceTime(action.result.timeCost);
    }
  };

  // Handle map point click
  const handleMapPointClick = (point: any) => {
    if (!gameState) return;
    
    switch (point.type) {
      case 'npc':
        if (point.targetId) {
          startDialog(point.targetId);
        }
        break;
      case 'clue':
        if (point.targetId && !point.isDiscovered) {
          addClue(point.targetId);
          // Помечаем точку как обнаруженную (в реальной реализации нужно обновлять состояние)
        }
        break;
      case 'exit':
        // Переход в другую локацию (нужно реализовать выбор локации)
        console.log('Exit to another location:', point.label);
        break;
      case 'interactive':
        console.log('Interactive object:', point.label);
        break;
    }
  };

  // Handle verdict submission
  const handleSubmitVerdict = () => {
    if (!selectedSuspect || !currentScenario) return;
    
    const isCorrect = giveVerdict(selectedSuspect, selectedClues);
    
    setVerdictResult({
      correct: isCorrect,
      message: isCorrect 
        ? 'Поздравляем! Вы раскрыли преступление!' 
        : 'Неверно. Настоящий убийца ускользнул...',
    });
    
    setShowVerdictModal(false);
  };

  // Format time display
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (!currentScenario || !gameState) {
    return (
      <div className="game-container">
        <div className="loading-screen">
          <h1>Загрузка дела...</h1>
          <p className="text-muted">Подготовка материалов расследования</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Header */}
      <header className="game-header">
        <div className="header-left">
          <h1 className="game-title">{currentScenario.title}</h1>
          <span className="location-name">{currentLocation?.name || 'Неизвестно'}</span>
        </div>
        <div className="header-right">
          <div className="time-display">
            <span className="time-label">Время:</span>
            <span className="time-value">{formatTime(gameState.currentTime)}</span>
          </div>
          <button 
            className="btn btn-secondary"
            onClick={() => saveGame(`Сохранение ${new Date().toLocaleTimeString()}`)}
          >
            Сохранить
          </button>
          {canGiveVerdict && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowVerdictModal(true)}
            >
              Вынести вердикт
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="game-main">
        {/* Location view */}
        <section className="location-section">
          <div className="location-map">
            {currentLocation?.backgroundImage ? (
              <img 
                src={currentLocation.backgroundImage} 
                alt={currentLocation.name}
                className="location-background"
              />
            ) : (
              <div className="location-placeholder">
                <p>{currentLocation?.description || 'Описание локации'}</p>
              </div>
            )}
            
            {/* Map points overlay */}
            <div className="map-points-overlay">
              {currentLocation?.mapPoints.map(point => (
                <button
                  key={point.id}
                  className={`map-point point-${point.type} ${point.isDiscovered ? 'discovered' : ''}`}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  onClick={() => handleMapPointClick(point)}
                  title={point.label}
                >
                  <span className="point-icon">
                    {point.type === 'npc' && '👤'}
                    {point.type === 'clue' && '🔍'}
                    {point.type === 'exit' && '🚪'}
                    {point.type === 'interactive' && '⚡'}
                  </span>
                  {point.isDiscovered && point.label && (
                    <span className="point-label">{point.label}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Location actions */}
          {currentLocation?.availableActions && currentLocation.availableActions.length > 0 && (
            <div className="location-actions">
              <h3>Доступные действия:</h3>
              <div className="actions-list">
                {currentLocation.availableActions.map(action => (
                  <button
                    key={action.id}
                    className="btn btn-secondary action-btn"
                    onClick={() => handleLocationAction(action.id)}
                    disabled={!action.isAvailable}
                  >
                    {action.name}
                    <span className="action-time">{action.timeCost} мин</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="game-sidebar">
          {/* Clues panel */}
          <div className="sidebar-panel clues-panel">
            <h3>Улики ({collectedClues.length})</h3>
            <div className="clues-list">
              {collectedClues.length === 0 ? (
                <p className="text-muted">Нет собранных улик</p>
              ) : (
                collectedClues.map(clue => (
                  <div key={clue.id} className="clue-card">
                    <div className="clue-header">
                      <h4>{clue.name}</h4>
                      <span className={`badge badge-${clue.type}`}>{clue.type}</span>
                    </div>
                    <p className="clue-description">{clue.description}</p>
                    {clue.tags.length > 0 && (
                      <div className="clue-tags">
                        {clue.tags.map(tag => (
                          <span key={tag} className="badge badge-accent">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* NPCs in location */}
          {currentNPCs.length > 0 && (
            <div className="sidebar-panel npcs-panel">
              <h3>Персонажи здесь</h3>
              <div className="npcs-list">
                {currentNPCs.map(npc => (
                  <button
                    key={npc.id}
                    className="npc-item"
                    onClick={() => startDialog(npc.id)}
                  >
                    {npc.portrait && (
                      <img src={npc.portrait} alt={npc.name} className="npc-portrait-small" />
                    )}
                    <span className="npc-name">{npc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* Dialog modal */}
      {activeDialog && currentDialogNode && (
        <div className="modal-overlay" onClick={() => setActiveDialog(null)}>
          <div className="dialog-modal" onClick={e => e.stopPropagation()}>
            <div className="dialog-content">
              <div className="dialog-speaker">
                {currentDialogNode.speakerId && (
                  <h3>{currentScenario.npcs.find(n => n.id === currentDialogNode.speakerId)?.name}</h3>
                )}
              </div>
              <p className="dialog-text">{currentDialogNode.text}</p>
              <div className="dialog-choices">
                {currentDialogNode.choices.map(choice => {
                  // Проверяем требования (упрощенно)
                  const isAvailable = !choice.requirements || choice.requirements.every(req => {
                    if (req.type === 'hasFlag') {
                      return gameState.flags[req.value as string];
                    }
                    if (req.type === 'hasClue') {
                      return gameState.collectedClues.includes(req.value as string);
                    }
                    return true;
                  });
                  
                  return (
                    <button
                      key={choice.id}
                      className="btn btn-secondary dialog-choice"
                      onClick={() => handleDialogChoice(choice.id)}
                      disabled={!isAvailable}
                    >
                      {choice.text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verdict modal */}
      {showVerdictModal && (
        <div className="modal-overlay" onClick={() => setShowVerdictModal(false)}>
          <div className="verdict-modal" onClick={e => e.stopPropagation()}>
            <h2>Вынести вердикт</h2>
            <p className="text-muted">Выберите подозреваемого и улики, подтверждающие вашу версию</p>
            
            <div className="verdict-section">
              <h3>Подозреваемый:</h3>
              <div className="suspects-list">
                {currentScenario.suspects.map(suspectId => {
                  const npc = currentScenario.npcs.find(n => n.id === suspectId);
                  if (!npc) return null;
                  
                  return (
                    <button
                      key={suspectId}
                      className={`suspect-item ${selectedSuspect === suspectId ? 'selected' : ''}`}
                      onClick={() => setSelectedSuspect(suspectId)}
                    >
                      {npc.portrait && (
                        <img src={npc.portrait} alt={npc.name} className="suspect-portrait" />
                      )}
                      <span>{npc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="verdict-section">
              <h3>Улики ({selectedClues.length} выбрано):</h3>
              <div className="verdict-clues-list">
                {collectedClues.map(clue => (
                  <label key={clue.id} className="clue-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedClues.includes(clue.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClues([...selectedClues, clue.id]);
                        } else {
                          setSelectedClues(selectedClues.filter(id => id !== clue.id));
                        }
                      }}
                    />
                    <span>{clue.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="verdict-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowVerdictModal(false)}
              >
                Отмена
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitVerdict}
                disabled={!selectedSuspect || selectedClues.length === 0}
              >
                Обвинить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verdict result modal */}
      {verdictResult && (
        <div className="modal-overlay" onClick={() => setVerdictResult(null)}>
          <div className={`verdict-result-modal ${verdictResult.correct ? 'correct' : 'incorrect'}`} onClick={e => e.stopPropagation()}>
            <h2>{verdictResult.correct ? 'Верно!' : 'Ошибка!'}</h2>
            <p>{verdictResult.message}</p>
            <button 
              className="btn btn-primary mt-lg"
              onClick={() => setVerdictResult(null)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
