function actualizarOpcionesPlaya() {

    const esJ = esPlayaEspecial(playaSelect.value);

    if (esJ) {

        modoPares.parentElement.classList.add("hidden");
        modoImpares.parentElement.classList.add("hidden");
        modoContinua.parentElement.classList.remove("hidden");

        let opcionFila = document.getElementById("modoPorFilaContainer");

        if (!opcionFila) {

            opcionFila = document.createElement("div");

            opcionFila.id = "modoPorFilaContainer";
            opcionFila.className = "numbering-option";

            opcionFila.innerHTML = `
                <input
                    type="radio"
                    name="modoNumeracion"
                    id="modoPorFila"
                    value="porFila"
                >

                <!-- EDITABLE: texto de la opcion creada para Playa especial -->
                <label for="modoPorFila">
                    Por fila
                </label>
            `;

            document
                .querySelector(".numbering-options")
                .appendChild(opcionFila);

            document
                .getElementById("modoPorFila")
                .addEventListener("change", function() {

                    actualizarControlesPlaya();
                    guardarConfiguracionNumeracion();
                    actualizarPantalla();

                });

        } else {

            opcionFila.classList.remove("hidden");

        }

        actualizarControlesPlaya();

        return;

    }

    modoPares.parentElement.classList.remove("hidden");
    modoImpares.parentElement.classList.remove("hidden");

    const opcionFila = document.getElementById("modoPorFilaContainer");

    if (opcionFila) {
        opcionFila.classList.add("hidden");
    }

    organizarControlesInicio(false);

    numeroInicialContainer.classList.remove("hidden");
    filaInicialContainer.classList.add("hidden");

}

function organizarControlesInicio(modoPorFila) {

    let contenedor = document.getElementById("controlesInicioRow");

    if (!contenedor) {

        contenedor = document.createElement("div");
        contenedor.id = "controlesInicioRow";

        numeroInicialContainer.parentNode.insertBefore(
            contenedor,
            numeroInicialContainer
        );

        contenedor.appendChild(numeroInicialContainer);
        contenedor.appendChild(filaInicialContainer);

    }

    contenedor.style.display = "grid";
    contenedor.style.gap = "12px";
    contenedor.style.gridTemplateColumns = modoPorFila
        ? "1fr 1fr"
        : "1fr";

}

