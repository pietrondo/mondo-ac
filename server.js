import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');
const DIST_DIR = path.join(__dirname, 'dist');

// Ensure data directory and scores.json exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SCORES_FILE)) {
  fs.writeFileSync(SCORES_FILE, JSON.stringify([], null, 2), 'utf-8');
}

function getScores() {
  try {
    const raw = fs.readFileSync(SCORES_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.sort((a, b) => b.score - a.score).slice(0, 50);
  } catch (err) {
    console.error('Error reading scores:', err);
    return [];
  }
}

function saveScore(newScore) {
  try {
    const scores = getScores();
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: (newScore.name || 'Giocatore').trim().substring(0, 20) || 'Giocatore',
      score: Number(newScore.score) || 0,
      kills: Number(newScore.kills) || 0,
      survivalTimeSec: Number(newScore.survivalTimeSec) || 0,
      waveReached: Number(newScore.waveReached) || 1,
      accuracyPct: Number(newScore.accuracyPct) || 0,
      favoriteWeapon: String(newScore.favoriteWeapon || 'Rifle').substring(0, 15),
      date: new Date().toISOString()
    };
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 100);
    fs.writeFileSync(SCORES_FILE, JSON.stringify(topScores, null, 2), 'utf-8');
    return topScores;
  } catch (err) {
    console.error('Error saving score:', err);
    return getScores();
  }
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Admin Auth helper
  function checkAdminAuth(req) {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Basic ')) return false;
    const credentials = Buffer.from(auth.substring(6), 'base64').toString('utf-8');
    return credentials === 'admin:admin';
  }

  // API Endpoints
  if (pathname === '/api/scores') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getScores()));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const updatedScores = saveScore(parsed);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updatedScores));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }
  }

  if (pathname === '/api/admin/stats') {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin Area"' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const scores = getScores();
    const onlinePlayers = Array.from(playersMap.values()).map(p => p.data);
    const statsData = {
      onlinePlayersCount: onlinePlayers.length,
      totalGames: scores.length,
      highScore: scores.length > 0 ? scores[0].score : 0,
      uptimeSec: Math.floor(process.uptime()),
      onlinePlayers,
      scores
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(statsData));
    return;
  }

  if (pathname === '/api/admin/broadcast' && req.method === 'POST') {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin Area"' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { message } = JSON.parse(body);
        broadcast({ type: 'announcement', message });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400);
        res.end();
      }
    });
    return;
  }

  if (pathname === '/api/admin/clear-scores' && req.method === 'POST') {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin Area"' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    fs.writeFileSync(SCORES_FILE, JSON.stringify([], null, 2), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Serve static files from dist/
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  // Prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error');
      } else {
        const headers = {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        };
        res.writeHead(200, headers);
        res.end(content);
      }
    });
  });
});



// Real-time Multiplayer State
const playersMap = new Map();

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (url.pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  const playerId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  let playerInfo = { id: playerId, name: 'Giocatore', x: 0, y: 0, z: 0, yaw: 0, hp: 100, weapon: 'rifle' };

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'join') {
        playerInfo.name = (data.name || 'Giocatore').substring(0, 20);
        playersMap.set(playerId, { ws, data: playerInfo });

        // Send init state with all currently connected players
        const onlineList = Array.from(playersMap.values()).map(p => p.data);
        ws.send(JSON.stringify({ type: 'init', yourId: playerId, players: onlineList }));

        // Broadcast new player joined to everyone else
        broadcast({ type: 'player_joined', player: playerInfo }, playerId);
      } else if (data.type === 'move') {
        playerInfo.x = data.x;
        playerInfo.y = data.y;
        playerInfo.z = data.z;
        playerInfo.yaw = data.yaw;
        playerInfo.hp = data.hp;
        playerInfo.weapon = data.weapon;

        broadcast({ type: 'player_update', id: playerId, ...data }, playerId);
      } else if (data.type === 'shoot') {
        broadcast({ type: 'player_shoot', id: playerId, ...data }, playerId);
      } else if (data.type === 'hit_player') {
        broadcast({ type: 'hit_player', attackerId: playerId, attackerName: playerInfo.name, ...data });
      }
    } catch (err) {}
  });

  ws.on('close', () => {
    playersMap.delete(playerId);
    broadcast({ type: 'player_left', id: playerId });
  });
});

function broadcast(msgObj, excludeId = null) {
  const jsonStr = JSON.stringify(msgObj);
  for (const [id, client] of playersMap.entries()) {
    if (id !== excludeId && client.ws.readyState === 1) {
      client.ws.send(jsonStr);
    }
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mondo 3D Server with Multiplayer running on http://0.0.0.0:${PORT}`);
});
