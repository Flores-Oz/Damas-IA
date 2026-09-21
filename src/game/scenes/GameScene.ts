import Phaser from "phaser";

import { GameState } from "../../core/GameState";
import type {
    Move,
    Position
} from "../../core/Move";
import type { Player } from "../../core/Piece";

import { CheckersRules } from "../../rules/CheckersRules";
import { BoardRenderer } from "../board/BoardRenderer";
import type { Agent } from "../../agents/Agent";
import { ReactiveAgent } from "../../agents/ReactiveAgent";
import { GoalAgent } from "../../agents/GoalAgent";

export class GameScene extends Phaser.Scene {

    private gameState!: GameState;
    private boardRenderer!: BoardRenderer;
    private aiAgent: Agent | null = null;
    private agentName = "";

    private selectedMoveOptions: Move[] = [];
    private forcedPiece: Position | null = null;
    private winner: Player | null = null;

    private turnHadCapture = false;
    private turnHadPromotion = false;

    private aiTurnInProgress = false;
    private gameSessionId = 0;
    private pendingAiTimers: Phaser.Time.TimerEvent[] = [];

    constructor() {
        super("GameScene");
    }

    create(): void {

        this.showAgentSelection();

        this.input.on(
            "pointerdown",
            (pointer: Phaser.Input.Pointer) => {

                if (this.aiAgent === null) {
                    return;
                }

                if (
                    this.aiTurnInProgress ||
                    this.gameState.getCurrentPlayer() !== "human"
                ) {
                    return;
                }

                this.handleBoardClick(
                    pointer.x,
                    pointer.y
                );
            }
        );
    }

    // ─── Selección de agente ───────────────────────────────────────────────────

    private showAgentSelection(): void {

        this.clearScreen();

        this.add.text(
            400,
            120,
            "DAMAS IA",
            {
                fontSize: "48px",
                color: "#ffffff"
            }
        ).setOrigin(0.5);

        this.add.text(
            400,
            190,
            "Selecciona el agente",
            {
                fontSize: "24px",
                color: "#cccccc"
            }
        ).setOrigin(0.5);

        this.createAgentButton(
            400,
            280,
            "Agente Reactivo",
            () => {
                this.startGame(
                    new ReactiveAgent(),
                    "Reactivo"
                );
            }
        );

        this.createAgentButton(
            400,
            370,
            "Agente por Objetivos (Minimax)",
            () => {
                this.startGame(
                    new GoalAgent(),
                    "Objetivos - Minimax"
                );
            }
        );
    }

