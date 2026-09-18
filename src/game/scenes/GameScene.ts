import Phaser from "phaser";

import { Board } from "../../core/Board";
import type { Move } from "../../core/Move";

import { CheckersRules } from "../../rules/CheckersRules";
import { BoardRenderer } from "../board/BoardRenderer";

export class GameScene extends Phaser.Scene {

    private board!: Board;
    private boardRenderer!: BoardRenderer;

    private selectedMoveOptions: Move[] = [];

    constructor() {
        super("GameScene");
    }

    create(): void {

        this.board = new Board();

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

            this.board.movePiece(
                selectedMove.from.row,
                selectedMove.from.column,
                selectedMove.to.row,
                selectedMove.to.column
            );

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
            this.board.getCell(row, column);

        if (
            piece === null ||
            piece.player !== "human"
        ) {
            this.selectedMoveOptions = [];
            this.renderBoard();
            return;
        }

        this.selectedMoveOptions =
            CheckersRules.getValidMoves(
                this.board,
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
                this.board
            );

        this.boardRenderer.render();
    }
}