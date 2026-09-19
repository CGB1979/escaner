function actualizarOpcionesPlaya() {

    const esJ = esPlayaEspecial(playaSelect.value);

    modoPares.parentElement.classList.toggle("hidden", esJ);
    modoImpares.parentElement.classList.toggle("hidden", esJ);
    modoContinua.parentElement.classList.remove("hidden");

    let opcionFila = document.getElementById("modoPorFilaContainer");
    let opcionZigZag = document.getElementById("modoZigZagContainer");

    if (esJ) {
        const modoSeleccionado = obtenerModoNumeracion();
        if (!["continua", "porFila", "zigzag"].includes(modoSeleccionado)) {
            modoContinua.checked = true;
            configuracionNumeracion.modo = "continua";
            configuracionNumeracion.inversa = false;
        }

        if (!opcionFila) {
            opcionFila = document.createElement("div");
            opcionFila.id = "modoPorFilaContainer";
            opcionFila.className = "numbering-option";
            opcionFila.innerHTML = `
                <input type="radio" name="modoNumeracion" id="modoPorFila" value="porFila">
                <label for="modoPorFila">Por fila</label>
            `;
            document.querySelector(".numbering-options").appendChild(opcionFila);
            document.getElementById("modoPorFila").addEventListener("change", function() {
                ajustarNumeroInicialPorModo();
            });
        } else {
            opcionFila.classList.remove("hidden");
        }

        if (!opcionZigZag) {
            opcionZigZag = document.createElement("div");
            opcionZigZag.id = "modoZigZagContainer";
            opcionZigZag.className = "numbering-option";
            opcionZigZag.innerHTML = `
                <input type="radio" name="modoNumeracion" id="modoZigZag" value="zigzag">
                <label for="modoZigZag">ZigZag</label>
            `;
            document.querySelector(".numbering-options").appendChild(opcionZigZag);
            document.getElementById("modoZigZag").addEventListener("change", function() {
                ajustarNumeroInicialPorModo();
            });
        } else {
            opcionZigZag.classList.remove("hidden");
        }

        const radioActual = document.querySelector(
            'input[name="modoNumeracion"][value="' + obtenerModoNumeracion() + '"]'
        );
        if (radioActual) radioActual.checked = true;

        actualizarFilaSegunCapacidad();
        actualizarControlesPlaya();
        return;
    }

    if (opcionFila) opcionFila.classList.add("hidden");
    if (opcionZigZag) opcionZigZag.classList.add("hidden");

    const modoNormal = obtenerModoNumeracion();
    if (!["continua", "pares", "impares"].includes(modoNormal)) {
        modoContinua.checked = true;
        configuracionNumeracion.modo = "continua";
        configuracionNumeracion.inversa = false;
    }

    organizarControlesInicio();
    actualizarControlesPlaya();
}

function obtenerCochesPorCarril() {
    if (!cochesPorCarril) return 5;
    let cantidad = parseInt(cochesPorCarril.value, 10);
    if (!Number.isFinite(cantidad) || cantidad < 1 || cantidad > 6) {
        cantidad = 5;
        cochesPorCarril.value = String(cantidad);
    }
    return cantidad;
}

function actualizarFilaSegunCapacidad() {
    if (!filaInicial) return;

    const capacidad = obtenerCochesPorCarril();
    const valorActual = parseInt(filaInicial.value, 10);
    const valorSeguro = Number.isFinite(valorActual) && valorActual >= 1 && valorActual <= capacidad
        ? valorActual
        : 1;

    filaInicial.replaceChildren();
    for (let i = 1; i <= capacidad; i++) {
        const option = document.createElement("option");
        option.value = String(i);
        option.textContent = `Fila ${i}`;
        filaInicial.appendChild(option);
    }
    filaInicial.value = String(valorSeguro);
}

function guardarCochesPorCarril() {
    obtenerCochesPorCarril();
    actualizarFilaSegunCapacidad();

    // La cantidad es solo de esta sesion. Si se cambia despues de haber
    // avanzado, reiniciamos la secuencia de ese Playa + Bloque; las
    // posiciones ya ocupadas se siguen omitiendo automaticamente.
    if (esPlayaEspecial(playaSelect.value)) {
        reiniciarProgresoNumeracion(playaSelect.value, bloqueSelect.value);
    }

    actualizarAyudaNumeracion();
    actualizarPantalla();
}

