import * as THREE from 'three';

export class BackgroundGenerator {
    static createBackgroundFromImage(imagePath = '/assets/background.png') {
        // Create texture loader
        const loader = new THREE.TextureLoader();
        
        // Load the image texture
        const texture = loader.load(
            imagePath,
            // onLoad callback
            function (texture) {
                console.log('Background texture loaded successfully');
            },
            // onProgress callback
            function (progress) {
                console.log('Loading progress: ', progress);
            },
            // onError callback
            function (error) {
                console.error('Error loading background texture:', error);
                console.log('Falling back to programmatic background...');
                // Don't crash - just continue without the image
            }
        );
        
        // Configure texture properties
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.encoding = THREE.sRGBEncoding; // Preserves original colors
        texture.magFilter = THREE.NearestFilter; // Crisp pixel art
        texture.minFilter = THREE.NearestFilter; // Crisp pixel art
        
        return texture;
    }
    
    static createFallbackBackground() {
        // Create a simple fallback background if image fails
        return this.createScenario1Texture(512, 512);
    }
    
    // Keep the old method for fallback if needed
    static createScenario1Texture(width = 512, height = 512) {
        // Create a canvas to draw the swirling blue pattern
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create the swirling pattern
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) / 2;
        
        // Create gradient for the swirl effect
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                // Create swirling effect
                const spiralAngle = angle + (distance / 20) * Math.PI;
                const normalizedDistance = distance / maxRadius;
                
                // Create the blue color variations
                const wave1 = Math.sin(spiralAngle * 6 + normalizedDistance * 8) * 0.5 + 0.5;
                const wave2 = Math.cos(spiralAngle * 4 - normalizedDistance * 6) * 0.5 + 0.5;
                const wave3 = Math.sin(spiralAngle * 8 + normalizedDistance * 10) * 0.3 + 0.7;
                
                // Calculate blue color components
                const intensity = (1 - normalizedDistance * 0.3) * wave3;
                const r = Math.floor(30 + wave1 * 60 * intensity); // Low red
                const g = Math.floor(80 + wave2 * 100 * intensity); // Medium green  
                const b = Math.floor(120 + wave1 * wave2 * 135 * intensity); // High blue
                
                // Add some lighter swirls
                const lightWave = Math.sin(spiralAngle * 12 + normalizedDistance * 15) * 0.5 + 0.5;
                const lightIntensity = lightWave * (1 - normalizedDistance * 0.6);
                
                const finalR = Math.min(255, r + lightIntensity * 80);
                const finalG = Math.min(255, g + lightIntensity * 120);
                const finalB = Math.min(255, b + lightIntensity * 80);
                
                const pixelIndex = (y * width + x) * 4;
                data[pixelIndex] = finalR;     // Red
                data[pixelIndex + 1] = finalG; // Green
                data[pixelIndex + 2] = finalB; // Blue
                data[pixelIndex + 3] = 255;    // Alpha
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Create Three.js texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.encoding = THREE.sRGBEncoding; // Preserves original colors
        texture.magFilter = THREE.NearestFilter; // Crisp pixel art
        texture.minFilter = THREE.NearestFilter; // Crisp pixel art
        
        return texture;
    }
    
    static createBackgroundPlane(texture, camera) {
        // Get camera dimensions for full coverage
        const worldWidth = camera.right - camera.left;
        const worldHeight = camera.top - camera.bottom;
        
        // Create a plane geometry that covers the entire view
        const geometry = new THREE.PlaneGeometry(worldWidth * 1.2, worldHeight * 1.2);
        const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: false,
            depthWrite: false
        });
        
        const plane = new THREE.Mesh(geometry, material);
        plane.position.z = -10; // Place behind all other objects
        plane.renderOrder = -1; // Ensure it renders first (behind everything)
        
        return plane;
    }
} 