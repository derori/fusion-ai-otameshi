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
      // Sente pawn at y=6, Gote pawn at y=2. Move Sente pawn from (0,6) to (0,2) without rule validation.
      const from: Position = { x: 0, y: 6 };
      const to: Position = { x: 0, y: 2 };

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

      // Sente moves
      act(() => {
        result.current.handleSquareClick({ x: 0, y: 6 });
      });
      act(() => {
        result.current.handleSquareClick({ x: 0, y: 5 });
      });

      expect(result.current.gameState.turn).toBe('Gote');

      // Gote tries to select Sente piece - should fail
      act(() => {
        result.current.handleSquareClick({ x: 1, y: 6 });
      });
      expect(result.current.gameState.selectedSquare).toBeNull();

      // Gote selects own piece and captures
      act(() => {
        result.current.handleSquareClick({ x: 0, y: 2 });
      });
      expect(result.current.gameState.selectedSquare).toEqual({ x: 0, y: 2 });

      act(() => {
        result.current.handleSquareClick({ x: 0, y: 5 });
      });

      expect(result.current.gameState.captured.Gote).toHaveLength(1);
      expect(result.current.gameState.turn).toBe('Sente');
    });
  });
});
