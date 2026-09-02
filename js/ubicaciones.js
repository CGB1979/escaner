function reasignarDesdeLista(chasis) {

    const v = vehiculos.find(function(x) {

        return x.chasis === chasis;

    });

    if (!v) {
        return;
    }

    abrirCambioUbicacionVehiculo(
        v,
        false
    );

}

function abrirCambioUbicacionGeneral() {

    vehiculoCambioUbicacion = null;
    cambioDesdeScanner = false;

    document
        .getElementById("cambioPlaya")
        .value =
        playaSelect.value;

    document
        .getElementById("cambioBloque")
        .value =
        bloqueSelect.value;

    actualizarControlesCambioUbicacion();

    if (esPlayaEspecial(playaSelect.value)) {

        const posicion =
            obtenerProximaPosicionEspecial(
                playaSelect.value,
                bloqueSelect.value
            );

        const p =
            parsearPosicionEspecial(posicion);

        if (p) {

            document
                .getElementById("cambioEspecialCarril")
                .value =
                p.calle;

            document
                .getElementById("cambioEspecialPosicion")
                .value =
                p.fila;

        }

    } else {

        const sugerido =
            obtenerProximaPosicion(
                playaSelect.value,
                bloqueSelect.value
            );

        document
            .getElementById("cambioNumero")
            .value =
            sugerido;

    }

    document
        .getElementById("locationModal")
        .classList
        .remove("hidden");

    actualizarPreviewCambioUbicacion();

}

function abrirCambioUbicacionVehiculo(
    v,
    desdeScanner
) {

    vehiculoCambioUbicacion = v;
    cambioDesdeScanner = desdeScanner === true;

    document
        .getElementById("cambioPlaya")
        .value =
        v.playa;

    document
        .getElementById("cambioBloque")
        .value =
        v.bloque;

    actualizarControlesCambioUbicacion();

    if (esPlayaEspecial(v.playa)) {

        const p =
            parsearPosicionEspecial(v.posicion);

        if (p) {

            document
                .getElementById("cambioEspecialCarril")
                .value =
                p.calle;

            document
                .getElementById("cambioEspecialPosicion")
                .value =
                p.fila;

        } else {

            const sugerido =
                obtenerProximaPosicionEspecial(
                    v.playa,
                    v.bloque
                );

            const ps =
                parsearPosicionEspecial(sugerido);

            if (ps) {

                document
                    .getElementById("cambioEspecialCarril")
                    .value =
                    ps.calle;

                document
                    .getElementById("cambioEspecialPosicion")
                    .value =
                    ps.fila;

            }

        }

    } else {

        document
            .getElementById("cambioNumero")
            .value =
            obtenerProximaPosicionCambio(
                v.playa,
                v.bloque,
                v
            );

    }

    document
        .getElementById("locationModal")
        .classList
        .remove("hidden");

    document
        .getElementById("scanResult")
        .classList
        .add("hidden");

    actualizarPreviewCambioUbicacion();

}

function actualizarControlesCambioUbicacion() {

    const playa =
        document
            .getElementById("cambioPlaya")
            .value;

    const esJ =
        esPlayaEspecial(playa);

    const numeroContainer =
        document.getElementById(
            "cambioNumeroContainer"
        );

    const jContainer =
        document.getElementById(
            "cambioEspecialCarrilFilaContainer"
        );

    if (esJ) {

        numeroContainer
            .classList
            .add("hidden");

        jContainer
            .classList
            .remove("hidden");

    } else {

        numeroContainer
            .classList
            .remove("hidden");

        jContainer
            .classList
            .add("hidden");

    }

}

