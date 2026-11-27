// ===================================
// CONFIGURACIÓN
// Todos los "números mágicos" y listas de datos en un único sitio.
// Si hay que cambiar algo del juego, se cambia aquí.
// ===================================

export const CONFIG = {
    // Carpeta de las imágenes (relativa al HTML)
    RUTA_IMG: "./img/",

    // prettier-ignore
    SPRITES: [
        "mario.webp",
        "luigi.webp",
        "yoshi.webp",
        "bowser.webp",
        "king-boo.webp",
        "lakitu.webp",
        "setaAzul.webp",
        "wario.webp"
    ],

    NOMBRES: ["Mario", "Luigi", "Yoshi", "Bowser", "King-Boo", "Lakitu", "Seta Azul", "Wario"],

    // Monedas que aparecen en cada tanda
    CANTIDAD_MONEDAS: 8,

    // (Ya no se usa para mover a Mario; se conserva por compatibilidad)
    VELOCIDAD: 800,

    // NUEVO: movimiento horizontal
    PASO: 100, // px que avanza/retrocede cada pulsación
    VELOCIDAD_X: 500, // px por segundo al caminar

    // NUEVO: físicas
    GRAVEDAD: 1800, // px/s²
    IMPULSO_SALTO: 750, // px/s (altura máx. ≈ 136 px)
};
