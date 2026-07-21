export interface DialogueRequirement {
  minCoins?: number;
  requiredLoreId?: string;
  requiredQuestId?: string;
}

export interface DialogueReward {
  coins?: number;
  health?: number;
  ammo?: boolean;
  loreId?: string;
  questId?: string;
}

export interface DialogueOption {
  text: string;
  nextId?: string; // If undefined, ends the conversation
  action?: string; // Special action trigger, e.g. "open_shop"
  requirement?: DialogueRequirement;
}

export interface DialogueNode {
  id: string;
  speakerName?: string;
  speakerTitle?: string;
  text: string;
  options?: DialogueOption[];
  reward?: DialogueReward;
  soundEffect?: string;
}

export interface DialogueTree {
  id: string;
  npcName: string;
  npcRole: string;
  defaultNodeId: string;
  nodes: Record<string, DialogueNode>;
}

export interface LoreEntry {
  id: string;
  title: string;
  category: 'History' | 'Monsters' | 'Dungeons' | 'Artifacts' | 'World';
  content: string;
  unlockedAt?: string;
}

export interface QuestState {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  rewardCoins?: number;
}
