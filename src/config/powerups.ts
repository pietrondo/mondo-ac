export const POWERUPS = {
  health: {
    healAmount: 30,
  },
  ammo: {
    ammoAmount: 30,
  },
  adrenaline: {
    duration: 8,
    speedMultiplier: 1.6,
  },
  overclock: {
    duration: 8,
    damageMultiplier: 1.6,
  },
  shield: {
    duration: 8,
  },
} as const;