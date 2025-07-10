import * as THREE from 'three';
import { Bullet } from './Bullet.js';
import { Game } from './Game.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 6;
        this.radius = 1.5; // Collision radius
        this.isDestroyed = false;
        
        // Sereia dimensions: 630x370 pixels
        this.spritePixelWidth = 630;
        this.spritePixelHeight = 370;
        
        // Animation system
        this.setupAnimation();
        
        // Movement and input
        this.keys = {};
        this.velocity = new THREE.Vector3();
        this.maxSpeed = 6;
        
        // Shooting properties
        this.canShoot = true;
        this.shootCooldown = 0;
        this.shootCooldownTime = 0.4; // 400ms cooldown (fire rate limit)
        this.lastMousePosition = new THREE.Vector2();
        
        // Double-click shooting system
        this.lastSpacePress = 0;
        this.spaceClickCount = 0;
        this.doubleClickTimeout = 0.3; // 300ms window for double-click
        this.doubleClickTimer = null;
        this.pendingShot = false; // Flag for delayed single shot
        
        this.setupEventListeners();
        
        // Dash system
        this.isDashing = false;
        this.dashDistance = 3;
        this.dashDuration = 0.2;
        this.dashCooldown = 0;
        this.dashCooldownTime = 0.7; // 700ms cooldown
        this.dashDirection = new THREE.Vector3();
        this.dashTimer = 0;
        
        // Double-tap dash detection
        this.lastKeyTimes = {};
        this.keyPressCount = {};
        this.doubleTapTimeout = 0.5; // 500ms window for double-tap
        this.doubleTapTimers = {};
        
        // Direction and shooting tracking
        this.lastDirection = new THREE.Vector3(0, 1, 0); // Default facing up
        this.lastShootTime = 0;
        
        // Initialize key states
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            arrowUp: false,
            arrowLeft: false,
            arrowDown: false,
            arrowRight: false,
            space: false,
            shift: false
        };
        
        // Create the player mesh
        this.createMesh();
    }

    loadAnimationFrames() {
        // Load all mermaid animation frames
        const loader = new THREE.TextureLoader();
        const framePromises = [];
        
        // Load frames sereia1 through Sereia5 (note: mixed case in filenames)
        for (let i = 1; i <= 5; i++) {
            const framePromise = new Promise((resolve, reject) => {
                const filename = i === 1 ? 'sereia1.png' : `Sereia${i}.png`;
                const texture = loader.load(
                    `/assets/sereia/${filename}`,
                    (texture) => {
                        // Configure texture properties for sprite
                        texture.encoding = THREE.sRGBEncoding; // Preserves original colors
                        texture.magFilter = THREE.NearestFilter; // Crisp pixel art
                        texture.minFilter = THREE.NearestFilter; // Crisp pixel art
                        texture.generateMipmaps = false;
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
            console.log('All mermaid animation frames loaded');
        }).catch((error) => {
            console.error('Error loading animation frames:', error);
        });
        
        // Return the first frame as default
        const defaultTexture = loader.load('/assets/sereia/sereia1.png');
        defaultTexture.encoding = THREE.sRGBEncoding; // Preserves original colors
        defaultTexture.magFilter = THREE.NearestFilter; // Crisp pixel art
        defaultTexture.minFilter = THREE.NearestFilter; // Crisp pixel art
        defaultTexture.generateMipmaps = false;
        return defaultTexture;
    }
    
    setupAnimation() {
        // Animation configuration
        this.animationFrames = [];
        this.currentFrameIndex = 0;
        this.animationSpeed = 0.15; // Time between frames in seconds
        this.animationTimer = 0;
        this.animationDirection = 1; // 1 for forward, -1 for backward
        
        // Animation sequence: 1 → 2 → 3 → 4 → 5 → 4 → 3 → 2 → (repeat)
        // We'll handle this with direction changes at the ends
        this.maxFrameIndex = 4; // Index 4 = Sereia5 (0-based indexing)
        this.minFrameIndex = 0; // Index 0 = Sereia1
    }
    
    updateAnimation(deltaTime) {
        if (!this.animationFrames || this.animationFrames.length === 0) return;
        
        this.animationTimer += deltaTime;
        
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            
            // Update frame index based on direction
            this.currentFrameIndex += this.animationDirection;
            
            // Handle ping-pong animation logic
            if (this.currentFrameIndex >= this.maxFrameIndex) {
                this.currentFrameIndex = this.maxFrameIndex;
                this.animationDirection = -1; // Start going backward
            } else if (this.currentFrameIndex <= this.minFrameIndex) {
                this.currentFrameIndex = this.minFrameIndex;
                this.animationDirection = 1; // Start going forward
            }
            
            // Update the material's texture to show current frame
            if (this.mesh && this.mesh.material && this.animationFrames[this.currentFrameIndex]) {
                this.mesh.material.map = this.animationFrames[this.currentFrameIndex];
                this.mesh.material.needsUpdate = true;
            }
        }
    }

    createMesh() {
        // Create animated mermaid sprite for the player
        const initialTexture = this.loadAnimationFrames();
        
        // Use universal scaling system - sereia is 630x370 pixels
        const spriteSize = Game.calculateSpriteSize(this.spritePixelWidth, this.spritePixelHeight);
        const seireiaWidth = spriteSize.width;   // 6.3 units
        const seireiaHeight = spriteSize.height; // 3.7 units
        
        console.log(`Player sprite size: ${seireiaWidth.toFixed(2)}x${seireiaHeight.toFixed(2)} units (${this.spritePixelWidth}x${this.spritePixelHeight} pixels)`);
        
        const geometry = new THREE.PlaneGeometry(seireiaWidth, seireiaHeight);
        const material = new THREE.MeshBasicMaterial({ 
            map: initialTexture,
            transparent: true,
            alphaTest: 0.1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 0, 0);
        
        // Set initial scale for sprite orientation system
        this.mesh.scale.x = 1; // Normal orientation (not mirrored)
        this.mesh.rotation.z = 0; // Neutral rotation (not tilted)
        
        this.scene.add(this.mesh);
        
        // Store position for collision detection
        this.position = this.mesh.position;
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            const currentTime = Date.now() / 1000;
            
            switch(event.code) {
                case 'KeyW': 
                    this.checkDoubleTap('w', currentTime, new THREE.Vector3(0, 1, 0));
                    this.keys.w = true; 
                    break;
                case 'KeyA': 
                    this.checkDoubleTap('a', currentTime, new THREE.Vector3(-1, 0, 0));
                    this.keys.a = true; 
                    break;
                case 'KeyS': 
                    this.checkDoubleTap('s', currentTime, new THREE.Vector3(0, -1, 0));
                    this.keys.s = true; 
                    break;
                case 'KeyD': 
                    this.checkDoubleTap('d', currentTime, new THREE.Vector3(1, 0, 0));
                    this.keys.d = true; 
                    break;
                case 'ArrowUp': 
                    this.checkDoubleTap('arrowUp', currentTime, new THREE.Vector3(0, 1, 0));
                    this.keys.arrowUp = true; 
                    break;
                case 'ArrowLeft': 
                    this.checkDoubleTap('arrowLeft', currentTime, new THREE.Vector3(-1, 0, 0));
                    this.keys.arrowLeft = true; 
                    break;
                case 'ArrowDown': 
                    this.checkDoubleTap('arrowDown', currentTime, new THREE.Vector3(0, -1, 0));
                    this.keys.arrowDown = true; 
                    break;
                case 'ArrowRight': 
                    this.checkDoubleTap('arrowRight', currentTime, new THREE.Vector3(1, 0, 0));
                    this.keys.arrowRight = true; 
                    break;
                case 'Space': 
                    event.preventDefault(); // Prevent page scrolling
                    this.keys.space = true;
                    this.handleSpacePress(); // Handle double-click detection
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.shift = true;
                    // Trigger dash in current movement direction when shift is pressed
                    if (this.dashCooldown <= 0) {
                        const direction = this.getCurrentMovementDirection();
                        if (direction.length() > 0) {
                            this.startDash(direction.normalize());
                        }
                    }
                    event.preventDefault();
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW': this.keys.w = false; break;
                case 'KeyA': this.keys.a = false; break;
                case 'KeyS': this.keys.s = false; break;
                case 'KeyD': this.keys.d = false; break;
                case 'ArrowUp': this.keys.arrowUp = false; break;
                case 'ArrowLeft': this.keys.arrowLeft = false; break;
                case 'ArrowDown': this.keys.arrowDown = false; break;
                case 'ArrowRight': this.keys.arrowRight = false; break;
                case 'Space': this.keys.space = false; break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.shift = false; 
                    break;
            }
        });
    }

    checkDoubleTap(key, currentTime, direction) {
        // Clear any existing timer for this key
        if (this.doubleTapTimers[key]) {
            clearTimeout(this.doubleTapTimers[key]);
        }
        
        const timeSinceLastPress = currentTime - this.lastKeyTimes[key];
        
        // If the key was pressed recently, increment counter
        if (timeSinceLastPress < this.doubleTapTimeout) {
            this.keyPressCount[key]++;
            
            // Check for double-tap (2 presses within timeout)
            if (this.keyPressCount[key] >= 2 && this.dashCooldown <= 0) {
            // Double-tap detected, initiate dash!
            this.startDash(direction);
                this.keyPressCount[key] = 0; // Reset counter
                return;
            }
        } else {
            // Reset counter if too much time has passed
            this.keyPressCount[key] = 1;
        }
        
        // Set timer to reset counter after timeout
        this.doubleTapTimers[key] = setTimeout(() => {
            this.keyPressCount[key] = 0;
        }, this.doubleTapTimeout * 1000);
        
        this.lastKeyTimes[key] = currentTime;
    }

    getCurrentMovementDirection() {
        const direction = new THREE.Vector3();
        
        // Check WASD movement
        if (this.keys.w || this.keys.arrowUp) direction.y += 1;
        if (this.keys.s || this.keys.arrowDown) direction.y -= 1;
        if (this.keys.a || this.keys.arrowLeft) direction.x -= 1;
        if (this.keys.d || this.keys.arrowRight) direction.x += 1;
        
        return direction;
    }

    startDash(direction) {
        if (this.isDashing) return;
        
        this.isDashing = true;
        this.dashTimer = 0;
        this.dashDirection.copy(direction);
        this.dashCooldown = this.dashCooldownTime;
        
        // Visual feedback - make player slightly transparent during dash
        this.mesh.material.opacity = 0.7;
        this.mesh.material.transparent = true;
    }

    update(deltaTime) {
        this.updateAnimation(deltaTime); // Update mermaid animation
        this.handleDash(deltaTime);
        this.handleMovement(deltaTime);
        this.updateShootCooldown(deltaTime);
        this.updateDashCooldown(deltaTime);
        this.handleShooting();
    }

    handleDash(deltaTime) {
        if (!this.isDashing) return;
        
        this.dashTimer += deltaTime;
        
        if (this.dashTimer < this.dashDuration) {
            // Perform dash movement
            const dashSpeed = this.dashDistance / this.dashDuration;
            const moveDistance = dashSpeed * deltaTime;
            this.mesh.position.add(this.dashDirection.clone().multiplyScalar(moveDistance));
            
            // Apply sprite orientation during dash based on dash direction
            const movingLeft = this.dashDirection.x < 0;
            const movingRight = this.dashDirection.x > 0;
            const movingUp = this.dashDirection.y > 0;
            const movingDown = this.dashDirection.y < 0;
            this.updateSpriteOrientation(movingLeft, movingRight, movingUp, movingDown);
            
            // Keep player within bounds during dash
            this.mesh.position.x = Math.max(-15, Math.min(15, this.mesh.position.x));
            this.mesh.position.y = Math.max(-8, Math.min(8, this.mesh.position.y));
        } else {
            // End dash
            this.isDashing = false;
            this.mesh.material.opacity = 1.0;
            this.mesh.material.transparent = false;
        }
    }

    handleMovement(deltaTime) {
        if (this.isDashing) return; // No normal movement during dash
        
        const moveSpeed = this.speed * deltaTime;
        let moveDirection = new THREE.Vector3(0, 0, 0);
        
        // Track movement for sprite orientation
        let movingLeft = false;
        let movingRight = false;
        let movingUp = false;
        let movingDown = false;
        
        // WASD and Arrow key movement
        if (this.keys.w || this.keys.arrowUp) {
            this.mesh.position.y += moveSpeed;
            moveDirection.y += 1;
            movingUp = true;
        }
        if (this.keys.s || this.keys.arrowDown) {
            this.mesh.position.y -= moveSpeed;
            moveDirection.y -= 1;
            movingDown = true;
        }
        if (this.keys.a || this.keys.arrowLeft) {
            this.mesh.position.x -= moveSpeed;
            moveDirection.x -= 1;
            movingLeft = true;
        }
        if (this.keys.d || this.keys.arrowRight) {
            this.mesh.position.x += moveSpeed;
            moveDirection.x += 1;
            movingRight = true;
        }
        
        // Apply sprite mirroring and tilting
        this.updateSpriteOrientation(movingLeft, movingRight, movingUp, movingDown);
        
        // Update last direction if moving
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            this.lastDirection.copy(moveDirection);
        }
        
        // Keep player within bounds (adjusted for pixel art camera)
        this.mesh.position.x = Math.max(-15, Math.min(15, this.mesh.position.x));
        this.mesh.position.y = Math.max(-8, Math.min(8, this.mesh.position.y));
    }

    updateSpriteOrientation(movingLeft, movingRight, movingUp, movingDown) {
        // Horizontal mirroring (flip sprite when moving left/right)
        if (movingLeft) {
            this.mesh.scale.x = -1; // Mirror the sprite (flip horizontally)
        } else if (movingRight) {
            this.mesh.scale.x = 1; // Normal orientation
        }
        // If not moving horizontally, keep current orientation
        
        // Vertical tilting (tilt sprite when moving up/down)
        if (movingUp) {
            this.mesh.rotation.z = -0.2; // Tilt upward (increased from -0.1)
        } else if (movingDown) {
            this.mesh.rotation.z = 0.2; // Tilt downward (increased from 0.1)
        } else {
            this.mesh.rotation.z = 0; // Neutral position
        }
    }

    updateShootCooldown(deltaTime) {
        this.shootCooldown -= deltaTime;
        if (this.shootCooldown < 0) {
            this.shootCooldown = 0;
        }
    }

    updateDashCooldown(deltaTime) {
        this.dashCooldown -= deltaTime;
        if (this.dashCooldown < 0) {
            this.dashCooldown = 0;
        }
    }

    handleShooting() {
        // Handle pending single shot after double-click timeout
        if (this.pendingShot && this.shootCooldown <= 0) {
            this.shoot(1); // Single bullet
            this.pendingShot = false;
        }
    }
    
    handleSpacePress() {
        if (this.shootCooldown > 0) return; // Still in cooldown, ignore input
        
        const currentTime = Date.now() / 1000;
        const timeSinceLastPress = currentTime - this.lastSpacePress;
        
        // Clear existing timer
        if (this.doubleClickTimer) {
            clearTimeout(this.doubleClickTimer);
            this.doubleClickTimer = null;
        }
        
        if (timeSinceLastPress < this.doubleClickTimeout) {
            // Double-click detected!
            this.spaceClickCount++;
            
            if (this.spaceClickCount >= 2) {
                // Fire burst shot immediately
                this.pendingShot = false; // Cancel any pending single shot
                this.shoot(2); // Two bullets
                this.spaceClickCount = 0;
                console.log('Double-click burst!');
                return;
            }
        } else {
            // Reset click count if too much time passed
            this.spaceClickCount = 1;
        }
        
        // Set up timer for delayed single shot
        this.pendingShot = true;
        this.doubleClickTimer = setTimeout(() => {
            if (this.pendingShot && this.shootCooldown <= 0) {
                this.shoot(1); // Single bullet
                this.pendingShot = false;
                console.log('Single shot');
            }
            this.spaceClickCount = 0;
        }, this.doubleClickTimeout * 1000);
        
        this.lastSpacePress = currentTime;
    }

    findClosestEnemy() {
        if (!window.game || !window.game.enemies) return null;
        
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        window.game.enemies.forEach(enemy => {
            if (enemy.isDestroyed) return;
            
            const distance = this.mesh.position.distanceTo(enemy.mesh.position);
            
            // Consider last direction when multiple enemies are at similar distances
            const directionToEnemy = new THREE.Vector3()
                .subVectors(enemy.mesh.position, this.mesh.position)
                .normalize();
            
            const alignmentWithLastDirection = this.lastDirection.dot(directionToEnemy);
            
            // Prefer enemies in the direction the player was last moving
            const adjustedDistance = distance - (alignmentWithLastDirection * 2);
            
            if (adjustedDistance < closestDistance) {
                closestDistance = adjustedDistance;
                closestEnemy = enemy;
            }
        });
        
        return closestEnemy;
    }

    shoot(bulletCount = 1) {
        if (this.shootCooldown > 0) return;
        
        const closestEnemy = this.findClosestEnemy();
        let direction;
        
        if (closestEnemy) {
            // Aim at the closest enemy
            direction = new THREE.Vector3()
                .subVectors(closestEnemy.mesh.position, this.mesh.position)
                .normalize();
        } else {
            // No enemies found, shoot in the last direction moved
            direction = this.lastDirection.clone();
        }
        
        // Create bullets based on count
        for (let i = 0; i < bulletCount; i++) {
            let bulletDirection = direction.clone();
            
            if (bulletCount > 1) {
                // For multiple bullets, add slight spread
                const spread = 0.3; // Spread angle in radians
                const angle = (i - (bulletCount - 1) / 2) * spread / (bulletCount - 1);
                
                // Rotate direction vector by the spread angle
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const newX = bulletDirection.x * cos - bulletDirection.y * sin;
                const newY = bulletDirection.x * sin + bulletDirection.y * cos;
                
                bulletDirection.set(newX, newY, 0).normalize();
            }
            
            // Create bullet with slight position offset for multiple bullets
            const offsetX = bulletCount > 1 ? (i - (bulletCount - 1) / 2) * 0.2 : 0;
            
            const bullet = new Bullet(
                this.scene,
                this.mesh.position.x + offsetX,
                this.mesh.position.y,
                bulletDirection
            );
            
            // Add bullet to game
            if (window.game) {
                window.game.addBullet(bullet);
            }
        }
        
        this.shootCooldown = this.shootCooldownTime;
    }

    takeDamage(amount) {
        // No damage during dash (brief invincibility)
        if (this.isDashing) return;
        
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }

    reset() {
        this.health = this.maxHealth;
        this.mesh.position.set(0, 0, 0);
        this.shootCooldown = 0;
        this.dashCooldown = 0;
        this.isDashing = false;
        this.lastDirection.set(0, 1, 0); // Reset to facing up
        
        // Reset shooting state
        this.pendingShot = false;
        this.spaceClickCount = 0;
        if (this.doubleClickTimer) {
            clearTimeout(this.doubleClickTimer);
            this.doubleClickTimer = null;
        }
        
        // Reset visual state
        this.mesh.material.opacity = 1.0;
        this.mesh.material.transparent = false;
        
        // Reset sprite orientation to default
        this.mesh.scale.x = 1; // Normal orientation (not mirrored)
        this.mesh.rotation.z = 0; // Neutral rotation (not tilted)
    }

    destroy() {
        // Clean up timer
        if (this.doubleClickTimer) {
            clearTimeout(this.doubleClickTimer);
            this.doubleClickTimer = null;
        }
        
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
} 