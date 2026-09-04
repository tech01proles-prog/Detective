import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Multer setup for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Инициализация БД
const db = new Database(path.join(__dirname, 'detective.db'));

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
    player_name TEXT,
    game_state TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
  );

  CREATE TABLE IF NOT EXISTS uploaded_files (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadDir));

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

// Save game state
app.post('/api/saves', (req, res) => {
    try {
        const { id, scenario_id, player_name, game_state } = req.body;
        
        if (!scenario_id || !game_state) {
            return res.status(400).json({ error: 'Scenario ID and game state are required' });
        }

        const saveId = id || uuidv4();
        
        // Check if save exists
        const existing = db.prepare('SELECT id FROM saves WHERE id = ?').get(saveId);
        
        if (existing) {
            const stmt = db.prepare(`
                UPDATE saves 
                SET game_state = ?, player_name = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            stmt.run(JSON.stringify(game_state), player_name || '', saveId);
        } else {
            const stmt = db.prepare(`
                INSERT INTO saves (id, scenario_id, player_name, game_state)
                VALUES (?, ?, ?, ?)
            `);
            stmt.run(saveId, scenario_id, player_name || '', JSON.stringify(game_state));
        }
        
        res.status(201).json({ id: saveId, message: 'Game saved successfully' });
    } catch (error) {
        console.error('Error saving game:', error);
        res.status(500).json({ error: 'Failed to save game' });
    }
});

// Load game state
app.get('/api/saves/:id', (req, res) => {
    try {
        const save = db.prepare('SELECT * FROM saves WHERE id = ?').get(req.params.id);
        
        if (!save) {
            return res.status(404).json({ error: 'Save not found' });
        }
        
        res.json({
            ...save,
            game_state: JSON.parse(save.game_state)
        });
    } catch (error) {
        console.error('Error loading save:', error);
        res.status(500).json({ error: 'Failed to load save' });
    }
});

// Get all saves for a scenario
app.get('/api/saves', (req, res) => {
    try {
        const { scenario_id } = req.query;
        let query = 'SELECT id, scenario_id, player_name, created_at, updated_at FROM saves';
        const params = [];
        
        if (scenario_id) {
            query += ' WHERE scenario_id = ?';
            params.push(scenario_id);
        }
        
        query += ' ORDER BY updated_at DESC';
        
        const saves = db.prepare(query).all(...params);
        res.json(saves);
    } catch (error) {
        console.error('Error fetching saves:', error);
        res.status(500).json({ error: 'Failed to fetch saves' });
    }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileId = uuidv4();
        const stmt = db.prepare(`
            INSERT INTO uploaded_files (id, original_name, stored_name, mime_type, size)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            fileId,
            req.file.originalname,
            req.file.filename,
            req.file.mimetype,
            req.file.size
        );

        const fileUrl = `/uploads/${req.file.filename}`;
        
        res.json({
            id: fileId,
            url: fileUrl,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Get file info
app.get('/api/files/:id', (req, res) => {
    try {
        const file = db.prepare('SELECT * FROM uploaded_files WHERE id = ?').get(req.params.id);
        
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        res.json({
            id: file.id,
            url: `/uploads/${file.stored_name}`,
            originalName: file.original_name,
            mimeType: file.mime_type,
            size: file.size
        });
    } catch (error) {
        console.error('Error fetching file info:', error);
        res.status(500).json({ error: 'Failed to fetch file info' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔍 Detective Game Server running on port ${PORT}`);
    console.log(`📁 Uploads available at: http://0.0.0.0:${PORT}/uploads`);
    console.log(`🗄️  Database: ${path.join(__dirname, 'game.db')}`);
    
    // Load demo scenario if not exists
    const demoScenarioId = 'murder-at-the-dock';
    const existing = db.prepare('SELECT id FROM scenarios WHERE id = ?').get(demoScenarioId);
    if (!existing) {
        const demoScenario = {
            id: demoScenarioId,
            title: 'Murder at the Dock',
            author: 'System',
            description: 'A classic noir mystery. Find the killer before they escape!',
            initialGameState: {
                currentLocationId: 'detective-office',
                inventory: [],
                clues: [],
                visitedLocations: [],
                completedInteractions: [],
                dialogueStates: {},
                currentTime: 480, // 8:00 AM
                maxTime: 1320, // 10:00 PM
                gameStatus: 'playing',
                npcLocations: {}
            },
            locations: [
                {
                    id: 'detective-office',
                    name: 'Detective Office',
                    description: 'Your cramped office. Rain streaks the window.',
                    mapPosition: { x: 50, y: 50 },
                    connections: ['dock', 'police-station'],
                    interactions: []
                },
                {
                    id: 'dock',
                    name: 'The Dock',
                    description: 'Crime scene. Body found near warehouse.',
                    mapPosition: { x: 150, y: 50 },
                    connections: ['detective-office', 'warehouse'],
                    interactions: [
                        {
                            id: 'examine-body',
                            name: 'Examine Body',
                            description: 'Look closely at the victim',
                            type: 'examine',
                            result: {
                                message: 'Victim has a stab wound. No wallet found.',
                                cluesGained: ['stab-wound']
                            }
                        },
                        {
                            id: 'search-area',
                            name: 'Search Area',
                            description: 'Look for evidence around the body',
                            type: 'examine',
                            result: {
                                message: 'You find footprints leading to the warehouse.',
                                cluesGained: ['footprints']
                            }
                        }
                    ]
                },
                {
                    id: 'warehouse',
                    name: 'Abandoned Warehouse',
                    description: 'Dark and smelly. Something is hidden here.',
                    mapPosition: { x: 250, y: 50 },
                    connections: ['dock'],
                    interactions: [
                        {
                            id: 'find-knife',
                            name: 'Search Crates',
                            description: 'Look through old crates',
                            type: 'examine',
                            result: {
                                message: 'You find a bloody knife!',
                                cluesGained: ['bloody-knife']
                            }
                        }
                    ]
                },
                {
                    id: 'police-station',
                    name: 'Police Station',
                    description: 'Busy precinct with officers everywhere.',
                    mapPosition: { x: 50, y: 150 },
                    connections: ['detective-office'],
                    interactions: []
                }
            ],
            npcs: [
                {
                    id: 'witness',
                    name: 'Old Sailor',
                    description: 'A witness who was nearby',
                    dialogueTree: {
                        start: {
                            text: 'I saw someone running from the dock...',
                            choices: [
                                { text: 'Who was it?', nextNodeId: 'suspect-desc' },
                                { text: 'Thanks', nextNodeId: 'end' }
                            ]
                        },
                        'suspect-desc': {
                            text: 'Wore a red jacket. Looked like Joe the bartender!',
                            cluesGained: ['witness-testimony']
                        },
                        end: { text: '...' }
                    },
                    locationId: 'dock'
                },
                {
                    id: 'bartender',
                    name: 'Joe',
                    description: 'Bartender at the nearby pub',
                    dialogueTree: {
                        start: {
                            text: 'What do you want?',
                            choices: [
                                { text: 'Where were you last night?', nextNodeId: 'alibi' },
                                { text: 'Nothing', nextNodeId: 'end' }
                            ]
                        },
                        alibi: {
                            text: 'I was working! Ask anyone!',
                            cluesGained: ['joe-alibi']
                        },
                        end: { text: '...' }
                    },
                    locationId: 'police-station'
                }
            ],
            clues: [
                { id: 'stab-wound', name: 'Stab Wound', description: 'Victim was stabbed', type: 'text', content: 'Deep stab wound to the chest', tags: ['evidence'] },
                { id: 'footprints', name: 'Footprints', description: 'Leading to warehouse', type: 'text', content: 'Large boot prints', tags: ['trace'] },
                { id: 'bloody-knife', name: 'Bloody Knife', description: 'Found in warehouse', type: 'text', content: 'Kitchen knife with blood', tags: ['weapon'] },
                { id: 'witness-testimony', name: 'Witness Testimony', description: 'Saw someone in red', type: 'text', content: 'Red jacket suspect', tags: ['testimony'] },
                { id: 'joe-alibi', name: 'Joe Alibi', description: 'Claims he was working', type: 'text', content: 'Working at bar', tags: ['alibi'] },
                { id: 'torn-fabric', name: 'Torn Fabric', description: 'Red fabric found on victim', type: 'text', content: 'Red cloth piece', tags: ['evidence'] }
            ],
            suspects: [
                { id: 'joe', name: 'Joe (Bartender)', description: 'Had access to knife', isGuilty: true, requiredCluesForAccusation: ['bloody-knife', 'witness-testimony'] },
                { id: 'rival', name: 'Business Rival', description: 'Had motive', isGuilty: false, requiredCluesForAccusation: [] }
            ],
            minCluesForAccusation: 3
        };
        
        db.prepare(`INSERT INTO scenarios (id, title, author, content) VALUES (?, ?, ?, ?)`)
            .run(demoScenario.id, demoScenario.title, demoScenario.author, JSON.stringify(demoScenario));
        console.log('✅ Demo scenario loaded: Murder at the Dock');
    }
});
