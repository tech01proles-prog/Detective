const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// Initialize database
const db = new Database(path.join(__dirname, 'game.db'));

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS saves (
        id TEXT PRIMARY KEY,
        scenario_id TEXT NOT NULL,
        player_name TEXT,
        game_state TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
    );

    CREATE TABLE IF NOT EXISTS uploaded_files (
        id TEXT PRIMARY KEY,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        mime_type TEXT,
        size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// API Routes

// Get all scenarios
app.get('/api/scenarios', (req, res) => {
    try {
        const scenarios = db.prepare('SELECT id, title, author, description, created_at FROM scenarios ORDER BY created_at DESC').all();
        res.json(scenarios);
    } catch (error) {
        console.error('Error fetching scenarios:', error);
        res.status(500).json({ error: 'Failed to fetch scenarios' });
    }
});

// Get single scenario
app.get('/api/scenarios/:id', (req, res) => {
    try {
        const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(req.params.id);
        if (!scenario) {
            return res.status(404).json({ error: 'Scenario not found' });
        }
        res.json(scenario);
    } catch (error) {
        console.error('Error fetching scenario:', error);
        res.status(500).json({ error: 'Failed to fetch scenario' });
    }
});

// Create new scenario
app.post('/api/scenarios', (req, res) => {
    try {
        const { id, title, author, description, content } = req.body;
        
        if (!title || !author || !content) {
            return res.status(400).json({ error: 'Title, author and content are required' });
        }

        const scenarioId = id || uuidv4();
        const stmt = db.prepare(`
            INSERT INTO scenarios (id, title, author, description, content)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(scenarioId, title, author, description || '', JSON.stringify(content));
        
        res.status(201).json({ 
            id: scenarioId, 
            message: 'Scenario created successfully' 
        });
    } catch (error) {
        console.error('Error creating scenario:', error);
        res.status(500).json({ error: 'Failed to create scenario' });
    }
});

// Update scenario
app.put('/api/scenarios/:id', (req, res) => {
    try {
        const { title, author, description, content } = req.body;
        
        const stmt = db.prepare(`
            UPDATE scenarios 
            SET title = ?, author = ?, description = ?, content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        const result = stmt.run(title, author, description || '', JSON.stringify(content), req.params.id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Scenario not found' });
        }
        
        res.json({ message: 'Scenario updated successfully' });
    } catch (error) {
        console.error('Error updating scenario:', error);
        res.status(500).json({ error: 'Failed to update scenario' });
    }
});

// Delete scenario
app.delete('/api/scenarios/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM scenarios WHERE id = ?');
        const result = stmt.run(req.params.id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Scenario not found' });
        }
        
        res.json({ message: 'Scenario deleted successfully' });
    } catch (error) {
        console.error('Error deleting scenario:', error);
        res.status(500).json({ error: 'Failed to delete scenario' });
    }
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
        
        db.prepare(`INSERT INTO scenarios (id, title, author, description, content) VALUES (?, ?, ?, ?, ?)`)
            .run(demoScenario.id, demoScenario.title, demoScenario.author, demoScenario.description, JSON.stringify(demoScenario));
        console.log('✅ Demo scenario loaded: Murder at the Dock');
    }
});
