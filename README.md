# 🌊 Siren's Descent

A mystical underwater 2D roguelike shooter built with Three.js featuring a brave siren warrior battling through oceanic depths.

## 👥 Collaboration

This project is a collaboration between the development team and [@jairofortunato](https://github.com/jairofortunato).

## 🎮 Controls

- **WASD**: Move the siren warrior
- **Mouse Click** or **Spacebar**: Shoot magical projectiles towards cursor
- **Mouse Movement**: Aim direction

## 🚀 How to Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the local server (usually `http://localhost:3000`)

## 🎯 Game Features

- **Siren Movement**: Smooth WASD controls through underwater realms
- **Magical Combat**: Click or spacebar to shoot enchanted projectiles
- **Sea Creature Enemies**: Various underwater enemies with unique behaviors
  - **Minipolvo**: Agile tentacle creatures that shoot ink projectiles
  - **Swordfish**: Aggressive melee attackers with dash abilities
- **Wave System**: Progressive difficulty with increasing enemy counts
- **Health System**: Siren takes damage on enemy contact
- **Score System**: Earn points for vanquishing sea creatures
- **Game Over**: Restart functionality when health reaches zero

## 🧱 Technical Implementation

- **Three.js**: WebGL rendering with orthographic camera for 2D gameplay
- **Next.js**: Modern React framework for web deployment
- **ES6 Modules**: Clean code organization
- **RequestAnimationFrame**: Smooth 60fps game loop
- **Collision Detection**: Distance-based collision system
- **Sprite Animation**: Frame-based character animations

## 📁 Project Structure

```
lib/
├── main.js              # Entry point and game initialization
├── Game.js              # Main game loop and scene management
├── Player.js            # Siren warrior controls and shooting
├── Enemy.js             # Base enemy AI and behavior
├── SwordfishEnemy.js    # Melee dash enemy implementation
├── Bullet.js            # Magical projectile physics
├── EnemyBullet.js       # Enemy projectile system
├── WaveManager.js       # Enemy spawning and wave progression
├── UI.js               # Health bar and score display
└── BackgroundGenerator.js # Dynamic background generation

public/assets/
├── background.png       # Ocean background
├── sereia/             # Siren warrior sprites
│   ├── sereia1.png
│   ├── Sereia2.png
│   ├── Sereia3.png
│   ├── Sereia4.png
│   └── Sereia5.png
└── enemies/
    ├── Minipolvo/      # Tentacle creature sprites
    └── Swordfish/      # Swordfish enemy sprites
```

## 🎨 Visual Design

- **Siren Warrior**: Animated sprite with swimming motion
- **Minipolvo Enemies**: Tentacled creatures with ink projectiles
- **Swordfish**: Aggressive melee attackers with dash mechanics
- **Ocean Background**: Immersive underwater environment
- **UI**: Health bar with underwater theme

## 🚀 Future Enhancements

- Additional sea creature enemy types
- Underwater powerups (speed boosts, magic enhancements)
- Procedural ocean floor generation
- Underwater sound effects and ambient music
- Particle effects for magic and water
- Boss encounters with legendary sea monsters
- Multiplayer co-op mode 