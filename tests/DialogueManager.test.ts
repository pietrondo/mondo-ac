import { describe, expect, it, vi } from 'vitest';
import { DialogueManager } from '../src/dialogue/DialogueManager';

describe('DialogueManager', () => {
  it('starts dialogue tree and returns default node', () => {
    const manager = new DialogueManager();
    const node = manager.startDialogue('elder_eldrin');

    expect(node).not.toBeNull();
    expect(node?.id).toBe('start');
    expect(node?.speakerName).toBe('Anziano Eldrin');
    expect(manager.isDialogueActive()).toBe(true);
  });

  it('navigates through options and branches', () => {
    const manager = new DialogueManager();
    manager.startDialogue('elder_eldrin');

    const options = manager.getAvailableOptions();
    expect(options.length).toBeGreaterThan(0);

    // Pick option 0: Lore history
    const res = manager.selectOption(0);
    expect(res.closed).toBe(false);
    expect(res.nextNode?.id).toBe('lore_history');
    expect(manager.isLoreUnlocked('lore_ancient_world')).toBe(true);
  });

  it('filters options based on coin requirements', () => {
    const manager = new DialogueManager();
    manager.startDialogue('merchant_garrick');

    // Select "discount_check" node
    const res1 = manager.selectOption(2);
    expect(res1.nextNode?.id).toBe('discount_check');

    // Without enough coins (e.g. 10 coins), option requiring minCoins=50 is filtered
    const availableOptions1 = manager.getAvailableOptions(10);
    expect(availableOptions1.some((opt) => opt.nextId === 'grant_ammo')).toBe(false);

    // With 50 coins, option is available
    const availableOptions2 = manager.getAvailableOptions(50);
    expect(availableOptions2.some((opt) => opt.nextId === 'grant_ammo')).toBe(true);
  });

  it('triggers rewards and callbacks upon node entry and lore unlock', () => {
    const manager = new DialogueManager();
    const onReward = vi.fn();
    const onLoreUnlocked = vi.fn();

    manager.onReward = onReward;
    manager.onLoreUnlocked = onLoreUnlocked;

    manager.startDialogue('elder_eldrin');
    manager.selectOption(0); // Navigates to lore_history with lore reward + 15 coins

    expect(onLoreUnlocked).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'lore_ancient_world',
        title: 'La Genesi del Mondo Procedurale',
      })
    );

    expect(onReward).toHaveBeenCalledWith(
      expect.objectContaining({
        loreId: 'lore_ancient_world',
        coins: 15,
      })
    );
  });

  it('handles action triggers and closes dialogue', () => {
    const manager = new DialogueManager();
    const onAction = vi.fn();
    manager.onAction = onAction;

    manager.startDialogue('merchant_garrick');
    // Select option 0: "open_shop"
    const res = manager.selectOption(0);

    expect(res.closed).toBe(true);
    expect(res.action).toBe('open_shop');
    expect(onAction).toHaveBeenCalledWith('open_shop');
    expect(manager.isDialogueActive()).toBe(false);
  });

  it('tracks unlocked lore entries and avoids duplicate triggers', () => {
    const manager = new DialogueManager();
    const onLoreUnlocked = vi.fn();
    manager.onLoreUnlocked = onLoreUnlocked;

    manager.unlockLore('lore_wild_biomes');
    expect(manager.getUnlockedLore().length).toBe(1);
    expect(onLoreUnlocked).toHaveBeenCalledTimes(1);

    // Second unlock attempt should not re-trigger callback
    manager.unlockLore('lore_wild_biomes');
    expect(manager.getUnlockedLore().length).toBe(1);
    expect(onLoreUnlocked).toHaveBeenCalledTimes(1);
  });

  it('tracks active quests when assigned by dialogue nodes', () => {
    const manager = new DialogueManager();
    manager.startDialogue('elder_eldrin');
    manager.selectOption(1); // Navigates to dungeon_warning
    manager.selectOption(0); // Navigates to titan_quest (assigns quest_defeat_titan)

    const quests = manager.getActiveQuests();
    expect(quests.length).toBe(1);
    expect(quests[0].id).toBe('quest_defeat_titan');
    expect(quests[0].status).toBe('active');
  });
});