function organizarControlesInicio() {

    const contenedor = document.getElementById("controlesInicioRow");
    if (!contenedor) return;

    const elementos = [
        numeroInicialContainer,
        document.getElementById("cochesPorCarrilContainer"),
        filaInicialContainer,
        document.getElementById("inversaContainer"),
        document.getElementById("escaneoManualContainer")
    ].filter(Boolean);

    elementos.forEach(function(elemento) {
        if (elemento.parentElement !== contenedor) contenedor.appendChild(elemento);
    });

    const modo = obtenerModoNumeracion();
    const esJ = esPlayaEspecial(playaSelect.value);
    const manual = typeof obtenerEscaneoManual === "function" && obtenerEscaneoManual() && modo === "continua";

    // Orden visual solicitado:
    // Continua -> Numero inicial | Coches por carril | Asignacion Manual
    // Por fila -> Numero inicial | Fila | Asignar a la inversa
    // ZigZag -> Numero inicial | Coches por carril
    // Normales -> se conserva la distribucion anterior.
    let columnas = 2;
    if (esJ && (modo === "continua" || modo === "porFila") && !manual) {
        columnas = 3;
    }

    contenedor.style.display = "grid";
    contenedor.style.gap = "12px";
    contenedor.style.gridTemplateColumns = `repeat(${columnas}, minmax(0, 1fr))`;

    const posiciones = [
        numeroInicialContainer,
        document.getElementById("cochesPorCarrilContainer"),
        filaInicialContainer,
        document.getElementById("inversaContainer"),
        document.getElementById("escaneoManualContainer")
    ];

    posiciones.forEach(function(elemento) {
        if (!elemento) return;
        elemento.style.gridColumn = "auto";
        elemento.style.gridRow = "auto";
    });

    // En la vista de tres columnas fijamos los controles visibles en la
    // primera fila. Esto evita que el auto-placement de CSS envíe "Fila"
    // a una segunda fila en pantallas angostas cuando hay controles ocultos
    // entre los elementos del DOM.
    function colocarEnPrimeraFila(elemento, columna) {
        if (!elemento || elemento.classList.contains("hidden")) return;
        elemento.style.gridColumn = String(columna);
        elemento.style.gridRow = "1";
    }

    if (esJ && modo === "continua" && !manual) {
        colocarEnPrimeraFila(numeroInicialContainer, 1);
        colocarEnPrimeraFila(document.getElementById("cochesPorCarrilContainer"), 2);
        colocarEnPrimeraFila(document.getElementById("escaneoManualContainer"), 3);
    } else if (esJ && modo === "porFila" && !manual) {
        colocarEnPrimeraFila(numeroInicialContainer, 1);
        colocarEnPrimeraFila(filaInicialContainer, 2);
        colocarEnPrimeraFila(document.getElementById("inversaContainer"), 3);
    } else if (esJ && modo === "zigzag" && !manual) {
        colocarEnPrimeraFila(numeroInicialContainer, 1);
        colocarEnPrimeraFila(document.getElementById("cochesPorCarrilContainer"), 2);
    } else if (manual) {

        const manualContainer = document.getElementById("escaneoManualContainer");
        if (manualContainer) manualContainer.style.gridColumn = "2";
    } else {
        const inversa = document.getElementById("inversaContainer");
        if (inversa) inversa.style.gridColumn = "2";
        const manualContainer = document.getElementById("escaneoManualContainer");
        if (manualContainer) manualContainer.style.gridColumn = "2";
    }
}

