export interface Position {
    row: number;
    column: number;
}

export interface Move {
    from: Position;
    to: Position;
    captured?: Position;
}