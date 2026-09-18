import type { Piece } from "./Piece";

export class Board {
    public static readonly SIZE = 8;

    private cells: (Piece | null)[][];

     constructor() {
        this.cells = Array.from(
            { length: Board.SIZE },
            () => Array<Piece | null>(Board.SIZE).fill(null)
        );

        this.initializePieces();
    }

    public getCell(row: number, column: number): Piece | null {
        return this.cells[row][column];
    }

    private initializePieces(): void {
        for (let row = 0; row < 3; row++) {
            for (let column = 0; column < Board.SIZE; column++) {
                if (this.isPlayableCell(row, column)) {
                    this.cells[row][column] = {
                        player: "ai",
                        king: false
                    };
                }
            }
        }

        for (let row = 5; row < Board.SIZE; row++) {
            for (let column = 0; column < Board.SIZE; column++) {
                if (this.isPlayableCell(row, column)) {
                    this.cells[row][column] = {
                        player: "human",
                        king: false
                    };
                }
            }
        }
    }

    private isPlayableCell(row: number, column: number): boolean {
        return (row + column) % 2 !== 0;
    }
}