    private createAgentButton(
        x: number,
        y: number,
        label: string,
        onClick: () => void
    ): void {

        const button =
            this.add.rectangle(
                x,
                y,
                380,
                60,
                0x333333
            );

        button
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true });

        const text =
            this.add.text(
                x,
                y,
                label,
                {
                    fontSize: "20px",
                    color: "#ffffff"
                }
            )
            .setOrigin(0.5);

        button.on("pointerover", () => {
            button.setFillStyle(0x555555);
        });

        button.on("pointerout", () => {
            button.setFillStyle(0x333333);
        });

        button.on("pointerdown", (
            _pointer: Phaser.Input.Pointer,
            _localX: number,
            _localY: number,
            event: Phaser.Types.Input.EventData
        ) => {
            event.stopPropagation();
            button.disableInteractive();
            text.setVisible(false);
            onClick();
        });
    }

    private startGame(
        agent: Agent,
        name: string
    ): void {

        this.beginNewSession();

        this.aiAgent = agent;
        this.agentName = name;

        this.gameState = new GameState();

        this.winner = null;
        this.forcedPiece = null;
        this.selectedMoveOptions = [];

        this.turnHadCapture = false;
        this.turnHadPromotion = false;

        this.renderBoard();
    }

    // ─── Pantalla final ────────────────────────────────────────────────────────

    private showGameOver(): void {

        let message: string;

        if (this.gameState.isDraw()) {
            message = "¡EMPATE!";
        } else if (this.winner === "human") {
            message = "¡JUGADOR GANA!";
        } else {
            message = "¡IA GANA!";
        }

        this.add.rectangle(
            400,
            300,
            500,
            300,
            0x111111,
            0.95
        )
        .setStrokeStyle(3, 0xffffff);

        this.add.text(
            400,
            220,
            message,
            {
                fontSize: "36px",
                color: "#ffffff"
            }
        ).setOrigin(0.5);

        this.createEndButton(
            400,
            300,
            "Jugar de nuevo",
            () => {
                this.restartGame();
            }
        );

        this.createEndButton(
            400,
            380,
            "Volver al menú",
            () => {
                this.returnToMenu();
            }
        );
    }

    private createEndButton(
        x: number,
        y: number,
        label: string,
        onClick: () => void
    ): void {

        const button =
            this.add.rectangle(
                x,
                y,
                280,
                50,
                0x333333
            );

        button
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true });

        this.add.text(
            x,
            y,
            label,
            {
                fontSize: "20px",
                color: "#ffffff"
            }
        ).setOrigin(0.5);

        button.on("pointerover", () => {
            button.setFillStyle(0x555555);
        });

        button.on("pointerout", () => {
            button.setFillStyle(0x333333);
        });

        button.on("pointerdown", (
            _pointer: Phaser.Input.Pointer,
            _localX: number,
            _localY: number,
            event: Phaser.Types.Input.EventData
        ) => {
            event.stopPropagation();
            button.disableInteractive();
            onClick();
        });
    }

    private restartGame(): void {

        this.beginNewSession();

        this.gameState = new GameState();

        this.winner = null;
        this.forcedPiece = null;
        this.selectedMoveOptions = [];

        this.turnHadCapture = false;
        this.turnHadPromotion = false;

        this.renderBoard();
    }

    private returnToMenu(): void {

        this.beginNewSession();

        this.aiAgent = null;
        this.agentName = "";

        this.winner = null;
        this.forcedPiece = null;
        this.selectedMoveOptions = [];

        this.turnHadCapture = false;
        this.turnHadPromotion = false;

        this.showAgentSelection();
    }

    private beginNewSession(): void {

        this.gameSessionId++;

        if (this.pendingAiTimers.length > 0) {
            this.time.removeEvent(this.pendingAiTimers);
            this.pendingAiTimers = [];
        }

        this.aiTurnInProgress = false;
    }

    private scheduleAiAction(
        callback: () => void
    ): void {

        const sessionId = this.gameSessionId;

        let timer!: Phaser.Time.TimerEvent;

        timer = this.time.delayedCall(
            500,
            () => {
                this.pendingAiTimers =
                    this.pendingAiTimers.filter(
                        pendingTimer => pendingTimer !== timer
                    );

                if (
                    sessionId !== this.gameSessionId ||
                    this.aiAgent === null ||
                    this.winner !== null ||
                    this.gameState.isDraw() ||
                    this.gameState.getCurrentPlayer() !== "ai"
                ) {
                    if (sessionId === this.gameSessionId) {
                        this.aiTurnInProgress = false;
                    }

                    return;
                }

                callback();
            }
        );

        this.pendingAiTimers.push(timer);
    }

    private clearScreen(): void {

        const gameObjects = [
            ...this.children.getChildren()
        ];

        for (const gameObject of gameObjects) {
            gameObject.destroy();
        }
    }

    // ─── Lógica de movimiento ──────────────────────────────────────────────────

    private executeMove(move: Move): boolean {

        this.gameState.board.movePiece(
            move.from.row,
            move.from.column,
            move.to.row,
            move.to.column
        );

        const wasPromoted =
            this.gameState.board.shouldPromote(
                move.to.row,
                move.to.column
            );

        if (wasPromoted) {
            this.gameState.board.promotePiece(
                move.to.row,
                move.to.column
            );
            this.turnHadPromotion = true;
        }

        if (move.captured) {
            this.gameState.board.removePiece(
                move.captured.row,
                move.captured.column
            );
            this.turnHadCapture = true;
        }

        return wasPromoted;
    }

    private handleBoardClick(
        x: number,
        y: number
    ): void {

        if (
            this.winner !== null ||
            this.gameState.isDraw() ||
            this.aiTurnInProgress ||
            this.gameState.getCurrentPlayer() !== "human"
        ) {
            return;
        }

        const position =
            this.boardRenderer.getBoardPosition(x, y);

        if (position === null) {
            return;
        }

        const selectedMove =
            this.selectedMoveOptions.find(
                move =>
                    move.to.row === position.row &&
                    move.to.column === position.column
            );

        if (selectedMove) {

            const wasPromoted =
                this.executeMove(selectedMove);

            if (
                selectedMove.captured &&
                !wasPromoted
            ) {

                const nextCaptures =
                    CheckersRules.getCapturesForPiece(
                        this.gameState.board,
                        selectedMove.to.row,
                        selectedMove.to.column
                    );

                if (nextCaptures.length > 0) {

                    this.forcedPiece = {
                        row: selectedMove.to.row,
                        column: selectedMove.to.column
                    };

                    this.selectedMoveOptions =
                        nextCaptures;

                    this.renderBoard();

                    for (const move of nextCaptures) {
                        this.boardRenderer.highlightCell(
                            move.to.row,
                            move.to.column
                        );
                    }

                    return;
                }
            }

            this.forcedPiece = null;
            this.selectedMoveOptions = [];

            this.finishTurn();

            if (
                this.winner !== null ||
                this.gameState.isDraw()
            ) {
                return;
            }

            this.runAiTurn();

            return;
        }

        this.selectPiece(
            position.row,
            position.column
        );
    }

    private selectPiece(
        row: number,
        column: number
    ): void {

        if (
            this.forcedPiece !== null &&
            (
                this.forcedPiece.row !== row ||
                this.forcedPiece.column !== column
            )
        ) {
            return;
        }

        const piece =
            this.gameState.board.getCell(
                row,
                column
            );

        if (
            piece === null ||
            piece.player !==
                this.gameState.getCurrentPlayer()
        ) {
            this.selectedMoveOptions = [];
            this.renderBoard();
            return;
        }

        if (this.forcedPiece !== null) {

            this.selectedMoveOptions =
                CheckersRules.getCapturesForPiece(
                    this.gameState.board,
                    row,
                    column
                );

        } else {

            this.selectedMoveOptions =
                CheckersRules.getValidMoves(
                    this.gameState.board,
                    row,
                    column
                );
        }

        this.renderBoard();

        for (const move of this.selectedMoveOptions) {
            this.boardRenderer.highlightCell(
                move.to.row,
                move.to.column
            );
        }
    }

    private finishTurn(): void {

        this.gameState.registerProgress(
            this.turnHadCapture,
            this.turnHadPromotion
        );

        this.turnHadCapture = false;
        this.turnHadPromotion = false;

        this.gameState.changeTurn();

        if (this.gameState.isDraw()) {
            this.renderBoard();
            return;
        }

        if (this.checkGameOver()) {
            return;
        }

        this.renderBoard();
    }

    private runAiTurn(): void {

        if (
            this.aiAgent === null ||
            this.winner !== null ||
            this.gameState.isDraw() ||
            this.aiTurnInProgress
        ) {
            return;
        }

        if (
            this.gameState.getCurrentPlayer() !== "ai"
        ) {
            return;
        }

        const agent = this.aiAgent;

        this.aiTurnInProgress = true;

        this.scheduleAiAction(
            () => {
                const move =
                    agent.chooseMove(
                        this.gameState
                    );

                if (move === null) {
                    this.aiTurnInProgress = false;
                    this.checkGameOver();
                    return;
                }

                this.executeAiMove(move);
            }
        );
    }

    private executeAiMove(
        move: Move
    ): void {

        const wasPromoted =
            this.executeMove(move);

        this.renderBoard();

        if (
            move.captured &&
            !wasPromoted
        ) {

            const nextCaptures =
                CheckersRules.getCapturesForPiece(
                    this.gameState.board,
                    move.to.row,
                    move.to.column
                );

            if (nextCaptures.length > 0) {

                const nextMove =
                    nextCaptures[0];

                this.scheduleAiAction(
                    () => {
                        this.executeAiMove(
                            nextMove
                        );
                    }
                );

                return;
            }
        }

        this.finishTurn();
        this.aiTurnInProgress = false;
    }

    private checkGameOver(): boolean {

        const winner =
            this.gameState.getWinner();

        if (winner === null) {
            return false;
        }

        this.winner = winner;

        this.selectedMoveOptions = [];
        this.forcedPiece = null;

        this.renderBoard();

        return true;
    }

    // ─── Render ────────────────────────────────────────────────────────────────

    private renderBoard(): void {

        this.clearScreen();

        this.boardRenderer =
            new BoardRenderer(
                this,
                this.gameState.board
            );

        this.boardRenderer.render();

        if (
            this.winner !== null ||
            this.gameState.isDraw()
        ) {
            this.showGameOver();
            return;
        }

        const currentPlayer =
            this.gameState.getCurrentPlayer();

        this.add.text(
            20,
            20,
            `Turno: ${
                currentPlayer === "human"
                    ? "Jugador"
                    : "IA"
            }`,
            {
                fontSize: "24px",
                color: "#ffffff"
            }
        );

        this.add.text(
            600,
            20,
            `IA: ${this.agentName}`,
            {
                fontSize: "18px",
                color: "#aaaaaa"
            }
        ).setOrigin(0.5);
    }
}
