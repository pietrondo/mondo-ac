import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

let commitHash = 'dev';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {}

function scoresApiPlugin() {
  const dataDir = path.resolve(__dirname, 'data');
  const scoresFile = path.resolve(dataDir, 'scores.json');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(scoresFile)) {
    fs.writeFileSync(scoresFile, JSON.stringify([], null, 2), 'utf-8');
  }

  return {
    name: 'scores-api-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url?.startsWith('/api/scores')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (req.method === 'GET') {
            try {
              const raw = fs.readFileSync(scoresFile, 'utf-8');
              const scores = JSON.parse(raw);
              scores.sort((a: any, b: any) => b.score - a.score);
              res.end(JSON.stringify(scores.slice(0, 50)));
            } catch (e) {
              res.end(JSON.stringify([]));
            }
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                const raw = fs.existsSync(scoresFile) ? fs.readFileSync(scoresFile, 'utf-8') : '[]';
                const scores = JSON.parse(raw);
                const entry = {
                  id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
                  name: (parsed.name || 'Giocatore').trim().substring(0, 20) || 'Giocatore',
                  score: Number(parsed.score) || 0,
                  kills: Number(parsed.kills) || 0,
                  survivalTimeSec: Number(parsed.survivalTimeSec) || 0,
                  waveReached: Number(parsed.waveReached) || 1,
                  accuracyPct: Number(parsed.accuracyPct) || 0,
                  favoriteWeapon: String(parsed.favoriteWeapon || 'Rifle').substring(0, 15),
                  date: new Date().toISOString()
                };
                scores.push(entry);
                scores.sort((a: any, b: any) => b.score - a.score);
                const topScores = scores.slice(0, 100);
                fs.writeFileSync(scoresFile, JSON.stringify(topScores, null, 2), 'utf-8');
                res.end(JSON.stringify(topScores));
              } catch (err) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash)
  },
  plugins: [scoresApiPlugin()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true
  },
  build: {
    target: 'esnext',
    sourcemap: true
  }
});
