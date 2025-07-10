import * as THREE from 'three';
import { Player } from './Player.js';
import { WaveManager } from './WaveManager.js';
import { Enemy } from './Enemy.js';
import { SwordfishEnemy } from './SwordfishEnemy.js';
import { UI } from './UI.js';
import { BackgroundGenerator } from './BackgroundGenerator.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.waveManager = null;
        this.ui = null;
        this.isGameOver = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.backgroundPlane = null; // Add background plane reference
        
        // Pixel art configuration
        this.pixelWidth = 320;
        this.pixelHeight = 180;
        this.pixelRatio = 1;
        
        // Universal scaling system based on background dimensions
        // Background: 3200x1800 pixels should fit in 32x18 game world units
        this.backgroundPixelWidth = 3200;
        this.backgroundPixelHeight = 1800;
        this.worldWidth = 32;
        this.worldHeight = 18;
        
        // Calculate universal scale factor: units per pixel
        this.pixelsToUnits = this.worldWidth / this.backgroundPixelWidth; // 0.01 units per pixel
        
        console.log(`Universal scale factor: ${this.pixelsToUnits} units per pixel`);
    }
    
    // Static method to calculate proper sprite dimensions
    static calculateSpriteSize(pixelWidth, pixelHeight, pixelsToUnits = 0.01) {
        return {
            width: pixelWidth * pixelsToUnits,
            height: pixelHeight * pixelsToUnits
        };
    }
    
    // Static method to get the universal scale factor
    static getPixelsToUnits() {
        return 0.01; // 32 units / 3200 pixels
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupBackground(); // Add background setup
        this.setupGameObjects();
        this.setupEventListeners();
        this.gameLoop();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        // Remove solid background color since we'll use the scenario texture
        this.scene.background = null;
    }

    setupCamera() {
        // Pixel art orthographic camera
        const worldWidth = this.pixelWidth / 10; // Scale down for game world
        const worldHeight = this.pixelHeight / 10;
        
        this.camera = new THREE.OrthographicCamera(
            -worldWidth / 2,
            worldWidth / 2,
            worldHeight / 2,
            -worldHeight / 2,
            1,
            1000
        );
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        // Pixel-perfect renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, // Critical for pixel art
            alpha: false,
            powerPreference: "high-performance"
        });
        
        // Color preservation settings to prevent washed-out colors
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.NoToneMapping;
        
        // Use actual viewport dimensions with safety margins
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate scale factor with safety margin (leave space for UI and potential browser chrome)
        const maxWidth = viewportWidth - 20; // 20px margin
        const maxHeight = viewportHeight - 20; // 20px margin
        
        const scaleX = maxWidth / this.pixelWidth;
        const scaleY = maxHeight / this.pixelHeight;
        
        // Use floor to ensure integer scaling and never exceed viewport
        const scale = Math.max(1, Math.floor(Math.min(scaleX, scaleY)));
        
        const displayWidth = this.pixelWidth * scale;
        const displayHeight = this.pixelHeight * scale;
        
        // Ensure we never exceed viewport even with calculated size
        const finalWidth = Math.min(displayWidth, maxWidth);
        const finalHeight = Math.min(displayHeight, maxHeight);
        
        // Set internal rendering size to pixel dimensions
        this.renderer.setSize(finalWidth, finalHeight, false);
        
        // Disable texture filtering for pixel art
        this.renderer.domElement.style.imageRendering = 'pixelated';
        this.renderer.domElement.style.imageRendering = '-moz-crisp-edges';
        this.renderer.domElement.style.imageRendering = 'crisp-edges';
        
        // Center the canvas and ensure it doesn't cause overflow
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '50%';
        this.renderer.domElement.style.left = '50%';
        this.renderer.domElement.style.transform = 'translate(-50%, -50%)';
        this.renderer.domElement.style.maxWidth = '100vw';
        this.renderer.domElement.style.maxHeight = '100vh';
        
        const container = document.getElementById('gameContainer');
        container.appendChild(this.renderer.domElement);
        
        console.log(`Game scaled to: ${finalWidth}x${finalHeight} (${scale}x scale)`);
    }

    setupBackground() {
        try {
            // Create background texture from image
            console.log('Setting up background from image...');
            const backgroundTexture = BackgroundGenerator.createBackgroundFromImage('/assets/background.png');
            this.backgroundPlane = BackgroundGenerator.createBackgroundPlane(backgroundTexture, this.camera);
            
            // Add background to scene - it will persist across all levels
            this.scene.add(this.backgroundPlane);
            console.log('Background from image added successfully');
        } catch (error) {
            console.error('Error setting up background from image:', error);
            console.log('Using fallback background...');
            
            // Use fallback background
            try {
                const fallbackTexture = BackgroundGenerator.createFallbackBackground();
                this.backgroundPlane = BackgroundGenerator.createBackgroundPlane(fallbackTexture, this.camera);
                this.scene.add(this.backgroundPlane);
                console.log('Fallback background added successfully');
            } catch (fallbackError) {
                console.error('Error with fallback background:', fallbackError);
                // Set a simple black background if everything fails
                this.scene.background = new THREE.Color(0x000011);
            }
        }
    }

    setupGameObjects() {
        // Create player
        this.player = new Player(this.scene);
        
        // Create wave manager
        this.waveManager = new WaveManager(this.scene, this);
        
        // Create UI
        this.ui = new UI();
        
        // Make game instance globally accessible for bullet creation
        window.game = this;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restart());
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        
        // Pause key listener
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyP') {
                this.togglePause();
            }
        });
    }

    onWindowResize() {
        // Recalculate scale for pixel-perfect rendering
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate scale factor with safety margin
        const maxWidth = viewportWidth - 20;
        const maxHeight = viewportHeight - 20;
        
        const scaleX = maxWidth / this.pixelWidth;
        const scaleY = maxHeight / this.pixelHeight;
        
        // Use floor to ensure integer scaling and never exceed viewport
        const scale = Math.max(1, Math.floor(Math.min(scaleX, scaleY)));
        
        const displayWidth = this.pixelWidth * scale;
        const displayHeight = this.pixelHeight * scale;
        
        // Ensure we never exceed viewport
        const finalWidth = Math.min(displayWidth, maxWidth);
        const finalHeight = Math.min(displayHeight, maxHeight);
        
        this.renderer.setSize(finalWidth, finalHeight, false);
        
        console.log(`Game resized to: ${finalWidth}x${finalHeight} (${scale}x scale)`);
    }

    gameLoop(currentTime = 0) {
        if (this.isGameOver) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (!this.isPaused) {
            this.update(deltaTime);
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update player
        this.player.update(deltaTime);

        // Update enemies
        this.enemies.forEach(enemy => enemy.update(deltaTime, this.player));

        // Update player bullets
        this.bullets.forEach(bullet => bullet.update(deltaTime));

        // Update enemy bullets
        this.enemyBullets.forEach(bullet => bullet.update(deltaTime));

        // Update wave manager
        this.waveManager.update(deltaTime);

        // Check collisions
        this.checkCollisions();

        // Clean up destroyed objects
        this.cleanupObjects();

        // Update UI
        this.ui.update(
            this.player.health, 
            this.waveManager.getCurrentLevel(), 
            this.waveManager.getRemainingEnemies(),
            this.player.dashCooldown
        );
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    checkCollisions() {
        // Player bullets vs Enemy collisions
        this.bullets.forEach(bullet => {
            if (bullet.isDestroyed) return;
            
            this.enemies.forEach(enemy => {
                if (enemy.isDestroyed) return;
                
                if (this.checkCollision(bullet, enemy)) {
                    bullet.destroy();
                    enemy.takeDamage(1);
                }
            });
        });

        // Enemy bullets vs Player collisions
        this.enemyBullets.forEach(bullet => {
            if (bullet.isDestroyed) return;
            
            if (this.checkCollision(bullet, this.player)) {
                bullet.destroy();
                this.player.takeDamage(20); // Enemy bullets do more damage
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        });

        // Player vs Enemy collisions
        this.enemies.forEach(enemy => {
            if (enemy.isDestroyed) return;
            
            if (this.checkCollision(this.player, enemy)) {
                // Handle different enemy types differently
                if (enemy instanceof SwordfishEnemy) {
                    // SwordfishEnemy handles its own damage through dash attacks
                    // Only destroy if player is dashing (player can ram into enemies while dashing)
                    if (this.player.isDashing) {
                        enemy.destroy();
                    }
                    // No damage to player - SwordfishEnemy deals damage through its own dash system
                } else {
                    // Regular enemies deal touch damage
                    this.player.takeDamage(1);
                    enemy.destroy();
                    
                    if (this.player.health <= 0) {
                        this.gameOver();
                    }
                }
            }
        });
    }

    checkCollision(obj1, obj2) {
        const distance = obj1.position.distanceTo(obj2.position);
        return distance < (obj1.radius + obj2.radius);
    }

    cleanupObjects() {
        // Remove destroyed player bullets
        this.bullets = this.bullets.filter(bullet => !bullet.isDestroyed);
        
        // Remove destroyed enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => !bullet.isDestroyed);
        
        // Remove destroyed enemies
        this.enemies = this.enemies.filter(enemy => !enemy.isDestroyed);
    }

    addBullet(bullet) {
        this.bullets.push(bullet);
    }

    addEnemyBullet(bullet) {
        this.enemyBullets.push(bullet);
    }

    addEnemy(enemy) {
        this.enemies.push(enemy);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseOverlay').style.display = this.isPaused ? 'block' : 'none';
    }

    completeLevel() {
        // Clear all remaining enemy bullets when level is completed
        this.clearEnemyBullets();
        
        this.isPaused = true;
        document.getElementById('levelComplete').style.display = 'block';
    }

    completeGame() {
        // Clear all remaining enemy bullets when game is completed
        this.clearEnemyBullets();
        
        this.isPaused = true;
        document.getElementById('gameComplete').style.display = 'block';
    }

    nextLevel() {
        document.getElementById('levelComplete').style.display = 'none';
        
        // Clear any remaining enemy bullets before starting next level (safety measure)
        this.clearEnemyBullets();
        
        this.isPaused = false;
        this.waveManager.startNextLevel();
        // Note: Background persists automatically across levels
    }
    
    clearEnemyBullets() {
        // Destroy all enemy bullets and remove them from scene
        this.enemyBullets.forEach(bullet => {
            if (!bullet.isDestroyed) {
                bullet.destroy();
            }
        });
        this.enemyBullets = [];
        console.log('Cleared all enemy bullets for level transition');
    }

    gameOver() {
        this.isGameOver = true;
        document.getElementById('gameOver').style.display = 'block';
    }

    restart() {
        // Reset game state
        this.isGameOver = false;
        this.isPaused = false;
        
        // Clear all objects
        this.enemies.forEach(enemy => enemy.destroy());
        this.bullets.forEach(bullet => bullet.destroy());
        this.enemyBullets.forEach(bullet => bullet.destroy());
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        
        // Reset player
        this.player.reset();
        
        // Reset wave manager
        this.waveManager.reset();
        
        // Note: Background stays in place during restart
        
        // Hide all overlays
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('levelComplete').style.display = 'none';
        document.getElementById('gameComplete').style.display = 'none';
        document.getElementById('pauseOverlay').style.display = 'none';
        
        // Restart game loop
        this.lastTime = 0;
        this.gameLoop();
    }
} 