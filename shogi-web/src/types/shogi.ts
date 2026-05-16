export type Player = 'Sente' | 'Gote'; // Sente: Black (▲), Gote: White (▽)

export type PieceType =
  | 'Pawn'    // 歩
  | 'Lance'   // 香
  | 'Knight'  // 桂
  | 'Silver'  // 銀
  | 'Gold'    // 金
  | 'Bishop'  // 角
  | 'Rook'    // 飛
  | 'King'    // 玉
  | 'PromotedPawn'   // と
  | 'PromotedLance'  // 杏
  | 'PromotedKnight' // 圭
  | 'PromotedSilver' // 全
  | 'PromotedBishop' // 馬
  | 'PromotedRook';   // 龍

export interface Piece {
  id: string;
  type: PieceType;
  player: Player;
}

export interface Position {
  x: number; // 1-9 (from right to left in Shogi terms, but here 0-8)
  y: number; // 1-9 (from top to bottom, but here 0-8)
}

export type BoardState = (Piece | null)[][]; // 9x9 grid

export interface CapturedPieces {
  Sente: PieceType[];
  Gote: PieceType[];
}

export interface GameState {
  board: BoardState;
  turn: Player;
  captured: CapturedPieces;
  selectedSquare: Position | null;
}
