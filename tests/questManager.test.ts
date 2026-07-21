import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestManager } from '../src/quest/questManager';
import { HUD } from '../src/ui/hud';
import { WeaponType } from '../src/entities/Weapon';

function setupHUDMock(): HUD {
  const localStorageMock: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => localStorageMock[key] || null,
    setItem: (key: string, val: string) => { localStorageMock[key] = val; },
    removeItem: (key: string) => { delete localStorageMock[key]; },
  });

  const documentMock = {
    createElement: () => ({
      style: { cssText: '' },
      textContent: '',
      appendChild: vi.fn(),
      addEventListener: vi.fn(),
      setAttribute: vi.fn(),
      classList: { add: vi.fn(), remove: vi.fn() },
      getContext: vi.fn(() => ({})),
      remove: vi.fn(),
    }),
    body: {
      appendChild: vi.fn(),
    },
    addEventListener: vi.fn(),
  };
  vi.stubGlobal('document', documentMock);

  return new HUD();
}

describe('QuestManager Unit Tests', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('initializes with default active quests', () => {
    const qm = new QuestManager();
    const active = qm.getActiveQuests();

    expect(active.length).toBeGreaterThanOrEqual(2);
    expect(active.some(q => q.id === 'quest_bounty_monsters')).toBe(true);
    expect(active.some(q => q.id === 'quest_defeat_titan')).toBe(true);
  });

  it('tracks monster kills and completes bounty quest', () => {
    const hud = setupHUDMock();
    const qm = new QuestManager();
    qm.setHUD(hud);

    const bounty = qm.getActiveQuests().find(q => q.id === 'quest_bounty_monsters')!;
    const target = bounty.targetCount;

    for (let i = 0; i < target; i++) {
      qm.notifyMonsterKilled();
    }

    expect(bounty.status).toBe('completed');
    expect(hud.getCoins()).toBe(50 + bounty.rewardCoins);
  });

  it('triggers weapon reward callback on boss quest completion', () => {
    const hud = setupHUDMock();
    const qm = new QuestManager();
    qm.setHUD(hud);

    let rewardedWeapon: WeaponType | null = null;
    qm.setOnWeaponReward((type) => {
      rewardedWeapon = type;
    });

    qm.notifyBossKilled();

    const titanQuest = qm.getActiveQuests().find(q => q.id === 'quest_defeat_titan')!;
    expect(titanQuest.status).toBe('completed');
    expect(rewardedWeapon).toBe('sniper');
  });

  it('prevents adding duplicate quests', () => {
    const qm = new QuestManager();
    const initialCount = qm.getActiveQuests().length;

    qm.addQuest({
      id: 'quest_bounty_monsters',
      title: 'Duplicate Quest',
      description: 'Test',
      category: 'bounty',
      targetCount: 5,
      currentCount: 0,
      rewardCoins: 50,
      status: 'active',
    });

    expect(qm.getActiveQuests().length).toBe(initialCount);
  });
});
