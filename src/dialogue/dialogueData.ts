import { DialogueTree, LoreEntry } from './dialogue';

export const LORE_ENTRIES: Record<string, LoreEntry> = {
  lore_ancient_world: {
    id: 'lore_ancient_world',
    title: 'La Genesi del Mondo Procedurale',
    category: 'History',
    content: 'Nel principio esisteva solo il Ruoto del Seed Infinita. Gli antichi matematici forgiarono le equazioni FBM e Simplex per generare montagne, foreste e mari sconfinati. Ogni mondo è una permutazione unica dell\'eternità.',
  },
  lore_subterranean_titan: {
    id: 'lore_subterranean_titan',
    title: 'Il Re Titano della Cripta Subterranea',
    category: 'Monsters',
    content: 'Nelle profondità cieche del pianeta giace il Titano Boss. Protetto da portali dimensionali e servitori d\'ombra, il Titano adatta le sue tecniche di combattimento in tre fasi feroci quando viene minacciato.',
  },
  lore_portal_keys: {
    id: 'lore_portal_keys',
    title: 'I Portali di Traslazione Spaziale',
    category: 'Dungeons',
    content: 'Le antiche strutture di pietra in superficie celano varchi energetici violetti. Attraversarli sospende la simulazione terrestre e precipita i viaggiatori nei labirinti sotterranei forgiati nell\'oscurità.',
  },
  lore_weapons_of_power: {
    id: 'lore_weapons_of_power',
    title: 'Arsenale degli Eroi',
    category: 'Artifacts',
    content: 'Dalle lame d\'acciaio temprato alle armi al plasma e fucili da cecchino, l\'armonia tra tecnologia antica e futuristica è la sola chiave per sopravvivere alle ondate mostruose che infestano la terra.',
  },
  lore_wild_biomes: {
    id: 'lore_wild_biomes',
    title: 'La Natura Selvaggia dei Biomi',
    category: 'World',
    content: 'Dai deserti riarsi e cime innevate fino alle foreste rigogliose, ogni bioma ospita fauna ostile e risorse preziose. Chi domina il territorio domina il proprio destino.',
  },
};

