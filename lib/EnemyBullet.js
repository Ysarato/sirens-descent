import * as THREE from 'three';
import { Game } from './Game.js';

export class EnemyBullet {
    constructor(scene, x, y, direction, speed = 6) {
        this.scene = scene;
        this.isDestroyed = false;
        this.radius = 0.2; // Collision radius (for gameplay mechanics)
        this.speed = speed; // Use the passed speed parameter instead of fixed 6
        
        // Bullet dimensions - will be detected from actual image
        this.spritePixelWidth = null;
        this.spritePixelHeight = null;
        
        // Create the sprite mesh
        this.createMesh();
        
        // Set position
        this.mesh.position.set(x, y, 0);
        this.position = this.mesh.position;
        
        // Set direction
        if (direction && direction.x !== undefined && direction.y !== undefined) {
            this.direction = new THREE.Vector2(direction.x, direction.y);
        } else {
            this.direction = new THREE.Vector2(0, -1);
        }
        this.direction.normalize();
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    createMesh() {
        // Load MinipolvoBullet texture
        const loader = new THREE.TextureLoader();
        const texture = loader.load(
            '/assets/enemies/Minipolvo/MinipolvoBullet.png',
            (texture) => {
                console.log('MinipolvoBullet texture loaded successfully');
                
                // Detect image dimensions and update geometry
                const image = texture.image;
                if (image && this.mesh) {
                    this.spritePixelWidth = image.width;
                    this.spritePixelHeight = image.height;
                    
                    // Update mesh geometry with proper dimensions using universal scaling
                    const spriteSize = Game.calculateSpriteSize(this.spritePixelWidth, this.spritePixelHeight);
                    
                    // Dispose old geometry and create new one with proper size
                    this.mesh.geometry.dispose();
                    this.mesh.geometry = new THREE.PlaneGeometry(spriteSize.width, spriteSize.height);
                    
                    console.log(`MinipolvoBullet sprite size: ${spriteSize.width.toFixed(2)}x${spriteSize.height.toFixed(2)} units (${this.spritePixelWidth}x${this.spritePixelHeight} pixels)`);
                }
            },
            undefined,
            (error) => {
                console.error('Error loading MinipolvoBullet texture:', error);
            }
        );
        
        // Configure texture properties
        texture.encoding = THREE.sRGBEncoding; // Preserves original colors
        texture.magFilter = THREE.NearestFilter; // Crisp pixel art
        texture.minFilter = THREE.NearestFilter; // Crisp pixel art
        texture.generateMipmaps = false;
        
        // Create initial geometry with temporary size - will be updated when image loads
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1  // Helps with transparency edges
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
    }
    
    update(deltaTime) {
        if (this.isDestroyed) return;
        
        // Move bullet
        this.mesh.position.x += this.direction.x * this.speed * deltaTime;
        this.mesh.position.y += this.direction.y * this.speed * deltaTime;
        
        // Destroy if moved off screen
        if (this.mesh.position.y > 15 || this.mesh.position.y < -15 || 
            this.mesh.position.x > 20 || this.mesh.position.x < -20) {
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