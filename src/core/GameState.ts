import { Board } from "./Board";
import type { Player } from "./Piece";

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
}
