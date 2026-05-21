import { describe, it, expect } from 'vitest';
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
  });

  describe('Selecting a piece', () => {
    it('should select a Sente piece on click', () => {
      const { result } = renderHook(() => useGameLogic());
      // Sente pieces are at the bottom (y=6,7,8) in standard initial position
      const pos: Position = { x: 0, y: 6 };

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
      const pos: Position = { x: 0, y: 2 };

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
      const pos: Position = { x: 0, y: 6 };

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
      const firstPos: Position = { x: 0, y: 6 };
      const secondPos: Position = { x: 1, y: 6 };

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
    it('should move a piece to an empty square and switch turns', () => {
      const { result } = renderHook(() => useGameLogic());
      const from: Position = { x: 0, y: 6 };
      const to: Position = { x: 0, y: 5 };

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

    it('should not add to captured when moving to empty square', () => {
      const { result } = renderHook(() => useGameLogic());
      const from: Position = { x: 0, y: 6 };
      const to: Position = { x: 0, y: 5 };

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
      
      // 1. Sente moves Pawn from (0,6) to (0,5)
      act(() => { result.current.handleSquareClick({ x: 0, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 5 }); });

      // 2. Gote moves Pawn from (0,2) to (0,3)
      act(() => { result.current.handleSquareClick({ x: 0, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });

      // 3. Sente moves Pawn from (0,5) to (0,4)
      act(() => { result.current.handleSquareClick({ x: 0, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 4 }); });

      // 4. Gote moves another Pawn from (1,2) to (1,3) to pass turn without capturing
      act(() => { result.current.handleSquareClick({ x: 1, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 1, y: 3 }); });

      // 5. Sente captures Gote Pawn at (0,3) from (0,4)
      const from: Position = { x: 0, y: 4 };
      const to: Position = { x: 0, y: 3 };

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

      // 1. Sente moves Pawn from (0,6) to (0,5)
      act(() => {
        result.current.handleSquareClick({ x: 0, y: 6 });
      });
      act(() => {
        result.current.handleSquareClick({ x: 0, y: 5 });
      });

      expect(result.current.gameState.turn).toBe('Gote');

      // Gote tries to select Sente piece - should fail (because it's Gote's turn)
      act(() => {
        result.current.handleSquareClick({ x: 1, y: 6 });
      });
      expect(result.current.gameState.selectedSquare).toBeNull();

      // 2. Gote moves Pawn from (0,2) to (0,3)
      act(() => {
        result.current.handleSquareClick({ x: 0, y: 2 });
      });
      act(() => {
        result.current.handleSquareClick({ x: 0, y: 3 });
      });

      expect(result.current.gameState.turn).toBe('Sente');

      // 3. Sente moves Pawn from (0,5) to (0,4)
      act(() => {
        result.current.handleSquareClick({ x: 0, y: 5 });
      });
      act(() => {
        result.current.handleSquareClick({ x: 0, y: 4 });
      });

      expect(result.current.gameState.turn).toBe('Gote');

      // 4. Gote selects own piece at (0,3) and captures Sente Pawn at (0,4)
      act(() => {
        result.current.handleSquareClick({ x: 0, y: 3 });
      });
      expect(result.current.gameState.selectedSquare).toEqual({ x: 0, y: 3 });

      act(() => {
        result.current.handleSquareClick({ x: 0, y: 4 });
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

      // 1. Sente Pawn (0,6) -> (0,5)
      act(() => { result.current.handleSquareClick({ x: 0, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 5 }); });

      // 2. Gote Pawn (0,2) -> (0,3)
      act(() => { result.current.handleSquareClick({ x: 0, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });

      // 3. Sente Pawn (0,5) -> (0,4)
      act(() => { result.current.handleSquareClick({ x: 0, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 4 }); });

      // 4. Gote Pawn (1,2) -> (1,3)
      act(() => { result.current.handleSquareClick({ x: 1, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 1, y: 3 }); });

      // 5. Sente captures Gote Pawn at (0,3)
      act(() => { result.current.handleSquareClick({ x: 0, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });

      // 6. Gote Pawn (2,2) -> (2,3)
      act(() => { result.current.handleSquareClick({ x: 2, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 2, y: 3 }); });

      // 7. Sente Pawn (0,3) -> (0,2) [Moves into promotion zone!]
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 2 }); });

      expect(confirmMock).toHaveBeenCalled();
      expect(result.current.gameState.board[2][0]?.type).toBe('PromotedPawn');
      
      vi.unstubAllGlobals();
    });

    it('should not promote a piece if the user cancels', () => {
      const confirmMock = vi.fn(() => false);
      vi.stubGlobal('confirm', confirmMock);

      const { result } = renderHook(() => useGameLogic());

      // 1. Sente Pawn (0,6) -> (0,5)
      act(() => { result.current.handleSquareClick({ x: 0, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 5 }); });

      // 2. Gote Pawn (0,2) -> (0,3)
      act(() => { result.current.handleSquareClick({ x: 0, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });

      // 3. Sente Pawn (0,5) -> (0,4)
      act(() => { result.current.handleSquareClick({ x: 0, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 4 }); });

      // 4. Gote Pawn (1,2) -> (1,3)
      act(() => { result.current.handleSquareClick({ x: 1, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 1, y: 3 }); });

      // 5. Sente captures Gote Pawn at (0,3)
      act(() => { result.current.handleSquareClick({ x: 0, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });

      // 6. Gote Pawn (2,2) -> (2,3)
      act(() => { result.current.handleSquareClick({ x: 2, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 2, y: 3 }); });

      // 7. Sente Pawn (0,3) -> (0,2) [Moves into promotion zone!]
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 2 }); });

      expect(confirmMock).toHaveBeenCalled();
      expect(result.current.gameState.board[2][0]?.type).toBe('Pawn');
      
      vi.unstubAllGlobals();
    });

    it('should automatically promote if mustPromote is met', () => {
      const confirmMock = vi.fn(() => false);
      vi.stubGlobal('confirm', confirmMock);

      const { result } = renderHook(() => useGameLogic());

      // 1. Sente Pawn (0,6) -> (0,5)
      act(() => { result.current.handleSquareClick({ x: 0, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 5 }); });

      // 2. Gote Pawn (0,2) -> (0,3)
      act(() => { result.current.handleSquareClick({ x: 0, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });

      // 3. Sente Pawn (0,5) -> (0,4)
      act(() => { result.current.handleSquareClick({ x: 0, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 4 }); });

      // 4. Gote Pawn (1,2) -> (1,3)
      act(() => { result.current.handleSquareClick({ x: 1, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 1, y: 3 }); });

      // 5. Sente captures Gote Pawn at (0,3)
      act(() => { result.current.handleSquareClick({ x: 0, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });

      // 6. Gote Pawn (2,2) -> (2,3)
      act(() => { result.current.handleSquareClick({ x: 2, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 2, y: 3 }); });

      // 7. Sente Pawn (0,3) -> (0,2) [Moves into promotion zone, user cancels promotion]
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 2 }); });

      // 8. Gote Pawn (3,2) -> (3,3)
      act(() => { result.current.handleSquareClick({ x: 3, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 3 }); });

      // 9. Sente Pawn (0,2) -> (0,1) [Moves forward, user cancels promotion]
      act(() => { result.current.handleSquareClick({ x: 0, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 1 }); });

      // 10. Gote Pawn (4,2) -> (4,3)
      act(() => { result.current.handleSquareClick({ x: 4, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 4, y: 3 }); });

      confirmMock.mockClear();

      // 11. Sente Pawn (0,1) -> (0,0) [Reaches back row, must promote!]
      act(() => { result.current.handleSquareClick({ x: 0, y: 1 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 0 }); });

      expect(confirmMock).not.toHaveBeenCalled();
      expect(result.current.gameState.board[0][0]?.type).toBe('PromotedPawn');

      vi.unstubAllGlobals();
    });
  });

  describe('Dropping captured pieces', () => {
    it('should drop a captured piece onto an empty square and update state', () => {
      vi.stubGlobal('confirm', vi.fn(() => true));

      const { result } = renderHook(() => useGameLogic());

      // 1. Sente Pawn (0,6) -> (0,5)
      act(() => { result.current.handleSquareClick({ x: 0, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 5 }); });

      // 2. Gote Pawn (0,2) -> (0,3)
      act(() => { result.current.handleSquareClick({ x: 0, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });

      // 3. Sente Pawn (0,5) -> (0,4)
      act(() => { result.current.handleSquareClick({ x: 0, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 4 }); });

      // 4. Gote Pawn (1,2) -> (1,3)
      act(() => { result.current.handleSquareClick({ x: 1, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 1, y: 3 }); });

      // 5. Sente captures Gote Pawn at (0,3)
      act(() => { result.current.handleSquareClick({ x: 0, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });

      expect(result.current.gameState.captured.Sente).toEqual(['Pawn']);

      // 6. Gote Pawn (2,2) -> (2,3)
      act(() => { result.current.handleSquareClick({ x: 2, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 2, y: 3 }); });

      // 7. Sente Pawn (0,3) -> (0,2) [Moves and promotes to PromotedPawn. Col 0 has NO unpromoted Sente Pawn now!]
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 2 }); });

      expect(result.current.gameState.board[2][0]?.type).toBe('PromotedPawn');

      // 8. Gote Pawn (3,2) -> (3,3)
      act(() => { result.current.handleSquareClick({ x: 3, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 3, y: 3 }); });

      // 9. Sente selects the captured Pawn (index 0)
      act(() => {
        result.current.handleCapturedPieceClick('Sente', 'Pawn', 0);
      });
      expect(result.current.gameState.selectedCapturedPiece).toEqual({
        player: 'Sente',
        type: 'Pawn',
        index: 0,
      });

      // Try to drop it at (0,5)
      act(() => {
        result.current.handleSquareClick({ x: 0, y: 5 });
      });

      // Drop succeeded!
      expect(result.current.gameState.board[5][0]?.type).toBe('Pawn');
      expect(result.current.gameState.board[5][0]?.player).toBe('Sente');
      expect(result.current.gameState.captured.Sente).toEqual([]);
      expect(result.current.gameState.selectedCapturedPiece).toBeNull();
      expect(result.current.gameState.turn).toBe('Gote');

      vi.unstubAllGlobals();
    });

    it('should prevent dropping due to Nihfu (二歩)', () => {
      const { result } = renderHook(() => useGameLogic());

      // 1. Sente Pawn (0,6) -> (0,5)
      act(() => { result.current.handleSquareClick({ x: 0, y: 6 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 5 }); });

      // 2. Gote Pawn (0,2) -> (0,3)
      act(() => { result.current.handleSquareClick({ x: 0, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); });

      // 3. Sente Pawn (0,5) -> (0,4)
      act(() => { result.current.handleSquareClick({ x: 0, y: 5 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 4 }); });

      // 4. Gote Pawn (1,2) -> (1,3)
      act(() => { result.current.handleSquareClick({ x: 1, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 1, y: 3 }); });

      // 5. Sente captures Gote Pawn at (0,3)
      act(() => { result.current.handleSquareClick({ x: 0, y: 4 }); });
      act(() => { result.current.handleSquareClick({ x: 0, y: 3 }); }); // Sente Pawn now at (0,3) [Unpromoted!]

      expect(result.current.gameState.captured.Sente).toEqual(['Pawn']);

      // 6. Gote Pawn (2,2) -> (2,3)
      act(() => { result.current.handleSquareClick({ x: 2, y: 2 }); });
      act(() => { result.current.handleSquareClick({ x: 2, y: 3 }); });

      // 7. Sente selects captured Pawn
      act(() => {
        result.current.handleCapturedPieceClick('Sente', 'Pawn', 0);
      });

      // Try to drop Sente Pawn on Column 0 (e.g. at (0, 5)).
      // Sente has an unpromoted Pawn at (0,3). This must fail due to Nihfu!
      act(() => {
        result.current.handleSquareClick({ x: 0, y: 5 });
      });

      // Drop failed!
      expect(result.current.gameState.board[5][0]).toBeNull();
      expect(result.current.gameState.turn).toBe('Sente');
      expect(result.current.gameState.selectedCapturedPiece).toEqual({
        player: 'Sente',
        type: 'Pawn',
        index: 0,
      });
    });
  });

  describe('Game over and restart', () => {
    it('should determine a winner when King is captured, block actions, and reset game', () => {
      const { result } = renderHook(() => useGameLogic());

      expect(result.current.gameState.winner).toBeNull();

      // Set up a custom test board state by directly modifying the board array.
      // We will place Gote's King right in front of Sente's Rook with no obstacles.
      const board = result.current.gameState.board;
      
      // Remove Gote King from its original spot (4,0)
      board[0][4] = null;
      // Remove Sente's Pawn at (7,6) to clear the vertical path for Sente's Rook at (7,7)
      board[6][7] = null;
      // Put Gote's King at (7,5)
      board[5][7] = { id: 'Gote-King-Test', type: 'King', player: 'Gote' };

      // Sente Rook (7,7) captures Gote King at (7,5)!
      act(() => { result.current.handleSquareClick({ x: 7, y: 7 }); });
      act(() => { result.current.handleSquareClick({ x: 7, y: 5 }); });

      // Sente wins!
      expect(result.current.gameState.winner).toBe('Sente');

      // 10. Actions should be blocked. Try to select a Sente piece - should fail
      act(() => { result.current.handleSquareClick({ x: 3, y: 2 }); });
      expect(result.current.gameState.selectedSquare).toBeNull();

      // 11. Reset match
      act(() => {
        result.current.handleRestart();
      });

      expect(result.current.gameState.winner).toBeNull();
      expect(result.current.gameState.turn).toBe('Sente');
    });
  });
});