function actualizarControlesPlaya() {

    const esJ = esPlayaEspecial(playaSelect.value);
    const modoActual = obtenerModoNumeracion();
    const manual = typeof obtenerEscaneoManual === "function" && obtenerEscaneoManual() && modoActual === "continua";
    const inversaControl = document.getElementById("asignarInversa");

    if (typeof aplicarModoEscaneoManual === "function") {
        aplicarModoEscaneoManual();
    }

    if (inversaControl) {
        const habilitada = modoActual === "porFila" || (!esJ && modoActual !== "continua");
        inversaControl.disabled = !habilitada;
        if (!habilitada && inversaControl.checked) inversaControl.checked = false;
    }

    if (manual) return;

    if (!esJ) {
        organizarControlesInicio();
        numeroInicialContainer.classList.remove("hidden");
        filaInicialContainer.classList.add("hidden");
        numberingHelp.classList.remove("editable-j");
        return;
    }

    numeroInicialContainer.classList.remove("hidden");

    if (modoActual === "porFila") {
        filaInicialContainer.classList.remove("hidden");
    } else {
        filaInicialContainer.classList.add("hidden");
    }

    if (modoActual === "continua" || modoActual === "zigzag") {
        const capacidad = document.getElementById("cochesPorCarrilContainer");
        if (capacidad) capacidad.classList.remove("hidden");
    }

    numberingHelp.classList.add("editable-j");
    organizarControlesInicio();
}

function obtenerModoNumeracion() {

    const seleccionado = document.querySelector(
        'input[name="modoNumeracion"]:checked'
    );

    if (!seleccionado) {
        return "continua";
    }

    return seleccionado.value;

}

function obtenerFilaInicial() {

    let fila = parseInt(
        filaInicial.value,
        10
    );

    if (!Number.isFinite(fila) || fila < 1 || fila > obtenerCochesPorCarril()) {
        fila = 1;
    }

    return fila;

}

function obtenerInicioNumeracion() {

    let numero = parseInt(
        numeroInicial.value,
        10
    );

    if (!Number.isFinite(numero) || numero < 1) {
        numero = 1;
    }

    return numero;

}

function obtenerInicioNumeracionEspecial() {

    let numero = parseInt(
        configuracionNumeracion.inicio,
        10
    );

    if (!Number.isFinite(numero) || numero < 1) {
        numero = 1;
    }

    return numero;

}

function guardarConfiguracionNumeracion(reiniciarProgreso) {

    const modo = obtenerModoNumeracion();
    const inicio = obtenerInicioNumeracion();
    const fila = obtenerFilaInicial();
    const inversa = obtenerAsignacionInversa();

    configuracionNumeracion = {
        modo: modo,
        inicio: inicio,
        inicioBase: Number.isFinite(Number(numeroInicialBase))
            ? Number(numeroInicialBase)
            : inicio,
        filaInicio: fila,
        inversa: inversa,
        manual: typeof obtenerEscaneoManual === "function" && obtenerEscaneoManual() && modo === "continua",
        manualCarril: typeof obtenerUbicacionManual === "function" ? obtenerUbicacionManual().carril : 1,
        manualPosicion: typeof obtenerUbicacionManual === "function" ? obtenerUbicacionManual().posicion : 1
    };

    localStorage.setItem(
        "configNumeracionPlaya",
        JSON.stringify(configuracionNumeracion)
    );

    if (reiniciarProgreso) {
        reiniciarProgresoNumeracion(
            playaSelect.value,
            bloqueSelect.value
        );
    }

    actualizarAyudaNumeracion();
    if (typeof aplicarModoEscaneoManual === "function") {
        aplicarModoEscaneoManual();
    }

}

let numeroInicialBase = null;

