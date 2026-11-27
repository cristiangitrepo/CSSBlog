// ===================================
// CLASE BLOQUE
// Plataforma sólida. Sus coordenadas son las de la lógica del juego:
//   x: píxeles desde la izquierda del escenario
//   y: altura de la BASE del bloque sobre el suelo de ladrillos
// La parte superior (donde se pisa) es y + alto.
// ===================================

export class Bloque {
    constructor(escenario, x, y, ancho, alto) {
        this.x = x;
        this.y = y;
        this.ancho = ancho;
        this.alto = alto;

        this.elemento = document.createElement("div");
        this.elemento.className = "bloque";
        this.elemento.setAttribute("aria-hidden", "true");

        this.elemento.style.left = `${x}px`;
        // Mismo origen que Mario y las monedas: encima del suelo
        this.elemento.style.bottom = `calc(var(--alto-suelo) + ${y}px)`;
        this.elemento.style.width = `${ancho}px`;
        this.elemento.style.height = `${alto}px`;

        escenario.appendChild(this.elemento);
    }

    get superior() {
        return this.y + this.alto;
    }

    eliminar() {
        this.elemento.remove();
    }
}
