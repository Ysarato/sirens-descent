import * as THREE from 'three';
import { Game } from './Game.js';

export class SwordfishEnemy {
    constructor(scene, x, y, speed = 3) {
        this.scene = scene;
        this.health = 2; // Slightly more health for melee enemy
        this.maxHealth = 2;
        this.speed = speed; // Use the passed speed parameter
        this.dashSpeed = speed * 4; // Dash speed is 4x normal speed
        this.radius = 0.8;
        this.isDestroyed = false;
        
        // Swordfish dimensions - will be detected from actual image
        this.spritePixelWidth = null;
        this.spritePixelHeight = null;
        
        // Melee attack properties
        this.meleeRange = 3.5; // Increased range but will add minimum distance check
        this.minDashDistance = 2.8; // Minimum distance before dash can trigger (safety buffer)
        this.isDashing = false;
        this.dashDuration = 0.3; // Duration of dash in seconds
        this.dashTimer = 0;
        this.dashDirection = new THREE.Vector3();
        this.dashCooldown = 0;
        this.dashCooldownTime = 2.0; // 2 seconds between dashes
        this.retreatDistance = 2; // Distance to retreat after dash
        this.isRetreating = false;
        this.retreatTimer = 0;
        this.retreatDuration = 1.0; // 1 second retreat time
        
        // Safety flags
        this.hasSeenPlayer = false; // Only start attacking after moving toward player first
        
        // Target tracking
        this.targetPosition = new THREE.Vector3();
        this.hasDealtDamage = false; // Prevent multiple damage in single dash
        
        // Setup animation system
        this.setupAnimation();
        
        this.createMesh();
        this.mesh.position.set(x, y, 0);
        this.position = this.mesh.position;
        
        // Add the mesh to the scene
        this.scene.add(this.mesh);
    }
    
    setupAnimation() {
        // Animation sequence: swordfish1 > swordfish1 > swordfish2 > loop
        this.animationSequence = [0, 0, 1]; // Frame indices: 0=swordfish1, 1=swordfish2
        this.currentFrameIndex = 0;
        this.animationTimer = 0;
        this.animationSpeed = 0.25; // Seconds per frame (slightly slower than Minipolvo)
        this.animationFrames = null; // Will be loaded in createMesh
    }
    
    loadAnimationFrames() {
        const loader = new THREE.TextureLoader();
        
        this.animationFrames = [
            // Frame 0: Swordfish1
            loader.load('/assets/enemies/Swordfish/Sworsfish1.png', 
                (texture) => {
                    console.log('Swordfish1 frame loaded');
                    
                    // Configure texture for color preservation
                    texture.encoding = THREE.sRGBEncoding;
                    texture.magFilter = THREE.NearestFilter;
                    texture.minFilter = THREE.NearestFilter;
                    texture.generateMipmaps = false;
                    
                    // Detect image dimensions from the first frame and adjust geometry
                    const image = texture.image;
                    if (image && this.mesh) {
                        this.spritePixelWidth = image.width;
                        this.spritePixelHeight = image.height;
                        
                        // Update mesh geometry with proper dimensions using universal scaling
                        const spriteSize = Game.calculateSpriteSize(this.spritePixelWidth, this.spritePixelHeight);
                        
                        // Dispose old geometry and create new one with proper size
                        this.mesh.geometry.dispose();
                        this.mesh.geometry = new THREE.PlaneGeometry(spriteSize.width, spriteSize.height);
                        
                        console.log(`Swordfish sprite size: ${spriteSize.width.toFixed(2)}x${spriteSize.height.toFixed(2)} units (${this.spritePixelWidth}x${this.spritePixelHeight} pixels)`);
                    }
                },
                undefined, 
                (error) => console.error('Error loading Swordfish1:', error)
            ),
            // Frame 1: Swordfish2  
            loader.load('/assets/enemies/Swordfish/Sworsfish2.png', 
                (texture) => {
                    console.log('Swordfish2 frame loaded');
                    // Configure texture for color preservation
                    texture.encoding = THREE.sRGBEncoding;
                    texture.magFilter = THREE.NearestFilter;
                    texture.minFilter = THREE.NearestFilter;
                    texture.generateMipmaps = false;
                },
                undefined, 
                (error) => console.error('Error loading Swordfish2:', error)
            )
        ];
        
        // Return the first frame for initial setup
        return this.animationFrames[0];
    }
    
