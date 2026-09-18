import { Board } from "../core/Board";
import type { Move } from "../core/Move";
import type { Piece, Player } from "../core/Piece";

export class CheckersRules {

    public static getAllValidMoves(
        board: Board,
        player: Player
    ): Move[] {

        const allMoves: Move[] = [];

        for (let row = 0; row < Board.SIZE; row++) {
            for (let column = 0; column < Board.SIZE; column++) {

                const piece = board.getCell(row, column);

                if (
                    piece === null ||
                    piece.player !== player
                ) {
                    continue;
                }

                const moves = this.getValidMoves(
                    board,
                    row,
                    column
                );

                allMoves.push(...moves);
            }
        }

        return allMoves;
    }

    public static hasAnyCapture(
        board: Board,
        player: Player
    ): boolean {

        for (let row = 0; row < Board.SIZE; row++) {
            for (let column = 0; column < Board.SIZE; column++) {

                const piece = board.getCell(row, column);

                if (
                    piece === null ||
                    piece.player !== player
                ) {
                    continue;
                }

                const captures = this.getCaptureMoves(
                    board,
                    row,
                    column
                );

                if (captures.length > 0) {
                    return true;
                }
            }
        }

        return false;
    }

    public static getCapturesForPiece(
        board: Board,
        row: number,
        column: number
    ): Move[] {
        return this.getCaptureMoves(
            board,
            row,
            column
        );
    }

    public static getValidMoves(
        board: Board,
        row: number,
        column: number
    ): Move[] {

        const piece = board.getCell(row, column);

        if (piece === null) {
            return [];
        }

        const captures = this.getCaptureMoves(
            board,
            row,
            column
        );

        const playerMustCapture =
            this.hasAnyCapture(
                board,
                piece.player
            );

        if (playerMustCapture) {
            return captures;
        }

        return this.getNormalMoves(
            board,
            row,
            column
        );
    }

    private static getNormalMoves(
        board: Board,
        row: number,
        column: number
    ): Move[] {

        const piece = board.getCell(row, column);

        if (piece === null) {
            return [];
        }

        const moves: Move[] = [];

        const directions =
            this.getDirections(piece);

        for (
            const [rowDirection, columnDirection]
            of directions
        ) {

            const targetRow =
                row + rowDirection;

            const targetColumn =
                column + columnDirection;

            if (
                board.isInside(
                    targetRow,
                    targetColumn
                ) &&
                board.isEmpty(
                    targetRow,
                    targetColumn
                )
            ) {
                moves.push({
                    from: { row, column },

                    to: {
                        row: targetRow,
                        column: targetColumn
                    }
                });
            }
        }

        return moves;
    }

    private static getCaptureMoves(
        board: Board,
        row: number,
        column: number
    ): Move[] {

        const piece = board.getCell(row, column);

        if (piece === null) {
            return [];
        }

        const captures: Move[] = [];

        const directions =
            this.getDirections(piece);

        for (
            const [rowDirection, columnDirection]
            of directions
        ) {

            const enemyRow =
                row + rowDirection;

            const enemyColumn =
                column + columnDirection;

            const landingRow =
                row + rowDirection * 2;

            const landingColumn =
                column + columnDirection * 2;

            if (
                !board.isInside(
                    landingRow,
                    landingColumn
                )
            ) {
                continue;
            }

            const possibleEnemy =
                board.getCell(
                    enemyRow,
                    enemyColumn
                );

            if (
                possibleEnemy !== null &&
                possibleEnemy.player !== piece.player &&
                board.isEmpty(
                    landingRow,
                    landingColumn
                )
            ) {
                captures.push({
                    from: {
                        row,
                        column
                    },

                    to: {
                        row: landingRow,
                        column: landingColumn
                    },

                    captured: {
                        row: enemyRow,
                        column: enemyColumn
                    }
                });
            }
        }

        return captures;
    }

    private static getDirections(
        piece: Piece
    ): [number, number][] {

        if (piece.king) {
            return [
                [-1, -1],
                [-1, 1],
                [1, -1],
                [1, 1]
            ];
        }

        if (piece.player === "human") {
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