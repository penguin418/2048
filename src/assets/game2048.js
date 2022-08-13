const createGame = ((id) => {
    // 변수
    const BoardColor = "#b5a99a"
    const tileColor = "#c7baae"
    const colors = ['#e7ddd3']
    // 입력 대기
    let waitForInput = false;

    // 회전 함수
    function rotateArray(a, n) {
        function __rotateRight(a) {
            const rowSize = a.length;
            const columnSize = a.at(0).length;
            const result = Array.from({ length: columnSize }, () => Array.from({ length: rowSize }))
            for (let i = 0; i < columnSize; i++) {
                for (let j = 0; j < rowSize; j++) {
                    result[i][j] = a[rowSize - 1 - j][i]
                }
            }
            return result
        }
        for (let i = 0; i < n; i++) {
            a = __rotateRight(a)
        }
        return a
    }
    // 이동 함수


    const SHIFT_DIRECTION = {
        RIGHT: 'right',
        DOWN: 'down',
        LEFT: 'left',
        UP: 'up',
    }


    // 셀
    class Tile {
        constructor(size) {
            this.size = size;
            this.pd = 5;
            this.el = document.createElement('div')
            this.el.classList.add('tile')

        }
        setPosition(y, x) {
            this.x = x;
            this.y = y;
        }
        getCoordinate() {
            return { x: this.x, y: this.y }
        }
        getElement() {
            return this.el
        }
        renderOn(parent) {
            this.posX = this.x * (this.size) + this.pd
            this.posY = this.y * (this.size) + this.pd
            this.el.style.cssText = `
            width: ${this.size - this.pd * 2}px;
            height: ${this.size - this.pd * 2}px;
            background: ${tileColor};
            position: absolute;
            top:${this.posY}px;
            left:${this.posX}px;
            `
            parent.appendChild(this.el)
            this.update()
        }
        update() {
            this.posX = this.x * (this.size) + this.pd
            this.posY = this.y * (this.size) + this.pd
            this.el.style.cssText += `
            top:${this.posY}px;
            left:${this.posX}px;
            `
        }
    }
    class NumberTile extends Tile {
        constructor(size, number) {
            super(size)
            this.number = number
        }
        getNumber() {
            return this.number
        }
        setNumber(number) {
            this.number = number
        }
        delete() {
            this.deleteFlag = true
        }
        renderOn(parent) {
            super.renderOn(parent)
            this.el.style.cssText += `
            background: ${colors[0]};
            `
            parent.appendChild(this.el)
        }
        update() {
            super.update()
            this.el.innerHTML = this.number
            if (this.deleteFlag === true) {
                this.el.remove()
            }
        }
    }
    // 보드
    class Board {
        constructor(size) {
            this.el = document.createElement('div')
            this.el.classList.add('board')
            this.size = size;
            this._initialize(size)
        }
        getWidth() {
            return this.el.offsetWidth
        }
        getHeight() {
            return this.el.offsetHeight
        }
        getTileSize() {
            return this.getWidth() / this.size
        }
        getTile(x, y) {
            return this.grid[y][x]
        }
        addNumberedTile(y, x, tile) {
            tile.setPosition(y, x)
            tile.renderOn(this.getElement())
            const coordinate = tile.getCoordinate()
            this.grid[coordinate.y][coordinate.x] = tile
        }
        printGrid() {
            let gridPrinter = ''
            this.grid.forEach(gridLine => {
                gridPrinter += `${gridLine.map(t => t ? t.getNumber() : 0)}\n`
            })
            console.log(gridPrinter)
        }
        updateGrid(newGrid) {
            this.grid = newGrid
        }
        getGrid() {
            return this.grid
        }
        getAllTiles() {
            const result = this.grid.reduce((p, c, i) => {
                c.reduce((pp, cc, j) => {
                    p.push({ y: i, x: j })
                }, [])
                return p
            }, [])
            return result
        }
        getEmptyTiles(requiredSize) {
            const emptyTiles = []
            this.grid.forEach((gridRow, i) => {
                gridRow.forEach((tile, j) => {
                    if (tile === undefined)
                        emptyTiles.push({ y: i, x: j })
                })
            })
            console.log('empty tiles are ', emptyTiles.length)
            const selected = []
            let i = 0;
            while (i < requiredSize && emptyTiles.length) {
                const selectedIdx = Math.floor(Math.random() * emptyTiles.length)
                selected.push(...emptyTiles.splice(selectedIdx, 1))
                i -= 1;
            }
            return selected;
        }
        __moveNumberedTile(tile, y, x, number, deleteFlag) {
            if (number !== undefined) {
                tile.setNumber(number)
            }
            if (deleteFlag !== undefined) {
                tile.delete()
            }
            tile.setPosition(y, x);
            this.grid[y][x] = tile;
        }
        shift(shiftDirection) {
            switch (shiftDirection) {
                case SHIFT_DIRECTION.UP: this.grid = rotateArray(this.grid, 3); break;
                case SHIFT_DIRECTION.RIGHT: this.grid = rotateArray(this.grid, 2); break;
                case SHIFT_DIRECTION.DOWN: this.grid = rotateArray(this.grid, 1); break;
                case SHIFT_DIRECTION.LEFT: this.grid = rotateArray(this.grid, 0); break;
            }

            let destGrid = Array.from({ length: this.size }, () => Array.from({ length: this.size }, () => ([])))
            for (let i = 0; i < this.size; i++) {
                // i 행
                const q = []
                for (let j = 0; j < this.size; j++) {
                    // j 열
                    if (this.grid[i][j] !== undefined) {
                        q.push(this.grid[i][j])
                    }
                    this.grid[i][j] = undefined
                }
                if (q.length > 0) {
                    for (let k = 0; k < this.size; k++) {
                        // 첫번째 할당
                        const first = q.shift()
                        if (first === undefined) {
                            break;
                        }
                        const firstNumber = first.getNumber();
                        if (first !== undefined) {
                            destGrid[i][k].push(first)
                        }
                        // 두번째 합찰지 말지
                        if (q.length > 0) {
                            const second = q.at(0)
                            if (first.getNumber() === second.getNumber()) {
                                destGrid[i][k].push(second)
                                destGrid[i][k].at(0).setNumber(firstNumber * 2)
                                destGrid[i][k].at(1).setNumber(firstNumber * 2)
                                q.shift()
                            }
                        }
                    }
                }
            }
            switch (shiftDirection) {
                case SHIFT_DIRECTION.UP: destGrid = rotateArray(destGrid, 1); break;
                case SHIFT_DIRECTION.RIGHT: destGrid = rotateArray(destGrid, 2); break;
                case SHIFT_DIRECTION.DOWN: destGrid = rotateArray(destGrid, 3); break;
                case SHIFT_DIRECTION.LEFT: destGrid = rotateArray(destGrid, 0); break;
            }
            // this.printGrid()
            this._initialize(this.size)
            destGrid.forEach((destGridRow, destI) => {
                destGridRow.forEach((tiles, destJ) => {
                    tiles.forEach(tile => {
                        // const coord = tile.getCoordinate()
                        tile.setPosition(destI, destJ)
                        if (this.grid[destI][destJ] !== undefined) {
                            this.grid[destI][destJ].delete()
                        }
                        this.grid[destI][destJ] = tile
                    })
                })
            })

        }
        _initialize(size) {
            this.grid = Array.from({ length: size }, () => Array.from({ length: size }))
        }
        getElement() {
            return this.el
        }
        renderOn(parent) {
            this.el.style.cssText = `
            position: relative;
            width: ${parent.offsetWidth}px;
            height: ${parent.offsetWidth}px;
            background: ${BoardColor};
            `
            parent.appendChild(this.el)

            this.getAllTiles().forEach(pos => {
                const tile = new Tile(this.getTileSize())
                tile.setPosition(pos.y, pos.x)
                tile.renderOn(this.el)
            })

            parent.appendChild(this.el)
        }
    }
    // 키보드 캡쳐
    let shiftDirection = ''
    document.addEventListener('keydown', function (e) {
        let x = 0, y = 0;
        switch (e.key) {
            case "ArrowLeft":
                x = -1;
                shiftDirection = SHIFT_DIRECTION.LEFT
                break;
            case "ArrowRight":
                x = 1;
                shiftDirection = SHIFT_DIRECTION.RIGHT
                break;
            case "ArrowUp":
                y = -1
                shiftDirection = SHIFT_DIRECTION.UP
                break;
            case "ArrowDown":
                y = 1
                shiftDirection = SHIFT_DIRECTION.DOWN
                break;
        }

        if (x || y) { waitForInput = false }
    })

    // 초기화 - 프레임사이즈 계산
    const rect = document.getElementById(id)
    const rectSize = Math.min(rect.offsetHeight, rect.offsetWidth)
    const frameSize = Math.max(rectSize, 300)
    // 초기화 - 프레임 생성
    const frameWrapper = document.createElement('div')
    frameWrapper.classList.add('frameWrapper')
    frameWrapper.style.cssText += `display: flex; justify-content: center; align-items: center`
    const frame = document.createElement('div')
    frame.classList.add('frame')
    frame.style.cssText += 'style', 'display: inline-block;'
    rect.appendChild(frameWrapper)
    frameWrapper.appendChild(frame)
    frame.style.cssText += `
    width: ${frameSize}px;
    height: ${frameSize * (5 / 4)}px; 
    border:1px solid;
    `

    // 점수
    const dashboardHeight = frameSize * 1 / 4
    const dashboard = document.createElement('div')
    dashboard.classList.add('dashboard')
    dashboard.style.cssText += `
    width: ${frameSize}px;
    height: ${dashboardHeight}px;
    `
    frame.appendChild(dashboard)
    frame.addEventListener('updateScore', (score) => {
        dashboard.innerHTML = score
    });


    // 게임 메인 루프
    // let playState = 1
    // while (playState > 0) {
    // while (playState === 1) {

    // let p = 1
    async function play() {
        const playGame = true
        // 변수 초기화
        const size = 4;
        // 맵 초기화
        const board = new Board(size);
        board.renderOn(frame)
        const updateTargets = []
        while (playGame) {
            const emptyTilePos = board.getEmptyTiles(1).at(0)
            console.log('emptyTilePos', emptyTilePos)
            const numberTile = new NumberTile(board.getTileSize(), 2)
            board.addNumberedTile(emptyTilePos.y, emptyTilePos.x, numberTile)
            updateTargets.push(numberTile)



            board.printGrid()
            // let gridPrinter = ''
            // const newArray = rotateArray(board.grid, 1)
            // // 위로 이동시 1번, 오른쪽 이동시 2번, 아래 이동시 3번돌면
            // // 현재위치에서 이동한 경우의 위치가 나옴
            // newArray.forEach(gridLine => {
            //     gridPrinter += `${gridLine.map(t => t ? t.getNumber() : 0)}\n`
            // })
            // console.log('rotated\n', gridPrinter)

            waitForInput = true;
            await new Promise((resolve) => {
                const waitId = setInterval(() => {
                    if (!waitForInput) {
                        clearInterval(waitId);
                        resolve()
                    }
                }, 100)
            })
            board.shift(shiftDirection)

            updateTargets.forEach(t => {
                console.log('updateTargets', t)
                t.update()
            })
        }

    }
    play();
})
