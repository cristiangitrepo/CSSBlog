import { CONFIG } from "./config.js";

// Tolerancia para comparar posiciones con decimales
const EPS = 0.01;

export class Mario {
    constructor(nombre, sprite, escenario) {
        this.nombre = nombre;
        this.sprite = sprite;
        this.escenario = escenario;

        this.vidas = 3;
        this.monedas = 0;

        this.x = 20;
        this.y = 0; // altura de los pies sobre el suelo de ladrillos
        this.objetivoX = this.x; // hacia dónde está caminando

        this.velocidadY = 0;
        this.gravedad = CONFIG.GRAVEDAD;
        this.impulsoSalto = CONFIG.IMPULSO_SALTO;
        this.enSuelo = true;

        this.scale = 1;
        this.rotation = 0;

        this.elemento = document.createElement("figure");
        this.elemento.className = "mario";

        // La posición (left/bottom) la controla la física cada fotograma:
        // se anula la transición CSS de "left" y solo se anima el transform.
        this.elemento.style.transition = "transform 0.3s ease";

        this.elemento.innerHTML = `
            <img
                src="${CONFIG.RUTA_IMG}${this.sprite}"
                alt="${this.nombre}"
                draggable="false"
            >
            <figcaption>${this.nombre}</figcaption>
        `;

        this.escenario.appendChild(this.elemento);

        this.actualizar();
    }

    get vidas() {
        return this._vidas;
    }

    set vidas(valor) {
        if (typeof valor !== "number") return;
        this._vidas = Math.max(0, valor);
    }

    actualizar() {
        this.elemento.style.left = `${this.x}px`;
        // CORREGIDO: y se mide desde el suelo de ladrillos, no desde el borde
        this.elemento.style.bottom = `calc(var(--alto-suelo) + ${this.y}px)`;

        this.elemento.style.transform = `
            scale(${this.scale})
            rotate(${this.rotation}deg)
        `;
    }

    // ===================================
    // MOVIMIENTO HORIZONTAL
    // Ya no teletransporta: fija un objetivo y la física camina hacia él.
    // Así Mario puede caminar sobre bloques y caer por sus bordes.
    // ===================================

    get maxX() {
        return this.escenario.clientWidth - this.elemento.offsetWidth;
    }

    avanzar() {
        this.objetivoX = Math.min(this.x + CONFIG.PASO, this.maxX);
        this.mostrarMensaje(`${this.nombre} avanza.`);
    }

    retroceder() {
        this.objetivoX = Math.max(this.x - CONFIG.PASO, 0);
        this.mostrarMensaje(`${this.nombre} retrocede.`);
    }

    // ===================================
    // SALTO
    // ===================================

    saltar() {
        // Solo puede saltar si está apoyado (en el suelo o en un bloque)
        if (!this.enSuelo) return;

        this.velocidadY = this.impulsoSalto;
        this.enSuelo = false;

        this.mostrarMensaje(`${this.nombre} salta.`);
    }

    // ===================================
    // FÍSICAS Y COLISIONES CON BLOQUES
    // Se llama una vez por fotograma desde Juego.bucle()
    // ===================================

