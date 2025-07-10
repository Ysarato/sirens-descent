import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function GamePage() {
  const [loadingState, setLoadingState] = useState('Loading...');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      // Add a delay before starting to prevent fast refresh issues
      const timer = setTimeout(() => {
        setLoadingState('Initializing game...');
        
        // Dynamic import of the game to ensure it only runs on client-side
        import('../lib/main').then(({ initGame }) => {
          try {
            setLoadingState('Starting game...');
            initGame();
            setLoadingState('Game loaded!');
            // Hide loading screen after a moment
            setTimeout(() => setLoadingState(null), 1000);
          } catch (err) {
            console.error('Game initialization error:', err);
            setError(err.message);
          }
        }).catch(err => {
          console.error('Game import error:', err);
          setError(err.message);
        });
      }, 2000); // 2 second delay

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <Head>
        <title>2D Roguelike Shooter</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #0a0a0a;
          font-family: 'Press Start 2P', monospace;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
        
        * {
          box-sizing: border-box;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
        
        #__next {
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }
      `}</style>
      
      <style jsx>{`
        #gameContainer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .loadingScreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          color: white;
          font-family: 'Press Start 2P', monospace;
          font-size: 16px;
          text-align: center;
        }
        
        .loadingText {
          margin-bottom: 20px;
        }
        
        .errorText {
          color: #ff4444;
          font-size: 12px;
          max-width: 80%;
          line-height: 1.5;
        }
        
        .loadingBar {
          width: 200px;
          height: 20px;
          border: 2px solid white;
          background: transparent;
          overflow: hidden;
        }
        
        .loadingProgress {
          height: 100%;
          background: #00ff00;
          width: 50%;
          animation: loading 2s ease-in-out infinite;
        }
        
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 100%; }
          100% { width: 0%; }
        }
        
        #ui {
          position: fixed;
          top: 10px;
          left: 10px;
          color: #ffffff;
          z-index: 100;
          font-size: 8px;
          line-height: 1.5;
          text-shadow: 1px 1px 0px #000000;
          pointer-events: none;
        }
        
        #healthBar {
          width: 80px;
          height: 8px;
          background: #333333;
          border: 1px solid #ffffff;
          margin-bottom: 6px;
          image-rendering: pixelated;
        }
        
        #healthFill {
          height: 100%;
          background: #ff0000;
          width: 100%;
          transition: width 0.1s linear;
          image-rendering: pixelated;
        }
        
        #level {
          margin-bottom: 4px;
          color: #ffffff;
        }
        
        #enemiesRemaining {
          margin-bottom: 4px;
          color: #ffff00;
        }
        
        #dashIndicator {
          margin-bottom: 4px;
          color: #00ffff;
        }
        
        #dashIndicator.ready {
          color: #00ff00;
          animation: pulse 1s ease-in-out infinite alternate;
        }
        
        #dashIndicator.cooling {
          color: #ff6600;
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          100% { opacity: 1.0; }
        }
        
        #pauseButton {
          position: fixed;
          top: 10px;
          right: 10px;
          width: 24px;
          height: 24px;
          background: #333333;
          border: 2px solid #ffffff;
          color: #ffffff;
          font-size: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          font-family: 'Press Start 2P', monospace;
          image-rendering: pixelated;
          pointer-events: auto;
        }
        
        #pauseButton:hover {
          background: #555555;
        }
        
        #pauseButton:active {
          background: #777777;
        }
        
        .overlay {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #ffffff;
          text-align: center;
          z-index: 200;
          background: #000000;
          border: 2px solid #ffffff;
          padding: 16px;
          font-family: 'Press Start 2P', monospace;
          image-rendering: pixelated;
          pointer-events: auto;
        }
        
        #gameOver {
          display: none;
          font-size: 16px;
        }
        
        #levelComplete {
          display: none;
          font-size: 12px;
        }
        
        #gameComplete {
          display: none;
          font-size: 16px;
          background: #004400;
          border: 2px solid #00ff00;
        }
        
        #pauseOverlay {
          display: none;
          font-size: 12px;
        }
        
        .button {
          margin-top: 12px;
          padding: 8px 12px;
          font-size: 8px;
          background: #ff0000;
          color: #ffffff;
          border: 2px solid #ffffff;
          cursor: pointer;
          font-family: 'Press Start 2P', monospace;
          image-rendering: pixelated;
          transition: none;
        }
        
        .button:hover {
          background: #ff3333;
        }
        
        .button:active {
          background: #cc0000;
        }
        
        .congratulations {
          font-size: 12px;
          margin-bottom: 8px;
          color: #00ff00;
        }
        
        .subtitle {
          font-size: 6px;
          margin-top: 8px;
          color: #cccccc;
        }
      `}</style>

      {/* Loading Screen */}
      {(loadingState || error) && (
        <div className="loadingScreen">
          {error ? (
            <div>
              <div className="loadingText">Game Failed to Load</div>
              <div className="errorText">{error}</div>
              <div className="errorText">Check console for details</div>
            </div>
          ) : (
            <div>
              <div className="loadingText">{loadingState}</div>
              <div className="loadingBar">
                <div className="loadingProgress"></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Container */}
      <div id="gameContainer"></div>

      {/* UI Elements */}
      <div id="ui">
        <div id="healthBar"><div id="healthFill"></div></div>
        <div id="level">Level: 1</div>
        <div id="enemiesRemaining">Enemies: 0</div>
        <div id="dashIndicator">DASH: Ready</div>
      </div>

      <button id="pauseButton">||</button>

      {/* Game Overlays */}
      <div id="gameOver" className="overlay">
        <h2>GAME OVER</h2>
        <p>You have been defeated!</p>
        <button id="restartBtn" className="button">Restart</button>
      </div>

      <div id="levelComplete" className="overlay">
        <h2>LEVEL COMPLETE!</h2>
        <p>Get ready for the next challenge!</p>
        <button id="nextLevelBtn" className="button">Continue</button>
      </div>

      <div id="gameComplete" className="overlay">
        <div className="congratulations">CONGRATULATIONS!</div>
        <h2>YOU WIN!</h2>
        <p>You have completed all levels!</p>
        <button id="playAgainBtn" className="button">Play Again</button>
        <div className="subtitle">Thanks for playing!</div>
      </div>

      <div id="pauseOverlay" className="overlay">
        <h2>PAUSED</h2>
        <p>Press P to resume</p>
        <p>Use WASD to move</p>
        <p>Press SPACE to shoot</p>
        <p>Double-tap direction OR Shift to dash</p>
      </div>
    </>
  );
} 