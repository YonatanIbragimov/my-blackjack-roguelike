import React from "react";

export default function Deck({ remaining, onClick }) {
  return (
    <div className="deck" onClick={onClick}>
      {remaining > 0 ? (
        <div className="deck-main">Deck ({remaining} left)</div>
      ) : (
        <div className="no-cards">No cards remaining</div>
      )}
    </div>
  );
}
