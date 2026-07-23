export type PlayerClass = 'warrior' | 'scout' | 'engineer';

export interface RegistrationCallbacks {
  onStart: (name: string, playerClass: PlayerClass) => void;
}

const ROLE_LABEL: Record<PlayerClass, string> = {
  warrior: 'GUERRIERO',
  scout: 'ESPLORATORE',
  engineer: 'INGEGNERE',
};

export function createRegistrationOverlay(callbacks: RegistrationCallbacks): { destroy: () => void } {
  const savedName = localStorage.getItem('mondo_player_name') || '';
  let selectedClass: PlayerClass = 'scout';

  const overlay = document.createElement('div');
  overlay.id = 'mondo-registration-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(10, 12, 22, 0.92);
    backdrop-filter: blur(10px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, sans-serif;
    color: white;
    pointer-events: auto;
  `;
  overlay.innerHTML = `
    <div style="background: rgba(20, 25, 40, 0.95); border: 2px solid #00E5FF; border-radius: 16px; padding: 32px; width: 440px; max-width: 92vw; box-shadow: 0 0 35px rgba(0,229,255,0.4); text-align: center;">
      <h1 style="color: #00E5FF; font-size: 32px; font-weight: 900; letter-spacing: 3px; margin-bottom: 8px; text-shadow: 0 0 15px rgba(0,229,255,0.6);">MONDO 3D</h1>
      <p style="color: #B0BEC5; font-size: 14px; margin-bottom: 24px;">Registrati per salvare i tuoi punteggi in classifica e scegliere la tua classe!</p>
      <div style="text-align: left; margin-bottom: 20px;">
        <label style="display: block; font-size: 13px; font-weight: bold; color: #80DEEA; margin-bottom: 6px;">NOME GIOCATORE:</label>
        <input id="reg-player-name" type="text" value="${savedName}" placeholder="Inserisci il tuo nome..." maxlength="20" style="width: 100%; background: #0A0D18; border: 1.5px solid #00E5FF; border-radius: 8px; padding: 10px 14px; color: white; font-size: 15px; font-weight: bold; outline: none; box-shadow: inset 0 0 8px rgba(0,0,0,0.8);" />
      </div>
      <div style="text-align: left; margin-bottom: 24px;">
        <label style="display: block; font-size: 13px; font-weight: bold; color: #80DEEA; margin-bottom: 8px;">SCEGLI CLASSE / RUOLO:</label>
        <div style="display: flex; gap: 8px;">
          <button data-class="warrior" class="class-btn" style="flex: 1; background: rgba(255,23,68,0.2); border: 2px solid #FF1744; border-radius: 8px; padding: 10px 6px; color: white; font-weight: bold; font-size: 12px; cursor: pointer; transition: transform 0.1s;">
            🛡️ ${ROLE_LABEL.warrior}<br><span style="font-size: 10px; color: #FF8A80; font-weight: normal;">+30 HP Max</span>
          </button>
          <button data-class="scout" class="class-btn" style="flex: 1; background: rgba(0,230,118,0.2); border: 2px solid #00E676; border-radius: 8px; padding: 10px 6px; color: white; font-weight: bold; font-size: 12px; cursor: pointer; transition: transform 0.1s;">
            ⚡ ${ROLE_LABEL.scout}<br><span style="font-size: 10px; color: #B9F6CA; font-weight: normal;">+20% Speed</span>
          </button>
          <button data-class="engineer" class="class-btn" style="flex: 1; background: rgba(0,229,255,0.2); border: 2px solid #00E5FF; border-radius: 8px; padding: 10px 6px; color: white; font-weight: bold; font-size: 12px; cursor: pointer; transition: transform 0.1s;">
            🔧 ${ROLE_LABEL.engineer}<br><span style="font-size: 10px; color: #80DEEA; font-weight: normal;">-30% Cooldown</span>
          </button>
        </div>
      </div>
      <button id="start-game-btn" style="width: 100%; background: linear-gradient(90deg, #00E5FF, #76FF03); border: none; border-radius: 10px; padding: 14px; color: #050A14; font-size: 18px; font-weight: 900; letter-spacing: 1px; cursor: pointer; box-shadow: 0 0 20px rgba(0,229,255,0.6); transition: transform 0.1s;">
        ENTRA NEL MONDO 3D
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  const buttons = overlay.querySelectorAll<HTMLButtonElement>('[data-class]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.class as PlayerClass;
      selectedClass = role;
      buttons.forEach(b => {
        b.style.opacity = b.dataset.class === role ? '1.0' : '0.4';
      });
    });
  });
  buttons.forEach(b => {
    b.style.opacity = b.dataset.class === selectedClass ? '1.0' : '0.4';
  });

  const startBtn = overlay.querySelector<HTMLButtonElement>('#start-game-btn');
  startBtn?.addEventListener('click', () => {
    const nameInput = overlay.querySelector<HTMLInputElement>('#reg-player-name');
    const finalName = nameInput?.value.trim() || 'Giocatore';
    callbacks.onStart(finalName, selectedClass);
    overlay.remove();
  });

  return {
    destroy: () => overlay.remove(),
  };
}
