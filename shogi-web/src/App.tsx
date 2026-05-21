import { useGameLogic } from './hooks/useGameLogic';
import Board from './components/Board';
import { getPieceSymbol } from './models/Board';
import './index.css';

function App() {
  const { gameState, handleSquareClick, handleCapturedPieceClick, handleRestart, handleKeyDown } = useGameLogic();

  return (
    <div className="App">
      {gameState.winner && (
        <div className="game-over-overlay">
          <div className="game-over-box">
            <div className="winner-title">
              {gameState.winner === 'Sente' ? '▲ 先手 勝利！' : '▽ 後手 勝利！'}
            </div>
            <div className="game-over-subtitle">
              見事に王を捕獲しました！
            </div>
            <button className="restart-btn" onClick={handleRestart}>
              もう一度遊ぶ
            </button>
          </div>
        </div>
      )}

      <h1>Shogi Web</h1>
      <div className="status">
        手番: {gameState.turn === 'Sente' ? '先手 (▲)' : '後手 (▽)'}
        <br />
        <small>(矢印キーで移動, Enter/Spaceで選択・決定)</small>
      </div>
      
      <div className="captured-area">
        <div className="captured-label">後手 持ち駒:</div>
        <div className="captured-list">
          {gameState.captured.Gote.length === 0 ? (
            <span className="no-captured">なし</span>
          ) : (
            gameState.captured.Gote.map((type, idx) => {
              const isSelected = gameState.selectedCapturedPiece?.player === 'Gote' &&
                                 gameState.selectedCapturedPiece?.type === type &&
                                 gameState.selectedCapturedPiece?.index === idx;
              return (
                <button
                  key={`${type}-${idx}`}
                  className={`captured-piece-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCapturedPieceClick('Gote', type, idx)}
                  disabled={gameState.turn !== 'Gote' || !!gameState.winner}
                >
                  {getPieceSymbol(type)}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div 
        onKeyDown={handleKeyDown} 
        tabIndex={0} 
        style={{ outline: 'none' }}
        aria-label="Shogi Board"
      >
        <Board 
          board={gameState.board}
          selectedSquare={gameState.selectedSquare}
          cursor={gameState.cursor}
          onSquareClick={handleSquareClick}
        />
      </div>

      <div className="captured-area">
        <div className="captured-label">先手 持ち駒:</div>
        <div className="captured-list">
          {gameState.captured.Sente.length === 0 ? (
            <span className="no-captured">なし</span>
          ) : (
            gameState.captured.Sente.map((type, idx) => {
              const isSelected = gameState.selectedCapturedPiece?.player === 'Sente' &&
                                 gameState.selectedCapturedPiece?.type === type &&
                                 gameState.selectedCapturedPiece?.index === idx;
              return (
                <button
                  key={`${type}-${idx}`}
                  className={`captured-piece-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCapturedPieceClick('Sente', type, idx)}
                  disabled={gameState.turn !== 'Sente' || !!gameState.winner}
                >
                  {getPieceSymbol(type)}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
