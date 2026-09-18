import Phaser from "phaser";
import { Board } from "../../core/Board";

export class BoardRenderer{
    private readonly scene: Phaser.Scene; 
    private readonly tileSize: number;
    private readonly offsetX: number;
    private readonly offsetY: number; 

    constructor(
        scene: Phaser.Scene,
        tileSize = 64,
        offsetX = 144,
        offsetY = 44
    ) {
        this.scene = scene;
        this.tileSize = tileSize;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    public render(): void {
        for (let row = 0; row < Board.SIZE; row++) {
            for (let column = 0; column < Board.SIZE; column++) {
                this.drawCell(row, column);
            }
        }
    }

    private drawCell(row: number, column: number): void {
        const isDark = (row + column) % 2 !== 0;

        const x =
            this.offsetX +
            column * this.tileSize +
            this.tileSize / 2;

        const y =
            this.offsetY +
            row * this.tileSize +
            this.tileSize / 2;

        this.scene.add.rectangle(
            x,
            y,
            this.tileSize,
            this.tileSize,
            isDark ? 0x704214 : 0xdec49c
        );
    }
}
