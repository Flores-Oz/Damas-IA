import type { Agent } from "./Agent";
import type { GameState } from "../core/GameState";
import type { Move } from "../core/Move";

import { Board } from "../core/Board";
import { CheckersRules } from "../rules/CheckersRules";

export class ReactiveAgent implements Agent {

    public chooseMove(
        gameState: GameState
    ): Move | null {

        const player =
            gameState.getCurrentPlayer();

        const moves =
            CheckersRules.getAllValidMoves(
                gameState.board,
                player
            );

        if (moves.length === 0) {
            return null;
        }

        // REGLA 1:
        // SI existe captura
        // ENTONCES capturar.
        const captureMove =
            moves.find(
                move =>
                    move.captured !== undefined
            );

        if (captureMove !== undefined) {
            return captureMove;
        }

        // REGLA 2:
        // SI puede coronar
        // ENTONCES coronar.
        const promotionMove =
            moves.find(move => {

                const piece =
                    gameState.board.getCell(
                        move.from.row,
                        move.from.column
                    );

                if (
                    piece === null ||
                    piece.king
                ) {
                    return false;
                }

                if (piece.player === "ai") {
                    return (
                        move.to.row ===
                        Board.SIZE - 1
                    );
                }

                return move.to.row === 0;
            });

        if (promotionMove !== undefined) {
            return promotionMove;
        }

        // REGLA 3:
        // SI una ficha está amenazada
        // ENTONCES intentar mover esa ficha.
        const escapeMove =
            moves.find(move =>
                this.isPieceThreatened(
                    gameState,
                    move.from.row,
                    move.from.column
                )
            );

        if (escapeMove !== undefined) {
            return escapeMove;
        }

        // REGLA 4:
        // SI existe una ficha normal que puede avanzar
        // ENTONCES priorizar la que esté más cerca
        // de la coronación.
        const advanceMove =
            this.findAdvanceMove(
                gameState,
                moves
            );

        if (advanceMove !== null) {
            return advanceMove;
        }

        // REGLA POR DEFECTO
        return moves[0];
    }

    private findAdvanceMove(
        gameState: GameState,
        moves: Move[]
    ): Move | null {

        let bestMove: Move | null = null;
        let bestProgress = -1;

        for (const move of moves) {

            const piece =
                gameState.board.getCell(
                    move.from.row,
                    move.from.column
                );

            if (
                piece === null ||
                piece.king
            ) {
                continue;
            }

            const progress =
                piece.player === "ai"
                    ? move.to.row
                    : Board.SIZE - 1 - move.to.row;

            if (progress > bestProgress) {
                bestProgress = progress;
                bestMove = move;
            }
        }

        return bestMove;
    }

    private isPieceThreatened(
        gameState: GameState,
        row: number,
        column: number
    ): boolean {

        const opponentMoves =
            CheckersRules.getAllValidMoves(
                gameState.board,
                "human"
            );

        return opponentMoves.some(
            move =>
                move.captured?.row === row &&
                move.captured?.column === column
        );
    }
}
