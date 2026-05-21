import { describe, it, expect } from 'vitest';
import { createInitialBoard, isValidMove, canPromote, mustPromote, getPromotedType, isValidDrop } from './Board';
import type { BoardState, Piece, Position } from '../types/shogi';

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

  describe('isValidMove with custom board states', () => {
    // Helper to generate an empty board
    const createEmptyBoard = (): BoardState =>
      Array(9).fill(null).map(() => Array(9).fill(null));

    it('should return false for out-of-bounds coords', () => {
      const board = createEmptyBoard();
      board[4][4] = { id: 'p', type: 'Pawn', player: 'Sente' };

      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: -1 })).toBe(false);
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 9 })).toBe(false);
      expect(isValidMove(board, { x: 4, y: 4 }, { x: -1, y: 4 })).toBe(false);
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 9, y: 4 })).toBe(false);
      expect(isValidMove(board, { x: -1, y: 4 }, { x: 4, y: 4 })).toBe(false);
    });

    it('should return false if there is no piece at from position', () => {
      const board = createEmptyBoard();
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(false);
    });

    it('should return false when moving to the same square', () => {
      const board = createEmptyBoard();
      board[4][4] = { id: 'p', type: 'Pawn', player: 'Sente' };
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 4 })).toBe(false);
    });

    it('should prevent moving to a square occupied by a friendly piece', () => {
      const board = createEmptyBoard();
      board[4][4] = { id: 'p1', type: 'Pawn', player: 'Sente' };
      board[3][4] = { id: 'p2', type: 'Pawn', player: 'Sente' };
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(false);
    });

    it('should allow moving to a square occupied by an enemy piece (capture)', () => {
      const board = createEmptyBoard();
      board[4][4] = { id: 'p1', type: 'Pawn', player: 'Sente' };
      board[3][4] = { id: 'p2', type: 'Pawn', player: 'Gote' };
      expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(true);
    });

    describe('Pawn (歩)', () => {
      it('should move 1 step forward only', () => {
        const board = createEmptyBoard();
        
        // Sente Pawn: forward is up (dy = -1)
        board[4][4] = { id: 'p1', type: 'Pawn', player: 'Sente' };
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(true);
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 5 })).toBe(false); // backward
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 4 })).toBe(false); // left
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 4 })).toBe(false); // right
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 3 })).toBe(false); // diagonal forward left

        // Gote Pawn: forward is down (dy = +1)
        board[4][4] = { id: 'p2', type: 'Pawn', player: 'Gote' };
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 5 })).toBe(true);
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(false); // backward
      });
    });

    describe('Lance (香車)', () => {
      it('should move forward any number of squares in a straight line', () => {
        const board = createEmptyBoard();
        
        // Sente Lance
        board[6][4] = { id: 'l1', type: 'Lance', player: 'Sente' };
        expect(isValidMove(board, { x: 4, y: 6 }, { x: 4, y: 3 })).toBe(true);
        expect(isValidMove(board, { x: 4, y: 6 }, { x: 4, y: 0 })).toBe(true);
        expect(isValidMove(board, { x: 4, y: 6 }, { x: 4, y: 7 })).toBe(false); // backward
        expect(isValidMove(board, { x: 4, y: 6 }, { x: 3, y: 6 })).toBe(false); // sideways
        expect(isValidMove(board, { x: 4, y: 6 }, { x: 3, y: 5 })).toBe(false); // diagonal

        // Gote Lance
        board[2][4] = { id: 'l2', type: 'Lance', player: 'Gote' };
        expect(isValidMove(board, { x: 4, y: 2 }, { x: 4, y: 5 })).toBe(true);
        expect(isValidMove(board, { x: 4, y: 2 }, { x: 4, y: 1 })).toBe(false); // backward
      });

      it('should be blocked by obstacles', () => {
        const board = createEmptyBoard();
        board[6][4] = { id: 'l1', type: 'Lance', player: 'Sente' };
        board[3][4] = { id: 'obs', type: 'Pawn', player: 'Gote' }; // Opponent piece at y=3

        expect(isValidMove(board, { x: 4, y: 6 }, { x: 4, y: 4 })).toBe(true); // space before obstacle is clear
        expect(isValidMove(board, { x: 4, y: 6 }, { x: 4, y: 3 })).toBe(true); // can capture obstacle
        expect(isValidMove(board, { x: 4, y: 6 }, { x: 4, y: 2 })).toBe(false); // cannot jump over
      });
    });

    describe('Knight (桂馬)', () => {
      it('should move forward 2 squares and 1 square sideways', () => {
        const board = createEmptyBoard();

        // Sente Knight: dy = -2, dx = ±1
        board[4][4] = { id: 'n1', type: 'Knight', player: 'Sente' };
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 2 })).toBe(true);
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 2 })).toBe(true);
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 2 })).toBe(false); // straight forward 2
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 2, y: 3 })).toBe(false); // dx = -2, dy = -1 (wrong L-shape)
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 6 })).toBe(false); // backward-sideways

        // Gote Knight: dy = 2, dx = ±1
        board[4][4] = { id: 'n2', type: 'Knight', player: 'Gote' };
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 6 })).toBe(true);
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 6 })).toBe(true);
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 2 })).toBe(false);
      });

      it('should be able to jump over obstacles', () => {
        const board = createEmptyBoard();
        board[4][4] = { id: 'n1', type: 'Knight', player: 'Sente' };
        // Place obstacles in front
        board[3][4] = { id: 'o1', type: 'Pawn', player: 'Sente' };
        board[3][3] = { id: 'o2', type: 'Pawn', player: 'Gote' };
        board[3][5] = { id: 'o3', type: 'Pawn', player: 'Sente' };

        // Should still be able to jump to (3,2) and (5,2)
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 2 })).toBe(true);
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 2 })).toBe(true);
      });
    });

    describe('Silver (銀将)', () => {
      it('should move 1 step in 5 directions: forward, and 4 diagonals', () => {
        const board = createEmptyBoard();
        
        // Sente Silver
        board[4][4] = { id: 's1', type: 'Silver', player: 'Sente' };
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(true); // forward
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 3 })).toBe(true); // diag forward left
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 3 })).toBe(true); // diag forward right
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 5 })).toBe(true); // diag backward left
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 5 })).toBe(true); // diag backward right
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 5 })).toBe(false); // straight backward
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 4 })).toBe(false); // left
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 4 })).toBe(false); // right

        // Gote Silver
        board[4][4] = { id: 's2', type: 'Silver', player: 'Gote' };
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 5 })).toBe(true); // forward (down)
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(false); // backward (up)
      });
    });

    describe('Gold and Promoted pieces (金将、と金、成香、成桂、成銀)', () => {
      it('should move 1 step in 6 directions: 4 orthogonal, and 2 forward diagonals', () => {
        const board = createEmptyBoard();
        const goldTypes: ('Gold' | 'PromotedPawn' | 'PromotedLance' | 'PromotedKnight' | 'PromotedSilver')[] = [
          'Gold', 'PromotedPawn', 'PromotedLance', 'PromotedKnight', 'PromotedSilver'
        ];

        goldTypes.forEach((type) => {
          // Sente
          board[4][4] = { id: `${type}-s`, type, player: 'Sente' };
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(true); // forward
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 3 })).toBe(true); // diag forward left
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 3 })).toBe(true); // diag forward right
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 4 })).toBe(true); // left
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 4 })).toBe(true); // right
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 5 })).toBe(true); // backward
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 5 })).toBe(false); // diag backward left
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 5 })).toBe(false); // diag backward right

          // Gote
          board[4][4] = { id: `${type}-g`, type, player: 'Gote' };
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 5 })).toBe(true); // forward (down)
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 5 })).toBe(true); // diag forward left (down-left)
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 5 })).toBe(true); // diag forward right (down-right)
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(true); // backward (up)
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 3 })).toBe(false); // diag backward left (up-left)
        });
      });
    });

    describe('King (玉将)', () => {
      it('should move 1 step in all 8 directions', () => {
        const board = createEmptyBoard();
        board[4][4] = { id: 'k1', type: 'King', player: 'Sente' };

        const directions = [
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
          { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];

        directions.forEach(({ dx, dy }) => {
          expect(isValidMove(board, { x: 4, y: 4 }, { x: 4 + dx, y: 4 + dy })).toBe(true);
        });

        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 2 })).toBe(false); // 2 steps
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 6, y: 4 })).toBe(false); // 2 steps
      });
    });

    describe('Bishop (角行)', () => {
      it('should slide diagonally in 4 directions', () => {
        const board = createEmptyBoard();
        board[4][4] = { id: 'b1', type: 'Bishop', player: 'Sente' };

        expect(isValidMove(board, { x: 4, y: 4 }, { x: 7, y: 1 })).toBe(true); // top-right
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 1, y: 1 })).toBe(true); // top-left
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 7, y: 7 })).toBe(true); // bottom-right
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 1, y: 7 })).toBe(true); // bottom-left

        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 1 })).toBe(false); // straight up
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 2 })).toBe(false); // not diagonal
      });

      it('should be blocked by obstacles', () => {
        const board = createEmptyBoard();
        board[4][4] = { id: 'b1', type: 'Bishop', player: 'Sente' };
        board[2][2] = { id: 'o1', type: 'Pawn', player: 'Gote' }; // Enemy at (2,2)

        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 3 })).toBe(true); // path clear
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 2, y: 2 })).toBe(true); // can capture enemy
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 1, y: 1 })).toBe(false); // blocked
      });
    });

    describe('Rook (飛車)', () => {
      it('should slide orthogonally in 4 directions', () => {
        const board = createEmptyBoard();
        board[4][4] = { id: 'r1', type: 'Rook', player: 'Sente' };

        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 0 })).toBe(true); // up
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 8 })).toBe(true); // down
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 0, y: 4 })).toBe(true); // left
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 8, y: 4 })).toBe(true); // right

        expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 5 })).toBe(false); // diagonal
      });

      it('should be blocked by obstacles', () => {
        const board = createEmptyBoard();
        board[4][4] = { id: 'r1', type: 'Rook', player: 'Sente' };
        board[2][4] = { id: 'o1', type: 'Pawn', player: 'Sente' }; // Friendly at (4,2)

        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(true); // path clear
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 2 })).toBe(false); // cannot capture friendly
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 1 })).toBe(false); // blocked
      });
    });

    describe('Promoted Bishop / Dragon Horse (竜馬)', () => {
      it('should slide diagonally AND move 1 step orthogonally', () => {
        const board = createEmptyBoard();
        board[4][4] = { id: 'pb1', type: 'PromotedBishop', player: 'Sente' };

        // Slide diagonally
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 1, y: 1 })).toBe(true);
        // 1 step orthogonal
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 3 })).toBe(true); // 1 step up
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 4 })).toBe(true); // 1 step left
        
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 2 })).toBe(false); // 2 steps orthogonal
      });
    });

    describe('Promoted Rook / Dragon (竜王)', () => {
      it('should slide orthogonally AND move 1 step diagonally', () => {
        const board = createEmptyBoard();
        board[4][4] = { id: 'pr1', type: 'PromotedRook', player: 'Sente' };

        // Slide orthogonally
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 4, y: 1 })).toBe(true);
        // 1 step diagonal
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 3, y: 3 })).toBe(true); // 1 step top-left
        expect(isValidMove(board, { x: 4, y: 4 }, { x: 5, y: 5 })).toBe(true); // 1 step bottom-right

        expect(isValidMove(board, { x: 4, y: 4 }, { x: 2, y: 2 })).toBe(false); // 2 steps diagonal
      });
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

      // Gote counterparts
      const gotePawn: Piece = { id: 'gp1', type: 'Pawn', player: 'Gote' };
      const goteKnight: Piece = { id: 'gn1', type: 'Knight', player: 'Gote' };
      expect(mustPromote(gotePawn, { x: 4, y: 8 })).toBe(true);
      expect(mustPromote(goteKnight, { x: 4, y: 7 })).toBe(true);
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
      expect(isValidDrop(board, 'Lance', 'Gote', { x: 0, y: 8 })).toBe(false); // Gote Lance at Gote back row
      expect(isValidDrop(board, 'Knight', 'Gote', { x: 0, y: 7 })).toBe(false); // Gote Knight at 2nd back row
    });
  });
});
