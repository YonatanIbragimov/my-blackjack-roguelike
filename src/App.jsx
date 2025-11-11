import React, { useState } from "react";
import Card from "./Card";
import Deck from "./Deck";
import "./App.css";

const suitSymbols = ["♤", "♡", "♢", "♧"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const cardSymbols = [
  "🂡","🂢","🂣","🂤","🂥","🂦","🂧","🂨","🂩","🂪","🂫","🂭","🂮",
  "🂱","🂲","🂳","🂴","🂵","🂶","🂷","🂸","🂹","🂺","🂻","🂽","🂾",
  "🃁","🃂","🃃","🃄","🃅","🃆","🃇","🃈","🃉","🃊","🃋","🃍","🃎",
  "🃑","🃒","🃓","🃔","🃕","🃖","🃗","🃘","🃙","🃚","🃛","🃝","🃞",
];

function createDeck() {
  return cardSymbols.map((symbol, index) => {
    const suit = suitSymbols[Math.floor(index / 13)];
    const value = values[index % 13];
    return { suit, value, symbol };
  });
}

function shuffle(deck) {
  return [...deck].sort(() => Math.random() - 0.5);
}

function handValue(hand) {
  let total = 0;
  let aces = 0;
  hand.forEach(card => {
    if (card.value === "A") {
      total += 11;
      aces++;
    } else if (["J", "Q", "K"].includes(card.value)) {
      total += 10;
    } else {
      total += Number(card.value);
    }
  });
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

// Power-up items
const itemsList = [
  { name: "Extra Hit", description: "Hit without busting once per room" },
  { name: "Peek", description: "See dealer's hidden card" },
  { name: "Re-roll", description: "Swap a card once per room" },
];

export default function App() {
  const [deck, setDeck] = useState(shuffle(createDeck()));
  const [player, setPlayer] = useState({
    hand: [],
    health: 100,
    gold: 0,
    items: [],
    usedItem: null,
  });
  const [dealer, setDealer] = useState([]);
  const [standTriggered, setStandTriggered] = useState(false);
  const [message, setMessage] = useState("Welcome to Blackjack Roguelike!");
  const [currentRoom, setCurrentRoom] = useState(1);
  const [roomEvent, setRoomEvent] = useState("");

  const deal = () => {
    let d = shuffle(createDeck());
    setPlayer(prev => ({ ...prev, hand: [], usedItem: null }));
    const playerHand = [d.pop(), d.pop()];
    setPlayer(prev => ({ ...prev, hand: playerHand }));
    setDealer([d.pop(), d.pop()]);
    setDeck(d);
    setMessage(`Room ${currentRoom}: A new dealer awaits!`);
    setStandTriggered(false);

    // Random room event
    const eventRoll = Math.random();
    if (eventRoll < 0.25) {
      const gold = Math.floor(Math.random() * 10 + 5);
      setPlayer(prev => ({ ...prev, gold: prev.gold + gold }));
      setRoomEvent(`You found ${gold} gold on the floor!`);
    } else if (eventRoll < 0.4) {
      const item = itemsList[Math.floor(Math.random() * itemsList.length)];
      setPlayer(prev => ({ ...prev, items: [...prev.items, item] }));
      setRoomEvent(`You found an item: ${item.name}`);
    } else {
      setRoomEvent("");
    }
  };

  const hit = () => {
    if (!player.hand.length) return;

    const newDeck = [...deck];
    const card = newDeck.pop();
    let newHand = [...player.hand, card];

    if (player.usedItem === "Extra Hit") {
      setMessage(`Extra Hit! You drew ${card.symbol} but won't bust this turn.`);
    }

    setDeck(newDeck);
    setPlayer(prev => ({ ...prev, hand: newHand }));

    if (handValue(newHand) > 21 && player.usedItem !== "Extra Hit") {
      setMessage("Bust! You lost 10 health.");
      setPlayer(prev => ({ ...prev, health: prev.health - 10 }));
      checkGameOver();
    }
  };

  const stand = () => {
    setStandTriggered(true);

    let d = [...deck];
    let dlr = [...dealer];

    while (handValue(dlr) < 17) dlr.push(d.pop());

    setDeck(d);
    setDealer(dlr);

    const pVal = handValue(player.hand);
    const dVal = handValue(dlr);

    if (dVal > 21 || pVal > dVal) {
      setMessage("Player Wins! You gain 10 gold.");
      setPlayer(prev => ({ ...prev, gold: prev.gold + 10 }));
      setNextRoom();
    } else if (pVal < dVal) {
      setMessage("Dealer Wins! You lose 10 health.");
      setPlayer(prev => ({ ...prev, health: prev.health - 10 }));
      checkGameOver();
    } else {
      setMessage("Push (Tie). Room cleared.");
      setNextRoom();
    }
  };

  const handleUseItem = (item) => {
    if (!player.items.find(i => i.name === item.name) || player.usedItem === item.name) return;

    setPlayer(prev => ({ ...prev, usedItem: item.name }));

    if (item.name === "Peek") {
      setStandTriggered(true);
      setMessage(`Peek used! Dealer's hidden card: ${dealer[1].symbol}`);
    }
    if (item.name === "Extra Hit") {
      setMessage("Extra Hit available! Hit without busting once.");
    }
    if (item.name === "Re-roll") {
      setMessage("Re-roll: Swap a card in your hand.");
    }
  };

  const checkGameOver = () => {
    if (player.health <= 0) {
      setMessage("You have perished! Game over.");
      setPlayer({ hand: [], items: [], gold: 0, health: 100, usedItem: null });
      setDealer([]);
      setDeck(shuffle(createDeck()));
      setCurrentRoom(1);
      setStandTriggered(false);
    }
  };

  const setNextRoom = () => {
    setCurrentRoom(prev => prev + 1);
    deal();
  };

  return (
    <div className="app">
      {/* Left Sidebar */}
      <div className="sidebar">
        <h2>Player Stats</h2>
        <div className="stats-item">Room: {currentRoom}</div>
        <div className="stats-item">Health: {player.health}</div>
        <div className="stats-item">Gold: {player.gold}</div>
        <div className="item-list">
          Items:
          {player.items.length ? player.items.map(i => <span key={i.name}>{i.name}</span>) : <span>None</span>}
        </div>
        {roomEvent && <div className="event-item">{roomEvent}</div>}
      </div>

      {/* Right Table */}
      <div className="table">
        <h1>Blackjack Roguelike</h1>

        <Deck remaining={deck.length} onClick={deal} />

        <h2>Dealer ({standTriggered ? handValue(dealer) : "?"})</h2>
        <div className="cards">
          {dealer.map((card, i) => {
            if (!standTriggered && i === 1) return <div key={i} className="card back">🂠</div>;
            return <Card key={i} {...card} />;
          })}
        </div>

        <h2>You ({handValue(player.hand)})</h2>
        <div className="cards">
          {player.hand.map((card, i) => <Card key={i} {...card} />)}
        </div>

        <div className="controls">
          <button onClick={deal}>Deal</button>
          <button onClick={hit} disabled={!player.hand.length}>Hit</button>
          <button onClick={stand} disabled={!player.hand.length}>Stand</button>
          {player.items.map((item, i) => (
            <button key={i} onClick={() => handleUseItem(item)} disabled={player.usedItem === item.name}>
              Use {item.name}
            </button>
          ))}
        </div>

        <h2>{message}</h2>
      </div>
    </div>
  );
}
