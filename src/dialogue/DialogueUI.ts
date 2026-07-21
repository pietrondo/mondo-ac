import { DialogueNode } from './dialogue';
import { DialogueManager } from './DialogueManager';

export class DialogueUI {
  private container: HTMLDivElement;
  private speakerNameEl: HTMLDivElement;
  private speakerTitleEl: HTMLDivElement;
  private textEl: HTMLDivElement;
  private optionsContainer: HTMLDivElement;

  private journalContainer: HTMLDivElement;
  private journalContentEl: HTMLDivElement;

  private dialogueManager: DialogueManager;
  private typewriterTimer: any = null;
  private fullText: string = '';
  private isTyping: boolean = false;
  private getPlayerCoins: () => number;
  private onCloseCallback?: () => void;
  private onOpenShop?: () => void;

  constructor(
    dialogueManager: DialogueManager,
    getPlayerCoins: () => number,
    onCloseCallback?: () => void,
    onOpenShop?: () => void
  ) {
    this.dialogueManager = dialogueManager;
    this.getPlayerCoins = getPlayerCoins;
    this.onCloseCallback = onCloseCallback;
    this.onOpenShop = onOpenShop;

    // Create Main Dialogue Box Container
    this.container = document.createElement('div');
    this.container.id = 'npc-dialogue-overlay';
    this.container.style.cssText = `
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      width: 680px;
      max-width: 92vw;
      background: rgba(14, 18, 30, 0.94);
      border: 2px solid #FFD54F;
      border-radius: 14px;
      padding: 20px 24px;
      color: #FFFFFF;
      font-family: system-ui, -apple-system, sans-serif;
      z-index: 500;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.75), 0 0 15px rgba(255, 213, 79, 0.3);
      display: none;
      pointer-events: auto;
      user-select: none;
    `;

    // Header (Speaker Info)
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255, 213, 79, 0.3);
      padding-bottom: 8px;
    `;

    this.speakerNameEl = document.createElement('div');
    this.speakerNameEl.style.cssText = `
      color: #FFD54F;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    `;

    this.speakerTitleEl = document.createElement('div');
    this.speakerTitleEl.style.cssText = `
      color: #90A4AE;
      font-size: 13px;
      font-style: italic;
    `;

    header.appendChild(this.speakerNameEl);
    header.appendChild(this.speakerTitleEl);
    this.container.appendChild(header);

    // Text Display Area
    this.textEl = document.createElement('div');
    this.textEl.style.cssText = `
      font-size: 16px;
      line-height: 1.5;
      color: #ECEFF1;
      margin-bottom: 16px;
      min-height: 48px;
    `;
    this.container.appendChild(this.textEl);

    // Options List Container
    this.optionsContainer = document.createElement('div');
    this.optionsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    this.container.appendChild(this.optionsContainer);

    document.body.appendChild(this.container);

    // Lore Journal Modal Container
    this.journalContainer = document.createElement('div');
    this.journalContainer.id = 'lore-journal-overlay';
    this.journalContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
      background: rgba(12, 16, 26, 0.96);
      border: 2px solid #80DEEA;
      border-radius: 16px;
      padding: 24px;
      color: #FFFFFF;
      font-family: system-ui, sans-serif;
      z-index: 600;
      display: none;
      flex-direction: column;
      box-shadow: 0 0 30px rgba(128, 222, 234, 0.35);
      pointer-events: auto;
    `;

    const journalHeader = document.createElement('div');
    journalHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px solid #80DEEA;
      padding-bottom: 10px;
    `;

    const journalTitle = document.createElement('h2');
    journalTitle.textContent = '📜 DIARIO DEL LORE & SEGRETI';
    journalTitle.style.cssText = 'margin:0; font-size: 20px; color: #80DEEA; font-weight: 800;';

    const closeJournalBtn = document.createElement('button');
    closeJournalBtn.textContent = '✖ CHIUDI';
    closeJournalBtn.style.cssText = `
      background: rgba(255,255,255,0.1);
      border: 1px solid #80DEEA;
      color: white;
      padding: 4px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    `;
    closeJournalBtn.addEventListener('click', () => this.hideLoreJournal());

    journalHeader.appendChild(journalTitle);
    journalHeader.appendChild(closeJournalBtn);
    this.journalContainer.appendChild(journalHeader);

    this.journalContentEl = document.createElement('div');
    this.journalContentEl.style.cssText = `
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-right: 6px;
    `;
    this.journalContainer.appendChild(this.journalContentEl);

    document.body.appendChild(this.journalContainer);

