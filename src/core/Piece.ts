export type Player = "human" | "ai";

export interface Piece {
    player: Player;
    king: boolean;
}