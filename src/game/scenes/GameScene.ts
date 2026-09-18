import Phaser from "phaser";
import { Board } from "../../core/Board";
import { BoardRenderer } from "../board/BoardRenderer";

export class GameScene extends Phaser.Scene {

    private board: Board;
    
    constructor() {
        super("GameScene");
    }

    preload() {
        // Cargar imágenes aquí
    }

    create():void {
        // Crear objetos aquí
       this.board = new Board();
       const boardRenderer = new BoardRenderer(this);
       boardRenderer.render();   
    }

    update(time: number, delta: number) {
        // Lógica de actualización aquí
    }
}