function actualizarControlesPlaya() {

    const esJ = esPlayaEspecial(playaSelect.value);

    if (!esJ) {

        organizarControlesInicio(false);

        numeroInicialContainer.classList.remove("hidden");
        filaInicialContainer.classList.add("hidden");

        numberingHelp.classList.remove("editable-j");

        return;

    }

    const modo = obtenerModoNumeracion();

    // En playas especiales tambien debe mostrarse el numero inicial,
    // igual que en las playas normales. Este valor indica el carril
    // desde el que comienza la asignacion.
    organizarControlesInicio(modo === "porFila");
    numeroInicialContainer.classList.remove("hidden");

    // En modo "Por fila" se muestra ademas la fila de inicio,
    // ubicada junto al numero inicial para conservar la misma altura
    // y armonia visual de la configuracion.
    if (modo === "porFila") {
        filaInicialContainer.classList.remove("hidden");
    } else {
        filaInicialContainer.classList.add("hidden");
    }

    numberingHelp.classList.add("editable-j");

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

    if (!Number.isFinite(fila) || fila < 1 || fila > 5) {
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

function guardarConfiguracionNumeracion() {

    const modo = obtenerModoNumeracion();
    const inicio = obtenerInicioNumeracion();
    const fila = obtenerFilaInicial();

    configuracionNumeracion = {
        modo: modo,
        inicio: inicio,
        filaInicio: fila
    };

    localStorage.setItem(
        "configNumeracionPlaya",
        JSON.stringify(configuracionNumeracion)
    );

    actualizarAyudaNumeracion();

}

function cargarConfiguracionNumeracion() {

    let modo = configuracionNumeracion.modo;

    let inicio = parseInt(
        configuracionNumeracion.inicio,
        10
    );

    let fila = parseInt(
        configuracionNumeracion.filaInicio,
        10
    );

    if (
        modo !== "continua" &&
        modo !== "pares" &&
        modo !== "impares" &&
        modo !== "porFila"
    ) {
        modo = "continua";
    }

    if (!Number.isFinite(inicio) || inicio < 1) {
        inicio = 1;
    }

    if (!Number.isFinite(fila) || fila < 1 || fila > 5) {
        fila = 1;
    }

    if (modo === "pares" && inicio % 2 !== 0) {
        inicio++;
    }

    if (modo === "impares" && inicio % 2 === 0) {
        inicio++;
    }

    configuracionNumeracion = {
        modo: modo,
        inicio: inicio,
        filaInicio: fila
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

    actualizarOpcionesPlaya();
    actualizarControlesPlaya();
    actualizarAyudaNumeracion();

}

function ajustarNumeroInicialPorModo() {

    const modo = obtenerModoNumeracion();

    if (
        esPlayaEspecial(playaSelect.value) &&
        modo === "porFila"
    ) {

        actualizarControlesPlaya();
        guardarConfiguracionNumeracion();
        actualizarPantalla();

        return;

    }

    let numero = parseInt(
        numeroInicial.value,
        10
    );

    if (!Number.isFinite(numero) || numero < 1) {
        numero = 1;
    }

    if (modo === "pares" && numero % 2 !== 0) {
        numero++;
    }

    if (modo === "impares" && numero % 2 === 0) {
        numero++;
    }

    numeroInicial.value = numero;

    actualizarControlesPlaya();
    guardarConfiguracionNumeracion();
    actualizarPantalla();

}

async function editarInicioPlayaEspecial() {

    if (!esPlayaEspecial(playaSelect.value)) {
        return;
    }

    const actual = obtenerInicioNumeracionEspecial();

    // EDITABLE: texto que aparece en la ventana para cambiar el inicio
    const respuesta = await mostrarPrompt(
        "Ingrese el numero de Carril desde el que desea comenzar la asignacion:",
        String(actual)
    );

    if (respuesta === null) {
        return;
    }

    const numero = parseInt(
        String(respuesta).trim(),
        10
    );

    if (!Number.isFinite(numero) || numero < 1) {

        // EDITABLE: mensaje de error
        mostrarAlerta("Ingrese un numero valido mayor o igual a 1.");

        return;

    }

    configuracionNumeracion.inicio = numero;

    numeroInicial.value = numero;

    localStorage.setItem(
        "configNumeracionPlaya",
        JSON.stringify(configuracionNumeracion)
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
    .querySelectorAll('input[name="modoNumeracion"]')
    .forEach(function(radio) {

        radio.addEventListener(
            "change",
            ajustarNumeroInicialPorModo
        );

    });

numeroInicial.addEventListener(
    "change",
    function() {
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

function actualizarAyudaNumeracion() {

    const modo = obtenerModoNumeracion();

    if (esPlayaEspecial(playaSelect.value)) {

        const inicio = obtenerInicioNumeracionEspecial();

        if (modo === "continua") {

            // EDITABLE: texto de ayuda para Playa especial en modo continuo
            numberingHelp.innerText =
                `Se asignara ${inicio}-1, ${inicio}-2, ${inicio}-3, ${inicio}-4, ${inicio}-5 y luego\n${inicio + 1}-1, ${inicio + 1}-2, ${inicio + 1}-3, ${inicio + 1}-4, ${inicio + 1}-5...`;

            numberingHelp.classList.add("editable-j");

            return;

        }

        if (modo === "porFila") {

            const fila = obtenerFilaInicial();

            // EDITABLE: texto de ayuda para Playa especial por fila
            numberingHelp.innerText =
                `Se escaneara la fila ${fila}: ${inicio}-${fila}, ${inicio + 1}-${fila}, ${inicio + 2}-${fila}, ${inicio + 3}-${fila}, ${inicio + 4}-${fila}, ${inicio + 5}-${fila}...`;

            numberingHelp.classList.add("editable-j");

            return;

        }

    }

    numberingHelp.classList.remove("editable-j");

    const inicio = obtenerInicioNumeracion();

    if (modo === "continua") {

        // EDITABLE: texto de ayuda para numeracion continua
        numberingHelp.innerText =
            `Se asignara ${inicio}, ${inicio + 1}, ${inicio + 2}, ${inicio + 3}...`;

        return;

    }

    if (modo === "pares") {

        let primero = inicio;

        if (primero % 2 !== 0) {
            primero++;
        }

        // EDITABLE: texto de ayuda para numeros pares
        numberingHelp.innerText =
            `Se asignara ${primero}, ${primero + 2}, ${primero + 4}, ${primero + 6}...`;

        return;

    }

    if (modo === "impares") {

        let primero = inicio;

        if (primero % 2 === 0) {
            primero++;
        }

        // EDITABLE: texto de ayuda para numeros impares
        numberingHelp.innerText =
            `Se asignara ${primero}, ${primero + 2}, ${primero + 4}, ${primero + 6}...`;

    }

}

function obtenerUbicacionSeleccionada() {

    return {
        playa: playaSelect.value,
        bloque: bloqueSelect.value
    };

}

function normalizarPrimerNumero(numero) {

    const modo = obtenerModoNumeracion();

    numero = Number(numero);

    if (!Number.isFinite(numero) || numero < 1) {
        numero = 1;
    }

    if (modo === "pares" && numero % 2 !== 0) {
        numero++;
    }

    if (modo === "impares" && numero % 2 === 0) {
        numero++;
    }

    return numero;

}

function convertirPosicionEspecial(calle, fila) {

    return (
        Number(calle) +
        "-" +
        Number(fila)
    );

}

function parsearPosicionEspecial(posicion) {

    const texto = String(posicion || "").trim();

    const partes = texto.split("-");

    if (partes.length !== 2) {
        return null;
    }

    const calle = parseInt(
        partes[0],
        10
    );

    const fila = parseInt(
        partes[1],
        10
    );

    if (
        !Number.isFinite(calle) ||
        !Number.isFinite(fila) ||
        calle < 1 ||
        fila < 1 ||
        fila > 5
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

        const p = parsearPosicionEspecial(
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

    const registros = vehiculos.filter(function(v) {

        return (
            v.playa === playa &&
            v.bloque === bloque
        );

    });

    const inicio = obtenerInicioNumeracionEspecial();
    const modo = obtenerModoNumeracion();

    if (registros.length === 0) {

        if (modo === "porFila") {

            return convertirPosicionEspecial(
                inicio,
                obtenerFilaInicial()
            );

        }

        return convertirPosicionEspecial(
            inicio,
            1
        );

    }

    const posiciones = registros
        .map(function(v) {

            return parsearPosicionEspecial(
                v.posicion
            );

        })
        .filter(function(p) {
            return p !== null;
        });

    if (posiciones.length === 0) {

        if (modo === "porFila") {

            return convertirPosicionEspecial(
                inicio,
                obtenerFilaInicial()
            );

        }

        return convertirPosicionEspecial(
            inicio,
            1
        );

    }

    if (modo === "continua") {

        let ultimaCalle = inicio;
        let ultimaFila = 0;

        posiciones.forEach(function(p) {

            if (
                p.calle > ultimaCalle ||
                (
                    p.calle === ultimaCalle &&
                    p.fila > ultimaFila
                )
            ) {

                ultimaCalle = p.calle;
                ultimaFila = p.fila;

            }

        });

        if (ultimaFila < 5) {

            return convertirPosicionEspecial(
                ultimaCalle,
                ultimaFila + 1
            );

        }

        return convertirPosicionEspecial(
            Math.max(
                inicio,
                ultimaCalle + 1
            ),
            1
        );

    }

    if (modo === "porFila") {

        const fila = obtenerFilaInicial();

        let mayorCalle = inicio - 1;

        posiciones.forEach(function(p) {

            if (
                p.fila === fila &&
                p.calle >= inicio &&
                p.calle > mayorCalle
            ) {

                mayorCalle = p.calle;

            }

        });

        return convertirPosicionEspecial(
            Math.max(
                inicio,
                mayorCalle + 1
            ),
            fila
        );

    }

    return convertirPosicionEspecial(
        inicio,
        1
    );

}

function obtenerUbicacionNormal(posicion) {
    const numero = Number(posicion);

    if (!Number.isFinite(numero) || numero < 1) {
        return null;
    }

    /*
     * En playas normales el carril siempre queda identificado por el
     * numero impar del par fisico:
     *   1/2 -> carril 1
     *   3/4 -> carril 3
     *   5/6 -> carril 5
     *
     * Esto no depende del numero inicial configurado ni del modo de
     * escaneo. Los impares son "Adelante" y los pares "Atras".
     */
    return {
        carril: numero % 2 === 0 ? numero - 1 : numero,
        posicion: numero % 2 === 0 ? "Atras" : "Adelante"
    };
}

function formatearUbicacionNormal(posicion) {
    const u = obtenerUbicacionNormal(posicion);

    return u
        ? `Carril ${u.carril} - Posicion ${u.posicion}`
        : String(posicion);
}

function obtenerProximaPosicion(
    playa,
    bloque
) {

    if (esPlayaEspecial(playa)) {
        return obtenerProximaPosicionEspecial(
            playa,
            bloque
        );
    }

    const inicio = obtenerInicioNumeracion();

    const posiciones = vehiculos
        .filter(function(v) {
            return (
                v.playa === playa &&
                v.bloque === bloque
            );
        })
        .map(function(v) {
            return Number(v.posicion);
        })
        .filter(function(numero) {
            return Number.isFinite(numero) && numero >= inicio;
        });

    if (posiciones.length === 0) {
        return normalizarPrimerNumero(inicio);
    }

    const modo = obtenerModoNumeracion();

    if (modo === "pares" || modo === "impares") {
        /*
         * En escaneo por una sola fila cada lectura salta al siguiente
         * carril fisico, por lo que la numeracion avanza de a 2.
         * Se consideran solo las posiciones de la misma paridad para
         * no mezclar un escaneo de adelante con uno de atras.
         */
        const posicionesDelModo = posiciones.filter(function(numero) {
            return modo === "pares"
                ? numero % 2 === 0
                : numero % 2 !== 0;
        });

        if (posicionesDelModo.length === 0) {
            return normalizarPrimerNumero(inicio);
        }

        return Math.max(...posicionesDelModo) + 2;
    }

    /*
     * Escaneo continuo: se recorren ambas posiciones de cada carril,
     * por lo que la numeracion avanza de a uno.
     */
    return Math.max(...posiciones) + 1;

}