    actualizarFisica(delta, bloques) {
        // Caja de colisión (tiene en cuenta el escalado, que se hace
        // desde el centro-abajo, así que el ancho se recorta por los lados)
        const anchoReal = this.elemento.offsetWidth * this.scale;
        const alto = this.elemento.offsetHeight * this.scale;
        const margen = (this.elemento.offsetWidth - anchoReal) / 2;

        const izquierda = () => this.x + margen;
        const derecha = () => this.x + margen + anchoReal;

        // ---------- 1. HORIZONTAL ----------
        const falta = this.objetivoX - this.x;

        if (Math.abs(falta) > 0.5) {
            const dx = Math.sign(falta) * Math.min(Math.abs(falta), CONFIG.VELOCIDAD_X * delta);
            this.x += dx;

            // Los bloques son sólidos por los lados
            for (const bloque of bloques) {
                const solapaEnAltura =
                    this.y < bloque.superior - EPS && this.y + alto > bloque.y + EPS;

                if (!solapaEnAltura) continue;

                const solapaEnAncho =
                    derecha() > bloque.x && izquierda() < bloque.x + bloque.ancho;

                if (solapaEnAncho) {
                    this.x =
                        dx > 0
                            ? bloque.x - anchoReal - margen
                            : bloque.x + bloque.ancho - margen;

                    this.objetivoX = this.x; // se detiene contra el bloque
                }
            }
        }

        // Límites del escenario
        this.x = Math.max(0, Math.min(this.x, this.maxX));
        this.objetivoX = Math.max(0, Math.min(this.objetivoX, this.maxX));

        // ---------- 2. ¿SIGUE APOYADO? ----------
        // Si caminó fuera del borde de un bloque, empieza a caer
        if (this.enSuelo && this.y > EPS) {
            const tieneApoyo = bloques.some(
                (bloque) =>
                    derecha() > bloque.x &&
                    izquierda() < bloque.x + bloque.ancho &&
                    Math.abs(this.y - bloque.superior) < 1
            );

            if (!tieneApoyo) {
                this.enSuelo = false;
                this.velocidadY = 0;
            }
        }

        // ---------- 3. VERTICAL ----------
        if (!this.enSuelo) {
            const yAnterior = this.y;

            this.velocidadY -= this.gravedad * delta;
            this.y += this.velocidadY * delta;

            for (const bloque of bloques) {
                const solapaEnAncho =
                    derecha() > bloque.x && izquierda() < bloque.x + bloque.ancho;

                if (!solapaEnAncho) continue;

                // Cayendo: aterriza si cruza la parte superior del bloque
                if (
                    this.velocidadY <= 0 &&
                    yAnterior >= bloque.superior - EPS &&
                    this.y <= bloque.superior
                ) {
                    this.y = bloque.superior;
                    this.velocidadY = 0;
                    this.enSuelo = true;
                    break;
                }

                // Subiendo: se golpea la cabeza con la base del bloque
                if (
                    this.velocidadY > 0 &&
                    yAnterior + alto <= bloque.y + EPS &&
                    this.y + alto > bloque.y
                ) {
                    this.y = bloque.y - alto;
                    this.velocidadY = 0; // empieza a caer
                    break;
                }
            }
        }

        // ---------- 4. SUELO DEL ESCENARIO ----------
        if (this.y <= 0) {
            this.y = 0;
            this.velocidadY = 0;
            this.enSuelo = true;
        }

        this.actualizar();
    }

    // ===================================
    // TRANSFORMACIONES
    // ===================================

    aumentar() {
        this.scale += 0.2;
        this.actualizar();
        this.mostrarMensaje(`${this.nombre} aumenta de tamaño.`);
    }

    encoger() {
        this.scale = Math.max(0.4, this.scale - 0.2);
        this.actualizar();
        this.mostrarMensaje(`${this.nombre} se encoge.`);
    }

    rotar(grados = 45) {
        this.rotation += grados;
        this.actualizar();
        this.mostrarMensaje(`${this.nombre} rota ${grados} grados.`);
    }

    reiniciar() {
        this.x = 20;
        this.objetivoX = 20;
        this.y = 0;
        this.velocidadY = 0;
        this.enSuelo = true;
        this.scale = 1;
        this.rotation = 0;

        this.actualizar();
        this.mostrarMensaje(`${this.nombre} vuelve a su posición inicial.`);
    }

    duplicar() {
        const clon = new Mario(
            this.nombre + " clon",
            this.sprite,
            this.escenario
        );

        clon.x = this.x + 100;
        clon.objetivoX = clon.x;
        clon.y = this.y;
        clon.velocidadY = this.velocidadY;
        // Si el original está apoyado, la física del clon lo comprobará
        // en el siguiente fotograma (y lo hará caer si no hay bloque debajo).
        clon.enSuelo = this.enSuelo;
        clon.scale = this.scale;
        clon.rotation = this.rotation;

        clon.actualizar();

        this.mostrarMensaje(`${this.nombre} se ha duplicado.`);

        return clon;
    }

    // ===================================
    // MENSAJES Y VIDAS
    // ===================================

    mostrarMensaje(texto) {
        document.querySelector("#info").textContent = texto;
    }

    perderVida() {
        this.vidas--;

        if (this.vidas === 0) {
            this.mostrarMensaje(`${this.nombre} ha perdido todas sus vidas!`);
        } else {
            this.mostrarMensaje(
                `${this.nombre} pierde una vida. Le quedan ${this.vidas}`
            );
        }
    }

    // ===================================
    // COLISIONES CON OTROS ELEMENTOS
    // ===================================

    obtenerZonaColision() {
        const r = this.elemento.getBoundingClientRect();
        const margenX = r.width * 0.15;
        const margenY = r.height * 0.15;

        return {
            left: r.left + margenX,
            right: r.right - margenX,
            top: r.top + margenY,
            bottom: r.bottom - margenY
        };
    }

    toca(rectangulo) {
        const m = this.obtenerZonaColision();

        return (
            m.left < rectangulo.right &&
            m.right > rectangulo.left &&
            m.top < rectangulo.bottom &&
            m.bottom > rectangulo.top
        );
    }

    cogerMoneda(moneda) {
        this.monedas++;
        moneda.recoger();
    }
}
