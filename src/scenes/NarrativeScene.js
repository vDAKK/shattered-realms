class NarrativeScene extends Phaser.Scene {
  constructor() { super({ key: 'NarrativeScene' }); }

  init(data) {
    this.lines = data.lines || ['...'];
    this.nextScene = data.nextScene || 'GameScene';
    this.nextData = data.nextData || {};
    this.worldColor = data.worldColor || '#00e5ff';
    this.titleText = data.title || '';
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.currentLine = 0;
    this.canAdvance = false;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000005);
    this._createStarField(W, H);

    // Animated divider line
    const topLine = this.add.rectangle(W / 2, H * 0.15, 0, 2,
      parseInt(this.worldColor.replace('#', '0x')), 0.7);
    this.tweens.add({ targets: topLine, width: W * 0.6, duration: 800, ease: 'Expo.easeOut' });

    // Title
    if (this.titleText) {
      this.add.text(W / 2, H * 0.12, this.titleText, {
        fontFamily: 'Orbitron, Courier New',
        fontSize: '13px',
        color: this.worldColor,
        letterSpacing: 8,
      }).setOrigin(0.5).setAlpha(0.7);
    }

    // Main text area
    this.lineText = this.add.text(W / 2, H / 2, '', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '17px',
      color: '#ccddee',
      align: 'center',
      wordWrap: { width: W * 0.7 },
      lineSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);

    // Prompt
    this.prompt = this.add.text(W / 2, H * 0.82, '[ CLIQUER POUR CONTINUER ]', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '12px',
      color: this.worldColor,
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.prompt, alpha: { from: 0.3, to: 0.9 },
      duration: 900, yoyo: true, repeat: -1, delay: 1500
    });

    // Line counter
    this.counterText = this.add.text(W / 2, H * 0.87, '', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '11px', color: '#334455',
    }).setOrigin(0.5);

    // Bottom decorative line
    const bottomLine = this.add.rectangle(W / 2, H * 0.9, 0, 1,
      parseInt(this.worldColor.replace('#', '0x')), 0.3);
    this.tweens.add({ targets: bottomLine, width: W * 0.5, duration: 1000, delay: 300, ease: 'Expo.easeOut' });

    // Start first line
    this._showLine(0);

    // Input
    this.input.on('pointerdown', () => this._advance());
    this.input.keyboard.on('keydown-SPACE', () => this._advance());
    this.input.keyboard.on('keydown-ENTER', () => this._advance());
  }

  _showLine(index) {
    if (index >= this.lines.length) {
      this._finish();
      return;
    }
    this.canAdvance = false;
    this.lineText.setAlpha(0);
    this.lineText.setText(this.lines[index]);

    // Typewriter effect
    this.lineText.setAlpha(1);
    const fullText = this.lines[index];
    this.lineText.setText('');
    let charIndex = 0;

    this.typewriterTimer = this.time.addEvent({
      delay: 35,
      callback: () => {
        charIndex++;
        this.lineText.setText(fullText.slice(0, charIndex));
        if (charIndex >= fullText.length) {
          this.canAdvance = true;
        }
      },
      repeat: fullText.length - 1
    });

    this.counterText.setText(`${index + 1} / ${this.lines.length}`);
  }

  _advance() {
    if (!this.canAdvance) {
      // Skip typewriter
      if (this.typewriterTimer && !this.typewriterTimer.hasDispatched) {
        this.typewriterTimer.remove(false);
        this.typewriterTimer = null;
        this.lineText.setText(this.lines[this.currentLine]);
        this.canAdvance = true;
      }
      return;
    }
    this.currentLine++;
    if (this.currentLine >= this.lines.length) {
      this._finish();
    } else {
      this.tweens.add({
        targets: this.lineText, alpha: 0, duration: 200,
        onComplete: () => this._showLine(this.currentLine)
      });
    }
  }

  _finish() {
    this.canAdvance = false;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(this.nextScene, this.nextData);
    });
  }

  _createStarField(W, H) {
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const size = Phaser.Math.FloatBetween(0.5, 1.5);
      this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.05, 0.3));
    }
  }
}