function cargarConfiguracionNumeracion() {

    let modo = configuracionNumeracion.modo;

    let inicio = parseInt(
        configuracionNumeracion.inicio,
        10
    );

    let inicioBaseGuardado = parseInt(
        configuracionNumeracion.inicioBase,
        10
    );

    let fila = parseInt(
        configuracionNumeracion.filaInicio,
        10
    );

    let inversa = configuracionNumeracion.inversa === true;
    const manualGuardado = configuracionNumeracion.manual === true;
    const manualCarrilGuardado = parseInt(configuracionNumeracion.manualCarril, 10);
    const manualPosicionGuardada = parseInt(configuracionNumeracion.manualPosicion, 10);

    if (
        modo !== "continua" &&
        modo !== "pares" &&
        modo !== "impares" &&
        modo !== "porFila" &&
        modo !== "zigzag"
    ) {
        modo = "continua";
    }

    if (!Number.isFinite(inicio) || inicio < 1) {
        inicio = 1;
    }

    if (!Number.isFinite(inicioBaseGuardado) || inicioBaseGuardado < 1) {
        inicioBaseGuardado = inicio;
    }

    numeroInicialBase = inicioBaseGuardado;

    if (!Number.isFinite(fila) || fila < 1 || fila > obtenerCochesPorCarril()) {
        fila = 1;
    }

    if (modo === "pares" && inicio % 2 !== 0) {
        inicio += inversa ? -1 : 1;
    }

    if (modo === "impares" && inicio % 2 === 0) {
        inicio += inversa ? -1 : 1;
    }

    if (
        inversa &&
        (modo === "pares" || modo === "impares") &&
        inicio <= 1
    ) {
        inicio = modo === "pares" ? 2 : 3;
    }

    if (
        (!esPlayaEspecial(playaSelect.value) && modo === "continua") ||
        modo === "zigzag" ||
        (esPlayaEspecial(playaSelect.value) && modo === "continua")
    ) {
        inversa = false;
    }

    configuracionNumeracion = {
        modo: modo,
        inicio: inicio,
        inicioBase: numeroInicialBase,
        filaInicio: fila,
        inversa: inversa,
        manual: manualGuardado && modo === "continua",
        manualCarril: Number.isFinite(manualCarrilGuardado) && manualCarrilGuardado >= 1 ? manualCarrilGuardado : 1,
        manualPosicion: Number.isFinite(manualPosicionGuardada) && manualPosicionGuardada >= 1 ? manualPosicionGuardada : 1
    };

    let radio = document.querySelector(
        'input[name="modoNumeracion"][value="' + modo + '"]'
    );

    if (
        !radio &&
        playaSelect.value === "J" &&
        modo === "porFila"
    ) {

        actualizarOpcionesPlaya();

        radio = document.querySelector(
            'input[name="modoNumeracion"][value="porFila"]'
        );

    }

    if (radio) {
        radio.checked = true;
    }

    numeroInicial.value = inicio;
    filaInicial.value = fila;

    const inversaControl =
        document.getElementById("asignarInversa");

    if (inversaControl) {
        inversaControl.checked = inversa;
    }

    if (typeof escaneoManual !== "undefined" && escaneoManual) {
        escaneoManual.checked = configuracionNumeracion.manual === true && modo === "continua";
    }
    if (typeof manualCarril !== "undefined" && manualCarril) manualCarril.value = configuracionNumeracion.manualCarril || 1;
    if (typeof manualPosicion !== "undefined" && manualPosicion) manualPosicion.value = configuracionNumeracion.manualPosicion || 1;

    actualizarOpcionesPlaya();
    actualizarControlesPlaya();
    actualizarAyudaNumeracion();

}

function ajustarNumeroInicialPorModo() {

    const modo = obtenerModoNumeracion();
    const inversa = obtenerAsignacionInversa();

    // El numero base es independiente del modo seleccionado.
    // Al cambiar entre Pares e Impares no se debe usar el numero ya
    // normalizado del modo anterior.
    if (
        !Number.isFinite(Number(numeroInicialBase)) ||
        numeroInicialBase < 1
    ) {

        numeroInicialBase =
            parseInt(
                numeroInicial.value,
                10
            );

        if (
            !Number.isFinite(numeroInicialBase) ||
            numeroInicialBase < 1
        ) {

            numeroInicialBase = 1;

        }

    }

    let numero =
        Number(numeroInicialBase);

    if (
        modo === "pares" ||
        modo === "impares"
    ) {

        numero =
            normalizarNumeroParaDireccion(
                numero,
                modo,
                inversa
            );

        if (numero < 1) {

            numero =
                inversa
                    ? (
                        modo === "pares"
                            ? 2
                            : 3
                    )
                    : 1;

        }

    }

    numeroInicial.value = numero;

    actualizarControlesPlaya();

    guardarConfiguracionNumeracion(true);

    actualizarPantalla();

}

