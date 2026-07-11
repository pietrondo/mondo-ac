# Mondo 3D Autogenerato — Design

**Data**: 2026-07-11
**Stato**: Bozza in approvazione
**Autore**: brainstorming koda × utente

## 1. Scopo

Un mondo 3D autogenerato in stile low-poly che l'utente può esplorare liberamente in terza persona. Il mondo è popolato da villaggi, castelli, NPC, mostri e oggetti da raccogliere, distribuiti su una mappa vasta finita divisa in biomi.

L'enfasi è sull'**esperienza di visita**: il giocatore cammina, osserva il mondo vivere, parla con gli NPC, combatte i mostri e raccoglie oggetti. Non c'è progressione RPG, livelli, salvataggi, né obiettivi a lungo termine. È un sandbox esplorativo con un ciclo di feedback immediato e ricco.

## 2. Decisioni approvate (brainstorming)

| Decisione | Scelta | Note |
|---|---|---|
| Scopo | Sandbox esplorativo | Focus su visita del mondo, non RPG pesante |
| Stile visivo | Low-poly stilizzato | Flat shading, palette limitata, geometria semplice |
| Scala mondo | Mondo con biomi, finito ma vasto | ~2 km², biomi distinti, tutto caricato, niente streaming |
| Interazioni | Tutto insieme | Diorama + dialoghi + combattimento + collezionabili |
| Camera | Terza persona orbitale | Default, WASD + mouse, zoom regolabile |
| Stack | Vite + TypeScript + Three.js | Dal pacchetto threejs-game-skills installato |
| Asset esterni | Nessuno (no API key) | Low-poly procedurale sufficiente |
| Lingua UI | Italiano | Coerente con la lingua utente |

## 3. Architettura

### 3.1 Stack tecnico

