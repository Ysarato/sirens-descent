import * as THREE from 'three';
import { EnemyBullet } from './EnemyBullet.js';
import { Game } from './Game.js';

export class Enemy {
    constructor(scene, x, y, speed = 2, bulletSpeed = 6) {
        this.scene = scene;
        this.health = 1;
        this.isDestroyed = false;
        this.radius = 0.8; // Collision radius
        this.speed = speed;
        this.bulletSpeed = bulletSpeed; // Store bullet speed for this enemy
        
        // Minipolvo dimensions - will be detected from actual image
        this.spritePixelWidth = null;
        this.spritePixelHeight = null;
        
        // Setup animation system
        this.setupAnimation();
        
        // Create the sprite mesh
        this.createMesh();
        
        // Set position
        this.mesh.position.set(x || 0, y || 8, 0);
        this.position = this.mesh.position;
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Movement pattern
        this.moveDirection = new THREE.Vector2(0, -1);
        this.shootTimer = 0;
        this.shootInterval = 2; // Shoot every 2 seconds
    }
    
    setupAnimation() {
        // Animation configuration
        this.animationFrames = [];
        this.animationSpeed = 0.2; // Time between frames in seconds (slightly slower than player)
        this.animationTimer = 0;
        
        // Custom sequence: minipolvo1 → minipolvo2 → minipolvo3 → minipolvo2 → (repeat)
        // Frame indices: [0, 1, 2, 1] (0-based indexing)
        this.animationSequence = [0, 1, 2, 1];
        this.currentSequenceIndex = 0;
    }
    
    loadAnimationFrames() {
        // Load all minipolvo animation frames
        const loader = new THREE.TextureLoader();
        const framePromises = [];
        
        // Load frames minipolvo1, minipolvo2, minipolvo3
        for (let i = 1; i <= 3; i++) {
            const framePromise = new Promise((resolve, reject) => {
                const filename = `Minipolvo${i}.png`;
                const texture = loader.load(
                    `/assets/enemies/Minipolvo/${filename}`,
                    (texture) => {
                        // Configure texture properties for sprite
                        texture.encoding = THREE.sRGBEncoding; // Preserves original colors
                        texture.magFilter = THREE.NearestFilter; // Crisp pixel art
                        texture.minFilter = THREE.NearestFilter; // Crisp pixel art
                        texture.generateMipmaps = false;
                        
                        // Detect image dimensions from the first frame
                        if (i === 1 && texture.image) {
                            this.spritePixelWidth = texture.image.width;
                            this.spritePixelHeight = texture.image.height;
                            
                            // Update mesh geometry with proper dimensions
                            if (this.mesh) {
                                const spriteSize = Game.calculateSpriteSize(this.spritePixelWidth, this.spritePixelHeight);
                                
                                // Dispose old geometry and create new one with proper size
                                this.mesh.geometry.dispose();
                                this.mesh.geometry = new THREE.PlaneGeometry(spriteSize.width, spriteSize.height);
                                
                                console.log(`Minipolvo sprite size: ${spriteSize.width.toFixed(2)}x${spriteSize.height.toFixed(2)} units (${this.spritePixelWidth}x${this.spritePixelHeight} pixels)`);
                            }
                        }
                        
                        console.log(`${filename} loaded successfully`);
                        resolve(texture);
                    },
                    undefined,
                    (error) => {
                        console.error(`Error loading ${filename}:`, error);
                        reject(error);
                    }
                );
            });
            framePromises.push(framePromise);
        }
        
        // Wait for all frames to load
        Promise.all(framePromises).then((textures) => {
            this.animationFrames = textures;
            console.log('All Minipolvo animation frames loaded');
        }).catch((error) => {
            console.error('Error loading Minipolvo animation frames:', error);
        });
        
        // Return the first frame as default
        const defaultTexture = loader.load('/assets/enemies/Minipolvo/Minipolvo1.png');
        defaultTexture.encoding = THREE.sRGBEncoding; // Preserves original colors
        defaultTexture.magFilter = THREE.NearestFilter; // Crisp pixel art
        defaultTexture.minFilter = THREE.NearestFilter; // Crisp pixel art
        defaultTexture.generateMipmaps = false;
        return defaultTexture;
    }
    