function obtenerProximaPosicionCambio(
    playa,
    bloque,
    vehiculoActual
) {

    if (esPlayaEspecial(playa)) {

        return obtenerProximaPosicionEspecial(
            playa,
            bloque
        );

    }

    const registros =
        vehiculos.filter(function(v) {

            if (
                vehiculoActual &&
                v.id === vehiculoActual.id
            ) {
                return false;
            }

            return (
                v.playa === playa &&
                v.bloque === bloque
            );

        });

    if (registros.length === 0) {

        return normalizarPrimerNumero(
            obtenerInicioNumeracion()
        );

    }

    let mayor =
        Math.max.apply(
            null,
            registros.map(function(v) {
                return Number(v.posicion);
            })
        );

    const modo = obtenerModoNumeracion();

    if (modo === "pares" || modo === "impares") {
        const posicionesDelModo = registros
            .map(function(v) {
                return Number(v.posicion);
            })
            .filter(function(numero) {
                return Number.isFinite(numero) && (
                    modo === "pares"
                        ? numero % 2 === 0
                        : numero % 2 !== 0
                );
            });

        if (posicionesDelModo.length === 0) {
            return normalizarPrimerNumero(
                obtenerInicioNumeracion()
            );
        }

        return Math.max.apply(
            null,
            posicionesDelModo
        ) + 2;
    }

    return mayor + 1;

}

function actualizarPreviewCambioUbicacion() {

    const playa =
        document
            .getElementById("cambioPlaya")
            .value;

    const bloque =
        document
            .getElementById("cambioBloque")
            .value;

    const hint =
        document
            .getElementById("positionHint");

    if (esPlayaEspecial(playa)) {

        const calle =
            parseInt(
                document
                    .getElementById("cambioEspecialCarril")
                    .value,
                10
            );

        const fila =
            parseInt(
                document
                    .getElementById("cambioEspecialPosicion")
                    .value,
                10
            );

        const calleValida =
            Number.isFinite(calle) &&
            calle >= 1;

        const filaValida =
            Number.isFinite(fila) &&
            fila >= 1 &&
            fila <= 5;

        if (
            !calleValida ||
            !filaValida
        ) {

            // EDITABLE: vista previa cuando faltan datos
            document
                .getElementById("locationPreview")
                .innerText =
                `Nueva ubicacion: Playa ${playa} - Bloque ${bloque}`;

            // EDITABLE: mensaje de error
            hint.innerText =
                "Ingrese una carril y una ubicacion validas.";

            hint.style.color =
                "#dc3545";

            return;

        }

        const posicion =
            convertirPosicionEspecial(
                calle,
                fila
            );

        // EDITABLE: formato de vista previa de Playa especial
        document
            .getElementById("locationPreview")
            .innerText =
            `Nueva ubicacion: \nPlaya ${playa} - Bloque ${bloque} \nCarril ${calle} - Posicion ${fila} - Ubicacion ${posicion}`;

        const ocupado =
            posicionEspecialOcupada(
                playa,
                bloque,
                calle,
                fila,
                vehiculoCambioUbicacion
            );

        if (ocupado) {

            // EDITABLE: mensaje cuando la ubicacion esta ocupada
            hint.innerText =
                "Esta ubicacion ya esta ocupada. Elija otra.";

            hint.style.color =
                "#dc3545";

        } else {

            // EDITABLE: mensaje cuando la ubicacion esta libre
            hint.innerText =
                "La ubicacion esta disponible.";

            hint.style.color =
                "#198754";

        }

        return;

    }

    let numero =
        parseInt(
            document
                .getElementById("cambioNumero")
                .value,
            10
        );

    if (
        !Number.isFinite(numero) ||
        numero < 1
    ) {
        numero = 1;
    }

    // EDITABLE: vista previa para las demas playas
    document
        .getElementById("locationPreview")
        .innerText =
        `Nueva ubicacion: \nPlaya ${playa} - Bloque ${bloque} - Numero ${numero}`;

    const ocupado =
        vehiculos.some(function(v) {

            if (
                vehiculoCambioUbicacion &&
                v.id === vehiculoCambioUbicacion.id
            ) {
                return false;
            }

            return (
                v.playa === playa &&
                v.bloque === bloque &&
                Number(v.posicion) === numero
            );

        });

    if (ocupado) {

        // EDITABLE: mensaje cuando el numero esta ocupado
        hint.innerText =
            "Este numero ya esta ocupado. Elija otro numero.";

        hint.style.color =
            "#dc3545";

    } else {

        // EDITABLE: mensaje cuando el numero esta libre
        hint.innerText =
            "El numero esta disponible.";

        hint.style.color =
            "#198754";

    }

}

