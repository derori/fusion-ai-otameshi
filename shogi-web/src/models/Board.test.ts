import { describe, it, expect } from 'vitest';
import { createInitialBoard } from './Board';

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
});
