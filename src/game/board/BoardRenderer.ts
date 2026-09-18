import Phaser from "phaser";
import { Board } from "../../core/Board";
import type { Piece } from "../../core/Piece";

export class BoardRenderer {

    private readonly scene: Phaser.Scene;
    private readonly board: Board;

    private readonly tileSize: number;
    private readonly offsetX: number;
    private readonly offsetY: number;

    constructor(
        scene: Phaser.Scene,
        board: Board,
        tileSize = 64,
        offsetX = 144,
        offsetY = 44
    ) {
        this.scene = scene;
        this.board = board;
        this.tileSize = tileSize;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    public render(): void {
        for (let row = 0; row < Board.SIZE; row++) {
            for (let column = 0; column < Board.SIZE; column++) {
                this.drawCell(row, column);

                const piece = this.board.getCell(row, column);

                if (piece !== null) {
                    this.drawPiece(row, column, piece);
                }
            }
        }
    }

    private drawCell(row: number, column: number): void {
        const isDark = (row + column) % 2 !== 0;

        const { x, y } = this.getCellCenter(row, column);

        this.scene.add.rectangle(
            x,
            y,
            this.tileSize,
            this.tileSize,
            isDark ? 0x704214 : 0xdec49c
        );
    }

    private drawPiece(
        row: number,
        column: number,
        piece: Piece
    ): void {
        const { x, y } = this.getCellCenter(row, column);

        const color =
            piece.player === "human"
                ? 0xe8e8e8
                : 0x202020;

        const pieceRadius = this.tileSize * 0.36;

        const circle = this.scene.add.circle(
            x,
            y,
            pieceRadius,
            color
        );

        circle.setStrokeStyle(
            3,
            piece.player === "human"
                ? 0xaaaaaa
                : 0x555555
        );

        if (piece.king) {
            this.scene.add.text(
                x,
                y,
                "♛",
                {
                    fontSize: "32px",
                    color:
                        piece.player === "human"
                            ? "#222222"
                            : "#ffffff"
                }
            ).setOrigin(0.5);
        }
    }

    private getCellCenter(
        row: number,
        column: number
    ): { x: number; y: number } {
        return {
            x:
                this.offsetX +
                column * this.tileSize +
                this.tileSize / 2,

            y:
                this.offsetY +
                row * this.tileSize +
                this.tileSize / 2
        };
    }
    public getBoardPosition(
        x: number,
        y: number
    ): { row: number; column: number } | null {

        const column = Math.floor(
            (x - this.offsetX) / this.tileSize
        );

        const row = Math.floor(
            (y - this.offsetY) / this.tileSize
        );

        if (
            row < 0 ||
            row >= Board.SIZE ||
            column < 0 ||
            column >= Board.SIZE
        ) {
            return null;
        }

        return {
            row,
            column
        };
    }

    public highlightCell(
        row: number,
        column: number
    ): void {

        const { x, y } = this.getCellCenter(
            row,
            column
        );

        this.scene.add.rectangle(
            x,
            y,
            this.tileSize - 8,
            this.tileSize - 8,
            0x00ff00,
            0.35
        );
    }
}