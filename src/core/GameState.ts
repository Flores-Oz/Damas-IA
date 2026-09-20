import { Board } from "./Board";
import type { Player } from "./Piece";
import { CheckersRules } from "../rules/CheckersRules";

export class GameState {

    public readonly board: Board;

    private currentPlayer: Player;

    private movesWithoutProgress = 0;

    private readonly drawLimit = 40;

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

    public registerProgress(
        captured: boolean,
        promoted: boolean
    ): void {

        if (captured || promoted) {
            this.movesWithoutProgress = 0;
            return;
        }

        this.movesWithoutProgress++;
    }

    public isDraw(): boolean {
        return this.movesWithoutProgress >= this.drawLimit;
    }

    public getMovesWithoutProgress(): number {
        return this.movesWithoutProgress;
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
