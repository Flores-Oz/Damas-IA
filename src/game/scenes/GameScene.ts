import Phaser from "phaser";
import { Board } from "../../core/Board";
import { BoardRenderer } from "../board/BoardRenderer";

export class GameScene extends Phaser.Scene {

    private board!: Board;

    constructor() {
        super("GameScene");
    }

    create(): void {
        this.board = new Board();

        const boardRenderer = new BoardRenderer(
            this,
            this.board
        );

        boardRenderer.render();
    }
}