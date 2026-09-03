import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Инициализация БД
const db = new Database('detective.db');

// Создание таблиц
db.exec(`
  CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS saves (
    id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    state TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
  )
`);

// Стартовый сценарий (Демо-игра "Тень над городом")
const defaultScenarioId = 'demo-noir-001';
const defaultScenario = {
  id: defaultScenarioId,
  title: "Тень над городом",
  author: "System",
  content: {
    title: "Тень над городом",
    description: "Дождливый ноябрь. В городе найдено тело мэра. Ваша задача - найти убийцу до полуночи.",
    startingLocation: "office",
    timeLimit: 480, // минут (8 часов)
    locations: [
      {
        id: "office",
        name: "Офис детектива",
        description: "Ваш кабинет. Пахнет дешевым кофе и сигаретами. На столе телефон.",
        imagePrompt: "Noir style detective office, dim light, rain on window, desk with phone, cigarette smoke, 1940s atmosphere",
        connections: ["street", "police_station"],
        interactables: [
          { id: "phone_call", name: "Ответить на звонок", result: "Звонит шеф: 'Найди убийцу, или я закрою контору!' Вы получили совет: осмотреть место преступления.", givesClueId: "clue_chief_call" }
        ],
        npcs: []
      },
      {
        id: "street",
        name: "Улица Грязных Фонарей",
        description: "Темная улица. Мигают фонари. Видна лента огражения.",
        imagePrompt: "Dark street at night, rain, flickering street lamp, police tape, noir style",
        connections: ["office", "crime_scene", "bar"],
        interactables: [],
        npcs: [
          { id: "witness", name: "Свидетель", portraitPrompt: "Old man in trench coat, scared expression, noir style portrait", dialogueTree: { start: { text: "Я ничего не видел! Честно!", options: [{ text: "Показать значок", next: "scared" }, { text: "Уйти", next: "end" }] }, scared: { text: "Ладно, ладно! Я видел человека в красном плаще...", givesClueId: "clue_red_cloak" }, end: { text: "..." } } }
        ]
      },
      {
        id: "crime_scene",
        name: "Место преступления (Аллея)",
        description: "Тело уже увезли. Осталась только меловая обводка и лужа крови.",
        imagePrompt: "Alleyway crime scene, chalk outline on ground, blood puddle, rain, yellow police tape",
        connections: ["street"],
        interactables: [
          { id: "search_body", name: "Осмотреть следы крови", result: "Вы нашли странный пуговичный отпечаток в грязи.", givesClueId: "clue_button_mark" },
          { id: "search_trash", name: "Обыскать мусорные баки", result: "Ничего полезного, только крысы.", givesClueId: null }
        ],
        npcs: []
      },
      {
        id: "bar",
        name: "Бар 'У Джека'",
        description: "Дым коромыслом. Джаз играет тихо.",
        imagePrompt: "Smoky jazz bar interior, dim lights, bartender cleaning glass, noir style",
        connections: ["street"],
        interactables: [],
        npcs: [
          { id: "bartender", name: "Джек (Бармен)", portraitPrompt: "Strong bartender with towel, suspicious look, noir style portrait", dialogueTree: { start: { text: "Чего надо?", options: [{ text: "Спросить про мэра", next: "mayor_q" }, { text: "Заказать виски", next: "drink" }] }, mayor_q: { text: "Он уходил отсюда злым. С кем-то спорил.", givesClueId: "clue_argument" }, drink: { text: "С тебя 5 баксов.", givesClueId: null } } }
        ]
      },
      {
        id: "police_station",
        name: "Участок полиции",
        description: "Шум печатных машинок и крики сержанта.",
        imagePrompt: "Busy police station 1940s, desks, phones ringing, officers working",
        connections: ["office"],
        interactables: [],
        npcs: []
      }
    ],
    clues: [
      { id: "clue_chief_call", name: "Звонок шефа", type: "text", content: "Шеф требует результатов.", tags: ["story"] },
      { id: "clue_red_cloak", name: "Красный плащ", type: "text", content: "Свидетель видел человека в красном плаще.", tags: ["suspect", "clothing"] },
      { id: "clue_button_mark", name: "Отпечаток пуговицы", type: "image_placeholder", content: "Странный герб на пуговице.", tags: ["physical", "suspect"] },
      { id: "clue_argument", name: "Ссора в баре", type: "text", content: "Мэр с кем-то сильно поругался перед смертью.", tags: ["motive"] }
    ],
    suspects: [
      { id: "suspect_1", name: "Секретарь мэра", description: "Был в красном плаще." },
      { id: "suspect_2", name: "Бизнесмен", description: "Имел мотив." }
    ],
    solution: {
      culpritId: "suspect_1",
      requiredClues: ["clue_red_cloak", "clue_button_mark"]
    }
  }
};

// Проверка наличия демо-сценария
const stmt = db.prepare('SELECT id FROM scenarios WHERE id = ?');
if (!stmt.get(defaultScenarioId)) {
  const insert = db.prepare('INSERT INTO scenarios (id, title, author, content) VALUES (?, ?, ?, ?)');
  insert.run(defaultScenario.id, defaultScenario.title, defaultScenario.author, JSON.stringify(defaultScenario.content));
  console.log("Demo scenario loaded.");
}

// API Routes

// Получить список сценариев
app.get('/api/scenarios', (req, res) => {
  const rows = db.prepare('SELECT id, title, author FROM scenarios').all();
  res.json(rows);
});

// Получить сценарий по ID
app.get('/api/scenarios/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Scenario not found' });
  res.json({ ...row, content: JSON.parse(row.content) });
});

// Сохранить игру
app.post('/api/save', (req, res) => {
  const { scenarioId, state } = req.body;
  const id = uuidv4();
  try {
    const insert = db.prepare('INSERT INTO saves (id, scenario_id, state) VALUES (?, ?, ?)');
    insert.run(id, scenarioId, JSON.stringify(state));
    res.json({ success: true, saveId: id });
  } catch (e) {
    res.status(500).json({ error: 'Save failed' });
  }
});

// Загрузить игру
app.get('/api/save/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM saves WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Save not found' });
  res.json({ ...row, state: JSON.parse(row.state) });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});