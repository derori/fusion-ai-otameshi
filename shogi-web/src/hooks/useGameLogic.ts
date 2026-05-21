import { useState, useCallback } from 'react';
import type { GameState, Position, BoardState, PieceType, Player } from '../types/shogi';
import { createInitialBoard, isValidMove, canPromote, mustPromote, getPromotedType, isValidDrop } from '../models/Board';

type ExtendedGameState = GameState & {
  cursor: Position;
  selectedCapturedPiece: { player: Player; type: PieceType; index: number } | null;
  winner: Player | null;
};

const processSquareAction = (prev: ExtendedGameState, pos: Position): ExtendedGameState => {
  if (prev.winner) return prev; // Do nothing if the game has already been won

  const { board, turn, selectedSquare, selectedCapturedPiece } = prev;
  const pieceAtClicked = board[pos.y][pos.x];

  // If a captured piece is selected, try to drop it on the clicked square
  if (selectedCapturedPiece) {
    if (!isValidDrop(board, selectedCapturedPiece.type, turn, pos)) {
      return { ...prev, cursor: pos };
    }

    const newBoard: BoardState = board.map((row) => [...row]);
    const idCounter = board.flat().filter(Boolean).length + 1000;
    newBoard[pos.y][pos.x] = {
      id: `${selectedCapturedPiece.type}-${turn}-drop-${idCounter}`,
      type: selectedCapturedPiece.type,
      player: turn,
    };

    // Remove the piece from the player's captured list
    const newCaptured = { ...prev.captured };
    const playerCaptured = [...newCaptured[turn]];
    playerCaptured.splice(selectedCapturedPiece.index, 1);
    newCaptured[turn] = playerCaptured;

    return {
      ...prev,
      board: newBoard,
      turn: turn === 'Sente' ? 'Gote' : 'Sente',
      selectedSquare: null,
      selectedCapturedPiece: null,
      captured: newCaptured,
      cursor: pos,
    };
  }

  // Normal piece selection and movement on the board
  if (!selectedSquare) {
    if (pieceAtClicked && pieceAtClicked.player === turn) {
      return { ...prev, selectedSquare: pos, cursor: pos, selectedCapturedPiece: null };
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

  if (!selectedPiece || !isValidMove(board, selectedSquare, pos)) {
    return { ...prev, cursor: pos };
  }

  let finalPiece = selectedPiece;
  if (canPromote(selectedPiece, selectedSquare, pos)) {
    if (mustPromote(selectedPiece, pos)) {
      finalPiece = {
        ...selectedPiece,
        type: getPromotedType(selectedPiece.type),
      };
    } else {
      const shouldPromote = typeof window !== 'undefined' && window.confirm
        ? window.confirm('成りますか？')
        : true;
      if (shouldPromote) {
        finalPiece = {
          ...selectedPiece,
          type: getPromotedType(selectedPiece.type),
        };
      }
    }
  }

  const newBoard: BoardState = board.map((row) => [...row]);
  const capturedPiece = pieceAtClicked;
  const newCaptured = { ...prev.captured };
  let winner = prev.winner;

  if (capturedPiece) {
    if (capturedPiece.type === 'King') {
      winner = turn; // Current player wins if they capture the King
    }
    const baseType = capturedPiece.type.startsWith('Promoted')
      ? (capturedPiece.type.replace('Promoted', '') as PieceType)
      : capturedPiece.type;
    newCaptured[turn] = [...newCaptured[turn], baseType];
  }

  newBoard[pos.y][pos.x] = finalPiece;
  newBoard[selectedSquare.y][selectedSquare.x] = null;

  return {
    ...prev,
    board: newBoard,
    turn: turn === 'Sente' ? 'Gote' : 'Sente',
    selectedSquare: null,
    captured: newCaptured,
    cursor: pos,
    winner,
  };
};

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<ExtendedGameState>({
    board: createInitialBoard(),
    turn: 'Sente',
    captured: { Sente: [], Gote: [] },
    selectedSquare: null,
    cursor: { x: 4, y: 8 },
    selectedCapturedPiece: null,
    winner: null,
  });

  const handleSquareClick = useCallback((pos: Position) => {
    setGameState((prev) => processSquareAction(prev, pos));
  }, []);

  const handleCapturedPieceClick = useCallback((player: Player, type: PieceType, index: number) => {
    setGameState((prev) => {
      if (prev.winner) return prev;
      if (player !== prev.turn) return prev;

      // Toggle selection
      if (
        prev.selectedCapturedPiece &&
        prev.selectedCapturedPiece.player === player &&
        prev.selectedCapturedPiece.type === type &&
        prev.selectedCapturedPiece.index === index
      ) {
        return { ...prev, selectedCapturedPiece: null };
      }

      return {
        ...prev,
        selectedCapturedPiece: { player, type, index },
        selectedSquare: null, // Deselect board square
      };
    });
  }, []);

  const handleRestart = useCallback(() => {
    setGameState({
      board: createInitialBoard(),
      turn: 'Sente',
      captured: { Sente: [], Gote: [] },
      selectedSquare: null,
      cursor: { x: 4, y: 8 },
      selectedCapturedPiece: null,
      winner: null,
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    setGameState((prev) => {
      if (prev.winner) return prev;
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
    handleCapturedPieceClick,
    handleRestart,
    handleKeyDown,
  };
};
