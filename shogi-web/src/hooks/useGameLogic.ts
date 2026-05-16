import { useState, useCallback } from 'react';
import type { GameState, Position, BoardState, PieceType } from '../types/shogi';
import { createInitialBoard } from '../models/Board';

type ExtendedGameState = GameState & { cursor: Position };

const processSquareAction = (prev: ExtendedGameState, pos: Position): ExtendedGameState => {
  const { board, turn, selectedSquare } = prev;
  const pieceAtClicked = board[pos.y][pos.x];

  if (!selectedSquare) {
    if (pieceAtClicked && pieceAtClicked.player === turn) {
      return { ...prev, selectedSquare: pos, cursor: pos };
    }
    return { ...prev, cursor: pos };
  }

  const selectedPiece = board[selectedSquare.y][selectedSquare.x];

  if (pieceAtClicked && pieceAtClicked.player === turn) {
    if (selectedSquare.x === pos.x && selectedSquare.y === pos.y) {
      return { ...prev, selectedSquare: null, cursor: pos };
    }
    return { ...prev, selectedSquare: pos, cursor: pos };
  }

  const newBoard: BoardState = board.map((row) => [...row]);
  const capturedPiece = pieceAtClicked;
  const newCaptured = { ...prev.captured };
  if (capturedPiece) {
    const baseType = capturedPiece.type.startsWith('Promoted')
      ? (capturedPiece.type.replace('Promoted', '') as PieceType)
      : capturedPiece.type;
    newCaptured[turn] = [...newCaptured[turn], baseType];
  }

  newBoard[pos.y][pos.x] = selectedPiece;
  newBoard[selectedSquare.y][selectedSquare.x] = null;

  return {
    ...prev,
    board: newBoard,
    turn: turn === 'Sente' ? 'Gote' : 'Sente',
    selectedSquare: null,
    captured: newCaptured,
    cursor: pos,
  };
};

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<ExtendedGameState>({
    board: createInitialBoard(),
    turn: 'Sente',
    captured: { Sente: [], Gote: [] },
    selectedSquare: null,
    cursor: { x: 4, y: 8 },
  });

  const handleSquareClick = useCallback((pos: Position) => {
    setGameState((prev) => processSquareAction(prev, pos));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    setGameState((prev) => {
      const { cursor } = prev;

      switch (e.key) {
        case 'ArrowUp':
          return { ...prev, cursor: { ...cursor, y: Math.max(0, cursor.y - 1) } };
        case 'ArrowDown':
          return { ...prev, cursor: { ...cursor, y: Math.min(8, cursor.y + 1) } };
        case 'ArrowLeft':
          return { ...prev, cursor: { ...cursor, x: Math.max(0, cursor.x - 1) } };
        case 'ArrowRight':
          return { ...prev, cursor: { ...cursor, x: Math.min(8, cursor.x + 1) } };
        case 'Enter':
        case ' ':
          return processSquareAction(prev, cursor);
        default:
          return prev;
      }
    });
  }, []);

  return {
    gameState,
    handleSquareClick,
    handleKeyDown,
  };
};
