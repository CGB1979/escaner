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

    const contenedor = document.getElementById("controlesInicioRow");

    if (!contenedor) {
        return;
    }

    if (numeroInicialContainer.parentElement !== contenedor) {
        contenedor.appendChild(numeroInicialContainer);
    }

    const inversaContainer = document.getElementById("inversaContainer");

    if (inversaContainer && inversaContainer.parentElement !== contenedor) {
        contenedor.appendChild(inversaContainer);
    }

    if (filaInicialContainer.parentElement !== contenedor) {
        contenedor.appendChild(filaInicialContainer);
    }

    contenedor.style.display = "grid";
    contenedor.style.gap = "12px";
    contenedor.style.gridTemplateColumns = modoPorFila
        ? "1fr 1fr 1fr"
        : "1fr 1fr";

}

function actualizarControlesPlaya() {

    const esJ = esPlayaEspecial(playaSelect.value);
    const modoActual = obtenerModoNumeracion();
    const inversaControl = document.getElementById("asignarInversa");

    if (inversaControl) {

        // En playas normales, Continua no admite asignacion inversa.
        // Las playas especiales conservan su logica propia de inversion.
        const habilitada = esJ || modoActual !== "continua";

        inversaControl.disabled = !habilitada;

        if (!habilitada && inversaControl.checked) {
            inversaControl.checked = false;
        }

    }

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
        inversa: inversa
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

    if (!Number.isFinite(inicioBaseGuardado) || inicioBaseGuardado < 1) {
        inicioBaseGuardado = inicio;
    }

    numeroInicialBase = inicioBaseGuardado;

    if (!Number.isFinite(fila) || fila < 1 || fila > 5) {
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
        !esPlayaEspecial(playaSelect.value) &&
        modo === "continua"
    ) {
        inversa = false;
    }

    configuracionNumeracion = {
        modo: modo,
        inicio: inicio,
        inicioBase: numeroInicialBase,
        filaInicio: fila,
        inversa: inversa
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

function actualizarAyudaNumeracion() {

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

            numberingHelp.innerText =
                inversa
                    ? `Se asignara ${inicio}-5, ${inicio}-4, ${inicio}-3, ${inicio}-2, ${inicio}-1 y luego ${inicio - 1}-5, ${inicio - 1}-4...`
                    : `Se asignara ${inicio}-1, ${inicio}-2, ${inicio}-3, ${inicio}-4, ${inicio}-5 y luego ${inicio + 1}-1, ${inicio + 1}-2...`;

            numberingHelp.classList.add(
                "editable-j"
            );

            return;

        }

        if (modo === "porFila") {

            const fila =
                obtenerFilaInicial();

            numberingHelp.innerText =
                inversa
                    ? `Se escaneara la fila ${fila}: ${inicio}-${fila}, ${inicio - 1}-${fila}, ${inicio - 2}-${fila}, ${inicio - 3}-${fila}...`
                    : `Se escaneara la fila ${fila}: ${inicio}-${fila}, ${inicio + 1}-${fila}, ${inicio + 2}-${fila}, ${inicio + 3}-${fila}...`;

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
                ? `Se asignara ${inicio}, ${inicio - 1}, ${inicio - 2}, ${inicio - 3}...`
                : `Se asignara ${inicio}, ${inicio + 1}, ${inicio + 2}, ${inicio + 3}...`;

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
        `Se asignara ${primero}, ${primero + paso}, ${primero + paso * 2}, ${primero + paso * 3}...`;

}

function obtenerUbicacionSeleccionada() {

    return {
        playa: playaSelect.value,
        bloque: bloqueSelect.value
    };

}

function obtenerAsignacionInversa() {

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

        posicion:
            posicion

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

    // Si esta Playa + Bloque no tiene vehículos, el progreso anterior
    // no debe seguir condicionando la próxima asignación.
    if (posicionesOcupadas.size === 0) {
        return normalizarNumeroParaDireccion(
            inicio,
            modo,
            inversa
        );
    }

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

    const modo =
        obtenerModoNumeracion();

    const inversa =
        obtenerAsignacionInversa();

    const inicio =
        obtenerInicioNumeracionEspecial();

    const clave =
        obtenerClaveProgreso(
            playa,
            bloque
        );

    const estado =
        progresoNumeracion[
            clave
        ];

    const hayVehiculosEnUbicacion = vehiculos.some(function(v) {
        return (
            v.playa === playa &&
            v.bloque === bloque &&
            parsearPosicionEspecial(v.posicion) !== null
        );
    });

    let calle;
    let fila;

    if (!hayVehiculosEnUbicacion) {
        calle = inicio;
        fila =
            modo === "porFila"
                ? obtenerFilaInicial()
                : (
                    inversa
                        ? 5
                        : 1
                );
    } else if (
        !estado ||
        estado.modo !== modo ||
        estado.inversa !== inversa ||
        Number(estado.inicio) !== Number(inicio)
    ) {

        calle = inicio;

        fila =
            modo === "porFila"
                ? obtenerFilaInicial()
                : (
                    inversa
                        ? 5
                        : 1
                );

    } else {

        const p =
            parsearPosicionEspecial(
                estado.posicion
            );

        if (!p) {

            calle = inicio;

            fila =
                inversa
                    ? 5
                    : (
                        modo === "porFila"
                            ? obtenerFilaInicial()
                            : 1
                    );

        } else {

            calle = p.calle;
            fila = p.fila;

            if (modo === "porFila") {

                calle +=
                    inversa
                        ? -1
                        : 1;

                fila =
                    obtenerFilaInicial();

            } else if (inversa) {

                fila--;

                if (fila < 1) {

                    calle--;
                    fila = 5;

                }

            } else {

                fila++;

                if (fila > 5) {

                    calle++;
                    fila = 1;

                }

            }

        }

    }

    while (calle >= 1) {

        const posicion =
            convertirPosicionEspecial(
                calle,
                fila
            );

        if (
            !posicionEspecialOcupada(
                playa,
                bloque,
                calle,
                fila
            )
        ) {

            return posicion;

        }

        if (modo === "porFila") {

            calle +=
                inversa
                    ? -1
                    : 1;

            fila =
                obtenerFilaInicial();

        } else if (inversa) {

            fila--;

            if (fila < 1) {

                calle--;
                fila = 5;

            }

        } else {

            fila++;

            if (fila > 5) {

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