document
    .getElementById("cambioPlaya")
    .addEventListener(
        "change",
        function() {

            actualizarControlesCambioUbicacion();
            sugerirNumeroCambio();

        }
    );

document
    .getElementById("cambioBloque")
    .addEventListener(
        "change",
        function() {

            sugerirNumeroCambio();

        }
    );

document
    .getElementById("cambioNumero")
    .addEventListener(
        "input",
        actualizarPreviewCambioUbicacion
    );

document
    .getElementById("cambioEspecialCarril")
    .addEventListener(
        "input",
        actualizarPreviewCambioUbicacion
    );

document
    .getElementById("cambioEspecialPosicion")
    .addEventListener(
        "change",
        actualizarPreviewCambioUbicacion
    );

function sugerirNumeroCambio() {

    const playa =
        document
            .getElementById("cambioPlaya")
            .value;

    const bloque =
        document
            .getElementById("cambioBloque")
            .value;

    actualizarControlesCambioUbicacion();

    if (esPlayaEspecial(playa)) {

        const sugerido =
            obtenerProximaPosicionEspecial(
                playa,
                bloque
            );

        const p =
            parsearPosicionEspecial(sugerido);

        if (p) {

            document
                .getElementById("cambioEspecialCarril")
                .value =
                p.calle;

            document
                .getElementById("cambioEspecialPosicion")
                .value =
                p.fila;

        }

        actualizarPreviewCambioUbicacion();

        return;

    }

    const sugerido =
        obtenerProximaPosicionCambio(
            playa,
            bloque,
            vehiculoCambioUbicacion
        );

    document
        .getElementById("cambioNumero")
        .value =
        sugerido;

    actualizarPreviewCambioUbicacion();

}

