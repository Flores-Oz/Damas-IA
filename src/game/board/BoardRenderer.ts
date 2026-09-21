import Phaser from "phaser";
import { Board } from "../../core/Board";
import { PieceRenderer } from "../pieces/PieceRenderer";
import { GAME_THEME } from "../ui/GameTheme";

export class BoardRenderer {

    private readonly scene: Phaser.Scene;
    private readonly board: Board;
    private readonly tileSize: number;
    private readonly offsetX: number;
    private readonly offsetY: number;
    private readonly pieceRenderer: PieceRenderer;

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
        this.pieceRenderer = new PieceRenderer(scene);
    }

    public render(): void {
        this.drawFrame();

        for (let row = 0; row < Board.SIZE; row++) {
            for (
                let column = 0;
                column < Board.SIZE;
                column++
            ) {
                this.drawCell(row, column);

                const piece =
                    this.board.getCell(row, column);

                if (piece !== null) {
                    const { x, y } =
                        this.getCellCenter(row, column);

                    this.pieceRenderer.render(
                        x,
                        y,
                        piece,
                        this.tileSize
                    );
                }
            }
        }
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

        return { row, column };
    }

    public highlightCell(
        row: number,
        column: number
    ): void {
        const { x, y } =
            this.getCellCenter(row, column);

        this.scene.add.rectangle(
            x,
            y,
            this.tileSize - 8,
            this.tileSize - 8,
            GAME_THEME.highlight,
            0.34
        ).setStrokeStyle(
            2,
            GAME_THEME.highlight,
            0.9
        );

        this.scene.add.circle(
            x,
            y,
            7,
            GAME_THEME.highlight,
            0.9
        );
    }

    private drawFrame(): void {
        const boardSize = Board.SIZE * this.tileSize;
        const centerX = this.offsetX + boardSize / 2;
        const centerY = this.offsetY + boardSize / 2;

        this.scene.add.rectangle(
            centerX,
            centerY + 5,
            boardSize + 22,
            boardSize + 22,
            0x000000,
            0.35
        );

        this.scene.add.rectangle(
            centerX,
            centerY,
            boardSize + 18,
            boardSize + 18,
            GAME_THEME.boardFrame
        ).setStrokeStyle(3, GAME_THEME.gold);
    }

    private drawCell(
        row: number,
        column: number
    ): void {
        const isDark = (row + column) % 2 !== 0;
        const { x, y } =
            this.getCellCenter(row, column);

        this.scene.add.rectangle(
            x,
            y,
            this.tileSize,
            this.tileSize,
            isDark
                ? GAME_THEME.boardDark
                : GAME_THEME.boardLight
        );
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
}