async function editarInicioPlayaEspecial() {

    if (!esPlayaEspecial(playaSelect.value)) {
        return;
    }

    const actual =
        obtenerInicioNumeracionEspecial();

    const respuesta =
        await mostrarPrompt(
            "Ingrese el numero de Carril desde el que desea comenzar la asignacion:",
            String(actual)
        );

    if (respuesta === null) {
        return;
    }

    const numero =
        parseInt(
            String(respuesta).trim(),
            10
        );

    if (
        !Number.isFinite(numero) ||
        numero < 1
    ) {

        mostrarAlerta(
            "Ingrese un numero valido mayor o igual a 1."
        );

        return;

    }

    if (
        obtenerAsignacionInversa() &&
        numero <= 1
    ) {

        mostrarAlerta(
            "Con Asignar a la inversa, el numero inicial debe ser mayor que 1."
        );

        return;

    }

    configuracionNumeracion.inicio =
        numero;

    configuracionNumeracion.inversa =
        obtenerAsignacionInversa();

    numeroInicialBase = numero;
    numeroInicial.value = numero;

    localStorage.setItem(
        "configNumeracionPlaya",
        JSON.stringify(
            configuracionNumeracion
        )
    );

    reiniciarProgresoNumeracion(
        playaSelect.value,
        bloqueSelect.value
    );

    actualizarAyudaNumeracion();
    actualizarPantalla();

    if (
        scannerActivo &&
        !document
            .getElementById("scannerModal")
            .classList
            .contains("hidden")
    ) {

        actualizarPosicionScanner();

    }

}

numberingHelp.addEventListener(
    "dblclick",
    editarInicioPlayaEspecial
);

document
    .querySelectorAll(
        'input[name="modoNumeracion"]'
    )
    .forEach(function(radio) {

        radio.addEventListener(
            "change",
            ajustarNumeroInicialPorModo
        );

    });

const asignarInversa =
    document.getElementById(
        "asignarInversa"
    );

if (asignarInversa) {

    asignarInversa.addEventListener(
        "change",
        function() {

            ajustarNumeroInicialPorModo();

        }
    );

}

numeroInicial.addEventListener(
    "change",
    function() {

        let numero =
            parseInt(
                numeroInicial.value,
                10
            );

        if (
            !Number.isFinite(numero) ||
            numero < 1
        ) {

            numero = 1;

        }

        // Este es el valor que realmente escribio el usuario.
        // Cambiar de modo posteriormente no debe modificar esta base.
        numeroInicialBase = numero;

        ajustarNumeroInicialPorModo();

    }
);

filaInicial.addEventListener(
    "change",
    function() {

        guardarConfiguracionNumeracion();
        actualizarAyudaNumeracion();
        actualizarPantalla();

    }
);

if (cochesPorCarril) {
    cochesPorCarril.addEventListener("change", guardarCochesPorCarril);
}


function actualizarAyudaNumeracion() {

    if (typeof obtenerEscaneoManual === "function" && obtenerEscaneoManual()) {
        numberingHelp.innerText = "Escaneo manual: la ubicacion se define con Carril y Posicion antes de escanear.";
        return;
    }

    const modo =
        obtenerModoNumeracion();

    const inversa =
        obtenerAsignacionInversa();

    if (
        esPlayaEspecial(
            playaSelect.value
        )
    ) {

        const inicio =
            obtenerInicioNumeracionEspecial();

        if (modo === "continua") {

            const capacidad = obtenerCochesPorCarril();
            const ejemplo = Array.from({ length: Math.min(capacidad, 4) }, (_, i) => `${inicio}-${i + 1}`).join(", ");

            numberingHelp.innerText =
                `Se asignara ${ejemplo}${capacidad > 4 ? ", ..." : ""} y luego ${inicio + 1}-1, ${inicio + 1}-2...`;

            numberingHelp.classList.add("editable-j");
            return;

        }

        if (modo === "zigzag") {

            const capacidad = obtenerCochesPorCarril();
            const inicioArriba = `${inicio}-1 → ${inicio}-${capacidad}`;
            const siguienteAbajo = `${inicio + 1}-${capacidad} → ${inicio + 1}-1`;

            numberingHelp.innerText =
                `ZigZag: ${inicioArriba}, luego ${siguienteAbajo}, y asi sucesivamente.`;

            numberingHelp.classList.add("editable-j");
            return;

        }

        if (modo === "porFila") {

            const fila =
                obtenerFilaInicial();

            numberingHelp.innerText =
    inversa
        ? inicio === 1
            ? `Se escaneará la fila ${fila} en inversa desde la posición 1.`
            : `Se escaneará la fila ${fila} en inversa: ${inicio}-${fila}, ${inicio - 1}-${fila}, ${inicio - 2}-${fila}, ${inicio - 3}-${fila}... La asignación continuará hasta llegar a la posición 1.`
        : `Se escaneará la fila ${fila}: ${inicio}-${fila}, ${inicio + 1}-${fila}, ${inicio + 2}-${fila}, ${inicio + 3}-${fila}... La asignación continuará en orden ascendente.`;

            numberingHelp.classList.add(
                "editable-j"
            );

            return;

        }

    }

    numberingHelp.classList.remove(
        "editable-j"
    );

    const inicio =
        obtenerInicioNumeracion();

    if (modo === "continua") {

        numberingHelp.innerText =
            inversa
                ? `Se asignara ${inicio}, ${inicio - 1}, ${inicio - 2}, ${inicio - 3}... \n.`
                : `Se asignara ${inicio}, ${inicio + 1}, ${inicio + 2}, ${inicio + 3}... \n.`;

        return;

    }

    const primero =
        normalizarNumeroParaDireccion(
            inicio,
            modo,
            inversa
        );

    const paso =
        inversa
            ? -2
            : 2;

    numberingHelp.innerText =
        `Se asignara ${primero}, ${primero + paso}, ${primero + paso * 2}, ${primero + paso * 3}... \n.`;

}

