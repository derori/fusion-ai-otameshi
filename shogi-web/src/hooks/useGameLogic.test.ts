import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameLogic } from './useGameLogic';
import type { Position } from '../types/shogi';

describe('useGameLogic', () => {
  describe('Initial state', () => {
    it('should initialize with Sente turn', () => {
      const { result } = renderHook(() => useGameLogic());
      expect(result.current.gameState.turn).toBe('Sente');
    });

    it('should initialize with no selected square', () => {
      const { result } = renderHook(() => useGameLogic());
      expect(result.current.gameState.selectedSquare).toBeNull();
    });

    it('should initialize with empty captured pieces', () => {
      const { result } = renderHook(() => useGameLogic());
      expect(result.current.gameState.captured.Sente).toEqual([]);
      expect(result.current.gameState.captured.Gote).toEqual([]);
    });

    it('should initialize with a 9x9 board', () => {
      const { result } = renderHook(() => useGameLogic());
      expect(result.current.gameState.board).toHaveLength(9);
      result.current.gameState.board.forEach((row) => {
        expect(row).toHaveLength(9);
      });
    });

    it('should initialize cursor at (4, 8)', () => {
      const { result } = renderHook(() => useGameLogic());
      expect(result.current.gameState.cursor).toEqual({ x: 4, y: 8 });
    });
  });

  describe('Selecting a piece', () => {
    it('should select a Sente piece on click', () => {
      const { result } = renderHook(() => useGameLogic());
      // Sente pieces are at the bottom (y=6,7,8) in standard initial position
      const pos: Position = { x: 4, y: 6 }; // Sente Pawn

      act(() => {
        result.current.handleSquareClick(pos);
      });

      expect(result.current.gameState.selectedSquare).toEqual(pos);
    });

    it('should not select an empty square', () => {
      const { result } = renderHook(() => useGameLogic());
      // Middle of the board should be empty
      const pos: Position = { x: 4, y: 4 };

      act(() => {
        result.current.handleSquareClick(pos);
      });

      expect(result.current.gameState.selectedSquare).toBeNull();
    });

    it('should not select an opponent piece when it is Sente turn', () => {
      const { result } = renderHook(() => useGameLogic());
      // Gote pieces at top (y=0,1,2)
      const pos: Position = { x: 4, y: 2 }; // Gote Pawn

      act(() => {
        result.current.handleSquareClick(pos);
      });

      expect(result.current.gameState.selectedSquare).toBeNull();
      expect(result.current.gameState.turn).toBe('Sente');
    });
  });

  describe('Deselecting / Reselecting', () => {
    it('should deselect when clicking the same square again', () => {
      const { result } = renderHook(() => useGameLogic());
      const pos: Position = { x: 4, y: 6 };

      act(() => {
        result.current.handleSquareClick(pos);
      });
      expect(result.current.gameState.selectedSquare).toEqual(pos);

      act(() => {
        result.current.handleSquareClick(pos);
      });
      expect(result.current.gameState.selectedSquare).toBeNull();
    });

    it('should reselect when clicking another of own pieces', () => {
      const { result } = renderHook(() => useGameLogic());
      const firstPos: Position = { x: 4, y: 6 };
      const secondPos: Position = { x: 3, y: 6 };

      act(() => {
        result.current.handleSquareClick(firstPos);
      });
      expect(result.current.gameState.selectedSquare).toEqual(firstPos);

      act(() => {
        result.current.handleSquareClick(secondPos);
      });
      expect(result.current.gameState.selectedSquare).toEqual(secondPos);
    });
  });

  describe('Moving a piece', () => {
    it('should move a piece to an empty square and switch turns if valid', () => {
      const { result } = renderHook(() => useGameLogic());
      const from: Position = { x: 4, y: 6 }; // Sente Pawn
      const to: Position = { x: 4, y: 5 };

      const pieceBefore = result.current.gameState.board[from.y][from.x];

      act(() => {
        result.current.handleSquareClick(from);
      });
      act(() => {
        result.current.handleSquareClick(to);
      });

      expect(result.current.gameState.board[to.y][to.x]).toEqual(pieceBefore);
      expect(result.current.gameState.board[from.y][from.x]).toBeNull();
      expect(result.current.gameState.turn).toBe('Gote');
      expect(result.current.gameState.selectedSquare).toBeNull();
    });

    it('should not move a piece if the movement is invalid', () => {
      const { result } = renderHook(() => useGameLogic());
      const from: Position = { x: 4, y: 6 }; // Sente Pawn
      const to: Position = { x: 4, y: 4 }; // 2 steps (invalid)

      const pieceBefore = result.current.gameState.board[from.y][from.x];

      act(() => {
        result.current.handleSquareClick(from);
      });
      act(() => {
        result.current.handleSquareClick(to);
      });

      // No change to piece positions, same turn, selection remains
      expect(result.current.gameState.board[from.y][from.x]).toEqual(pieceBefore);
      expect(result.current.gameState.board[to.y][to.x]).toBeNull();
      expect(result.current.gameState.turn).toBe('Sente');
      expect(result.current.gameState.selectedSquare).toEqual(from);
    });

    it('should not add to captured when moving to empty square', () => {
      const { result } = renderHook(() => useGameLogic());
      const from: Position = { x: 4, y: 6 };
      const to: Position = { x: 4, y: 5 };

      act(() => {
        result.current.handleSquareClick(from);
      });
      act(() => {
        result.current.handleSquareClick(to);
      });

      expect(result.current.gameState.captured.Sente).toEqual([]);
      expect(result.current.gameState.captured.Gote).toEqual([]);
    });
  });

  describe('Capturing a piece', () => {
    it('should capture an opponent piece and add it to captured list', () => {
      const { result } = renderHook(() => useGameLogic());
      
      // 1. Sente moves Pawn from (4,6) to (4,5)
      act(() => { result.current.handleSquareClick({ x: 4, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });

      // 2. Gote moves Pawn from (4,2) to (4,3)
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });

      // 3. Sente moves Pawn from (4,5) to (4,4)
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });

      // 4. Gote moves another Pawn from (3,2) to (3,3) to pass turn without capturing
      act(() => { result.current.handleSquareClick({ x: 3, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 3 }); });

      // 5. Sente captures Gote Pawn at (4,3) from (4,4)
      const from: Position = { x: 4, y: 4 };
      const to: Position = { x: 4, y: 3 };

      const capturedPieceOriginal = result.current.gameState.board[to.y][to.x];
      expect(capturedPieceOriginal).not.toBeNull();

      const movingPiece = result.current.gameState.board[from.y][from.x];

      act(() => {
        result.current.handleSquareClick(from);
      });
      act(() => {
        result.current.handleSquareClick(to);
      });

      expect(result.current.gameState.board[to.y][to.x]).toEqual(movingPiece);
      expect(result.current.gameState.board[from.y][from.x]).toBeNull();
      expect(result.current.gameState.captured.Sente).toHaveLength(1);
      expect(result.current.gameState.captured.Sente[0]).toBe(capturedPieceOriginal!.type);
      expect(result.current.gameState.turn).toBe('Gote');
    });

    it('should switch turns and allow Gote to capture on their turn', () => {
      const { result } = renderHook(() => useGameLogic());

      // 1. Sente moves Pawn from (4,6) to (4,5)
      act(() => {
        result.current.handleSquareClick({ x: 4, y: 6 });
      });
      act(() => {
        result.current.handleSquareClick({ x: 4, y: 5 });
      });

      expect(result.current.gameState.turn).toBe('Gote');

      // Gote tries to select Sente piece - should fail (because it's Gote's turn)
      act(() => {
        result.current.handleSquareClick({ x: 3, y: 6 });
      });
      expect(result.current.gameState.selectedSquare).toBeNull();

      // 2. Gote moves Pawn from (4,2) to (4,3)
      act(() => {
        result.current.handleSquareClick({ x: 4, y: 2 });
      });
      act(() => {
        result.current.handleSquareClick({ x: 4, y: 3 });
      });

      expect(result.current.gameState.turn).toBe('Sente');

      // 3. Sente moves Pawn from (4,5) to (4,4)
      act(() => {
        result.current.handleSquareClick({ x: 4, y: 5 });
      });
      act(() => {
        result.current.handleSquareClick({ x: 4, y: 4 });
      });

      expect(result.current.gameState.turn).toBe('Gote');

      // 4. Gote selects own piece at (4,3) and captures Sente Pawn at (4,4)
      act(() => {
        result.current.handleSquareClick({ x: 4, y: 3 });
      });
      expect(result.current.gameState.selectedSquare).toEqual({ x: 4, y: 3 });

      act(() => {
        result.current.handleSquareClick({ x: 4, y: 4 });
      });

      expect(result.current.gameState.captured.Gote).toHaveLength(1);
      expect(result.current.gameState.captured.Gote[0]).toBe('Pawn');
      expect(result.current.gameState.turn).toBe('Sente');
    });
  });

  describe('Promotion', () => {
    it('should promote a piece if the user confirms', () => {
      const confirmMock = vi.fn(() => true);
      vi.stubGlobal('confirm', confirmMock);

      const { result } = renderHook(() => useGameLogic());

      // 1. Sente Pawn (4,6) -> (4,5)
      act(() => { result.current.handleSquareClick({ x: 4, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });

      // 2. Gote Pawn (4,2) -> (4,3)
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });

      // 3. Sente Pawn (4,5) -> (4,4)
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });

      // 4. Gote Pawn (3,2) -> (3,3)
      act(() => { result.current.handleSquareClick({ x: 3, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 3 }); });

      // 5. Sente captures Gote Pawn at (4,3)
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });

      // 6. Gote Pawn (2,2) -> (2,3)
      act(() => { result.current.handleSquareClick({ x: 2, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 2, y: 3 }); });

      // 7. Sente Pawn (4,3) -> (4,2) [Moves into promotion zone!]
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });

      expect(confirmMock).toHaveBeenCalled();
      expect(result.current.gameState.board[2][4]?.type).toBe('PromotedPawn');
      
      vi.unstubAllGlobals();
    });

    it('should not promote a piece if the user cancels', () => {
      const confirmMock = vi.fn(() => false);
      vi.stubGlobal('confirm', confirmMock);

      const { result } = renderHook(() => useGameLogic());

      // 1. Sente Pawn (4,6) -> (4,5)
      act(() => { result.current.handleSquareClick({ x: 4, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });

      // 2. Gote Pawn (4,2) -> (4,3)
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });

      // 3. Sente Pawn (4,5) -> (4,4)
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });

      // 4. Gote Pawn (3,2) -> (3,3)
      act(() => { result.current.handleSquareClick({ x: 3, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 3 }); });

      // 5. Sente captures Gote Pawn at (4,3)
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });

      // 6. Gote Pawn (2,2) -> (2,3)
      act(() => { result.current.handleSquareClick({ x: 2, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 2, y: 3 }); });

      // 7. Sente Pawn (4,3) -> (4,2) [Moves into promotion zone!]
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });

      expect(confirmMock).toHaveBeenCalled();
      expect(result.current.gameState.board[2][4]?.type).toBe('Pawn');
      
      vi.unstubAllGlobals();
    });

    it('should automatically promote if mustPromote is met', () => {
      const confirmMock = vi.fn(() => false);
      vi.stubGlobal('confirm', confirmMock);

      const { result } = renderHook(() => useGameLogic());

      // 1. Sente Pawn (4,6) -> (4,5)
      act(() => { result.current.handleSquareClick({ x: 4, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });

      // 2. Gote Pawn (4,2) -> (4,3)
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });

      // 3. Sente Pawn (4,5) -> (4,4)
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });

      // 4. Gote Pawn (3,2) -> (3,3)
      act(() => { result.current.handleSquareClick({ x: 3, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 3 }); });

      // 5. Sente captures Gote Pawn at (4,3)
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });

      // 6. Gote Pawn (2,2) -> (2,3)
      act(() => { result.current.handleSquareClick({ x: 2, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 2, y: 3 }); });

      // 7. Sente Pawn (4,3) -> (4,2) [Moves into promotion zone, user cancels promotion]
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });

      // 8. Gote Pawn (1,2) -> (1,3)
      act(() => { result.current.handleSquareClick({ x: 1, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 1, y: 3 }); });

      // 9. Sente Pawn (4,2) -> (4,1) [Moves forward, user cancels promotion]
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 1 }); });

      // 10. Gote Pawn (0,2) -> (0,3)
      act(() => { result.current.handleSquareClick({ x: 0, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });

      confirmMock.mockClear();

      // 11. Sente Pawn (4,1) -> (4,0) [Reaches back row, must promote!]
      act(() => { result.current.handleSquareClick({ x: 4, y: 1 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 0 }); });

      expect(confirmMock).not.toHaveBeenCalled();
      expect(result.current.gameState.board[0][4]?.type).toBe('PromotedPawn');

      vi.unstubAllGlobals();
    });
  });

  describe('Captured pieces selection and dropping', () => {
    it('should allow active player to select and toggle deselect own captured piece', () => {
      const { result } = renderHook(() => useGameLogic());

      // Setup: Sente captures a Gote Pawn
      act(() => { result.current.handleSquareClick({ x: 4, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); }); // Capture Gote Pawn

      expect(result.current.gameState.captured.Sente).toEqual(['Pawn']);
      expect(result.current.gameState.turn).toBe('Gote');

      // Gote passes turn to make it Sente's turn again
      act(() => { result.current.handleSquareClick({ x: 2, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 2, y: 3 }); });
      expect(result.current.gameState.turn).toBe('Sente');

      // 1. Gote tries to click Sente's captured piece - should do nothing (not Gote's turn, not Gote's piece)
      act(() => {
        result.current.handleCapturedPieceClick('Sente', 'Pawn', 0);
      });
      // Sente's turn, so Sente CAN select it. Gote clicking as Sente works because we specify the player argument.
      // But let's verify clicking as Sente:
      expect(result.current.gameState.selectedCapturedPiece).toEqual({
        player: 'Sente',
        type: 'Pawn',
        index: 0,
      });

      // 2. Toggle deselecting
      act(() => {
        result.current.handleCapturedPieceClick('Sente', 'Pawn', 0);
      });
      expect(result.current.gameState.selectedCapturedPiece).toBeNull();
    });

    it('should prevent selecting opponent captured pieces or when not our turn', () => {
      const { result } = renderHook(() => useGameLogic());

      // Sente captures a Gote Pawn
      act(() => { result.current.handleSquareClick({ x: 4, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); }); // Sente captures

      expect(result.current.gameState.turn).toBe('Gote');

      // Gote tries to select Sente's captured Pawn (turn is Gote, but piece is Sente's)
      act(() => {
        result.current.handleCapturedPieceClick('Sente', 'Pawn', 0);
      });
      expect(result.current.gameState.selectedCapturedPiece).toBeNull(); // Blocked because player !== turn
    });

    it('should drop a captured piece and remove from list', () => {
      const confirmMock = vi.fn(() => true);
      vi.stubGlobal('confirm', confirmMock);

      const { result } = renderHook(() => useGameLogic());

      // Sente captures a Pawn
      act(() => { result.current.handleSquareClick({ x: 4, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); }); // Sente Captures Gote Pawn

      expect(result.current.gameState.captured.Sente).toEqual(['Pawn']);
      expect(result.current.gameState.turn).toBe('Gote');

      // Gote passes turn to Sente
      act(() => { result.current.handleSquareClick({ x: 2, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 2, y: 3 }); });
      expect(result.current.gameState.turn).toBe('Sente');

      // Sente moves Pawn from (4,3) to (4,2) to promote it!
      // This frees Column 4 of unpromoted Sente Pawns.
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });
      expect(result.current.gameState.board[2][4]?.type).toBe('PromotedPawn');
      expect(result.current.gameState.turn).toBe('Gote');

      // Gote passes turn to Sente
      act(() => { result.current.handleSquareClick({ x: 1, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 1, y: 3 }); });
      expect(result.current.gameState.turn).toBe('Sente');

      // Select captured pawn
      act(() => {
        result.current.handleCapturedPieceClick('Sente', 'Pawn', 0);
      });

      // Drop on (4, 5) which is now empty and has no unpromoted Sente Pawns
      act(() => {
        result.current.handleSquareClick({ x: 4, y: 5 });
      });

      expect(result.current.gameState.board[5][4]?.type).toBe('Pawn');
      expect(result.current.gameState.board[5][4]?.player).toBe('Sente');
      expect(result.current.gameState.captured.Sente).toEqual([]);
      expect(result.current.gameState.selectedCapturedPiece).toBeNull();
      expect(result.current.gameState.turn).toBe('Gote');

      vi.unstubAllGlobals();
    });

    it('should prevent invalid drops (e.g. Nihfu) and retain selection', () => {
      const { result } = renderHook(() => useGameLogic());

      // Sente captures a Pawn
      act(() => { result.current.handleSquareClick({ x: 4, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); }); // Pawn still on column 4!
      act(() => { result.current.handleSquareClick({ x: 3, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); }); // Captures Pawn

      // Gote passes turn
      act(() => { result.current.handleSquareClick({ x: 2, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 2, y: 3 }); });

      // Select captured pawn
      act(() => {
        result.current.handleCapturedPieceClick('Sente', 'Pawn', 0);
      });

      // Try to drop on column 4 (e.g., (4,5)). Sente already has an unpromoted Pawn at (4,3)
      act(() => {
        result.current.handleSquareClick({ x: 4, y: 5 });
      });

      // Drop fails! Board is empty at (4,5), captured list is unchanged, selection is retained
      expect(result.current.gameState.board[5][4]).toBeNull();
      expect(result.current.gameState.captured.Sente).toEqual(['Pawn']);
      expect(result.current.gameState.selectedCapturedPiece).toEqual({
        player: 'Sente',
        type: 'Pawn',
        index: 0,
      });
      expect(result.current.gameState.turn).toBe('Sente');
    });
  });

  describe('Keyboard Controls', () => {
    it('should move the cursor with arrow keys', () => {
      const { result } = renderHook(() => useGameLogic());
      expect(result.current.gameState.cursor).toEqual({ x: 4, y: 8 });

      // Move Up
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowUp' } as React.KeyboardEvent);
      });
      expect(result.current.gameState.cursor).toEqual({ x: 4, y: 7 });

      // Move Left
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowLeft' } as React.KeyboardEvent);
      });
      expect(result.current.gameState.cursor).toEqual({ x: 3, y: 7 });

      // Move Right
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowRight' } as React.KeyboardEvent);
      });
      expect(result.current.gameState.cursor).toEqual({ x: 4, y: 7 });

      // Move Down
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowDown' } as React.KeyboardEvent);
      });
      expect(result.current.gameState.cursor).toEqual({ x: 4, y: 8 });
    });

    it('should respect boundaries when moving cursor', () => {
      const { result } = renderHook(() => useGameLogic());
      expect(result.current.gameState.cursor).toEqual({ x: 4, y: 8 });

      // Move down from bottom edge - should stay at y=8
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowDown' } as React.KeyboardEvent);
      });
      expect(result.current.gameState.cursor).toEqual({ x: 4, y: 8 });

      // Move right repeatedly to the edge (x=8)
      for (let i = 0; i < 6; i++) {
        act(() => {
          result.current.handleKeyDown({ key: 'ArrowRight' } as React.KeyboardEvent);
        });
      }
      expect(result.current.gameState.cursor).toEqual({ x: 8, y: 8 });

      // Move right again - should stay at x=8
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowRight' } as React.KeyboardEvent);
      });
      expect(result.current.gameState.cursor).toEqual({ x: 8, y: 8 });
    });

    it('should select and move pieces using Enter and Space keys', () => {
      const { result } = renderHook(() => useGameLogic());

      // Move cursor to Sente Pawn at (4,6)
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowUp' } as React.KeyboardEvent); // y=7
      });
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowUp' } as React.KeyboardEvent); // y=6
      });
      expect(result.current.gameState.cursor).toEqual({ x: 4, y: 6 });

      // Press Enter to select
      act(() => {
        result.current.handleKeyDown({ key: 'Enter' } as React.KeyboardEvent);
      });
      expect(result.current.gameState.selectedSquare).toEqual({ x: 4, y: 6 });

      // Move cursor to empty square at (4,5)
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowUp' } as React.KeyboardEvent); // y=5
      });
      expect(result.current.gameState.cursor).toEqual({ x: 4, y: 5 });

      // Press Space to move
      act(() => {
        result.current.handleKeyDown({ key: ' ' } as React.KeyboardEvent);
      });

      expect(result.current.gameState.board[5][4]?.type).toBe('Pawn');
      expect(result.current.gameState.board[6][4]).toBeNull();
      expect(result.current.gameState.turn).toBe('Gote');
    });
  });

  describe('Game over and lock state', () => {
    it('should determine a winner, block all inputs, and reset upon restart', () => {
      const { result } = renderHook(() => useGameLogic());
      expect(result.current.gameState.winner).toBeNull();

      // Directly manipulate the board state to set up a quick win
      const board = result.current.gameState.board;
      // Clear vertical column for Sente Rook at (7,7)
      board[6][7] = null;
      // Put Gote King at (7,5)
      board[5][7] = { id: 'Gote-King-Test', type: 'King', player: 'Gote' };

      // Sente Rook captures Gote King!
      act(() => { result.current.handleSquareClick({ x: 7, y: 7 }); });
      act(() => { result.current.handleSquareClick({ x: 7, y: 5 }); });

      expect(result.current.gameState.winner).toBe('Sente');

      // Clicking on board should be blocked
      act(() => { result.current.handleSquareClick({ x: 4, y: 6 }); });
      expect(result.current.gameState.selectedSquare).toBeNull();

      // Keydowns should be blocked (cursor does not move)
      const cursorBefore = result.current.gameState.cursor;
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowUp' } as React.KeyboardEvent);
      });
      expect(result.current.gameState.cursor).toEqual(cursorBefore);

      // Clicks on captured pieces should be blocked
      act(() => {
        result.current.handleCapturedPieceClick('Sente', 'Pawn', 0);
      });
      expect(result.current.gameState.selectedCapturedPiece).toBeNull();

      // Reset match
      act(() => {
        result.current.handleRestart();
      });

      expect(result.current.gameState.winner).toBeNull();
      expect(result.current.gameState.turn).toBe('Sente');
    });
  });
});
