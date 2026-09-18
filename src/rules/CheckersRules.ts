import { Board } from "../core/Board";
import type { Move } from "../core/Move";
import type { Player } from "../core/Piece";

export class CheckersRules {

    public static getValidMoves(
        board: Board,
        row: number,
        column: number
    ): Move[] {

        const piece = board.getCell(row, column);

        if (piece === null) {
            return [];
        }

        const moves: Move[] = [];

        const directions = this.getDirections(piece.player);

        for (const [rowDirection, columnDirection] of directions) {

            const targetRow = row + rowDirection;
            const targetColumn = column + columnDirection;

            if (
                board.isInside(targetRow, targetColumn) &&
                board.isEmpty(targetRow, targetColumn)
            ) {
                moves.push({
                    from: {
                        row,
                        column
                    },
                    to: {
                        row: targetRow,
                        column: targetColumn
                    }
                });
            }
        }

        return moves;
    }

    private static getDirections(
        player: Player
    ): [number, number][] {

        if (player === "human") {
            return [
                [-1, -1],
                [-1, 1]
            ];
        }

        return [
            [1, -1],
            [1, 1]
        ];
    }
}