export const DIALOGUE_TREES: Record<string, DialogueTree> = {
  elder_eldrin: {
    id: 'elder_eldrin',
    npcName: 'Anziano Eldrin',
    npcRole: 'Saggio del Villaggio',
    defaultNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speakerName: 'Anziano Eldrin',
        speakerTitle: 'Saggio del Villaggio',
        text: 'Saluti, viaggiatore! Benvenuto nel nostro insediamento. Le terre esterne sono diventate irrequiete con l\'avanzare delle tenebre.',
        options: [
          { text: 'Parlami della storia di questo mondo.', nextId: 'lore_history' },
          { text: 'Ci sono pericoli imminenti nelle vicinanze?', nextId: 'dungeon_warning' },
          { text: 'Ho bisogno di provviste e assistenza.', nextId: 'grant_blessing' },
          { text: 'Arrivederci, Anziano.', nextId: undefined },
        ],
      },
      lore_history: {
        id: 'lore_history',
        speakerName: 'Anziano Eldrin',
        speakerTitle: 'Saggio del Villaggio',
        text: 'Questo mondo è stato inciso da antiche equazioni procedurali. Guarda nei tuoi diari di lore per comprenderne le origini.',
        reward: { loreId: 'lore_ancient_world', coins: 15 },
        options: [
          { text: 'Interessante... Cosa sai dei portali sotterranei?', nextId: 'dungeon_warning' },
          { text: 'Grazie per le informazioni.', nextId: 'start' },
        ],
      },
      dungeon_warning: {
        id: 'dungeon_warning',
        speakerName: 'Anziano Eldrin',
        speakerTitle: 'Saggio del Villaggio',
        text: 'Attento! I portali viola conducono alla Cripta Subterranea. Lì attende il Titano Boss in tre fasi di rabbia pura. Assicurati di essere ben armato prima di entrare!',
        reward: { loreId: 'lore_subterranean_titan' },
        options: [
          { text: 'Affronterò il Titano con coraggio.', nextId: 'titan_quest' },
          { text: 'Tornerò quando sarò più forte.', nextId: 'start' },
        ],
      },
      titan_quest: {
        id: 'titan_quest',
        speakerName: 'Anziano Eldrin',
        speakerTitle: 'Saggio del Villaggio',
        text: 'Prendi queste monete per prepararti all\'armeria. Che la fortuna ti assista!',
        reward: { coins: 30, questId: 'quest_defeat_titan' },
        options: [
          { text: 'Grazie Anziano!', nextId: undefined },
        ],
      },
      grant_blessing: {
        id: 'grant_blessing',
        speakerName: 'Anziano Eldrin',
        speakerTitle: 'Saggio del Villaggio',
        text: 'Incanto la tua linfa vitale. Prendi questa pozione di ristoro.',
        reward: { health: 25 },
        options: [
          { text: 'Mi sento rigenerato. Grazie!', nextId: 'start' },
        ],
      },
    },
  },
  merchant_garrick: {
    id: 'merchant_garrick',
    npcName: 'Mercante Garrick',
    npcRole: 'Mercante d\'Armi',
    defaultNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speakerName: 'Mercante Garrick',
        speakerTitle: 'Mercante d\'Armi',
        text: 'Benvenuto all\'armeria! Ho spade, proiettili, granate e tecnologia al plasma. Cosa desideri oggi?',
        options: [
          { text: 'Mostrami le tue merci! (Apri Negozio)', action: 'open_shop' },
          { text: 'Cosa sai delle armi leggendarie?', nextId: 'lore_weapons' },
          { text: 'Hai sconti o regali per un coraggioso guerriero?', nextId: 'discount_check' },
          { text: 'Devo andare.', nextId: undefined },
        ],
      },
      lore_weapons: {
        id: 'lore_weapons',
        speakerName: 'Mercante Garrick',
        speakerTitle: 'Mercante d\'Armi',
        text: 'Ogni arma ha il suo ritmo: la Spada Lunare devasta a corto raggio, l\'Arco colpisce a distanza e i Plasma Blaster trafiggono ogni corazza!',
        reward: { loreId: 'lore_weapons_of_power' },
        options: [
          { text: 'Apriamo il negozio ora!', action: 'open_shop' },
          { text: 'Capito, grazie.', nextId: 'start' },
        ],
      },
      discount_check: {
        id: 'discount_check',
        speakerName: 'Mercante Garrick',
        speakerTitle: 'Mercante d\'Armi',
        text: 'Se dimostri di avere almeno 50 monete, ti regalerò una scorta supplementare di munizioni!',
        options: [
          {
            text: 'Ho abbastanza monete, dammi la scorta!',
            nextId: 'grant_ammo',
            requirement: { minCoins: 50 },
          },
          { text: 'Tornerò con più monete.', nextId: 'start' },
        ],
      },
      grant_ammo: {
        id: 'grant_ammo',
        speakerName: 'Mercante Garrick',
        speakerTitle: 'Mercante d\'Armi',
        text: 'Eccellente! Ecco le tue munizioni di riserva cariche al massimo.',
        reward: { ammo: true, coins: 10 },
        options: [
          { text: 'Ottimo affare!', nextId: 'start' },
        ],
      },
    },
  },
  guard_varus: {
    id: 'guard_varus',
    npcName: 'Guardia Varus',
    npcRole: 'Protettore delle Mura',
    defaultNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speakerName: 'Guardia Varus',
        speakerTitle: 'Protettore delle Mura',
        text: 'Alto là! Io e i miei uomini pattugliamo il perimetro contro l\'assalto dei mostri.',
        options: [
          { text: 'Quali mostri infestano queste zone?', nextId: 'monster_info' },
          { text: 'Potete aiutarmi nella difesa?', nextId: 'patrol_tip' },
          { text: 'Riprendi la pattuglia.', nextId: undefined },
        ],
      },
      monster_info: {
        id: 'monster_info',
        speakerName: 'Guardia Varus',
        speakerTitle: 'Protettore delle Mura',
        text: 'Di notte appaiono i Goblin Veloci e gli Scheletri Cecchini. Mantieni il movimento costante e usa il Dash [Q] per schivare i proiettili!',
        reward: { loreId: 'lore_wild_biomes' },
        options: [
          { text: 'Grazie del consiglio, Guardia.', nextId: 'start' },
        ],
      },
      patrol_tip: {
        id: 'patrol_tip',
        speakerName: 'Guardia Varus',
        speakerTitle: 'Protettore delle Mura',
        text: 'Fai attenzione ai cristalli e ai collezionabili sul terreno: donano monete e punti esperienza instantanei!',
        reward: { coins: 20 },
        options: [
          { text: 'Buono a sapersi!', nextId: 'start' },
        ],
      },
    },
  },
  traveler_kael: {
    id: 'traveler_kael',
    npcName: 'Viaggiatore Kael',
    npcRole: 'Esploratore delle Rovine',
    defaultNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speakerName: 'Viaggiatore Kael',
        speakerTitle: 'Esploratore delle Rovine',
        text: 'Aah... un altro cercatore di misteri. Ho percorso miglia attraverso tutti i biomi di questa simulazione.',
        options: [
          { text: 'Quali segreti hai scoperto nei tuoi viaggi?', nextId: 'portal_lore' },
          { text: 'Avete incontrato il Titano Subterraneo?', nextId: 'titan_lore' },
          { text: 'Buon viaggio, esploratore.', nextId: undefined },
        ],
      },
      portal_lore: {
        id: 'portal_lore',
        speakerName: 'Viaggiatore Kael',
        speakerTitle: 'Esploratore delle Rovine',
        text: 'I portali fluttuanti collegano la superficie con i dungeon procedurali. Quando vi entri, il ciclo giorno/notte e la generazione esterna si fermano per concentrare le tue energie nella prova.',
        reward: { loreId: 'lore_portal_keys', coins: 25 },
        options: [
          { text: 'Affascinante.', nextId: 'start' },
        ],
      },
      titan_lore: {
        id: 'titan_lore',
        speakerName: 'Viaggiatore Kael',
        speakerTitle: 'Esploratore delle Rovine',
        text: 'Il Titano scatena onde d\'urto infuocate quando la sua salute scende sotto il 50%. Tieni d\'occhio la barra della salute in cima allo schermo!',
        reward: { loreId: 'lore_subterranean_titan' },
        options: [
          { text: 'Sarò pronto.', nextId: 'start' },
        ],
      },
    },
  },
};
