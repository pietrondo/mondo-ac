import { HUD } from '../ui/hud';
import { WeaponType } from '../entities/Weapon';

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'bounty' | 'boss' | 'exploration';
  targetCount: number;
  currentCount: number;
  rewardCoins: number;
  rewardWeaponType?: WeaponType;
  status: 'active' | 'completed' | 'turned_in';
}

export class QuestManager {
  private activeQuests: Quest[] = [];
  private completedQuests: Set<string> = new Set();
  private hud: HUD | null = null;
  private onWeaponReward?: (type: WeaponType) => void;

  constructor() {
    // Initial starting quests
    this.addQuest({
      id: 'quest_bounty_monsters',
      title: 'Caccia ai Mostri del Santuario',
      description: 'Sconfiggi 6 mostri nelle terre del mondo',
      category: 'bounty',
      targetCount: 6,
      currentCount: 0,
      rewardCoins: 75,
      status: 'active',
    });

    this.addQuest({
      id: 'quest_defeat_titan',
      title: 'Il Rito del Titano Subterraneo',
      description: 'Varca il portale viola e sconfiggi il Boss Titano',
      category: 'boss',
      targetCount: 1,
      currentCount: 0,
      rewardCoins: 250,
      rewardWeaponType: 'sniper',
      status: 'active',
    });
  }

  setHUD(hud: HUD): void {
    this.hud = hud;
    this.updateHUDQuestDisplay();
  }

  setOnWeaponReward(cb: (type: WeaponType) => void): void {
    this.onWeaponReward = cb;
  }

  addQuest(quest: Quest): void {
    if (this.completedQuests.has(quest.id) || this.activeQuests.some(q => q.id === quest.id)) {
      return;
    }
    this.activeQuests.push(quest);
    if (this.hud) {
      this.hud.showLoreNotification(quest.title, 'Nuova Missione!');
      this.updateHUDQuestDisplay();
    }
  }

  notifyMonsterKilled(): void {
    for (const q of this.activeQuests) {
      if (q.category === 'bounty' && q.status === 'active') {
        q.currentCount++;
        if (q.currentCount >= q.targetCount) {
          this.completeQuest(q);
        }
      }
    }
    this.updateHUDQuestDisplay();
  }

  notifyBossKilled(): void {
    for (const q of this.activeQuests) {
      if (q.category === 'boss' && q.status === 'active') {
        q.currentCount++;
        if (q.currentCount >= q.targetCount) {
          this.completeQuest(q);
        }
      }
    }
    this.updateHUDQuestDisplay();
  }

  private completeQuest(quest: Quest): void {
    quest.status = 'completed';
    this.completedQuests.add(quest.id);
    if (this.hud) {
      this.hud.addCoins(quest.rewardCoins);
      this.hud.showLoreNotification(
        `${quest.title}: +${quest.rewardCoins} 💰 Monete!`,
        'Missione Completata!'
      );
    }
    if (quest.rewardWeaponType && this.onWeaponReward) {
      this.onWeaponReward(quest.rewardWeaponType);
    }
  }

  getActiveQuests(): Quest[] {
    return this.activeQuests;
  }

  private updateHUDQuestDisplay(): void {
    if (!this.hud) return;
    const active = this.activeQuests.filter(q => q.status === 'active');
    if (active.length === 0) {
      this.hud.setQuestText('Nessuna missione attiva');
    } else {
      const q = active[0];
      this.hud.setQuestText(`📜 ${q.title} (${q.currentCount}/${q.targetCount}) - Premia: +${q.rewardCoins}💰`);
    }
  }
}
