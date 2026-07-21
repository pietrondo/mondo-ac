import { DialogueNode, DialogueOption, DialogueReward, DialogueTree, LoreEntry, QuestState } from './dialogue';
import { DIALOGUE_TREES, LORE_ENTRIES } from './dialogueData';

export class DialogueManager {
  private currentTree: DialogueTree | null = null;
  private currentNodeId: string | null = null;
  private unlockedLoreIds = new Set<string>();
  private activeQuests = new Map<string, QuestState>();

  onReward?: (reward: DialogueReward) => void;
  onLoreUnlocked?: (lore: LoreEntry) => void;
  onAction?: (actionName: string) => void;

  constructor() {}

  startDialogue(treeId: string, _playerCoins: number = 0): DialogueNode | null {
    const tree = DIALOGUE_TREES[treeId];
    if (!tree) return null;

    this.currentTree = tree;
    this.currentNodeId = tree.defaultNodeId;
    const node = this.getCurrentNode();

    if (node) {
      this.handleNodeRewards(node);
    }

    return node;
  }

  getCurrentNode(): DialogueNode | null {
    if (!this.currentTree || !this.currentNodeId) return null;
    return this.currentTree.nodes[this.currentNodeId] || null;
  }

  getCurrentTree(): DialogueTree | null {
    return this.currentTree;
  }

  isDialogueActive(): boolean {
    return this.currentTree !== null && this.currentNodeId !== null;
  }

  getAvailableOptions(playerCoins: number = 0): DialogueOption[] {
    const node = this.getCurrentNode();
    if (!node || !node.options) return [];

    return node.options.filter((opt) => {
      if (!opt.requirement) return true;
      if (opt.requirement.minCoins !== undefined && playerCoins < opt.requirement.minCoins) {
        return false;
      }
      if (opt.requirement.requiredLoreId !== undefined && !this.unlockedLoreIds.has(opt.requirement.requiredLoreId)) {
        return false;
      }
      if (opt.requirement.requiredQuestId !== undefined && !this.activeQuests.has(opt.requirement.requiredQuestId)) {
        return false;
      }
      return true;
    });
  }

  selectOption(index: number, playerCoins: number = 0): { nextNode: DialogueNode | null; action?: string; closed: boolean } {
    const options = this.getAvailableOptions(playerCoins);
    if (index < 0 || index >= options.length) {
      return { nextNode: null, closed: false };
    }

    const option = options[index];

    if (option.action) {
      if (this.onAction) {
        this.onAction(option.action);
      }
      this.closeDialogue();
      return { nextNode: null, action: option.action, closed: true };
    }

    if (!option.nextId) {
      this.closeDialogue();
      return { nextNode: null, closed: true };
    }

    this.currentNodeId = option.nextId;
    const nextNode = this.getCurrentNode();

    if (nextNode) {
      this.handleNodeRewards(nextNode);
    } else {
      this.closeDialogue();
      return { nextNode: null, closed: true };
    }

    return { nextNode, closed: false };
  }

  private handleNodeRewards(node: DialogueNode): void {
    if (node.reward) {
      if (node.reward.loreId) {
        this.unlockLore(node.reward.loreId);
      }

      if (node.reward.questId) {
        this.addQuest(node.reward.questId);
      }

      if (this.onReward) {
        this.onReward(node.reward);
      }
    }
  }

  unlockLore(loreId: string): LoreEntry | null {
    const lore = LORE_ENTRIES[loreId];
    if (!lore) return null;

    const isNew = !this.unlockedLoreIds.has(loreId);
    this.unlockedLoreIds.add(loreId);

    if (isNew) {
      const entryWithDate: LoreEntry = {
        ...lore,
        unlockedAt: new Date().toLocaleTimeString(),
      };
      if (this.onLoreUnlocked) {
        this.onLoreUnlocked(entryWithDate);
      }
      return entryWithDate;
    }

    return lore;
  }

  isLoreUnlocked(loreId: string): boolean {
    return this.unlockedLoreIds.has(loreId);
  }

  getUnlockedLore(): LoreEntry[] {
    const list: LoreEntry[] = [];
    for (const id of this.unlockedLoreIds) {
      if (LORE_ENTRIES[id]) {
        list.push(LORE_ENTRIES[id]);
      }
    }
    return list;
  }

  private addQuest(questId: string): void {
    if (!this.activeQuests.has(questId)) {
      this.activeQuests.set(questId, {
        id: questId,
        title: questId.replace('quest_', '').replace('_', ' ').toUpperCase(),
        description: 'Completa l\'obiettivo assegnato dagli NPC.',
        status: 'active',
      });
    }
  }

  getActiveQuests(): QuestState[] {
    return Array.from(this.activeQuests.values());
  }

  closeDialogue(): void {
    this.currentTree = null;
    this.currentNodeId = null;
  }
}
