// frontend/src/components/Card.js
import React from "react";

const Card = ({ card, flipped, handleChoice, disabled }) => {
  const handleClick = () => {
    if (!flipped && !disabled) {
      handleChoice(card);
    }
  };

  return (
    <div className="card">
      <div className={flipped ? "flipped" : ""}>
        <img className="front" src={card.src} alt="card front" />
        <img
          className="back"
          src="https://via.placeholder.com/100x150?text=?"
          alt="card back"
          onClick={handleClick}
        />
      </div>
    </div>
  );
};

export default Card;
