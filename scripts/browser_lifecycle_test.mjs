import { mkdir, writeFile } from "node:fs/promises";

const targets = await fetch("http://127.0.0.1:9222/json").then(
    response => response.json()
);

const page = targets.find(
    target =>
        target.type === "page" &&
        target.url.includes("127.0.0.1:5173")
);

if (!page) {
    throw new Error("No se encontro la pagina de Damas IA en Edge.");
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pendingCommands = new Map();
const browserErrors = [];
let nextCommandId = 1;

await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
});

socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);

    if (message.id !== undefined) {
        const pending = pendingCommands.get(message.id);

        if (pending) {
            pendingCommands.delete(message.id);

            if (message.error) {
                pending.reject(new Error(message.error.message));
            } else {
                pending.resolve(message.result);
            }
        }

        return;
    }

    if (message.method === "Runtime.exceptionThrown") {
        browserErrors.push(
            message.params.exceptionDetails.text
        );
    }

    if (
        message.method === "Runtime.consoleAPICalled" &&
        ["error", "warning"].includes(message.params.type)
    ) {
        browserErrors.push(
            message.params.args
                .map(argument => argument.value ?? argument.description)
                .join(" ")
        );
    }
});

function command(method, params = {}) {
    const id = nextCommandId++;

    return new Promise((resolve, reject) => {
        pendingCommands.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
    });
}

async function evaluate(expression) {
    const result = await command("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true
    });

    if (result.exceptionDetails) {
        throw new Error(
            result.exceptionDetails.exception?.description ??
            result.exceptionDetails.text
        );
    }

    return result.result.value;
}

const wait = milliseconds =>
    new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitFor(predicate, description, timeout = 10000) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeout) {
        const value = await predicate();

        if (value) {
            return value;
        }

        await wait(50);
    }

    throw new Error(`Tiempo agotado esperando: ${description}`);
}

async function clickGame(x, y) {
    const point = await evaluate(`(() => {
        const canvas = document.querySelector("canvas");
        const rect = canvas.getBoundingClientRect();

        return {
            x: rect.left + ${x} * rect.width / 800,
            y: rect.top + ${y} * rect.height / 600
        };
    })()`);

    await command("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: point.x,
        y: point.y,
        button: "left",
        clickCount: 1
    });

    await wait(20);

    await command("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: point.x,
        y: point.y,
        button: "left",
        clickCount: 1
    });
}

async function clickBoard(x, y) {
    await evaluate(`(() => {
        const scene = window.__DAMAS_GAME__.scene.getScene("GameScene");
        scene.handleBoardClick(${x}, ${y});
    })()`);
}

async function snapshot() {
    return evaluate(`(() => {
        const game = window.__DAMAS_GAME__;
        const scene = game?.scene.getScene("GameScene");

        if (!scene) {
            return null;
        }

        return {
            agent: scene.aiAgent?.constructor.name ?? null,
            session: scene.gameSessionId,
            currentPlayer: scene.gameState?.getCurrentPlayer() ?? null,
            winner: scene.winner,
            draw: scene.gameState?.isDraw() ?? false,
            aiTurnInProgress: scene.aiTurnInProgress,
            pendingTimers: scene.pendingAiTimers.length,
            input: {
                enabled: scene.input.enabled,
                pointerDownListeners:
                    scene.input.listenerCount("pointerdown"),
                x: scene.input.activePointer.x,
                y: scene.input.activePointer.y,
                isDown: scene.input.activePointer.isDown
            },
            forcedPiece: scene.forcedPiece,
            selectedMoves: scene.selectedMoveOptions,
            movesWithoutProgress:
                scene.gameState?.getMovesWithoutProgress() ?? null,
            humanPieces: scene.gameState?.board.countPieces("human") ?? null,
            aiPieces: scene.gameState?.board.countPieces("ai") ?? null,
            boardSignature: Array.from(
                { length: 8 },
                (_, row) => Array.from(
                    { length: 8 },
                    (_, column) => {
                        const piece = scene.gameState?.board.getCell(
                            row,
                            column
                        );

                        if (!piece) {
                            return ".";
                        }

                        const symbol =
                            piece.player === "human" ? "h" : "a";

                        return piece.king ? symbol.toUpperCase() : symbol;
                    }
                ).join("")
            ).join("/")
        };
    })()`);
}

async function chooseHumanMove(seed) {
    return evaluate(`(() => {
        const scene = window.__DAMAS_GAME__.scene.getScene("GameScene");

        if (scene.forcedPiece !== null) {
            return scene.selectedMoveOptions[0] ?? null;
        }

        const moves = [];

        for (let row = 0; row < 8; row++) {
            for (let column = 0; column < 8; column++) {
                const piece = scene.gameState.board.getCell(row, column);

                if (piece?.player !== "human") {
                    continue;
                }

                scene.selectPiece(row, column);
                moves.push(...scene.selectedMoveOptions);
            }
        }

        const captures = moves.filter(move => move.captured);
        const candidates = captures.length > 0 ? captures : moves;

        if (candidates.length === 0) {
            return null;
        }

        const promotions = candidates.filter(move => move.to.row === 0);
        const preferred = promotions.length > 0 ? promotions : candidates;

        return preferred[${seed} % preferred.length];
    })()`);
}