    this.bindKeyboard();
  }

  showDialogue(node: DialogueNode, speakerName?: string, speakerTitle?: string): void {
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }

    this.speakerNameEl.textContent = speakerName || node.speakerName || 'NPC';
    this.speakerTitleEl.textContent = speakerTitle || node.speakerTitle || '';

    this.fullText = node.text;
    this.textEl.textContent = '';
    this.isTyping = true;

    // Typewriter effect
    let charIdx = 0;
    this.typewriterTimer = setInterval(() => {
      if (charIdx < this.fullText.length) {
        this.textEl.textContent += this.fullText.charAt(charIdx);
        charIdx++;
      } else {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
        this.isTyping = false;
        this.renderOptions();
      }
    }, 15);

    this.container.style.display = 'block';

    try {
      document.exitPointerLock();
    } catch (_) {}
  }

  private renderOptions(): void {
    this.optionsContainer.innerHTML = '';
    const coins = this.getPlayerCoins();
    const options = this.dialogueManager.getAvailableOptions(coins);

    if (options.length === 0) {
      const closeBtn = document.createElement('button');
      closeBtn.style.cssText = `
        background: rgba(255, 213, 79, 0.15);
        border: 1.5px solid #FFD54F;
        color: #FFD54F;
        padding: 10px 14px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s;
      `;
      closeBtn.textContent = '[SPAZIO / INVIO / ESC] Chiudi conversazione';
      closeBtn.addEventListener('click', () => this.closeDialogue());
      this.optionsContainer.appendChild(closeBtn);
      return;
    }

    options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #FFFFFF;
        padding: 10px 14px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.15s ease;
      `;

      btn.innerHTML = `<span style="color:#FFD54F; font-weight:800;">[${idx + 1}]</span> ${opt.text}`;

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(255, 213, 79, 0.2)';
        btn.style.borderColor = '#FFD54F';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(255, 255, 255, 0.05)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      });

      btn.addEventListener('click', () => this.handleOptionSelect(idx));
      this.optionsContainer.appendChild(btn);
    });
  }

  private handleOptionSelect(index: number): void {
    if (this.isTyping) {
      // Complete typewriter immediately
      if (this.typewriterTimer) clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
      this.textEl.textContent = this.fullText;
      this.isTyping = false;
      this.renderOptions();
      return;
    }

    const coins = this.getPlayerCoins();
    const res = this.dialogueManager.selectOption(index, coins);

    if (res.action === 'open_shop') {
      this.closeDialogue();
      if (this.onOpenShop) {
        this.onOpenShop();
      }
      return;
    }

    if (res.closed || !res.nextNode) {
      this.closeDialogue();
    } else {
      const tree = this.dialogueManager.getCurrentTree();
      this.showDialogue(res.nextNode, tree?.npcName, tree?.npcRole);
    }
  }

  closeDialogue(): void {
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }
    this.isTyping = false;
    this.container.style.display = 'none';
    this.dialogueManager.closeDialogue();

    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  isOpen(): boolean {
    return this.container.style.display === 'block';
  }

  isJournalOpen(): boolean {
    return this.journalContainer.style.display === 'flex';
  }

  toggleLoreJournal(): void {
    if (this.isJournalOpen()) {
      this.hideLoreJournal();
    } else {
      this.showLoreJournal();
    }
  }

  showLoreJournal(): void {
    const entries = this.dialogueManager.getUnlockedLore();
    this.journalContentEl.innerHTML = '';

    if (entries.length === 0) {
      this.journalContentEl.innerHTML = `
        <div style="color: #90A4AE; text-align: center; margin-top: 40px; font-style: italic;">
          Nessun frammento di lore ancora sbloccato.<br/>Parla con gli NPC del villaggio ed esplora le rovine per scoprire i segreti del mondo!
        </div>
      `;
    } else {
      entries.forEach((e) => {
        const card = document.createElement('div');
        card.style.cssText = `
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(128, 222, 234, 0.4);
          border-radius: 10px;
          padding: 14px;
        `;
        card.innerHTML = `
          <div style="display:flex; justify-between; align-items:center; margin-bottom: 6px;">
            <span style="color:#80DEEA; font-weight:800; font-size:16px;">📖 ${e.title}</span>
            <span style="background: rgba(128,222,234,0.2); color:#80DEEA; padding: 2px 8px; border-radius: 4px; font-size:11px; font-weight:bold;">${e.category}</span>
          </div>
          <p style="color:#ECEFF1; font-size: 14px; line-height: 1.5; margin: 0;">${e.content}</p>
        `;
        this.journalContentEl.appendChild(card);
      });
    }

    this.journalContainer.style.display = 'flex';
    try { document.exitPointerLock(); } catch (_) {}
  }

  hideLoreJournal(): void {
    this.journalContainer.style.display = 'none';
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      // Key L toggles Lore Journal when not typing in an input
      if ((e.key === 'l' || e.key === 'L') && !this.isOpen() && document.activeElement?.tagName !== 'INPUT') {
        this.toggleLoreJournal();
        return;
      }

      if (this.isJournalOpen() && e.key === 'Escape') {
        this.hideLoreJournal();
        return;
      }

      if (!this.isOpen()) return;

      if (e.key === 'Escape') {
        this.closeDialogue();
        return;
      }

      if (this.isTyping && (e.key === ' ' || e.key === 'Enter')) {
        if (this.typewriterTimer) clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
        this.textEl.textContent = this.fullText;
        this.isTyping = false;
        this.renderOptions();
        return;
      }

      const options = this.dialogueManager.getAvailableOptions(this.getPlayerCoins());
      if (options.length === 0 && (e.key === ' ' || e.key === 'Enter')) {
        this.closeDialogue();
        return;
      }

      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= options.length) {
        this.handleOptionSelect(num - 1);
      }
    });
  }
}