function obtenerUbicacionSeleccionada() {

    return {
        playa: playaSelect.value,
        bloque: bloqueSelect.value
    };

}

function obtenerAsignacionInversa() {

    if (typeof obtenerEscaneoManual === "function" && obtenerEscaneoManual()) {
        return false;
    }

    const control =
        document.getElementById(
            "asignarInversa"
        );

    if (!control) {
        return false;
    }

    // En playas normales, Continua nunca puede trabajar en modo inverso.
    if (
        !esPlayaEspecial(
            playaSelect.value
        ) &&
        obtenerModoNumeracion() === "continua"
    ) {

        return false;

    }

    return control.checked;

}

function obtenerClaveProgreso(
    playa,
    bloque
) {

    return (
        String(playa || "") +
        "|" +
        String(bloque || "")
    );

}

function cargarProgresoNumeracion() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "progresoNumeracionPlaya"
            ) || "{}"
        );

    } catch (e) {

        return {};

    }

}

let progresoNumeracion =
    cargarProgresoNumeracion();

function guardarProgresoNumeracion() {

    localStorage.setItem(
        "progresoNumeracionPlaya",
        JSON.stringify(
            progresoNumeracion
        )
    );

}

function reiniciarTodoProgresoNumeracion() {
    progresoNumeracion = {};
    guardarProgresoNumeracion();
}

function reiniciarProgresoNumeracion(
    playa,
    bloque
) {

    delete progresoNumeracion[
        obtenerClaveProgreso(
            playa,
            bloque
        )
    ];

    guardarProgresoNumeracion();

}

function registrarPosicionAsignadaPorEscaner(
    playa,
    bloque,
    posicion
) {

    const clave =
        obtenerClaveProgreso(
            playa,
            bloque
        );

    progresoNumeracion[clave] = {

        modo:
            obtenerModoNumeracion(),

        inversa:
            obtenerAsignacionInversa(),

        inicio:
            obtenerInicioNumeracion(),

        posicion: posicion,

        capacidadSesion:
            esPlayaEspecial(playa)
                ? obtenerCochesPorCarril()
                : null

    };

    guardarProgresoNumeracion();

}

function normalizarNumeroParaDireccion(
    numero,
    modo,
    inversa
) {

    numero = Number(numero);

    if (
        !Number.isFinite(numero) ||
        numero < 1
    ) {

        numero =
            inversa
                ? 2
                : 1;

    }

    // La paridad siempre la determina el modo seleccionado.
    // La inversa solo cambia la direccion.

    if (
        modo === "pares" &&
        numero % 2 !== 0
    ) {

        numero +=
            inversa
                ? -1
                : 1;

    }

    if (
        modo === "impares" &&
        numero % 2 === 0
    ) {

        numero +=
            inversa
                ? -1
                : 1;

    }

    return numero;

}

function normalizarPrimerNumero(
    numero
) {

    return normalizarNumeroParaDireccion(
        numero,
        obtenerModoNumeracion(),
        obtenerAsignacionInversa()
    );

}

