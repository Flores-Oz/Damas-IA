import type { Agent } from "./Agent";
import type { GameState } from "../core/GameState";
import type { Move } from "../core/Move";
import type { Player } from "../core/Piece";

import { Board } from "../core/Board";
import { CheckersRules } from "../rules/CheckersRules";

export class GoalAgent implements Agent {

    private readonly maxDepth = 4;

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

        let bestMove: Move | null = null;
        let bestScore = -Infinity;

        for (const move of moves) {

            const resultingBoards =
                this.simulateMove(
                    gameState.board,
                    move
                );

            let moveScore = -Infinity;

            for (const resultingBoard of resultingBoards) {

                const score =
                    this.minimax(
                        resultingBoard,
                        this.getOpponent(player),
                        player,
                        this.maxDepth - 1
                    );

                moveScore =
                    Math.max(
                        moveScore,
                        score
                    );
            }

            if (moveScore > bestScore) {
                bestScore = moveScore;
                bestMove = move;
            }
        }

        return bestMove;
    }

    private simulateMove(
        board: Board,
        move: Move
    ): Board[] {

        const simulation = board.clone();

        simulation.applyMove(move);

        // Si no fue captura, la jugada terminó.
        if (move.captured === undefined) {
            return [simulation];
        }

        const movedPiece =
            simulation.getCell(
                move.to.row,
                move.to.column
            );

        if (movedPiece === null) {
            return [simulation];
        }

        // Si la captura produjo coronación,
        // nuestra variante termina la secuencia.
        const originalPiece =
            board.getCell(
                move.from.row,
                move.from.column
            );

        if (
            originalPiece !== null &&
            !originalPiece.king &&
            movedPiece.king
        ) {
            return [simulation];
        }

        const nextCaptures =
            CheckersRules.getCapturesForPiece(
                simulation,
                move.to.row,
                move.to.column
            );

        if (nextCaptures.length === 0) {
            return [simulation];
        }

        const results: Board[] = [];

        for (const nextCapture of nextCaptures) {

            const continuationBoards =
                this.simulateMove(
                    simulation,
                    nextCapture
                );

            results.push(
                ...continuationBoards
            );
        }

        return results;
    }

    private evaluate(
        board: Board,
        maximizingPlayer: Player
    ): number {

        let score = 0;

        for (let row = 0; row < Board.SIZE; row++) {

            for (
                let column = 0;
                column < Board.SIZE;
                column++
            ) {

                const piece =
                    board.getCell(row, column);

                if (piece === null) {
                    continue;
                }

                let value =
                    piece.king ? 3 : 1;

                // Pequeña recompensa por progreso
                if (!piece.king) {
                    if (piece.player === "ai") {
                        value += row * 0.1;
                    } else {
                        value +=
                            (Board.SIZE - 1 - row) * 0.1;
                    }
                }

                if (
                    piece.player ===
                    maximizingPlayer
                ) {
                    score += value;
                } else {
                    score -= value;
                }
            }
        }

        return score;
    }

    private minimax(
        board: Board,
        currentPlayer: Player,
        maximizingPlayer: Player,
        depth: number
    ): number {

        const moves =
            CheckersRules.getAllValidMoves(
                board,
                currentPlayer
            );

        if (
            depth === 0 ||
            moves.length === 0
        ) {

            if (moves.length === 0) {

                return currentPlayer === maximizingPlayer
                    ? -1000
                    : 1000;
            }

            return this.evaluate(
                board,
                maximizingPlayer
            );
        }

        const nextPlayer =
            this.getOpponent(currentPlayer);

        if (
            currentPlayer ===
            maximizingPlayer
        ) {

            let bestScore = -Infinity;

            for (const move of moves) {

                const resultingBoards =
                    this.simulateMove(
                        board,
                        move
                    );

                for (
                    const resultingBoard
                    of resultingBoards
                ) {

                    const score =
                        this.minimax(
                            resultingBoard,
                            nextPlayer,
                            maximizingPlayer,
                            depth - 1
                        );

                    bestScore =
                        Math.max(
                            bestScore,
                            score
                        );
                }
            }

            return bestScore;
        }

        let bestScore = Infinity;

        for (const move of moves) {

            const resultingBoards =
                this.simulateMove(
                    board,
                    move
                );

            for (
                const resultingBoard
                of resultingBoards
            ) {

                const score =
                    this.minimax(
                        resultingBoard,
                        nextPlayer,
                        maximizingPlayer,
                        depth - 1
                    );

                bestScore =
                    Math.min(
                        bestScore,
                        score
                    );
            }
        }

        return bestScore;
    }

    private getOpponent(
        player: Player
    ): Player {

        return player === "ai"
            ? "human"
            : "ai";
    }
}
