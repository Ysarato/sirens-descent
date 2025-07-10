import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { SwordfishEnemy } from './SwordfishEnemy.js';

export class WaveManager {
    constructor(scene, game) {
        this.scene = scene;
        this.game = game;
        this.currentLevel = 1;
        this.maxLevels = 5;
        this.enemiesSpawned = 0;
        this.totalEnemiesForLevel = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 0;
        this.levelDelay = 2; // seconds between levels
        this.levelTimer = 0;
        this.isSpawning = false;
        this.isLevelComplete = false;
        this.isGameComplete = false;
        
        // Enemy type spawn probabilities (adjust as needed)
        this.swordfishSpawnChance = 0.4; // 40% chance for swordfish, 60% for ranged
        
        // Level configurations: [enemyCount, swordfishSpeed, spawnInterval]
        this.levelConfigs = [
            { enemies: 12, swordfishSpeed: 1.5, spawnInterval: 2.0 },  // Level 1: Challenging start (was 3)
            { enemies: 20, swordfishSpeed: 2.0, spawnInterval: 1.5 },  // Level 2: More enemies (was 5)
            { enemies: 32, swordfishSpeed: 2.5, spawnInterval: 1.2 },  // Level 3: Faster enemies (was 8)
            { enemies: 48, swordfishSpeed: 3.0, spawnInterval: 1.0 },  // Level 4: Many fast enemies (was 12)
            { enemies: 60, swordfishSpeed: 3.5, spawnInterval: 0.8 }   // Level 5: Boss level (was 15)
        ];
        
        // Minipolvo enemy speed is always 2.0 (stabilized)
        this.minipolvoSpeed = 2.0;
        
        // Bullet speed scaling: starts at 6.0, increases by 0.8 per level
        this.baseBulletSpeed = 6.0;
        this.bulletSpeedIncrease = 0.8;
        
        this.setupLevel();
    }

    setupLevel() {
        if (this.currentLevel > this.maxLevels) {
            this.isGameComplete = true;
            return;
        }
        
        const config = this.levelConfigs[this.currentLevel - 1];
        this.totalEnemiesForLevel = config.enemies;
        this.spawnInterval = config.spawnInterval;
        this.swordfishSpeed = config.swordfishSpeed;
        
        // Calculate bullet speed for current level
        this.currentBulletSpeed = this.baseBulletSpeed + (this.currentLevel - 1) * this.bulletSpeedIncrease;
        
        this.enemiesSpawned = 0;
        this.isLevelComplete = false;
        this.spawnTimer = 0;
        this.levelTimer = 0;
        this.isSpawning = true;
        
        console.log(`Level ${this.currentLevel}: Minipolvo speed: ${this.minipolvoSpeed}, Swordfish speed: ${this.swordfishSpeed}, Bullet speed: ${this.currentBulletSpeed}`);
    }

    update(deltaTime) {
        if (this.isGameComplete) return;
        
        // Count alive enemies
        const enemiesAlive = this.game.enemies.filter(enemy => !enemy.isDestroyed).length;
        
        // Check if level is complete
        if (enemiesAlive === 0 && this.enemiesSpawned >= this.totalEnemiesForLevel && this.isSpawning && !this.isLevelComplete) {
            this.completeLevel();
        }
        
        // Spawn enemies for current level
        if (this.isSpawning && this.enemiesSpawned < this.totalEnemiesForLevel) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnEnemy();
                this.spawnTimer = 0;
            }
        }
        
        // Handle level transition delay
        if (this.isLevelComplete && !this.isSpawning) {
            this.levelTimer += deltaTime;
            if (this.levelTimer >= this.levelDelay) {
                this.startNextLevel();
            }
        }
    }

    completeLevel() {
        this.isLevelComplete = true;
        this.isSpawning = false;
        
        if (this.currentLevel >= this.maxLevels) {
            this.isGameComplete = true;
            this.game.completeGame();
        } else {
            this.game.completeLevel();
        }
    }

    startNextLevel() {
        this.currentLevel++;
        this.setupLevel();
    }

    spawnEnemy() {
        // Spawn enemy at random position around the edges (adjusted for pixel art camera)
        const spawnSide = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(spawnSide) {
            case 0: // Top
                x = (Math.random() - 0.5) * 30; // Wider spawn area
                y = 10;
                break;
            case 1: // Right
                x = 16;
                y = (Math.random() - 0.5) * 16;
                break;
            case 2: // Bottom
                x = (Math.random() - 0.5) * 30;
                y = -10;
                break;
            case 3: // Left
                x = -16;
                y = (Math.random() - 0.5) * 16;
                break;
        }
        
        // Randomly choose enemy type
        let enemy;
        if (Math.random() < this.swordfishSpawnChance) {
            // Spawn Swordfish (Yellow Melee Attacker) - uses scaling speed
            enemy = new SwordfishEnemy(this.scene, x, y, this.swordfishSpeed);
            console.log('Spawned Swordfish (melee) enemy at', x, y);
        } else {
            // Spawn regular Enemy (Red Ranged Shooter) - uses fixed 2.0 speed but level-based bullet speed
            enemy = new Enemy(this.scene, x, y, this.minipolvoSpeed, this.currentBulletSpeed);
            console.log('Spawned Minipolvo (ranged) enemy at', x, y);
        }
        
        this.game.addEnemy(enemy);
        this.enemiesSpawned++;
    }

    getRemainingEnemies() {
        const aliveEnemies = this.game.enemies.filter(enemy => !enemy.isDestroyed).length;
        const unspawnedEnemies = Math.max(0, this.totalEnemiesForLevel - this.enemiesSpawned);
        return aliveEnemies + unspawnedEnemies;
    }

    getCurrentLevel() {
        return this.currentLevel;
    }

    reset() {
        this.currentLevel = 1;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.levelTimer = 0;
        this.isSpawning = false;
        this.isLevelComplete = false;
        this.isGameComplete = false;
        this.setupLevel();
    }
} 