function obtenerSiguienteNumeroNormal(
    playa,
    bloque
) {

    const modo =
        obtenerModoNumeracion();

    const inversa =
        obtenerAsignacionInversa();

    const inicio =
        obtenerInicioNumeracion();

    const clave =
        obtenerClaveProgreso(
            playa,
            bloque
        );

    const estado =
        progresoNumeracion[
            clave
        ];

    let candidato;

    if (
        !estado ||
        estado.modo !== modo ||
        estado.inversa !== inversa ||
        Number(estado.inicio) !== Number(inicio)
    ) {

        candidato =
            normalizarNumeroParaDireccion(
                inicio,
                modo,
                inversa
            );

    } else {

        const paso =
            (
                modo === "pares" ||
                modo === "impares"
            )
                ? 2
                : 1;

        candidato =
            Number(estado.posicion) +
            (
                inversa
                    ? -paso
                    : paso
            );

    }

    const paso =
        (
            modo === "pares" ||
            modo === "impares"
        )
            ? 2
            : 1;

    const posicionesOcupadas =
        new Set(
            vehiculos
                .filter(function(v) {

                    return (
                        v.playa === playa &&
                        v.bloque === bloque
                    );

                })
                .map(function(v) {

                    return Number(
                        v.posicion
                    );

                })
                .filter(function(n) {

                    return (
                        Number.isFinite(n) &&
                        n >= 1
                    );

                })
        );

    while (
        candidato >= 1 &&
        posicionesOcupadas.has(candidato)
    ) {

        candidato +=
            inversa
                ? -paso
                : paso;

    }

    return candidato >= 1
        ? candidato
        : null;

}

function obtenerSiguientePosicionEspecialDesdeProgreso(
    playa,
    bloque
) {

    const modo = obtenerModoNumeracion();
    const inversa = obtenerAsignacionInversa();
    const inicio = obtenerInicioNumeracionEspecial();
    const capacidad = obtenerCochesPorCarril();
    const clave = obtenerClaveProgreso(playa, bloque);
    const estado = progresoNumeracion[clave];

    let estadoValido = !!estado &&
        estado.modo === modo &&
        estado.inversa === inversa &&
        Number(estado.inicio) === Number(inicio);

    // La capacidad no es una configuracion permanente de la playa. Sin
    // embargo, se registra en el progreso para poder detectar que un estado
    // viejo corresponde a otra capacidad y no continuar en una posicion
    // imposible para la sesion actual.
    if (estadoValido && modo !== "porFila") {
        const capacidadEstado = Number(estado.capacidadSesion);
        if (Number.isFinite(capacidadEstado)) {
            estadoValido = capacidadEstado === capacidad;
        } else if (capacidad !== 5) {
            estadoValido = false;
        }
    }

    let calle;
    let fila;

    if (!estadoValido) {
        calle = inicio;
        if (modo === "porFila") {
            fila = obtenerFilaInicial();
        } else if (modo === "zigzag") {
            fila = 1;
        } else {
            fila = inversa ? capacidad : 1;
        }
    } else {
        const p = parsearPosicionEspecial(estado.posicion);

        if (!p) {
            calle = inicio;
            fila = modo === "porFila"
                ? obtenerFilaInicial()
                : (modo === "zigzag" ? 1 : (inversa ? capacidad : 1));
        } else {
            calle = p.calle;
            fila = p.fila;

            if (modo === "porFila") {
                calle += inversa ? -1 : 1;
                fila = obtenerFilaInicial();
            } else if (modo === "zigzag") {
                const indiceCarril = calle - inicio;
                const vaHaciaArriba = indiceCarril % 2 === 0;

                if (vaHaciaArriba) {
                    if (fila < capacidad) {
                        fila++;
                    } else {
                        calle++;
                        fila = capacidad;
                    }
                } else {
                    if (fila > 1) {
                        fila--;
                    } else {
                        calle++;
                        fila = 1;
                    }
                }
            } else if (inversa) {
                fila--;
                if (fila < 1) {
                    calle--;
                    fila = capacidad;
                }
            } else {
                fila++;
                if (fila > capacidad) {
                    calle++;
                    fila = 1;
                }
            }
        }
    }

    while (calle >= 1) {
        const posicion = convertirPosicionEspecial(calle, fila);

        if (!posicionEspecialOcupada(playa, bloque, calle, fila)) {
            return posicion;
        }

        if (modo === "porFila") {
            calle += inversa ? -1 : 1;
            fila = obtenerFilaInicial();
        } else if (modo === "zigzag") {
            const indiceCarril = calle - inicio;
            const vaHaciaArriba = indiceCarril % 2 === 0;

            if (vaHaciaArriba) {
                if (fila < capacidad) {
                    fila++;
                } else {
                    calle++;
                    fila = capacidad;
                }
            } else {
                if (fila > 1) {
                    fila--;
                } else {
                    calle++;
                    fila = 1;
                }
            }
        } else if (inversa) {
            fila--;
            if (fila < 1) {
                calle--;
                fila = capacidad;
            }
        } else {
            fila++;
            if (fila > capacidad) {
                calle++;
                fila = 1;
            }
        }
    }

    return null;
}

