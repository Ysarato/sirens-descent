import * as THREE from 'three';
import { Game } from './Game.js';

// Export function to initialize the game
export function initGame() {
  try {
    console.log('Initializing game...');
    
    // Check if all required DOM elements exist
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
      console.error('Game container not found!');
      return;
    }
    
    // Initialize the game
    const game = new Game();
    console.log('Game instance created');
    
    game.init();
    console.log('Game initialized successfully');
    
  } catch (error) {
    console.error('Error initializing game:', error);
    
    // Show error message to user instead of crashing
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
      gameContainer.innerHTML = `
        <div style="color: white; text-align: center; padding: 20px; font-family: Arial, sans-serif;">
          <h2>Game Failed to Load</h2>
          <p>Error: ${error.message}</p>
          <p>Please refresh the page to try again.</p>
        </div>
      `;
    }
  }
} 