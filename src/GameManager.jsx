// GameManager.jsx
import React, { useState, useEffect } from "react";
import BlackjackGame from "./BlackjackGame";
import "./App.css";

export default function GameManager() {
  const [gameState, setGameState] = useState("loading"); // loading → home → menu → game → pause

  // Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => setGameState("home"), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => setGameState("menu");
  const handlePlay = () => setGameState("game");
  const handlePause = () => setGameState("pause");
  const handleResume = () => setGameState("game");
  const handleQuit = () => setGameState("menu");

  return (
    <div className="app-container">
      {gameState === "loading" && <LoadingScreen />}
      {gameState === "home" && <HomeScreen onContinue={handleStart} />}
      {gameState === "menu" && <MainMenu onPlay={handlePlay} />}
      {gameState === "game" && (
        <BlackjackGame onPause={handlePause} onQuit={handleQuit} />
      )}
      {gameState === "pause" && <PauseMenu onResume={handleResume} onQuit={handleQuit} />}
    </div>
  );
}

// 🔹 Individual screen components
const LoadingScreen = () => (
  <div className="screen loading">
    <h1>Loading...</h1>
    <p>Shuffling decks and preparing dealers...</p>
  </div>
);

const HomeScreen = ({ onContinue }) => (
  <div className="screen home">
    <h1>🂡 Blackjack Roguelike 🃞</h1>
    <button onClick={onContinue}>Press Start</button>
  </div>
);

const MainMenu = ({ onPlay }) => (
  <div className="screen menu">
    <h1>Main Menu</h1>
    <button onClick={onPlay}>Start Game</button>
    <button disabled>Settings (Coming Soon)</button>
    <button onClick={() => window.close()}>Quit</button>
  </div>
);

const PauseMenu = ({ onResume, onQuit }) => (
  <div className="screen pause">
    <h1>Game Paused</h1>
    <button onClick={onResume}>Resume</button>
    <button onClick={onQuit}>Quit to Menu</button>
  </div>
);
