// frontend/src/pages/GameBoard.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Card from "../components/Card";
import "../styles/GameBoard.css";

const TOTAL_PAIRS = 6;

const GameBoard = () => {
  const { matchId } = useParams(); // Just for display
  const [cards, setCards] = useState([]);
  const [choiceOne, setChoiceOne] = useState(null);
  const [choiceTwo, setChoiceTwo] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [turns, setTurns] = useState(0);

  // 1) Load cards once
  useEffect(() => {
    startGame();
    // eslint-disable-next-line
  }, []);

  // 2) When choiceOne & choiceTwo are set, compare them
  useEffect(() => {
    if (!choiceOne || !choiceTwo) return; // Early return, no hooking condition
    setDisabled(true);

    if (choiceOne.src === choiceTwo.src) {
      // matched
      setCards((prev) =>
        prev.map((card) =>
          card.src === choiceOne.src ? { ...card, matched: true } : card
        )
      );
      setTimeout(() => resetTurn(), 800);
    } else {
      // not matched
      setTimeout(() => resetTurn(), 1000);
    }
  }, [choiceOne, choiceTwo]);

  const fetchImages = async () => {
    try {
      const res = await fetch(`https://picsum.photos/v2/list?page=1&limit=${TOTAL_PAIRS}`);
      const data = await res.json();
      return [...data, ...data]
        .sort(() => Math.random() - 0.5)
        .map((img) => ({
          src: img.download_url,
          matched: false,
          id: Math.random(),
        }));
    } catch (error) {
      console.error("Image fetch error:", error);
      return [];
    }
  };

  const startGame = async () => {
    const newCards = await fetchImages();
    setCards(newCards);
    setChoiceOne(null);
    setChoiceTwo(null);
    setTurns(0);
    setDisabled(false);
  };

  const resetTurn = () => {
    setChoiceOne(null);
    setChoiceTwo(null);
    setTurns((prev) => prev + 1);
    setDisabled(false);
  };

  const handleChoice = (card) => {
    if (!disabled) {
      choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
    }
  };

  return (
    <div className="game-container">
      <h2>Memory Match Game</h2>
      <p>Match ID: {matchId}</p>
      <button onClick={startGame}>Restart Game</button>
      <p>Turns: {turns}</p>
      <div className="card-grid">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            flipped={card.matched || card === choiceOne || card === choiceTwo}
            handleChoice={handleChoice}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