    updateAnimation(deltaTime) {
        if (!this.animationFrames || this.animationFrames.length === 0) return;
        
        this.animationTimer += deltaTime;
        
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            
            // Move to next frame in sequence
            this.currentSequenceIndex = (this.currentSequenceIndex + 1) % this.animationSequence.length;
            
            // Get the frame index from our custom sequence
            const frameIndex = this.animationSequence[this.currentSequenceIndex];
            
            // Update the material's texture to show current frame
            if (this.mesh && this.mesh.material && this.animationFrames[frameIndex]) {
                this.mesh.material.map = this.animationFrames[frameIndex];
                this.mesh.material.needsUpdate = true;
            }
        }
    }
    
    createMesh() {
        // Load initial Minipolvo1 texture and setup animation frames
        const initialTexture = this.loadAnimationFrames();
        
        // Configure texture properties
        initialTexture.encoding = THREE.sRGBEncoding; // Preserves original colors
        initialTexture.magFilter = THREE.NearestFilter; // Crisp pixel art
        initialTexture.minFilter = THREE.NearestFilter; // Crisp pixel art
        initialTexture.generateMipmaps = false;
        
        // Create initial geometry with temporary size - will be updated when image loads
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ 
            map: initialTexture,
            transparent: true,
            alphaTest: 0.1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Set initial scale for sprite orientation system
        this.mesh.scale.x = 1; // Normal orientation (not mirrored)
    }
    
    updateSpriteOrientation(player) {
        if (!player || player.isDestroyed) return;
        
        // Calculate direction from enemy to player
        const directionToPlayer = player.position.x - this.mesh.position.x;
        
        // Mirror sprite based on player position relative to enemy
        if (directionToPlayer > 0) {
            // Player is to the right → Mirrored/inverted orientation
            this.mesh.scale.x = -Math.abs(this.mesh.scale.x);
        } else if (directionToPlayer < 0) {
            // Player is to the left → Normal orientation
            this.mesh.scale.x = Math.abs(this.mesh.scale.x);
        }
        // If directionToPlayer === 0, keep current orientation
    }
    
    update(deltaTime, player) {
        if (this.isDestroyed) return;
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update sprite orientation to face the player
        this.updateSpriteOrientation(player);
        
        // Always move directly toward player if player exists
        if (player && !player.isDestroyed) {
            const directionToPlayer = new THREE.Vector2(
                player.position.x - this.mesh.position.x,
                player.position.y - this.mesh.position.y
            ).normalize();
            
            // Move directly toward player
            this.mesh.position.x += directionToPlayer.x * this.speed * deltaTime;
            this.mesh.position.y += directionToPlayer.y * this.speed * deltaTime;
        } else {
            // Fallback movement if no player
            this.mesh.position.x += this.moveDirection.x * this.speed * deltaTime;
            this.mesh.position.y += this.moveDirection.y * this.speed * deltaTime;
        }
        
        // Shooting logic
        this.shootTimer += deltaTime;
        if (this.shootTimer >= this.shootInterval && player && !player.isDestroyed) {
            this.shoot(player);
            this.shootTimer = 0;
        }
        
        // Destroy if moved too far off screen
        if (this.mesh.position.y < -15 || this.mesh.position.x < -20 || this.mesh.position.x > 20) {
            this.destroy();
        }
    }
    
    shoot(player) {
        // Create enemy bullet toward player with level-based speed
        if (window.game && window.game.addEnemyBullet) {
            const direction = new THREE.Vector2(
                player.position.x - this.mesh.position.x,
                player.position.y - this.mesh.position.y
            ).normalize();
            
            const bullet = new EnemyBullet(
                this.scene,
                this.mesh.position.x,
                this.mesh.position.y,
                direction,
                this.bulletSpeed // Pass the bullet speed
            );
            window.game.addEnemyBullet(bullet);
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        this.scene.remove(this.mesh);
        
        // Clean up geometry and material
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
} 