import { Scenario, GameState } from '../types';

const API_BASE = 'http://138.16.177.245:3001/api';

export const api = {
  async fetchScenarios(): Promise<Array<{ id: string; title: string; author: string; description: string; created_at: string }>> {
    const response = await fetch(`${API_BASE}/scenarios`);
    if (!response.ok) throw new Error('Failed to fetch scenarios');
    return response.json();
  },

  async fetchScenario(id: string): Promise<Scenario> {
    const response = await fetch(`${API_BASE}/scenarios/${id}`);
    if (!response.ok) throw new Error('Failed to fetch scenario');
    const data = await response.json();
    return {
      ...data,
      content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content
    };
  },

  async createScenario(scenario: Scenario): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE}/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: scenario.id,
        title: scenario.title,
        author: scenario.author,
        description: scenario.description,
        content: scenario
      })
    });
    if (!response.ok) throw new Error('Failed to create scenario');
    return response.json();
  },

  async updateScenario(id: string, scenario: Scenario): Promise<void> {
    const response = await fetch(`${API_BASE}/scenarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: scenario.title,
        author: scenario.author,
        description: scenario.description,
        content: scenario
      })
    });
    if (!response.ok) throw new Error('Failed to update scenario');
  },

  async deleteScenario(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/scenarios/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete scenario');
  },

  async saveGame(saveData: { id?: string; scenario_id: string; player_name: string; game_state: GameState }): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE}/saves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData)
    });
    if (!response.ok) throw new Error('Failed to save game');
    return response.json();
  },

  async loadGame(id: string): Promise<{ id: string; scenario_id: string; player_name: string; game_state: GameState }> {
    const response = await fetch(`${API_BASE}/saves/${id}`);
    if (!response.ok) throw new Error('Failed to load game');
    return response.json();
  },

  async fetchSaves(scenario_id?: string): Promise<Array<{ id: string; scenario_id: string; player_name: string; created_at: string; updated_at: string }>> {
    const url = scenario_id ? `${API_BASE}/saves?scenario_id=${scenario_id}` : `${API_BASE}/saves`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch saves');
    return response.json();
  },

  async uploadFile(file: File): Promise<{ id: string; url: string; originalName: string; mimeType: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload file');
    return response.json();
  },

  async getFile(id: string): Promise<{ id: string; url: string; originalName: string; mimeType: string; size: number }> {
    const response = await fetch(`${API_BASE}/files/${id}`);
    if (!response.ok) throw new Error('Failed to fetch file');
    return response.json();
  }
};

export const storage = {
  getLocalSave(scenarioId: string): GameState | null {
    const key = `detective_game_save_${scenarioId}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  },

  setLocalSave(scenarioId: string, gameState: GameState): void {
    const key = `detective_game_save_${scenarioId}`;
    localStorage.setItem(key, JSON.stringify(gameState));
  },

  clearLocalSave(scenarioId: string): void {
    const key = `detective_game_save_${scenarioId}`;
    localStorage.removeItem(key);
  },

  getLocalScenarios(): Array<{ id: string; scenario: Scenario }> {
    const scenarios: Array<{ id: string; scenario: Scenario }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('detective_game_scenario_')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const scenario = JSON.parse(data);
            const id = key.replace('detective_game_scenario_', '');
            scenarios.push({ id, scenario });
          } catch {}
        }
      }
    }
    return scenarios;
  },

  setLocalScenario(id: string, scenario: Scenario): void {
    const key = `detective_game_scenario_${id}`;
    localStorage.setItem(key, JSON.stringify(scenario));
  }
};

// Helper functions for App.tsx
export async function fetchScenarios() {
  return api.fetchScenarios();
}

export async function fetchScenario(id: string) {
  return api.fetchScenario(id);
}

export async function loadGameSave(saveId: string) {
  // Сначала пробуем загрузить из localStorage
  const localData = localStorage.getItem(saveId);
  if (localData) {
    return JSON.parse(localData);
  }
  // Если нет, пробуем с сервера
  return api.loadGame(saveId);
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function clsx(...classes: Array<string | boolean | undefined | null>): string {
  return classes.filter(Boolean).join(' ');
}