- **Build**: Vite (dev server + build di produzione)
- **Linguaggio**: TypeScript strict
- **Render**: Three.js (vanilla, non R3F — minor overhead, più controllo)
- **HUD**: HTML + CSS overlay (no React per l'HUD)
- **Tuning runtime**: `lil-gui` per dev tools (toggle wireframe, regen seed, mostra colliders)
- **Test**: Playwright (smoke + screenshot + canvas non-blank), Vitest per unit della logica di generazione
- **RNG**: `mulberry32` seeded (determinismo → test ripetibili)

### 3.2 Moduli (`src/`)

```
src/
├── main.ts                  # bootstrap Three.js, game loop
├── config.ts                # configurazione globale (dimensioni mondo, seed, palette)
├── world/
│   ├── heightmap.ts         # generazione heightmap (FBM simplex noise)
│   ├── biomeMap.ts          # classificazione biomi (elevation × moisture)
│   ├── features.ts          # posizionamento villaggi/castelli/ruine
│   ├── structures.ts        # generazione geometrica strutture
│   ├── water.ts             # piano d'acqua e costa
│   └── decorations.ts       # alberi, rocce, erba (instanced meshes)
├── entities/
│   ├── Entity.ts            # classe base
│   ├── Player.ts            # controller del giocatore
│   ├── NPC.ts               # NPC con routine e dialoghi
│   ├── Monster.ts           # mostri con AI (wander/chase)
│   └── Collectible.ts       # oggetti da raccogliere
├── interactions/
│   ├── dialogue.ts          # bubble dialogo + stato
│   ├── combat.ts            # sistema combattimento melee
│   └── pickup.ts            # raccolta oggetti
├── render/
│   ├── scene.ts             # setup scena, luci, sky, fog
│   ├── camera.ts            # terza persona orbitale
│   └── materials.ts         # factory materiali per bioma
├── controls/
│   └── input.ts             # WASD + mouse + tasti azione (E, Space, Esc)
├── ui/
│   ├── hud.ts               # contatore oggetti, FPS, bussola
│   └── minimap.ts           # canvas 2D per minimappa
├── utils/
│   ├── rng.ts               # mulberry32
│   ├── noise.ts             # simplex 2D/3D
│   └── math.ts              # clamp, lerp, smoothstep, AABB
└── data/
    ├── biomes.json          # definizione biomi (palette, altezza, features)
    ├── structures.json      # template strutture (porte, finestre, tetti)
    ├── npcs.json            # tipi NPC (aspetto, dialoghi, routine)
    ├── monsters.json        # tipi mostri (aspetto, stats, AI)
    └── collectibles.json    # oggetti (modello, valore, rarità)
```

### 3.3 Game loop

```
init
  → genera heightmap
  → classifica biomi
  → piazza features (villaggi/castelli/ruine/monster/npc/items)
  → costruisci scena
start
  → requestAnimationFrame loop:
      handle input
      update entities (player, npc AI, monster AI, collectibles)
      update camera (follow player)
      render
```

Loop deterministico: stesso seed → stesso mondo → stesso screenshot.

## 4. Generazione procedurale

### 4.1 Heightmap

- **Dimensioni**: 2 km × 2 km, 256 × 256 celle (~8 m per cella)
- **Algoritmo**: FBM (Fractal Brownian Motion) con 5 ottave di simplex 2D
- **Scala**: frequenza base ~0.005, lacunarità 2.0, persistenza 0.5
- **Risultato**: altezze [0, 1] mappate su [0, 60] m

### 4.2 Biomi

Classificazione da due mappe noise (elevation + moisture):

| Bioma | Elevation | Moisture | Note |
|---|---|---|---|
| Costa | 0–0.15 | qualsiasi | sabbia chiara, acqua bassa |
| Pianura | 0.15–0.4 | 0.3–0.7 | erba verde, alberi radi |
| Foresta | 0.15–0.5 | >0.7 | alberi fitti, sottobosco |
| Deserto | 0.15–0.4 | <0.3 | sabbia gialla, rocce, cactus |
| Montagna | 0.4–0.7 | qualsiasi | rocce, pendii, neve parziale |
| Vetta innevata | >0.7 | qualsiasi | neve, rocce scure, ghiacciai |

Palette per bioma in `data/biomes.json`. Transizioni sfumate via `smoothstep` ai bordi.

### 4.3 Features (placement)

Per ogni bioma, regole di piazzamento (in `data/biomes.json`):

- **Costa**: nessuna feature
- **Pianura**: 0–2 villaggi, monete sparse
- **Foresta**: 0–1 villaggio fitto, NPC ranger, lupi, cristalli
- **Deserto**: rovine (1–2), goblin, ceneri (item)
- **Montagna**: 1–2 castelli, NPC guardie, draghi (rari)
- **Vetta**: rovine antiche, golem di ghiaccio (rari), item rari

Piazzamento:
- Minimo distanza tra feature (no sovrapposizioni)
- Score di "idoneità" per cella (bioma giusto + pendenza bassa)
- Sample N candidate, scegli top-K

### 4.4 Strutture

Template parametrizzati in `data/structures.json`:

- **Casa villaggio**: cubo base + tetto piramidale + 1 porta + 1–2 finestre + camino opzionale
- **Torre castello**: cilindro alto + tetto conico + merlature (BoxGeometry ripetute) + bandiera
- **Castello**: composizione di 4 torri + mura (BoxGeometry) + ponte levatoio
- **Rovine**: cubi inclinati random, archi rotti, vegetazione

Ogni template è una funzione che dato `(rng, pos, scale)` restituisce `THREE.Group`.

### 4.5 Decorazioni

- Alberi: tronco (cilindro) + chioma (cono o 3 sfere)
- Rocce: icosaedro deformato
- Erba: `InstancedMesh` di piccoli piani (centinaia → 1 draw call)
- Cactus, funghi: simili

## 5. Entità

### 5.1 Player

- Capsule bassa (cylinder + sphere testa) per semplicità low-poly
- WASD = movimento, mouse = guarda, Space = attacca, E = interagisci
- Velocità: 5 m/s, jump disabilitato (no platforming)
- HP: 100, danno melee: 20
- Collision: AABB sul terreno (heightmap query)

### 5.2 NPC

Tipi (in `data/npcs.json`):
- **Villager**: palette verde/marrone, dialogo friendly
- **Guard**: palette blu/grigio, armatura visiva, dialogo severo
- **Merchant**: palette oro/rosso, dialogo commerciante
- **Ranger**: palette verde scuro, vive in foresta

Comportamento:
- Routine: waypoint patrol nel villaggio
- Quando player si avvicina (<3 m): saluta, mostra dialogo random
- Quando player preme E: dialogo contestuale (es. villager parla del castello a nord)

### 5.3 Monster

Tipi (in `data/monsters.json`):
- **Lupo**: 4 zampe (small boxes), grigio, veloce, debole
- **Goblin**: umanoide verde, piccolo, medio
- **Orco**: umanoide verde scuro, grande, forte, lento
- **Drago**: 4 zampe + 2 ali, rosso, boss, raro (solo vette)

AI:
- **Wander**: cammina random finché non vede player
- **Chase**: se player entro 10 m → insegue
- **Attack**: se player entro 1.5 m → colpisce ogni 1.5 s
- **Flee**: se HP basso (lupi), fugge
- Ritorna a wander se player oltre 20 m per 5 s

### 5.4 Collectible

Tipi (in `data/collectibles.json`):
- **Moneta**: cubo dorato, +1, comune
- **Cristallo**: ottaedro azzurro, +5, raro
- **Erba**: 3 piani incrociati verdi, +1 crafting, comune
- **Pozione**: fiala (cilindro piccolo + sfera), +10 HP, non comune
- **Reliquia**: forma varia, +50, rarissima (rovine/castelli)

Piazzamento: 1–3 per cella di feature, 0.05 per cella random fuori.
Pickup: collision sfera, auto-raccolta.

## 6. Interazioni

### 6.1 Dialogo

- Walk near NPC → bubble "?" sopra la testa
- Premi E → bubble con testo (max 60 caratteri), pausa 3 s
- Una sola riga per stato (no alberi di dialogo)
- Testi random da pool per tipo NPC

### 6.2 Combattimento

- Walk near monster (1.5 m) → indicatore rosso (hitbox visibile solo in dev mode)
- Premi Space → animazione "fendente" (rotazione 0.5 s) → danno 20 a tutti i mostri in 1.5 m
- Monster attack: se player entro 1.5 m e cooldown scaduto → danno 10, knockback 0.5 m
- HP player visibile in HUD; a 0 HP → schermata "Sei caduto... premi R per rinascere" → respawn a `(0, altezza(0,0), 0)` (centro mondo)

### 6.3 Raccolta

- Walk over collectible → pickup automatico
- Animazione: scala a 0 in 0.3 s, poi `removeFromParent`
- Contatore HUD aggiornato, badge "× N" sopra player per 1 s

## 7. Visual

### 7.1 Rendering

- `WebGLRenderer` con `antialias: true`, `outputColorSpace: SRGB`
- Tone mapping: `ACESFilmicToneMapping`, exposure 1.0
- `shadowMap.enabled = true`, `PCFSoftShadowMap`
- Sole direzionale (intensità 1.2) + ambient (0.4) + hemispheric (0.3)
- Fog lineare: near 200, far 800, colore coerente con sky

### 7.2 Sky

- Gradient verticale: azzurro chiaro all'orizzonte → blu intenso allo zenith
- Sfondo via custom shader (sphere invertita, semplice)
- Sole come sprite/billboard

### 7.3 Materiali

- `MeshStandardMaterial` con `flatShading: true` per look low-poly
- Roughness 0.7–0.9, metalness 0–0.2
- Colori da palette per bioma

### 7.4 Performance

- Target: 60 FPS desktop, 30 FPS mobile
- Strategie:
  - `InstancedMesh` per erba/alberi piccoli
  - Merge geometries per strutture dove possibile
  - Frustum culling (Three.js default)
  - Disabilita shadow su oggetti <1 m
  - Cap decorazioni a 2000 istanze totali

## 8. UI / HUD

- **Top-left**: contatore oggetti raccolti ("🪙 12  💎 3  🌿 8  🧪 1")
- **Top-right**: FPS counter (toggle con F3)
- **Bottom-center**: HP bar player (scompare a 100%)
- **Center**: bubble dialogo NPC
- **Bottom-right**: minimappa 150×150 px (vista top-down del bioma player)
- **Modal**: schermata morte con "R per rinascere"

Font: system-ui, no web font (evita caricamenti).

## 9. Controlli

| Tasto | Azione |
|---|---|
| W/A/S/D | Movimento |
| Mouse | Guarda (rotazione camera orbitale) |
| Shift | Corri (×1.5 velocità) |
| Space | Attacca |
| E | Interagisci (parla con NPC vicino) |
| Esc | Pausa / rilascia mouse |
| R | Rinascere (dopo morte) |
| F3 | Toggle FPS / debug |
| F4 | Toggle wireframe |
| T | Teleport a coordinate (debug) |

## 10. Verifica

Workflow del director skill (threejs-game-director):

1. `npm install`
2. `npm run dev` (Vite dev server, porta 5173)
3. `npm run build` (TypeScript check + Vite build)
4. `npm run preview` (build servito, porta 4173)
5. `npm run test` (Vitest, logica di generazione deterministica)
6. `npm run verify:visual` (Playwright screenshot + canvas nonblank check)
7. Smoke Playwright: spawn → aspetta 5 s → screenshot → click Space → aspetta 2 s → screenshot

Criteri di done:
- Build TypeScript verde (no error)
- Build Vite verde (no warning critici)
- Canvas non-blank (pixel check)
- Screenshot mostra biomi distinti, almeno un villaggio, almeno un castello, almeno un mostro, almeno un NPC
- FPS ≥ 30 in screenshot test
- Console senza error

## 11. Rischi e non-goals

### Rischi noti
- Performance con troppe istanze (mitigato da InstancedMesh)
- Determinismo test (richiede RNG seeded ovunque)
- Bilanciamento combattimento (HP/danno da tunare con lil-gui)
- Z-fighting su terreni (mitigato da polygon offset)

### Non-goals (espliciti)
- Nessuna progressione RPG (livelli, skill tree)
- Nessun sistema di quest
- Nessun inventario oltre il contatore
- Nessun salvataggio persistente
- Nessuna storia/narrative
- Nessun multiplayer
- Nessun audio (placeholder, no ElevenLabs key richiesta)
- Nessun modello esterno (no Tripo API)
- Nessuna texture HD (no Gemini API)

## 12. File da creare

```
mondo/
├── README.md                       # esistente, aggiornare
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   └── ... (vedi 3.2)
├── data/
│   └── ... (vedi 3.2)
├── tests/
│   ├── heightmap.test.ts
│   ├── biomeMap.test.ts
│   └── smoke.playwright.ts
├── docs/
│   └── superpowers/specs/
│       └── 2026-07-11-mondo-3d-autogenerato-design.md  # questo file
└── public/
    └── favicon.svg
```

## 13. Tempistica stimata

- Fase 1 — Setup + scaffold: ~30 min
- Fase 2 — Generazione mondo (heightmap + biomi): ~1 h
- Fase 3 — Strutture + decorazioni: ~1 h
- Fase 4 — Player + camera + controlli: ~45 min
- Fase 5 — NPC + dialoghi: ~45 min
- Fase 6 — Monster + combattimento: ~1 h
- Fase 7 — Collectibles + pickup: ~30 min
- Fase 8 — UI/HUD + minimappa: ~45 min
- Fase 9 — Verifica (build, screenshot, fix): ~45 min

Totale stimato: ~7 ore di lavoro agentico.

## 14. Prossimi passi

1. Review di questa spec da parte dell'utente
2. Invocare `writing-plans` per creare il piano di implementazione dettagliato
3. Eseguire il piano fase per fase con `threejs-game-director` come orchestratore