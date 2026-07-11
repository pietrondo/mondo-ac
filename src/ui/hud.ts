export class HUD {
  private scoreElement: HTMLDivElement;
  private score = 0;

  constructor() {
    this.scoreElement = document.createElement('div');
    this.scoreElement.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      z-index: 100;
    `;
    this.scoreElement.textContent = 'Score: 0';
    document.body.appendChild(this.scoreElement);
  }

  addScore(amount: number): void {
    this.score += amount;
    this.scoreElement.textContent = `Score: ${this.score}`;
  }

  getScore(): number {
    return this.score;
  }
}
