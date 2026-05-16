import React from 'react';
import type { Piece as PieceType, Position } from '../types/shogi';
import Piece from './Piece';

interface SquareProps {
  piece: PieceType | null;
  position: Position;
  isSelected: boolean;
  isCursor: boolean;
  onClick: (pos: Position) => void;
}

const Square: React.FC<SquareProps> = ({ piece, position, isSelected, isCursor, onClick }) => {
  return (
    <div 
      className={`square ${isSelected ? 'selected' : ''} ${isCursor ? 'cursor' : ''}`}
      onClick={() => onClick(position)}
    >
      {piece && <Piece piece={piece} />}
    </div>
  );
};

export default Square;
