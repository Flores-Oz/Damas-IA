import Phaser from "phaser";

import { GameState } from "../../core/GameState";
import type { Move } from "../../core/Move";

import { CheckersRules } from "../../rules/CheckersRules";
import { BoardRenderer } from "../board/BoardRenderer";

export class GameScene extends Phaser.Scene {

    private gameState!: GameState;
    private boardRenderer!: BoardRenderer;

    private selectedMoveOptions: Move[] = [];

    constructor() {
        super("GameScene");
    }

    create(): void {

        this.gameState = new GameState();

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

    private handleBoardClick(
        x: number,
        y: number
    ): void {

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

            this.gameState.board.movePiece(
                selectedMove.from.row,
                selectedMove.from.column,
                selectedMove.to.row,
                selectedMove.to.column
            );

            this.gameState.changeTurn();

            this.selectedMoveOptions = [];

            this.renderBoard();

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

        const piece =
            this.gameState.board.getCell(row, column);

        if (
            piece === null ||
            piece.player !== this.gameState.getCurrentPlayer()
        ) {
            this.selectedMoveOptions = [];
            this.renderBoard();
            return;
        }

        this.selectedMoveOptions =
            CheckersRules.getValidMoves(
                this.gameState.board,
                row,
                column
            );

        this.renderBoard();

        for (
            const move of this.selectedMoveOptions
        ) {
            this.boardRenderer.highlightCell(
                move.to.row,
                move.to.column
            );
        }
    }

    private renderBoard(): void {

        this.children.removeAll();

        this.boardRenderer =
            new BoardRenderer(
                this,
                this.gameState.board
            );

        this.boardRenderer.render();

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