function convertirPosicionEspecial(
    calle,
    fila
) {

    return (
        Number(calle) +
        "-" +
        Number(fila)
    );

}

function parsearPosicionEspecial(
    posicion
) {

    const texto =
        String(
            posicion || ""
        ).trim();

    const partes =
        texto.split("-");

    if (partes.length !== 2) {
        return null;
    }

    const calle =
        parseInt(
            partes[0],
            10
        );

    const fila =
        parseInt(
            partes[1],
            10
        );

    if (
        !Number.isFinite(calle) ||
        !Number.isFinite(fila) ||
        calle < 1 ||
        fila < 1 ||
        fila > 6
    ) {

        return null;

    }

    return {
        calle: calle,
        fila: fila
    };

}

function obtenerPosicionesEspecialesOcupadas(
    playa,
    bloque,
    excluirVehiculo
) {

    return vehiculos
        .filter(function(v) {

            if (
                excluirVehiculo &&
                v.id === excluirVehiculo.id
            ) {

                return false;

            }

            return (
                v.playa === playa &&
                v.bloque === bloque
            );

        })
        .map(function(v) {

            return parsearPosicionEspecial(
                v.posicion
            );

        })
        .filter(function(p) {

            return p !== null;

        });

}

function posicionEspecialOcupada(
    playa,
    bloque,
    calle,
    fila,
    excluirVehiculo
) {

    return vehiculos.some(function(v) {

        if (
            excluirVehiculo &&
            v.id === excluirVehiculo.id
        ) {

            return false;

        }

        if (
            v.playa !== playa ||
            v.bloque !== bloque
        ) {

            return false;

        }

        const p =
            parsearPosicionEspecial(
                v.posicion
            );

        if (!p) {
            return false;
        }

        return (
            p.calle === Number(calle) &&
            p.fila === Number(fila)
        );

    });

}

function obtenerProximaPosicionEspecial(
    playa,
    bloque
) {

    return obtenerSiguientePosicionEspecialDesdeProgreso(
        playa,
        bloque
    );

}

function obtenerUbicacionNormal(
    posicion
) {

    const numero =
        Number(posicion);

    if (
        !Number.isFinite(numero) ||
        numero < 1
    ) {

        return null;

    }

    return {

        carril:
            numero % 2 === 0
                ? numero - 1
                : numero,

        posicion:
            numero

    };

}

function formatearUbicacionNormal(
    posicion
) {

    const u =
        obtenerUbicacionNormal(
            posicion
        );

    return u
        ? `Carril ${u.carril} - Posicion ${u.posicion}`
        : String(posicion);

}

function obtenerProximaPosicion(
    playa,
    bloque
) {

    if (typeof obtenerEscaneoManual === "function" && obtenerEscaneoManual()) {
        const manual = obtenerUbicacionManual();
        return esPlayaEspecial(playa)
            ? convertirPosicionEspecial(manual.carril, manual.posicion)
            : manual.posicion;
    }

    if (
        esPlayaEspecial(playa)
    ) {

        return obtenerProximaPosicionEspecial(
            playa,
            bloque
        );

    }

    return obtenerSiguienteNumeroNormal(
        playa,
        bloque
    );

}