async function playUntilFinished(maxMoves = 200) {
    let moveNumber = 0;

    while (moveNumber < maxMoves) {
        const state = await snapshot();

        if (state.winner || state.draw) {
            return { ...state, moves: moveNumber };
        }

        if (state.currentPlayer !== "human" || state.aiTurnInProgress) {
            await wait(75);
            continue;
        }

        const move = await chooseHumanMove(moveNumber * 17 + 3);

        if (!move) {
            await wait(100);
            continue;
        }

        const fromX = 144 + move.from.column * 64 + 32;
        const fromY = 44 + move.from.row * 64 + 32;
        const toX = 144 + move.to.column * 64 + 32;
        const toY = 44 + move.to.row * 64 + 32;

        await clickBoard(fromX, fromY);
        await wait(20);

        const stateAfterSelection = await snapshot();

        if (
            !stateAfterSelection.selectedMoves.some(
                selectedMove =>
                    selectedMove.to.row === move.to.row &&
                    selectedMove.to.column === move.to.column
            )
        ) {
            throw new Error(
                `El clic no selecciono la ficha: ${JSON.stringify({
                    move,
                    before: state,
                    afterSelection: stateAfterSelection
                })}`
            );
        }

        await clickBoard(toX, toY);
        await wait(40);

        const stateAfterClick = await snapshot();

        if (stateAfterClick.boardSignature === state.boardSignature) {
            throw new Error(
                `El clic no ejecuto el movimiento: ${JSON.stringify({
                    move,
                    before: state,
                    after: stateAfterClick
                })}`
            );
        }

        moveNumber++;

        if (moveNumber % 10 === 0) {
            console.log(
                `Movimientos humanos: ${moveNumber}; ` +
                `fichas ${stateAfterClick.humanPieces}-${stateAfterClick.aiPieces}; ` +
                `progreso ${stateAfterClick.movesWithoutProgress}`
            );
        }
    }

    throw new Error(
        "La partida no termino dentro del limite de movimientos: " +
        JSON.stringify(await snapshot())
    );
}

await command("Runtime.enable");
await command("Page.enable");
await command("Page.reload", { ignoreCache: true });
await wait(500);

await waitFor(
    async () => evaluate(`Boolean(
        window.__DAMAS_GAME__?.isBooted &&
        document.querySelector("canvas")
    )`),
    "inicio de Phaser"
);

const initial = await snapshot();

await clickGame(400, 280);

const firstStart = await waitFor(
    async () => {
        const state = await snapshot();
        return state?.agent === "ReactiveAgent" ? state : null;
    },
    "inicio con agente reactivo"
);

const firstResult = await playUntilFinished();

await clickGame(400, 380);

const returnedToMenu = await waitFor(
    async () => {
        const state = await snapshot();
        return state?.agent === null ? state : null;
    },
    "regreso al menu"
);

await clickGame(400, 370);

const secondStart = await waitFor(
    async () => {
        const state = await snapshot();
        return state?.agent === "GoalAgent" ? state : null;
    },
    "inicio con agente minimax"
);

await wait(1200);
const secondAfterDelay = await snapshot();

const secondMove = await chooseHumanMove(7);

if (!secondMove) {
    throw new Error("No se encontro un movimiento inicial contra Minimax.");
}

await clickBoard(
    144 + secondMove.from.column * 64 + 32,
    44 + secondMove.from.row * 64 + 32
);
await clickBoard(
    144 + secondMove.to.column * 64 + 32,
    44 + secondMove.to.row * 64 + 32
);

const secondAfterTurn = await waitFor(
    async () => {
        const state = await snapshot();

        if (
            state?.agent === "GoalAgent" &&
            state.session === secondStart.session &&
            !state.aiTurnInProgress &&
            state.pendingTimers === 0 &&
            (
                state.currentPlayer === "human" ||
                state.winner !== null ||
                state.draw
            ) &&
            state.boardSignature !== secondStart.boardSignature
        ) {
            return state;
        }

        return null;
    },
    "primer turno completo contra Minimax",
    30000
);

const screenshot = await command("Page.captureScreenshot", {
    format: "png"
});

await mkdir("logs", { recursive: true });
await writeFile(
    "logs/browser-lifecycle-final.png",
    Buffer.from(screenshot.data, "base64")
);

const report = {
    initial,
    firstStart,
    firstResult,
    returnedToMenu,
    secondStart,
    secondAfterDelay,
    secondAfterTurn,
    browserErrors
};

console.log(JSON.stringify(report, null, 2));

socket.close();
