import { CONFIG } from "./config.js";
import { Mario } from "./Mario.js";
import { Moneda } from "./Moneda.js";
import { Bloque } from "./Bloque.js";

// ===================================
// CLASE JUEGO
// Es el "director": guarda el estado (qué personajes y monedas hay)
// y coordina a Mario y Moneda. Antes eran variables globales sueltas.
// Depende de: CONFIG, Mario, Moneda
// ===================================

export class Juego {
    constructor(escenario) {
        this.escenario = escenario;

        this.marios = []; // todos los personajes
        this.marioActivo = null; // el que recibe las órdenes
        this.contadorMario = 0; // para elegir el siguiente nombre y sprite

        // NUEVO: bloques del escenario
        this.bloques = [];

        this.monedas = []; // monedas que hay ahora en el escenario
        this.totalMonedas = 0; // monedas recogidas entre todos

        this.marcador = document.querySelector("#contadorMonedas");

        // Para calcular el tiempo entre fotogramas (delta)
        this.ultimoTiempo = performance.now();
    }

    // ===================================
    // ARRANQUE
    // ===================================

    iniciar() {
        this.generarMonedas();
        this.generarBloques();
        this.bucle();
    }

    generarBloques() {
        this.crearBloque({ x: 200, y: 60,  ancho: 150, alto: 25 });
        this.crearBloque({ x: 450, y: 190, ancho: 130, alto: 25 });
        this.crearBloque({ x: 700, y: 200, ancho: 220, alto: 30 });
    }

    // ===================================
    // PERSONAJES
    // ===================================

    crearMario() {
        // Siguiente personaje de la lista (vuelve al principio al acabar)
        const indice = this.contadorMario % CONFIG.NOMBRES.length;
        const nombre = CONFIG.NOMBRES[indice];
        const sprite = CONFIG.SPRITES[indice];

        const nuevoMario = new Mario(nombre, sprite, this.escenario);

        this.registrar(nuevoMario);
        this.contadorMario++;

        nuevoMario.mostrarMensaje(`${nombre} ha sido creado.`);

        return nuevoMario;
    }

    /**
     * Guarda el personaje en la lista y lo convierte en el activo
     */
    registrar(mario) {
        this.marios.push(mario);
        this.marioActivo = mario;
    }

    cambiarMarioActivo() {
        if (this.marios.length === 0) return;

        const indice = (this.marios.indexOf(this.marioActivo) + 1) % this.marios.length;

        this.marioActivo = this.marios[indice];
        this.marioActivo.mostrarMensaje(`${this.marioActivo.nombre} es ahora el personaje activo.`);
    }

    duplicarActivo() {
        if (!this.marioActivo) return;

        this.registrar(this.marioActivo.duplicar());
    }

        // ===================================
    // BLOQUES
    // ===================================

    /**
     * Añade un bloque al escenario.
     *
     * x: posición horizontal
     * y: altura desde el suelo
     * ancho: anchura del bloque
     * alto: altura del bloque
     */
    crearBloque({
        x = 200,
        y = 100,
        ancho = 120,
        alto = 25
    } = {}) {
        const bloque = new Bloque(
            this.escenario,
            x,
            y,
            ancho,
            alto
        );

        this.bloques.push(bloque);

        return bloque;
    }

    eliminarBloque(bloque) {
        bloque.eliminar();

        this.bloques = this.bloques.filter(
            b => b !== bloque
        );
    }

    // ===================================
    // MONEDAS
    // ===================================

    generarMonedas(cantidad = CONFIG.CANTIDAD_MONEDAS) {
        for (let i = 0; i < cantidad; i++) {
            this.monedas.push(new Moneda(this.escenario));
        }
    }

    recogerMoneda(mario, moneda) {
        mario.cogerMoneda(moneda);

        this.monedas = this.monedas.filter((m) => m !== moneda);

        this.totalMonedas++;
        this.marcador.textContent = this.totalMonedas;

        let mensaje = `${mario.nombre} coge una moneda (lleva ${mario.monedas}).`;

        // Si era la última, programamos una tanda nueva
        if (this.monedas.length === 0) {
            mensaje += " ¡Era la última! Aparecen monedas nuevas.";
            setTimeout(() => this.generarMonedas(), 800);
        }

        mario.mostrarMensaje(mensaje);
    }

    // ===================================
    // COLISIONES
    // ===================================

    comprobarColisiones() {
        // [...] copia el array: recogerMoneda() lo modifica mientras lo recorremos
        for (const moneda of [...this.monedas]) {
            if (moneda.recogida) continue;

            const rectMoneda = moneda.elemento.getBoundingClientRect();
            const mario = this.marios.find((m) => m.toca(rectMoneda));

            if (mario) {
                this.recogerMoneda(mario, moneda);
            }
        }
    }

    /**
     * Bucle del juego: se repite en cada fotograma.
     * 1) Aplica la física (gravedad, salto, bloques) a cada personaje.
     * 2) Comprueba las colisiones con las monedas.
     */
    bucle(tiempo = performance.now()) {
        // Segundos desde el fotograma anterior (con tope para que, si la
        // pestaña estuvo en segundo plano, nadie "atraviese" un bloque)
        const delta = Math.min((tiempo - this.ultimoTiempo) / 1000, 0.05);
        this.ultimoTiempo = tiempo;

        for (const mario of this.marios) {
            mario.actualizarFisica(delta, this.bloques);
        }

        this.comprobarColisiones();

        requestAnimationFrame((t) => this.bucle(t));
    }
}