function confirmarCambioUbicacion() {

    const playa =
        document
            .getElementById("cambioPlaya")
            .value;

    const bloque =
        document
            .getElementById("cambioBloque")
            .value;

    if (esPlayaEspecial(playa)) {

        const calle =
            parseInt(
                document
                    .getElementById("cambioEspecialCarril")
                    .value,
                10
            );

        const fila =
            parseInt(
                document
                    .getElementById("cambioEspecialPosicion")
                    .value,
                10
            );

        if (
            !Number.isFinite(calle) ||
            calle < 1
        ) {

            // EDITABLE: mensaje de error
            mostrarAlerta(
                "Ingrese una calle valida."
            );

            return;

        }

        if (
            !Number.isFinite(fila) ||
            fila < 1 ||
            fila > 5
        ) {

            // EDITABLE: mensaje de error
            mostrarAlerta(
                "Seleccione una fila valida entre 1 y 5."
            );

            return;

        }

        const ocupado =
            posicionEspecialOcupada(
                playa,
                bloque,
                calle,
                fila,
                vehiculoCambioUbicacion
            );

        if (ocupado) {
            
            reproducirSonidoError();   
            // EDITABLE: mensaje de ubicacion ocupada
            mostrarAlerta(
                `La ubicacion ${calle}-${fila} \nya esta ocupada en Playa ${playa} - Bloque ${bloque}.`
            );

            return;

        }

        if (!vehiculoCambioUbicacion) {

            playaSelect.value =
                playa;

            bloqueSelect.value =
                bloque;

            filaInicial.value =
                fila;

            configuracionNumeracion.inicio =
                calle;

            numeroInicial.value =
                calle;

            guardarConfiguracionNumeracion();

            actualizarPantalla();
            cerrarCambioUbicacion();

            return;

        }

        const indice =
            vehiculos.findIndex(
                function(x) {

                    return (
                        x.id ===
                        vehiculoCambioUbicacion.id
                    );

                }
            );

        if (indice === -1) {

            cerrarCambioUbicacion();

            return;

        }

        const anterior =
            vehiculos[indice];

        vehiculos[indice].playa =
            playa;

        vehiculos[indice].bloque =
            bloque;

        vehiculos[indice].posicion =
            convertirPosicionEspecial(
                calle,
                fila
            );

        vehiculos[indice].fechaModificacion =
            new Date().toISOString();

        guardarDatos();
        
        reproducirSonidoNuevo();

        playaSelect.value =
            playa;

        bloqueSelect.value =
            bloque;

        actualizarPantalla();

        cerrarCambioUbicacion();

        resultadoPendiente = null;
        ultimoCodigo = null;
        bloqueandoLectura = false;

        if (cambioDesdeScanner) {

            actualizarPosicionScanner();

            // EDITABLE: mensaje despues de modificar ubicacion desde escaner
            document
                .getElementById("scannerStatus")
                .innerText =
                `Ubicacion modificada a Playa\n ${playa} - Bloque ${bloque} - Carril ${calle} - Posicion ${fila}.`;

            document
                .getElementById("scanResult")
                .classList
                .add("hidden");

        } else {

            // EDITABLE: mensaje despues de modificar ubicacion
            mostrarAlerta(
                `Vehiculo ${anterior.chasis} cambiado a \nPlaya ${playa} - Bloque ${bloque} - Carril ${calle} - Posicion ${fila}.`
            );

        }

        vehiculoCambioUbicacion = null;
        cambioDesdeScanner = false;

        return;

    }

    const numero =
        parseInt(
            document
                .getElementById("cambioNumero")
                .value,
            10
        );

    if (
        !Number.isFinite(numero) ||
        numero < 1
    ) {

        // EDITABLE: mensaje de error
        mostrarAlerta(
            "Ingrese un numero de posicion valido."
        );

        return;

    }

    const ocupado =
        vehiculos.some(function(v) {

            if (
                vehiculoCambioUbicacion &&
                v.id === vehiculoCambioUbicacion.id
            ) {
                return false;
            }

            return (
                v.playa === playa &&
                v.bloque === bloque &&
                Number(v.posicion) === numero
            );

        });

    if (ocupado) {

        reproducirSonidoError();
        // EDITABLE: mensaje de ubicacion ocupada
        mostrarAlerta(
            `La posicion ${numero} \nya esta ocupada en Playa ${playa} - Bloque ${bloque}.`
        );

        return;

    }

    if (!vehiculoCambioUbicacion) {

        playaSelect.value =
            playa;

        bloqueSelect.value =
            bloque;

        guardarConfiguracionNumeracion();
        actualizarPantalla();
        cerrarCambioUbicacion();

        return;

    }

    const indice =
        vehiculos.findIndex(
            function(x) {

                return (
                    x.id ===
                    vehiculoCambioUbicacion.id
                );

            }
        );

    if (indice === -1) {

        cerrarCambioUbicacion();

        return;

    }

    const anterior =
        vehiculos[indice];

    vehiculos[indice].playa =
        playa;

    vehiculos[indice].bloque =
        bloque;

    vehiculos[indice].posicion =
        numero;

    vehiculos[indice].fechaModificacion =
        new Date().toISOString();

    guardarDatos();

    reproducirSonidoNuevo();

    playaSelect.value =
        playa;

    bloqueSelect.value =
        bloque;

    actualizarPantalla();

    cerrarCambioUbicacion();

    resultadoPendiente = null;
    ultimoCodigo = null;
    bloqueandoLectura = false;

    if (cambioDesdeScanner) {

        actualizarPosicionScanner();

        // EDITABLE: mensaje despues de modificar ubicacion desde escaner
        document
            .getElementById("scannerStatus")
            .innerText =
            `Ubicacion modificada a Playa ${playa} - Bloque ${bloque} - Ubicacion ${numero}.`;

        document
            .getElementById("scanResult")
            .classList
            .add("hidden");

    } else {

        // EDITABLE: mensaje despues de modificar ubicacion
        mostrarAlerta(
            `Vehiculo ${anterior.chasis} cambiado a \nPlaya ${playa} - Bloque ${bloque} - Ubicacion ${numero}.`
        );

    }

    vehiculoCambioUbicacion = null;
    cambioDesdeScanner = false;

}
function abrirObservacionesCambioUbicacion() {
    if (!vehiculoCambioUbicacion) return;
    abrirObservaciones(vehiculoCambioUbicacion);
}

