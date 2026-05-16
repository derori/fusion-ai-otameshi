import React from 'react';
import type { BoardState, Position } from '../types/shogi';
import Square from './Square';

interface BoardProps {
  board: BoardState;
  selectedSquare: Position | null;
  cursor: Position;
  onSquareClick: (pos: Position) => void;
}

const Board: React.FC<BoardProps> = ({ board, selectedSquare, cursor, onSquareClick }) => {
  return (
    <div className="board">
      {board.map((row, y) => (
        <div key={y} className="board-row">
          {row.map((piece, x) => (
            <Square
              key={`${x}-${y}`}
              piece={piece}
              position={{ x, y }}
              isSelected={selectedSquare?.x === x && selectedSquare?.y === y}
              isCursor={cursor.x === x && cursor.y === y}
              onClick={onSquareClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
