import Phaser from "phaser";

import { GameState } from "../../core/GameState";
import type {
    Move,
    Position
} from "../../core/Move";
import type { Player } from "../../core/Piece";

import { CheckersRules } from "../../rules/CheckersRules";
import { BoardRenderer } from "../board/BoardRenderer";
import { ReactiveAgent } from "../../agents/ReactiveAgent";

export class GameScene extends Phaser.Scene {

    private gameState!: GameState;
    private boardRenderer!: BoardRenderer;
    private aiAgent!: ReactiveAgent;

    private selectedMoveOptions: Move[] = [];
    private forcedPiece: Position | null = null;
    private winner: Player | null = null;

    constructor() {
        super("GameScene");
    }

    create(): void {

        this.gameState = new GameState();
        this.aiAgent = new ReactiveAgent();

        this.renderBoard();

        this.input.on(
            "pointerdown",
            (pointer: Phaser.Input.Pointer) => {
                this.handleBoardClick(
                    pointer.x,
                    pointer.y
                );
            }
        );
    }

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
        }

        if (move.captured) {
            this.gameState.board.removePiece(
                move.captured.row,
                move.captured.column
            );
        }

        return wasPromoted;
    }

    private handleBoardClick(
        x: number,
        y: number
    ): void {

        if (this.winner !== null) {
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

            this.gameState.changeTurn();

            if (this.checkGameOver()) {
                return;
            }

            this.renderBoard();

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

    private runAiTurn(): void {

        if (
            this.gameState.getCurrentPlayer() !== "ai"
        ) {
            return;
        }

        this.time.delayedCall(
            500,
            () => {
                const move =
                    this.aiAgent.chooseMove(
                        this.gameState
                    );

                if (move === null) {
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

                this.time.delayedCall(
                    500,
                    () => {
                        this.executeAiMove(
                            nextMove
                        );
                    }
                );

                return;
            }
        }

        this.gameState.changeTurn();

        if (this.checkGameOver()) {
            return;
        }

        this.renderBoard();
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

    private renderBoard(): void {

        this.children.removeAll();

        this.boardRenderer =
            new BoardRenderer(
                this,
                this.gameState.board
            );

        this.boardRenderer.render();

        if (this.winner !== null) {

            this.add.text(
                400,
                570,
                this.winner === "human"
                    ? "¡Jugador gana!"
                    : "¡IA gana!",
                {
                    fontSize: "28px",
                    color: "#ffffff"
                }
            ).setOrigin(0.5);

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
    }
}