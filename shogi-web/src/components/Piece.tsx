import React from 'react';
import type { Piece as PieceType } from '../types/shogi';
import { getPieceSymbol } from '../models/Board';

interface PieceProps {
  piece: PieceType;
}

const Piece: React.FC<PieceProps> = ({ piece }) => {
  const isGote = piece.player === 'Gote';
  return (
    <div className={`piece ${isGote ? 'gote' : 'sente'}`}>
      {getPieceSymbol(piece.type)}
    </div>
  );
};

export default Piece;
