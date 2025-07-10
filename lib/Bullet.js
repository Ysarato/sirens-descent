import * as THREE from 'three';

export class Bullet {
    constructor(scene, x, y, direction) {
        this.scene = scene;
        this.isDestroyed = false;
        this.radius = 0.15; // Slightly larger to match new scale
        this.speed = 10;
        
        // Create bullet geometry and material
        const geometry = new THREE.CircleGeometry(this.radius, 6);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Set position
        this.mesh.position.set(x, y, 0);
        this.position = this.mesh.position;
        
        // Set direction
        if (direction && direction.x !== undefined && direction.y !== undefined) {
            this.direction = new THREE.Vector2(direction.x, direction.y);
        } else {
            this.direction = new THREE.Vector2(0, 1);
        }
        this.direction.normalize();
        
        // Add to scene
        this.scene.add(this.mesh);
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