import { Board } from "./Board";
import type { Player } from "./Piece";
import { CheckersRules } from "../rules/CheckersRules";

export class GameState {

    public readonly board: Board;

    private currentPlayer: Player;

    constructor() {
        this.board = new Board();
        this.currentPlayer = "human";
    }

    public getCurrentPlayer(): Player {
        return this.currentPlayer;
    }

    public changeTurn(): void {
        this.currentPlayer =
            this.currentPlayer === "human"
                ? "ai"
                : "human";
    }

    public getWinner(): Player | null {

        const humanPieces =
            this.board.countPieces("human");

        const aiPieces =
            this.board.countPieces("ai");

        if (humanPieces === 0) {
            return "ai";
        }

        if (aiPieces === 0) {
            return "human";
        }

        const currentMoves =
            CheckersRules.getAllValidMoves(
                this.board,
                this.currentPlayer
            );

        if (currentMoves.length === 0) {
            return this.currentPlayer === "human"
                ? "ai"
                : "human";
        }

        return null;
    }
}
