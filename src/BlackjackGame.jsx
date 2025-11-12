import React, { useState, useEffect } from "react";
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

const itemsList = [
  { name: "Extra Hit", description: "Hit without busting once per room" },
  { name: "Peek", description: "See dealer's hidden card" },
  { name: "Re-roll", description: "Swap a card once per room" },
];

const dealers = [
  {
    name: "Sneaky Sam",
    description: "Swaps your last card if you're close to 21.",
    trick: (playerHand, dealerHand, deck) => {
      if (handValue(playerHand) >= 18) {
        const newDeck = [...deck];
        const newCard = newDeck.pop();
        playerHand.pop();
        playerHand.push(newCard);
        return { playerHand, newDeck, message: "Sneaky Sam swapped your last card!" };
      }
      return null;
    }
  },
  {
    name: "Cautious Cathy",
    description: "Rarely busts and sometimes peeks at your hand.",
    trick: (playerHand, dealerHand) => {
      if (Math.random() < 0.3) {
        return { message: `Cathy peeks at your hand: ${playerHand.map(c => c.symbol).join(" ")}` };
      }
      return null;
    }
  },
  {
    name: "Random Rick",
    description: "Randomly adds a card for himself.",
    trick: (playerHand, dealerHand, deck) => {
      if (Math.random() < 0.2) {
        const newDeck = [...deck];
        dealerHand.push(newDeck.pop());
        return { dealerHand, newDeck, message: "Random Rick added a surprise card for himself!" };
      }
      return null;
    }
  },
  {
    name: "Bold Betty",
    description: "Always hits to 19, ignores safe play.",
    trick: () => null
  },
  {
    name: "Shifty Sharon",
    description: "Randomly reshuffles deck during your turn.",
    trick: (playerHand, dealerHand, deck) => {
      if (Math.random() < 0.15) {
        return { newDeck: shuffle(deck), message: "Shifty Sharon reshuffled the deck!" };
      }
      return null;
    }
  },
];

export default function BlackjackGame({ onPause, onQuit }) {
  const [deck, setDeck] = useState(shuffle(createDeck()));
  const [player, setPlayer] = useState({
    hand: [],
    health: 100,
    gold: 0,
    items: [],
    usedItem: null,
  });
  const [dealer, setDealer] = useState([]);
  const [currentDealer, setCurrentDealer] = useState(null);
  const [standTriggered, setStandTriggered] = useState(false);
  const [message, setMessage] = useState("Welcome to Blackjack Roguelike!");
  const [currentRoom, setCurrentRoom] = useState(1);
  const [roomEvent, setRoomEvent] = useState("");

  useEffect(() => {
    deal();
  }, []);

  const deal = () => {
    const d = shuffle(createDeck());
    const dealerPick = dealers[Math.floor(Math.random() * dealers.length)];
    setCurrentDealer(dealerPick);

    const playerHand = [d.pop(), d.pop()];
    const dealerHand = [d.pop(), d.pop()];

    setPlayer(prev => ({ ...prev, hand: playerHand, usedItem: null }));
    setDealer(dealerHand);
    setDeck(d);
    setStandTriggered(false);

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

    setMessage(`Room ${currentRoom}: ${dealerPick.name} appears!`);
  };

  const hit = () => {
    if (!player.hand.length) return;

    let newDeck = [...deck];
    const card = newDeck.pop();
    let newHand = [...player.hand, card];

    setDeck(newDeck);
    setPlayer(prev => ({ ...prev, hand: newHand }));

    if (currentDealer && currentDealer.trick) {
      const trickResult = currentDealer.trick(newHand, dealer, newDeck);
      if (trickResult) {
        if (trickResult.playerHand) newHand = trickResult.playerHand;
        if (trickResult.dealerHand) setDealer(trickResult.dealerHand);
        if (trickResult.newDeck) setDeck(trickResult.newDeck);
        if (trickResult.message) setMessage(trickResult.message);
      }
    }

    if (handValue(newHand) > 21 && player.usedItem !== "Extra Hit") {
      setMessage(prev => prev + " Bust! You lose 10 health.");
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
    if (!player.items.includes(item) || player.usedItem === item.name) return;

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
      setPlayer(prev => ({ ...prev, hand: [], items: [], gold: 0 }));
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
      <div className="sidebar">
        <h2>Room Info</h2>
        <p>Room: {currentRoom}</p>
        <p>Health: {player.health}</p>
        <p>Gold: {player.gold}</p>
        <p>Items: {player.items.map(i => i.name).join(", ") || "None"}</p>

        {currentDealer && (
          <>
            <p>Dealer: {currentDealer.name}</p>
            <p><em>{currentDealer.description}</em></p>
          </>
        )}

        {roomEvent && <p className="event">{roomEvent}</p>}
      </div>

      <div className="table">
        <h1>Blackjack Roguelike</h1>
        <Deck remaining={deck.length} onClick={deal} />

        <h2>Dealer ({standTriggered ? handValue(dealer) : "?"})</h2>
        <div className="cards">
          {dealer.map((card, i) =>
            !standTriggered && i === 1 ? (
              <div key={i} className="card back">🂠</div>
            ) : (
              <Card key={i} {...card} />
            )
          )}
        </div>

        <h2>You ({handValue(player.hand)})</h2>
        <div className="cards">
          {player.hand.map((card, i) => <Card key={i} {...card} />)}
        </div>

        <div className="controls">
          <button onClick={deal}>Deal</button>
          <button onClick={hit} disabled={!player.hand.length}>Hit</button>
          <button onClick={stand} disabled={!player.hand.length}>Stand</button>
          <button onClick={onPause}>Pause</button>
          <button onClick={onQuit}>Quit</button>
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
