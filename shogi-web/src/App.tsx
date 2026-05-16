import { useGameLogic } from './hooks/useGameLogic';
import Board from './components/Board';
import './index.css';

function App() {
  const { gameState, handleSquareClick, handleKeyDown } = useGameLogic();

  return (
    <div className="App">
      <h1>Shogi Web</h1>
      <div className="status">
        手番: {gameState.turn === 'Sente' ? '先手 (▲)' : '後手 (▽)'}
        <br />
        <small>(矢印キーで移動, Enter/Spaceで選択・決定)</small>
      </div>
      
      <div className="captured-area">
        <div className="captured-label">後手 持ち駒: {gameState.captured.Gote.join(', ') || 'なし'}</div>
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
        <div className="captured-label">先手 持ち駒: {gameState.captured.Sente.join(', ') || 'なし'}</div>
      </div>
    </div>
  );
}

export default App;
