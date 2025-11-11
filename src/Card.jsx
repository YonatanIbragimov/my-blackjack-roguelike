import React from "react";

export default function Card({ value, suit, symbol }) {
  const isRed = suit === "♡" || suit === "♢";
  return (
    <div className={`card ${isRed ? "red" : "black"}`}>
      <div className="symbol">{symbol}</div>
    </div>
  );
}
