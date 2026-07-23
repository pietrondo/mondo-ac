export type HealthListener = (currentHp: number, maxHp: number) => void;
export type DamageListener = (amount: number, currentHp: number) => void;
export type DeathListener = () => void;

export class Health {
  private _hp: number;
  public readonly maxHp: number;
  private _isInvulnerable: boolean = false;
  private _alive: boolean = true;

  private damageListeners: DamageListener[] = [];
  private deathListeners: DeathListener[] = [];
  private healthListeners: HealthListener[] = [];

  constructor(maxHp: number) {
    this.maxHp = maxHp;
    this._hp = maxHp;
  }

  get hp(): number {
    return this._hp;
  }

  get ratio(): number {
    return this.maxHp === 0 ? 0 : this._hp / this.maxHp;
  }

  get isInvulnerable(): boolean {
    return this._isInvulnerable;
  }

  set isInvulnerable(value: boolean) {
    this._isInvulnerable = value;
  }

  isAlive(): boolean {
    return this._alive && this._hp > 0;
  }

  takeDamage(amount: number): number {
    if (!this.isAlive() || this._isInvulnerable || amount <= 0) return 0;
    const dealt = Math.min(amount, this._hp);
    this._hp = Math.max(0, this._hp - amount);
    this.damageListeners.forEach(cb => cb(dealt, this._hp));
    this.healthListeners.forEach(cb => cb(this._hp, this.maxHp));
    if (this._hp <= 0) {
      this._alive = false;
      this.deathListeners.forEach(cb => cb());
    }
    return dealt;
  }

  heal(amount: number): number {
    if (!this.isAlive()) return 0;
    const before = this._hp;
    this._hp = Math.min(this.maxHp, this._hp + amount);
    const healed = this._hp - before;
    if (healed > 0) {
      this.healthListeners.forEach(cb => cb(this._hp, this.maxHp));
    }
    return healed;
  }

  reset(): void {
    this._hp = this.maxHp;
    this._alive = true;
    this._isInvulnerable = false;
    this.healthListeners.forEach(cb => cb(this._hp, this.maxHp));
  }

  onDamage(cb: DamageListener): () => void {
    this.damageListeners.push(cb);
    return () => {
      const i = this.damageListeners.indexOf(cb);
      if (i >= 0) this.damageListeners.splice(i, 1);
    };
  }

  onDeath(cb: DeathListener): () => void {
    this.deathListeners.push(cb);
    return () => {
      const i = this.deathListeners.indexOf(cb);
      if (i >= 0) this.deathListeners.splice(i, 1);
    };
  }

  onHealthChange(cb: HealthListener): () => void {
    this.healthListeners.push(cb);
    return () => {
      const i = this.healthListeners.indexOf(cb);
      if (i >= 0) this.healthListeners.splice(i, 1);
    };
  }
}
