import type { BoardState, Piece, PieceType, Player } from '../types/shogi';

let idCounter = 0;
const createPiece = (type: PieceType, player: Player): Piece => ({
  id: `${type}-${player}-${idCounter++}`,
  type,
  player,
});

export const createInitialBoard = (): BoardState => {
  const board: BoardState = Array(9).fill(null).map(() => Array(9).fill(null));

  // Pawns (Row 2 for Gote, Row 6 for Sente - 0-indexed)
  for (let x = 0; x < 9; x++) {
    board[2][x] = createPiece('Pawn', 'Gote');
    board[6][x] = createPiece('Pawn', 'Sente');
  }

  // Lances, Knights, Silvers, Golds, Kings
  const backRowPieces: PieceType[] = ['Lance', 'Knight', 'Silver', 'Gold', 'King', 'Gold', 'Silver', 'Knight', 'Lance'];
  for (let x = 0; x < 9; x++) {
    board[0][x] = createPiece(backRowPieces[x], 'Gote');
    board[8][x] = createPiece(backRowPieces[x], 'Sente');
  }

  // Bishops and Rooks
  board[1][1] = createPiece('Rook', 'Gote');
  board[1][7] = createPiece('Bishop', 'Gote');
  board[7][1] = createPiece('Bishop', 'Sente');
  board[7][7] = createPiece('Rook', 'Sente');

  return board;
};

export const getPieceSymbol = (type: PieceType): string => {
  const symbols: Record<PieceType, string> = {
    Pawn: '歩', Lance: '香', Knight: '桂', Silver: '銀', Gold: '金', Bishop: '角', Rook: '飛', King: '玉',
    PromotedPawn: 'と', PromotedLance: '杏', PromotedKnight: '圭', PromotedSilver: '全', PromotedBishop: '馬', PromotedRook: '龍'
  };
  return symbols[type];
};
