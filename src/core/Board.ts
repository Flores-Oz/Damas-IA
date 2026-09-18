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

    public isInside(row: number, column: number): boolean {
    return (
        row >= 0 &&
        row < Board.SIZE &&
        column >= 0 &&
        column < Board.SIZE
    );
}

    public isEmpty(row: number, column: number): boolean {
        return this.getCell(row, column) === null;
    }

    public movePiece(
        fromRow: number,
        fromColumn: number,
        toRow: number,
        toColumn: number
    ): void {

        const piece = this.getCell(fromRow, fromColumn);

        if (piece === null) {
            return;
        }

        this.cells[toRow][toColumn] = piece;
        this.cells[fromRow][fromColumn] = null;
    }

    public removePiece(
        row: number,
        column: number
    ): void {
        this.cells[row][column] = null;
    }

    public setCell(
        row: number,
        column: number,
        piece: Piece | null
    ): void {
        this.cells[row][column] = piece;
    }

    public promotePiece(
        row: number,
        column: number
    ): void {
        const piece = this.getCell(row, column);

        if (piece === null) {
            return;
        }

        piece.king = true;
    }

    public shouldPromote(
        row: number,
        column: number
    ): boolean {
        const piece = this.getCell(row, column);

        if (piece === null || piece.king) {
            return false;
        }

        if (piece.player === "human") {
            return row === 0;
        }

        return row === Board.SIZE - 1;
    }
}