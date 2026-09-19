import type { GameState } from "../core/GameState";
import type { Move } from "../core/Move";

export interface Agent {

    chooseMove(
        gameState: GameState
    ): Move | null;
}