function cerrarCambioUbicacion() {

    document
        .getElementById("locationModal")
        .classList
        .add("hidden");

    vehiculoCambioUbicacion = null;
    cambioDesdeScanner = false;

    if (
        scannerActivo &&
        !document
            .getElementById("scannerModal")
            .classList
            .contains("hidden")
    ) {

        document
            .getElementById("scanResult")
            .classList
            .add("hidden");

        resultadoPendiente = null;
        ultimoCodigo = null;
        bloqueandoLectura = false;
    }
}


async function cerrarScanner() {

    bloqueandoLectura = true;

    if (scanner) {

        try {
            await scanner.stop();
        } catch (error) {
            console.log("Error al detener scanner:", error);
        }

        try {
            scanner.clear();
        } catch (error) {
            console.log("Error al limpiar scanner:", error);
        }
    }

    scanner = null;
    scannerActivo = false;

    resultadoPendiente = null;
    ultimoCodigo = null;
    bloqueandoLectura = false;

    const manualModal =
        document.getElementById("manualCodeModal");

    if (manualModal) {
        manualModal.classList.add("hidden");
    }

    const scannerModal =
        document.getElementById("scannerModal");

    if (scannerModal) {
        scannerModal.classList.add("hidden");
    }
}


// ============================================================
// INGRESO MANUAL DE CODIGO
// ============================================================

function abrirIngresoManual() {

    const modal =
        document.getElementById("manualCodeModal");

    const input =
        document.getElementById("manualCodeInput");

    if (!modal || !input) {

        console.error(
            "No se encontro el modal de ingreso manual."
        );

        return;
    }

    bloqueandoLectura = true;

    input.value = "";

    modal.classList.remove("hidden");

    setTimeout(function() {
        input.focus();
    }, 100);
}


// ============================================================
// CERRAR INGRESO MANUAL
// ============================================================

function cerrarIngresoManual() {

    const modal =
        document.getElementById("manualCodeModal");

    if (modal) {
        modal.classList.add("hidden");
    }

    ultimoCodigo = null;
    bloqueandoLectura = false;
}


// ============================================================
// CONFIRMAR INGRESO MANUAL
// ============================================================

function confirmarIngresoManual() {

    const input =
        document.getElementById("manualCodeInput");

    if (!input) {

        console.error(
            "No se encontro el campo de ingreso manual."
        );

        return;
    }

    const chasis =
        input.value.trim();

    if (!chasis) {

        mostrarAlerta(
            "Ingrese un numero de chasis."
        );

        input.focus();

        return;
    }

    const modal =
        document.getElementById("manualCodeModal");

    if (modal) {
        modal.classList.add("hidden");
    }

    ultimoCodigo = chasis;

    procesarCodigo(chasis);
}


function actualizarPosicionScanner() {

    const playa =
        playaSelect.value;

    const bloque =
        bloqueSelect.value;

    const posicion =
        obtenerProximaPosicion(
            playa,
            bloque
        );

    document
        .getElementById("scannerPlaya")
        .innerText =
        playa;

    document
        .getElementById("scannerBloque")
        .innerText =
        bloque;

    document
        .getElementById("scannerPosicion")
        .innerText =
        posicion;
}
