import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    preload() {
        // Cargar imágenes aquí
    }

    create() {
        // Crear objetos aquí
        this.add.text(400,300, "DAMAS-IA",{
            fontSize: "48px", 
            color: "#FFFFFF"
        }).setOrigin(0.5);
    }

    update(time: number, delta: number) {
        // Lógica de actualización aquí
    }
}