    updateAnimation(deltaTime) {
        if (!this.animationFrames) return;
        
        this.animationTimer += deltaTime;
        
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            
            // Move to next frame in sequence
            this.currentFrameIndex = (this.currentFrameIndex + 1) % this.animationSequence.length;
            
            // Get the actual frame index from the sequence
            const frameIndex = this.animationSequence[this.currentFrameIndex];
            
            // Update the mesh material with the new frame
            if (this.mesh && this.animationFrames[frameIndex]) {
                this.mesh.material.map = this.animationFrames[frameIndex];
                this.mesh.material.needsUpdate = true;
            }
        }
    }

    createMesh() {
        // Load animation frames and get the initial texture
        const initialTexture = this.loadAnimationFrames();
        
        // Create initial geometry with temporary size - will be updated when image loads
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ 
            map: initialTexture,
            transparent: true,
            alphaTest: 0.1  // Helps with transparency edges
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
    }

    update(deltaTime, player) {
        if (this.isDestroyed) return;
        
        // Update cooldowns
        this.updateCooldowns(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update sprite orientation to face the player
        this.updateSpriteOrientation(player);
        
        // Get distance to player
        const distanceToPlayer = this.mesh.position.distanceTo(player.mesh.position);
        
        // Handle different states
        if (this.isDashing) {
            this.handleDash(deltaTime, player);
        } else if (this.isRetreating) {
            this.handleRetreat(deltaTime, player);
        } else {
            // Normal behavior: move toward player and check for dash opportunity
            this.moveTowardPlayer(deltaTime, player);
            this.checkForDashAttack(distanceToPlayer, player);
        }
        
        // Visual feedback during dash
        this.updateVisualEffects();
    }
    
    updateCooldowns(deltaTime) {
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
        }
        
        if (this.retreatTimer > 0) {
            this.retreatTimer -= deltaTime;
            if (this.retreatTimer <= 0) {
                this.isRetreating = false;
            }
        }
    }
    
    moveTowardPlayer(deltaTime, player) {
        // Calculate direction to player
        const direction = new THREE.Vector3()
            .subVectors(player.mesh.position, this.mesh.position)
            .normalize();
        
        // Move toward player at normal speed
        const moveDistance = this.speed * deltaTime;
        this.mesh.position.add(direction.multiplyScalar(moveDistance));
        
        // Mark that we've started moving toward player (prevents immediate attacks on spawn)
        if (!this.hasSeenPlayer) {
            this.hasSeenPlayer = true;
            console.log('Swordfish has locked onto player');
        }
    }
    
    checkForDashAttack(distanceToPlayer, player) {
        // Safety checks before allowing dash attack
        const tooClose = distanceToPlayer < this.minDashDistance;
        const inRange = distanceToPlayer <= this.meleeRange;
        const canAttack = this.dashCooldown <= 0 && !this.isRetreating && this.hasSeenPlayer;
        
        // Only dash if: in range, not too close, and all conditions met
        if (inRange && !tooClose && canAttack) {
            console.log(`Swordfish triggering dash attack! Distance: ${distanceToPlayer.toFixed(2)}, Range: ${this.meleeRange}, MinDist: ${this.minDashDistance}`);
            this.startDashAttack(player);
        } else if (inRange && tooClose) {
            console.log(`Swordfish too close to dash! Distance: ${distanceToPlayer.toFixed(2)}, MinDist: ${this.minDashDistance}`);
        }
    }
    
    startDashAttack(player) {
        this.isDashing = true;
        this.dashTimer = 0;
        this.hasDealtDamage = false;
        
        // Calculate dash direction toward player
        this.dashDirection = new THREE.Vector3()
            .subVectors(player.mesh.position, this.mesh.position)
            .normalize();
        
        // Store target position for dash
        this.targetPosition.copy(player.mesh.position);
        
        // No visual scaling - keep natural size
        
        console.log('Swordfish STARTING dash attack! Duration:', this.dashDuration);
    }
    
    handleDash(deltaTime, player) {
        this.dashTimer += deltaTime;
        
        if (this.dashTimer < this.dashDuration) {
            // Perform dash movement
            const moveDistance = this.dashSpeed * deltaTime;
            this.mesh.position.add(this.dashDirection.clone().multiplyScalar(moveDistance));
            
            // Check for collision with player during dash - only in the middle of the dash for precision
            if (!this.hasDealtDamage && this.dashTimer > (this.dashDuration * 0.2)) {
                const distanceToPlayer = this.mesh.position.distanceTo(player.mesh.position);
                const collisionThreshold = (this.radius + player.radius) * 0.8; // Tighter collision
                
                if (distanceToPlayer < collisionThreshold) {
                    // Deal damage to player
                    player.takeDamage(25); // Melee damage
                    this.hasDealtDamage = true;
                    console.log(`Swordfish DASH HIT! Distance: ${distanceToPlayer.toFixed(2)}, Threshold: ${collisionThreshold.toFixed(2)}`);
                    
                    // Check if player died from this attack
                    if (player.health <= 0) {
                        // Access the game instance to trigger game over
                        if (window.game) {
                            window.game.gameOver();
                        }
                    }
                }
            }
        } else {
            // End dash and start retreat
            this.isDashing = false;
            this.dashCooldown = this.dashCooldownTime;
            this.startRetreat(player);
        }
    }
    
    startRetreat(player) {
        this.isRetreating = true;
        this.retreatTimer = this.retreatDuration;
        
        // No visual effects reset needed since we don't change scale
        
        console.log('Swordfish retreating after dash');
    }
    
    handleRetreat(deltaTime, player) {
        // Move away from player during retreat
        const direction = new THREE.Vector3()
            .subVectors(this.mesh.position, player.mesh.position)
            .normalize();
        
        const moveDistance = this.speed * 0.7 * deltaTime; // Slower retreat
        this.mesh.position.add(direction.multiplyScalar(moveDistance));
    }
    
    updateVisualEffects() {
        // Keep sprite at natural size always - no scaling effects
        
        // Visual feedback for cooldown using opacity instead of color
        if (this.dashCooldown > 0) {
            // Slightly transparent during cooldown
            this.mesh.material.opacity = 0.7;
        } else {
            // Full opacity when ready to dash
            this.mesh.material.opacity = 1.0;
        }
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

    takeDamage(amount) {
        this.health -= amount;
        
        // Flash effect when hit using opacity
        this.mesh.material.opacity = 0.3;
        setTimeout(() => {
            if (!this.isDestroyed) {
                this.mesh.material.opacity = this.dashCooldown > 0 ? 0.7 : 1.0;
            }
        }, 100);
        
        if (this.health <= 0) {
            this.destroy();
        }
    }

    destroy() {
        this.isDestroyed = true;
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
} 