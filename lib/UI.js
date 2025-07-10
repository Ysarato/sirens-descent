export class UI {
    constructor() {
        this.healthBar = document.getElementById('healthFill');
        this.levelElement = document.getElementById('level');
        this.enemiesRemainingElement = document.getElementById('enemiesRemaining');
        this.dashIndicator = document.getElementById('dashIndicator');
    }

    update(health, level, enemiesRemaining, dashCooldown = 0) {
        // Update health bar
        const healthPercentage = (health / 100) * 100;
        this.healthBar.style.width = `${healthPercentage}%`;
        
        // Change health bar color based on health
        if (healthPercentage > 60) {
            this.healthBar.style.backgroundColor = '#00ff00';
        } else if (healthPercentage > 30) {
            this.healthBar.style.backgroundColor = '#ffff00';
        } else {
            this.healthBar.style.backgroundColor = '#ff0000';
        }
        
        // Update level with shortened format
        this.levelElement.textContent = `LVL: ${level}`;
        
        // Update enemies remaining with shortened format
        this.enemiesRemainingElement.textContent = `ENM: ${enemiesRemaining}`;
        
        // Update dash indicator
        this.updateDashIndicator(dashCooldown);
    }
    
    updateDashIndicator(dashCooldown) {
        if (!this.dashIndicator) return;
        
        if (dashCooldown <= 0) {
            // Dash is ready
            this.dashIndicator.textContent = 'DASH: Ready';
            this.dashIndicator.className = 'ready';
        } else {
            // Dash is cooling down
            const cooldownSeconds = Math.ceil(dashCooldown);
            this.dashIndicator.textContent = `DASH: ${cooldownSeconds}s`;
            this.dashIndicator.className = 'cooling';
        }
    }
} 