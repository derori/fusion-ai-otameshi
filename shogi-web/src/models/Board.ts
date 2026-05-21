import type { BoardState, Piece, PieceType, Player, Position } from '../types/shogi';

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

export const isValidMove = (board: BoardState, from: Position, to: Position): boolean => {
  if (from.x === to.x && from.y === to.y) return false;
  if (from.x < 0 || from.x > 8 || from.y < 0 || from.y > 8) return false;
  if (to.x < 0 || to.x > 8 || to.y < 0 || to.y > 8) return false;

  const piece = board[from.y][from.x];
  if (!piece) return false;

  const destPiece = board[to.y][to.x];
  if (destPiece && destPiece.player === piece.player) return false;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  // Direction multiplier based on player
  // For Sente, forward is decreasing y (upwards), so dy < 0
  // For Gote, forward is increasing y (downwards), so dy > 0
  const forwardY = piece.player === 'Sente' ? -1 : 1;

  // Helper to check if a path is clear (for sliding pieces: Rook, Bishop, Lance)
  const isPathClear = (startX: number, startY: number, endX: number, endY: number): boolean => {
    const stepX = Math.sign(endX - startX);
    const stepY = Math.sign(endY - startY);
    let curX = startX + stepX;
    let curY = startY + stepY;
    while (curX !== endX || curY !== endY) {
      if (board[curY][curX] !== null) return false;
      curX += stepX;
      curY += stepY;
    }
    return true;
  };

  switch (piece.type) {
    case 'Pawn':
      return dx === 0 && dy === forwardY;

    case 'Lance':
      // Must move forward along the same column, path must be clear
      if (dx !== 0) return false;
      if (Math.sign(dy) !== forwardY) return false;
      return isPathClear(from.x, from.y, to.x, to.y);

    case 'Knight':
      return absX === 1 && dy === 2 * forwardY;

    case 'Silver':
      // Forward 3 squares or backward diagonals
      if (dy === forwardY && (absX === 0 || absX === 1)) return true;
      if (dy === -forwardY && absX === 1) return true;
      return false;

    case 'Gold':
    case 'PromotedPawn':
    case 'PromotedLance':
    case 'PromotedKnight':
    case 'PromotedSilver':
      // Forward 3 squares, left, right, or straight backward
      if (dy === forwardY && (absX === 0 || absX === 1)) return true;
      if (dy === 0 && absX === 1) return true;
      if (dy === -forwardY && absX === 0) return true;
      return false;

    case 'King':
      return absX <= 1 && absY <= 1;

    case 'Bishop':
      // Diagonal movement, path must be clear
      if (absX !== absY) return false;
      return isPathClear(from.x, from.y, to.x, to.y);

    case 'Rook':
      // Orthogonal movement, path must be clear
      if (dx !== 0 && dy !== 0) return false;
      return isPathClear(from.x, from.y, to.x, to.y);

    case 'PromotedBishop': // Dragon Horse (馬)
      // Bishop moves OR 1 step in orthogonal directions
      if (absX === absY) {
        return isPathClear(from.x, from.y, to.x, to.y);
      }
      return absX <= 1 && absY <= 1;

    case 'PromotedRook': // Dragon (龍)
      // Rook moves OR 1 step in diagonal directions
      if (dx === 0 || dy === 0) {
        return isPathClear(from.x, from.y, to.x, to.y);
      }
      return absX <= 1 && absY <= 1;

    default:
      return false;
  }
};

export const canPromote = (piece: Piece, from: Position, to: Position): boolean => {
  const promotableTypes: PieceType[] = ['Pawn', 'Lance', 'Knight', 'Silver', 'Bishop', 'Rook'];
  if (!promotableTypes.includes(piece.type)) return false;

  if (piece.player === 'Sente') {
    return from.y <= 2 || to.y <= 2;
  } else {
    return from.y >= 6 || to.y >= 6;
  }
};

export const mustPromote = (piece: Piece, to: Position): boolean => {
  if (piece.player === 'Sente') {
    if (piece.type === 'Pawn' || piece.type === 'Lance') {
      return to.y === 0;
    }
    if (piece.type === 'Knight') {
      return to.y <= 1;
    }
  } else {
    if (piece.type === 'Pawn' || piece.type === 'Lance') {
      return to.y === 8;
    }
    if (piece.type === 'Knight') {
      return to.y >= 7;
    }
  }
  return false;
};

export const getPromotedType = (type: PieceType): PieceType => {
  const promotionMap: Partial<Record<PieceType, PieceType>> = {
    Pawn: 'PromotedPawn',
    Lance: 'PromotedLance',
    Knight: 'PromotedKnight',
    Silver: 'PromotedSilver',
    Bishop: 'PromotedBishop',
    Rook: 'PromotedRook',
  };
  return promotionMap[type] || type;
};

export const isValidDrop = (
  board: BoardState,
  pieceType: PieceType,
  player: Player,
  to: Position
): boolean => {
  if (to.x < 0 || to.x > 8 || to.y < 0 || to.y > 8) return false;
  if (board[to.y][to.x] !== null) return false;

  // Cannot place on rows where the piece has no valid moves (行き所のない駒)
  if (player === 'Sente') {
    if ((pieceType === 'Pawn' || pieceType === 'Lance') && to.y === 0) return false;
    if (pieceType === 'Knight' && to.y <= 1) return false;
  } else {
    if ((pieceType === 'Pawn' || pieceType === 'Lance') && to.y === 8) return false;
    if (pieceType === 'Knight' && to.y >= 7) return false;
  }

  // Nihfu (二歩): Cannot place a Pawn on a column that already has another unpromoted pawn of the same player
  if (pieceType === 'Pawn') {
    for (let y = 0; y < 9; y++) {
      const p = board[y][to.x];
      if (p && p.type === 'Pawn' && p.player === player) {
        return false;
      }
    }
  }

  return true;
};
