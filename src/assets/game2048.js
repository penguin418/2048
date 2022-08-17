const createGame = ((id) => {
    // 보드 변수
    const BoardColor = "#b5a99a"
    const tileColor = "#c7baae"
    const colors = (number) => {
        const pallete = {
            2: '#e7ddd3',
            4: '#eee1c9',
            8: '#f3b27a',
            16: '#f69664',
            32: '#f77c5f',
            64: '#f75f3b',
            128: '#edd073',
            256: '#edcc62'
        }
        // console.log('colors', number, pallete[number])
        return pallete[number] || '#edcc62'
    }
    const primaryColor = colors(0)
    // 애니메이션 함수
    function circ(timeFraction) {
        return 1 - Math.sin(Math.acos(timeFraction));
    }
    function animate({ timing, draw, duration, onComplete }) {
        if (timing === undefined) {
            timing = circ
        }
        let start = performance.now();
        requestAnimationFrame(function animate(time) {
            let timeFraction = (time - start) / duration;
            if (timeFraction > 1) timeFraction = 1;
            let progress = timing(timeFraction)
            draw(progress);
            if (timeFraction < 1) {
                requestAnimationFrame(animate);
            } else if (onComplete !== undefined) {
                onComplete()
            }
        });
    }
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

    const SHIFT_DIRECTION = {
        RIGHT: 'right',
        DOWN: 'down',
        LEFT: 'left',
        UP: 'up',
    }

    // 키보드 캡쳐
    // 입력 대기
    let receiveInput = false;
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

        if (x || y) { receiveInput = true }
    })

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
            this.lastX = this.x
            this.lastY = this.y
            this.el.style.cssText = `
            width: ${this.size - this.pd * 2}px;
            height: ${this.size - this.pd * 2}px;
            background: ${tileColor};
            position: absolute;
            top:${this.posY}px;
            left:${this.posX}px;
            display: flex;
            align-items:center;
            justify-content: center;
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
            this.lastX = this.x
            this.lastY = this.y
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
        deleteNow() {
            this.el.remove()
        }
        renderOn(parent) {
            super.renderOn(parent)
            const startSize = 0
            const endSize = this.size - this.pd * 2
            this.el.style.cssText += `
            width: ${startSize}px;
            height: ${startSize}px;
            background: ${colors(this.number)};
            `
            parent.appendChild(this.el)
            animate({
                draw: (progress) => {
                    const curSize = startSize + (endSize - startSize) * progress
                    const curPosX = this.posX + (this.size - this.pd * 2 - curSize) / 2
                    const curPosY = this.posY + (this.size - this.pd * 2 - curSize) / 2

                    this.el.style.cssText += `
                        width: ${curSize}px;
                        height: ${curSize}px;
                        top:${curPosY}px;
                        left:${curPosX}px;
                        `
                },
                duration: 100
            })
        }
        update() {
            if (this.deleted) {
                return;
            }

            this.srcPosX = this.lastX * (this.size) + this.pd
            this.srcPosY = this.lastY * (this.size) + this.pd
            this.destPosX = this.x * (this.size) + this.pd
            this.destPosY = this.y * (this.size) + this.pd
            animate({
                draw: (progress) => {
                    this.posX = this.srcPosX + (this.destPosX - this.srcPosX) * progress
                    this.posY = this.srcPosY + (this.destPosY - this.srcPosY) * progress
                    // console.log('update', progress, this.posX, this.posY)
                    this.el.style.cssText += `
                        top:${this.posY}px;
                        left:${this.posX}px;
                        `
                    this.el.innerHTML = `${this.number}`
                },
                duration: 100,
                onComplete: () => {
                    // console.log('onComplete', this)
                    if (this.deleteFlag === true) {
                        dashboard.updateScore(this.number / 2)
                        this.el.remove()
                        this.deleted = true;
                    }
                    this.el.style.cssText += `
                        background: ${colors(this.number)};
                        `
                    this.el.innerHTML = `${this.number}`
                    this.lastX = this.x
                    this.lastY = this.y
                }
            })
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
        clean() {
            this._initialize(this.size)
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
            const coordinate = tile.getCoordinate()
            this.grid[coordinate.y][coordinate.x] = tile
            tile.renderOn(this.getElement())
        }
        printGrid(targetGrid) {
            let gridPrinter = ''

            if (targetGrid === undefined) {
                this.grid.forEach(gridLine => {
                    gridPrinter += `${gridLine.map(t => t ? t.getNumber() : 0)}\n`
                })
            } else {
                targetGrid.forEach(gridLine => {
                    gridPrinter += `${gridLine.map(t => t ? t.getNumber() : 0)}\n`
                })
            }
            return gridPrinter
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
            // console.log('empty tiles are ', emptyTiles.length)
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
        shiftable() {
            // 남은 타일 존재
            console.log('this.getEmptyTiles().length', this.getEmptyTiles().length)
            if (this.getEmptyTiles(1).length > 0) {
                return true;
            }
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (i > 0 && this.grid[i - 1][j].getNumber() === this.grid[i][j].getNumber()) {
                        return true;
                    }
                    if (i < this.size - 1 && this.grid[i + 1][j].getNumber() === this.grid[i][j].getNumber()) {
                        return true;
                    }
                    if (j > 0 && this.grid[i][j - 1].getNumber() === this.grid[i][j].getNumber()) {
                        return true;
                    }
                    if (j < this.size - 1 && this.grid[i][j + 1].getNumber() === this.grid[i][j].getNumber()) {
                        return true;
                    }
                }
            }
            return false
        }

        /**
         * 
         * @param {SHIFT_DIRECTION} shiftDirection shift 방향
         * @return {Boolean} 이동 여부
         */
        shift(shiftDirection) {
            console.log('original-1\n', this.printGrid())
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
                    // this.grid[i][j] = undefined
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
            let anyMovement = false;
            const resultGrid = Array.from({ length: this.size }, () => Array.from({ length: this.size }))
            destGrid.forEach((destGridRow, destI) => {
                destGridRow.forEach((tiles, destJ) => {
                    tiles.forEach(tile => {
                        const coord = tile.getCoordinate()
                        if (coord.y !== destI || coord.x !== destJ) {
                            anyMovement = true;
                        }
                        tile.setPosition(destI, destJ)
                        if (resultGrid[destI][destJ] !== undefined) {
                            resultGrid[destI][destJ].delete()
                        }
                        resultGrid[destI][destJ] = tile
                    })
                })
            })
            this.grid = resultGrid
            return anyMovement
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
    class DashBoard {
        constructor(width, height) {
            this.score = 0;
            this.bestScore = 0;
            this.el = document.createElement('div')
            this.el.style.cssText = `
                background: ${BoardColor}
                `

            const header = document.createElement('div')
            header.classList.add('header')
            header.style.cssText = `
                height: ${height}px;
                width: ${width}px;
                display: flex;
            `
            this.el.appendChild(header)

            const title = document.createElement('h2')
            title.style.cssText = `
                width: ${width / 2}px;
                margin: 0px;
                text-align: left;
            `
            title.innerHTML = '2048'
            header.appendChild(title)


            const scoresWrapper = document.createElement('div')
            scoresWrapper.style.cssText = `
                display: flex;
                height: ${height}px;
            `
            header.appendChild(scoresWrapper)
            this.scoreEl = document.createElement('div')
            this.scoreEl.style.cssText = `
                width: ${width / 4}px;
            `
            this.scoreEl.innerHTML = 'score<br>0'
            scoresWrapper.appendChild(this.scoreEl)
            this.bestScoreEl = document.createElement('div')
            this.bestScoreEl.style.cssText = `
                width: ${width / 4}px;
            `
            this.bestScoreEl.innerHTML = 'best score<br>0'
            scoresWrapper.appendChild(this.bestScoreEl)
        }
        getRecord() {
            return this.score;
        }
        startRecord() {
            this.score = 0;
        }
        updateScore(newScore) {
            console.log('newScore', newScore)
            this.score = this.score + newScore;
            this.scoreEl.innerHTML = `
            score<br>
            ${this.score}
            `
        }
        endRecord() {
            this.bestScore = Math.max(this.score, this.bestScore)
            this.bestScoreEl.innerHTML = `
            best score<br>
            ${this.bestScore}
            `
        }
        renderOn(parent) {
            parent.appendChild(this.el)
        }
        update() {
            this.scoreEl.innerHTML = this.score
            this.bestScoreEl.innerHTML = this.bestScore
        }
    }

    class NavBar {
        constructor(width, height) {
            this.el = document.createElement('div')
            this.el.style.cssText = `
                display: flex;
                height: ${height}px;
                justify-content: right;
                background: ${BoardColor}
            `
            const restartButton = document.createElement('button')
            restartButton.style.cssText = `
                width: ${width / 4 - 10}px;
                height: ${height - 10}px;
                background: ${primaryColor}
                box-shadow: none;
                border-radius: 4px;
                margin: 5px;
                border:0px;
            `
            restartButton.innerHTML = `
                다시하기
            `
            restartButton.addEventListener('click', (e) => {
                if (this.restartHandler !== undefined) {
                    this.restartHandler(e)
                }
            })
            this.el.appendChild(restartButton)
        }
        setRestartHandler(restartHandler) {
            this.restartHandler = restartHandler
        }
        renderOn(parent) {
            parent.appendChild(this.el)
        }
    }


    // overlay
    class Notification {
        constructor() {
            this.el = document.createElement('div')
            this.el.classList.add('overlay')
            this.el.style.cssText = `
                position: absolute;
                top: 0;
                left:0;
                width: 100%;
                height: 100%;
                background-color: rgba(100, 100, 100, 0.25);
            `

            this.modal = document.createElement('div')
            this.modal.classList.add('modal')
            this.modal.style.cssText = `
                position: absolute;
                top: 50%;
                left:50%;
                width: 180px;
                transform: translate(-50%, -50%);
                background-color: ${tileColor};
                box-shadow: none;
                border-radius: 4px;
                padding: 16px;
                border:0px;
            `

            this.message = document.createElement('div')
            this.modal.appendChild(this.message)
            this.message.innerHTML = '획득하신 점수는 총 0점 입니다'


            const restartButton = document.createElement('button')
            restartButton.style.cssText = `
                background: ${primaryColor}
                box-shadow: none;
                border-radius: 4px;
                margin: 5px;
                padding: 8px;
                border:0px;
            `
            restartButton.innerHTML = `
                다시하기
            `
            restartButton.addEventListener('click', (e) => {
                if (this.restartHandler !== undefined) {
                    this.hide()
                    this.restartHandler(e)
                }
            })
            this.modal.appendChild(restartButton)

            this.el.appendChild(this.modal)
        }

        show(score) {
            this.message.innerHTML = `획득하신 점수는 총 ${score}점 입니다`
            this.el.style.cssText += `
            display: inherit;
            `
        }

        hide() {
            this.el.style.cssText += `
            display: none;
            `
        }

        setRestartHandler(restartHandler) {
            this.restartHandler = restartHandler
        }

        renderOn(parent) {
            parent.appendChild(this.el)
        }
    }

    // 초기화 - 프레임사이즈 계산
    const rect = document.getElementById(id)

    const rectSize = Math.min(rect.offsetHeight, rect.offsetWidth)
    const frameSize = Math.min(Math.max(rectSize, 300), 300)
    console.log('frameSize', frameSize)
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
    position: relative;
    width: ${frameSize}px;
    height: ${frameSize * (5 / 4)}px; 
    border:1px solid;
    `


    // 점수
    const headerHeight = frameSize * 1 / 4
    // const dashboard = document.createElement('div')
    // dashboard.classList.add('dashboard')
    // dashboard.style.cssText += `
    // width: ${frameSize}px;
    // height: ${headerHeight}px;
    // `
    // frame.appendChild(dashboard)
    const dashboard = new DashBoard(frameSize, headerHeight / 2)
    dashboard.renderOn(frame)
    const navBar = new NavBar(frameSize, headerHeight / 2)
    navBar.renderOn(frame)
    // frame.addEventListener('updateScore', (score) => {
    //     dashboard.innerHTML = score
    // });


    // 게임 메인 루프
    // let playState = 1
    // while (playState > 0) {
    // while (playState === 1) {

    // 시간 함수
    function timer(delay) {
        return new Promise((resolve) => setTimeout(resolve, delay))
    }
    // 입력 대기 함수
    function waitInput() {
        receiveInput = false;
        return new Promise((resolve) => {
            const waitId = setInterval(() => {
                if (receiveInput) {
                    clearInterval(waitId);
                    resolve()
                }
            }, 100)
        })
    }


    // let p = 1

    const size = 4;
    // 맵 초기화
    let board = new Board(size);
    board.renderOn(frame)

    const notification = new Notification()
    notification.renderOn(frame)
    notification.hide()


    let playGame = true
    const updateTargets = []
    async function play() {
        console.log('start')
        board.clean()
        // 변수 초기화
        while (playGame) {
            await Promise.race([timer(200), waitInput()])
            const emptyTilePos = board.getEmptyTiles(1).at(0)
            const numberTile = new NumberTile(board.getTileSize(), 2)
            board.addNumberedTile(emptyTilePos.y, emptyTilePos.x, numberTile)
            // console.log('grid', board.printGrid())
            updateTargets.push(numberTile)

            if (!board.shiftable()) {
                console.log('not shiftable')
                break;
            }

            let needRetry = true;
            while (needRetry) {
                receiveInput = false;
                await waitInput()
                const anyMovement = board.shift(shiftDirection)
                needRetry = !anyMovement
            }

            updateTargets.forEach(t => {
                t.update()
            })
        }
        return 'finished'
    }

    function restart() {
        console.log('restart')
        updateTargets.forEach(t => {
            if (t instanceof NumberTile) {
                t.deleteNow()
            }
        })
        playGame = false;
        dashboard.endRecord()
        dashboard.startRecord()
        startGame()
    }
    navBar.setRestartHandler(restart)
    notification.setRestartHandler(restart)

    async function waitPlay() {
        await play()
        return new Promise((resolve) => {
            resolve();
        });
    }

    async function waitRestart() {
        playGame = true;
        return new Promise((resolve) => {
            const waitId = setInterval(() => {
                if (!playGame) {
                    clearInterval(waitId);
                    resolve()
                }
            }, 100)
        })
    }

    async function startGame() {
        await Promise.race([waitRestart(), waitPlay()])
        console.log('game ended')
        notification.show(dashboard.getRecord())
    }
    startGame()

})
