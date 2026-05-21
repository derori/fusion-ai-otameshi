import { describe, it, expect } from 'vitest';
import { createInitialBoard, isValidMove, canPromote, mustPromote, getPromotedType, isValidDrop } from './Board';
import type { BoardState, Piece } from '../types/shogi';

describe('Board model', () => {
  it('should create a 9x9 board', () => {
    const board = createInitialBoard();
    expect(board.length).toBe(9);
    expect(board[0].length).toBe(9);
  });

  it('should place Pawns in the correct rows', () => {
    const board = createInitialBoard();
    // Gote Pawns on row 2 (index 2)
    for (let x = 0; x < 9; x++) {
      expect(board[2][x]?.type).toBe('Pawn');
      expect(board[2][x]?.player).toBe('Gote');
    }
    // Sente Pawns on row 6 (index 6)
    for (let x = 0; x < 9; x++) {
      expect(board[6][x]?.type).toBe('Pawn');
      expect(board[6][x]?.player).toBe('Sente');
    }
  });

  it('should place Kings in the correct positions', () => {
    const board = createInitialBoard();
    expect(board[0][4]?.type).toBe('King');
    expect(board[0][4]?.player).toBe('Gote');
    expect(board[8][4]?.type).toBe('King');
    expect(board[8][4]?.player).toBe('Sente');
  });

  it('should place Rooks and Bishops in the correct positions', () => {
    const board = createInitialBoard();
    // Gote
    expect(board[1][1]?.type).toBe('Rook');
    expect(board[1][7]?.type).toBe('Bishop');
    // Sente
    expect(board[7][1]?.type).toBe('Bishop');
    expect(board[7][7]?.type).toBe('Rook');
  });

  describe('isValidMove with custom board state', () => {
    it('should validate basic piece movements', () => {
      const board: BoardState = Array(9).fill(null).map(() => Array(9).fill(null));
      
      // Place a Sente Pawn at (4, 4)
      board[4][4] = { id: 'pawn-1', type: 'Pawn', player: 'Sente' };
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(true);
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 5 })).toBe(false);
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 4 })).toBe(false);

      // Place a Gote Pawn at (4, 4)
      board[4][4] = { id: 'pawn-2', type: 'Pawn', player: 'Gote' };
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 5 })).toBe(true);
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(false);

      // Place a Sente Knight at (4, 4)
      board[4][4] = { id: 'knight-1', type: 'Knight', player: 'Sente' };
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 2 })).toBe(true);
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 2 })).toBe(true);
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 6 })).toBe(false);

      // Place a Sente Silver at (4, 4)
      board[4][4] = { id: 'silver-1', type: 'Silver', player: 'Sente' };
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(true); // forward
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 3 })).toBe(true); // diagonal forward left
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 3 })).toBe(true); // diagonal forward right
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 5 })).toBe(true); // diagonal backward left
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 5 })).toBe(true); // diagonal backward right
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 5 })).toBe(false); // straight backward (invalid for Silver)
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 4 })).toBe(false); // left (invalid for Silver)

      // Place a Sente Gold at (4, 4)
      board[4][4] = { id: 'gold-1', type: 'Gold', player: 'Sente' };
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(true); // forward
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 3 })).toBe(true); // diagonal forward left
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 3 })).toBe(true); // diagonal forward right
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 4 })).toBe(true); // left
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 4 })).toBe(true); // right
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 5 })).toBe(true); // backward
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 5 })).toBe(false); // diagonal backward left (invalid for Gold)
    });

    it('should validate sliding pieces with obstacles', () => {
      const board: BoardState = Array(9).fill(null).map(() => Array(9).fill(null));
      
      // Place Sente Rook at (4, 4)
      board[4][4] = { id: 'rook-1', type: 'Rook', player: 'Sente' };
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 1 })).toBe(true); // straight forward
      
      // Put obstacle in path at (4, 2)
      board[2][4] = { id: 'obstacle', type: 'Pawn', player: 'Gote' };
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 2 })).toBe(true); // can capture obstacle
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 1 })).toBe(false); // cannot jump over obstacle
    });
  });

  describe('Promotion helpers', () => {
    it('should check if a piece can promote', () => {
      // Sente Pawn
      const pieceSente: Piece = { id: 'p1', type: 'Pawn', player: 'Sente' };
      // Move from non-promotion zone to non-promotion zone
      expect(canPromote(pieceSente, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(false);
      // Move from non-promotion zone to promotion zone (y <= 2)
      expect(canPromote(pieceSente, { x: 4, y: 3 }, { x: 4, y: 2 })).toBe(true);
      // Move within promotion zone
      expect(canPromote(pieceSente, { x: 4, y: 2 }, { x: 4, y: 1 })).toBe(true);
      // Move from promotion zone to non-promotion zone (exiting)
      expect(canPromote(pieceSente, { x: 4, y: 2 }, { x: 4, y: 3 })).toBe(true);

      // Gote Pawn
      const pieceGote: Piece = { id: 'p2', type: 'Pawn', player: 'Gote' };
      // Move to promotion zone (y >= 6)
      expect(canPromote(pieceGote, { x: 4, y: 5 }, { x: 4, y: 6 })).toBe(true);

      // King (cannot promote)
      const king: Piece = { id: 'k1', type: 'King', player: 'Sente' };
      expect(canPromote(king, { x: 4, y: 3 }, { x: 4, y: 2 })).toBe(false);
    });

    it('should check if a piece must promote', () => {
      const sentePawn: Piece = { id: 'p1', type: 'Pawn', player: 'Sente' };
      const senteKnight: Piece = { id: 'n1', type: 'Knight', player: 'Sente' };
      const senteSilver: Piece = { id: 's1', type: 'Silver', player: 'Sente' };

      // Sente Pawn at back row (y=0)
      expect(mustPromote(sentePawn, { x: 4, y: 0 })).toBe(true);
      expect(mustPromote(sentePawn, { x: 4, y: 1 })).toBe(false);

      // Sente Knight at row 0 or 1
      expect(mustPromote(senteKnight, { x: 4, y: 0 })).toBe(true);
      expect(mustPromote(senteKnight, { x: 4, y: 1 })).toBe(true);
      expect(mustPromote(senteKnight, { x: 4, y: 2 })).toBe(false);

      // Sente Silver (never must promote)
      expect(mustPromote(senteSilver, { x: 4, y: 0 })).toBe(false);
    });

    it('should map base types to promoted types', () => {
      expect(getPromotedType('Pawn')).toBe('PromotedPawn');
      expect(getPromotedType('Lance')).toBe('PromotedLance');
      expect(getPromotedType('Knight')).toBe('PromotedKnight');
      expect(getPromotedType('Silver')).toBe('PromotedSilver');
      expect(getPromotedType('Bishop')).toBe('PromotedBishop');
      expect(getPromotedType('Rook')).toBe('PromotedRook');
      expect(getPromotedType('King')).toBe('King');
    });
  });

  describe('isValidDrop', () => {
    it('should validate drop restrictions correctly', () => {
      const board: BoardState = Array(9).fill(null).map(() => Array(9).fill(null));

      // 1. Basic empty square drop
      expect(isValidDrop(board, 'Pawn', 'Sente', { x: 4, y: 4 })).toBe(true);

      // 2. Cannot drop on occupied square
      board[4][4] = { id: 'p1', type: 'Pawn', player: 'Sente' };
      expect(isValidDrop(board, 'Pawn', 'Sente', { x: 4, y: 4 })).toBe(false);

      // 3. Nihfu (二歩) check
      // Sente Pawn already at (4,4). Trying to drop another Sente Pawn at (4,2)
      expect(isValidDrop(board, 'Pawn', 'Sente', { x: 4, y: 2 })).toBe(false); // Same column (x=4)
      expect(isValidDrop(board, 'Pawn', 'Sente', { x: 3, y: 2 })).toBe(true); // Different column (x=3)
      
      // Promoted Pawn is exempt from Nihfu
      board[4][4] = { id: 'p1-promoted', type: 'PromotedPawn', player: 'Sente' };
      expect(isValidDrop(board, 'Pawn', 'Sente', { x: 4, y: 2 })).toBe(true);

      // 4. Dead-end rows check (行き所のない駒)
      expect(isValidDrop(board, 'Pawn', 'Sente', { x: 0, y: 0 })).toBe(false); // Pawn at Sente back row
      expect(isValidDrop(board, 'Lance', 'Sente', { x: 0, y: 0 })).toBe(false); // Lance at Sente back row
      expect(isValidDrop(board, 'Knight', 'Sente', { x: 0, y: 0 })).toBe(false); // Knight at Sente back row
      expect(isValidDrop(board, 'Knight', 'Sente', { x: 0, y: 1 })).toBe(false); // Knight at Sente 2nd back row
      expect(isValidDrop(board, 'Knight', 'Sente', { x: 0, y: 2 })).toBe(true); // Knight can move from row 2

      // Gote counterparts
      expect(isValidDrop(board, 'Pawn', 'Gote', { x: 0, y: 8 })).toBe(false); // Gote Pawn at Gote back row
      expect(isValidDrop(board, 'Knight', 'Gote', { x: 0, y: 7 })).toBe(false); // Gote Knight at 2nd back row
    });
  });
});
