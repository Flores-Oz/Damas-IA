export class Board {
    public static readonly SIZE = 8;

    private cells: (null)[][];

    constructor(){
        this.cells = Array.from({length: Board.SIZE},
            () => Array(Board.SIZE).fill(null));
    }

   public getCell(row: number, column: number): null{
    return this.cells[row][column];
   }
}