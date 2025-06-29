class Minesweeper {
    constructor() {
        this.rows = 9;
        this.cols = 9;
        this.mineCount = 10;
        this.board = [];
        this.gameState = 'playing'; // 'playing', 'won', 'lost'
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;
        this.flagCount = 0;
        
        this.initializeElements();
        this.initializeGame();
        this.attachEventListeners();
    }
    
    initializeElements() {
        this.gameBoard = document.getElementById('game-board');
        this.mineCountDisplay = document.getElementById('mine-count');
        this.timerDisplay = document.getElementById('timer');
        this.gameFace = document.getElementById('game-face');
        this.gameMessage = document.getElementById('game-message');
        this.resetBtn = document.getElementById('reset-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
    }
    
    initializeGame() {
        this.gameState = 'playing';
        this.firstClick = true;
        this.timer = 0;
        this.flagCount = 0;
        this.updateTimer();
        this.updateMineCount();
        this.updateGameFace();
        this.updateGameMessage('좌클릭으로 셀을 열고, 우클릭으로 깃발을 표시하세요!');
        
        // 보드 초기화
        this.board = [];
        for (let row = 0; row < this.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.board[row][col] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
        
        this.renderBoard();
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    renderBoard() {
        this.gameBoard.innerHTML = '';
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const cellData = this.board[row][col];
                
                if (cellData.isFlagged) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                } else if (cellData.isRevealed) {
                    cell.classList.add('revealed');
                    
                    if (cellData.isMine) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (cellData.neighborMines > 0) {
                        cell.textContent = cellData.neighborMines;
                        cell.classList.add(`number-${cellData.neighborMines}`);
                    }
                }
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    attachEventListeners() {
        this.gameBoard.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.handleCellClick(row, col);
            }
        });
        
        this.gameBoard.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.handleRightClick(row, col);
            }
        });
        
        this.resetBtn.addEventListener('click', () => {
            this.initializeGame();
        });
        
        this.newGameBtn.addEventListener('click', () => {
            this.initializeGame();
        });
        
        // 마우스 다운/업 이벤트로 얼굴 표정 변화
        this.gameBoard.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('cell') && this.gameState === 'playing') {
                this.gameFace.textContent = '😨';
            }
        });
        
        this.gameBoard.addEventListener('mouseup', () => {
            if (this.gameState === 'playing') {
                this.updateGameFace();
            }
        });
    }
    
    handleCellClick(row, col) {
        if (this.gameState !== 'playing') return;
        
        const cell = this.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;
        
        // 첫 클릭인 경우 지뢰 배치
        if (this.firstClick) {
            this.placeMines(row, col);
            this.calculateNeighborMines();
            this.startTimer();
            this.firstClick = false;
        }
        
        this.revealCell(row, col);
        this.renderBoard();
        this.checkGameState();
    }
    
    handleRightClick(row, col) {
        if (this.gameState !== 'playing') return;
        
        const cell = this.board[row][col];
        if (cell.isRevealed) return;
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            this.flagCount--;
        } else if (this.flagCount < this.mineCount) {
            cell.isFlagged = true;
            this.flagCount++;
        }
        
        this.updateMineCount();
        this.renderBoard();
        this.checkGameState();
    }
    
    placeMines(excludeRow, excludeCol) {
        const mines = [];
        
        // 첫 클릭한 셀과 인접한 셀들은 지뢰가 될 수 없음
        const excludeCells = new Set();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const newRow = excludeRow + dr;
                const newCol = excludeCol + dc;
                if (this.isValidCell(newRow, newCol)) {
                    excludeCells.add(`${newRow},${newCol}`);
                }
            }
        }
        
        // 가능한 모든 위치 생성
        const availableCells = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!excludeCells.has(`${row},${col}`)) {
                    availableCells.push([row, col]);
                }
            }
        }
        
        // 랜덤하게 지뢰 위치 선택
        for (let i = 0; i < this.mineCount; i++) {
            const randomIndex = Math.floor(Math.random() * availableCells.length);
            const [row, col] = availableCells.splice(randomIndex, 1)[0];
            this.board[row][col].isMine = true;
        }
    }
    
    calculateNeighborMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const newRow = row + dr;
                            const newCol = col + dc;
                            if (this.isValidCell(newRow, newCol) && this.board[newRow][newCol].isMine) {
                                count++;
                            }
                        }
                    }
                    this.board[row][col].neighborMines = count;
                }
            }
        }
    }
    
    revealCell(row, col) {
        if (!this.isValidCell(row, col)) return;
        
        const cell = this.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;
        
        cell.isRevealed = true;
        
        // 지뢰를 클릭한 경우
        if (cell.isMine) {
            this.gameState = 'lost';
            this.revealAllMines();
            return;
        }
        
        // 빈 셀인 경우 인접 셀들도 자동으로 열기
        if (cell.neighborMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    this.revealCell(row + dr, col + dc);
                }
            }
        }
    }
    
    revealAllMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col].isMine) {
                    this.board[row][col].isRevealed = true;
                }
            }
        }
    }
    
    checkGameState() {
        if (this.gameState === 'lost') {
            this.endGame(false);
            return;
        }
        
        // 승리 조건: 모든 지뢰가 아닌 셀이 열렸는지 확인
        let revealedCount = 0;
        let totalNonMineCells = this.rows * this.cols - this.mineCount;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col].isMine && this.board[row][col].isRevealed) {
                    revealedCount++;
                }
            }
        }
        
        if (revealedCount === totalNonMineCells) {
            this.gameState = 'won';
            this.endGame(true);
        }
    }
    
    endGame(won) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (won) {
            this.updateGameFace('😎');
            this.updateGameMessage('🎉 축하합니다! 게임에서 승리했습니다!');
            document.querySelector('.container').classList.add('game-won');
            
            // 모든 지뢰에 자동으로 깃발 표시
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (this.board[row][col].isMine) {
                        this.board[row][col].isFlagged = true;
                    }
                }
            }
            this.flagCount = this.mineCount;
            this.updateMineCount();
        } else {
            this.updateGameFace('😵');
            this.updateGameMessage('💥 게임 오버! 지뢰를 터뜨렸습니다.');
            document.querySelector('.container').classList.add('game-lost');
        }
        
        setTimeout(() => {
            document.querySelector('.container').classList.remove('game-won', 'game-lost');
        }, 2000);
        
        this.renderBoard();
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }
    
    updateTimer() {
        this.timerDisplay.textContent = this.timer.toString().padStart(3, '0');
    }
    
    updateMineCount() {
        const remainingMines = this.mineCount - this.flagCount;
        this.mineCountDisplay.textContent = remainingMines.toString().padStart(2, '0');
    }
    
    updateGameFace(face = null) {
        if (face) {
            this.gameFace.textContent = face;
        } else {
            switch (this.gameState) {
                case 'playing':
                    this.gameFace.textContent = '😊';
                    break;
                case 'won':
                    this.gameFace.textContent = '😎';
                    break;
                case 'lost':
                    this.gameFace.textContent = '😵';
                    break;
            }
        }
    }
    
    updateGameMessage(message) {
        this.gameMessage.textContent = message;
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
