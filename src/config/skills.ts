export const SKILLS = {
  dash: {
    cooldown: 5.0,
    duration: 0.4,
    speed: 28,
  },
  grenade: {
    cooldown: 8.0,
    damage: 120,
    radius: 12,
    timer: 3.0,
    velocity: 24,
    gravity: 15.0,
  },
  shield: {
    cooldown: 15.0,
    duration: 3.5,
    radius: 1.4,
  },
} as const;