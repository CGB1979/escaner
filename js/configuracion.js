let vehiculos = JSON.parse(
    localStorage.getItem("vehiculosPlaya") || "[]"
);

let scanner = null;
let scannerActivo = false;
let ultimoCodigo = null;
let resultadoPendiente = null;
let bloqueandoLectura = false;
let vehiculoCambioUbicacion = null;
let cambioDesdeScanner = false;

let configuracionNumeracion = {
    modo: "continua",
    inicio: 1,
    filaInicio: 1,
    manual: false,
    manualCarril: 1,
    manualPosicion: 1
};

try {
    const guardada = JSON.parse(localStorage.getItem("configNumeracionPlaya") || "null");
    if (guardada && typeof guardada === "object") {
        configuracionNumeracion = { ...configuracionNumeracion, ...guardada };
    }
} catch (_) {
    // Si la configuracion guardada esta corrupta, se usan valores seguros.
}

const playaSelect = document.getElementById("playa");
const bloqueSelect = document.getElementById("bloque");
const listaVehiculos = document.getElementById("listaVehiculos");
const cantidadVehiculos = document.getElementById("cantidadVehiculos");
const proximaPosicion = document.getElementById("proximaPosicion");
const tituloUbicacion = document.getElementById("tituloUbicacion");
const numeroInicial = document.getElementById("numeroInicial");
const numberingHelp = document.getElementById("numberingHelp");
const numeroInicialContainer = document.getElementById("numeroInicialContainer");
const filaInicialContainer = document.getElementById("filaInicialContainer");
const filaInicial = document.getElementById("filaInicial");
const modoContinua = document.getElementById("modoContinua");
const modoPares = document.getElementById("modoPares");
const modoImpares = document.getElementById("modoImpares");
const escaneoManual = document.getElementById("escaneoManual");
const escaneoManualContainer = document.getElementById("escaneoManualContainer");
const manualLocationRow = document.getElementById("manualLocationRow");
const manualCarril = document.getElementById("manualCarril");
const manualPosicion = document.getElementById("manualPosicion");
const numberingOptions = document.getElementById("numberingOptions");
const tipoNumeracionLabel = document.getElementById("tipoNumeracionLabel");

function cargarListasUbicacionCentralizadas() {
    const crearOpciones = (valores, valorVacio = "") => {
        return valores.map(valor => {
            const option = document.createElement("option");
            option.value = valor;
            option.textContent = valor;
            return option;
        });
    };

    if (playaSelect) {
        playaSelect.replaceChildren(new Option("", ""), ...crearOpciones(PLAYAS_DISPONIBLES));
    }
    if (bloqueSelect) {
        bloqueSelect.replaceChildren(new Option("", ""), ...crearOpciones(BLOQUES_DISPONIBLES));
    }

    const cambioPlaya = document.getElementById("cambioPlaya");
    if (cambioPlaya) {
        cambioPlaya.replaceChildren(...crearOpciones(PLAYAS_DISPONIBLES));
    }

    const cambioBloque = document.getElementById("cambioBloque");
    if (cambioBloque) {
        cambioBloque.replaceChildren(...crearOpciones(BLOQUES_DISPONIBLES));
    }
}

cargarListasUbicacionCentralizadas();

playaSelect.addEventListener("change", function() {

    actualizarOpcionesPlaya();

    guardarConfiguracionNumeracion();

    actualizarPantalla();

});

bloqueSelect.addEventListener("change", function() {

    guardarConfiguracionNumeracion();

    actualizarPantalla();

});

// ACA SE A�ADEN PLAYAS ESPECIALES a�adir entre comillas y separando con coma


function obtenerEscaneoManual() {
    return !!(escaneoManual && escaneoManual.checked);
}

function obtenerUbicacionManual() {
    const carril = parseInt(manualCarril && manualCarril.value, 10);
    const posicion = parseInt(manualPosicion && manualPosicion.value, 10);
    return {
        carril: Number.isFinite(carril) && carril >= 1 ? carril : 1,
        posicion: Number.isFinite(posicion) && posicion >= 1 ? posicion : 1
    };
}

function aplicarModoEscaneoManual() {
    const manual = obtenerEscaneoManual();
    const modo = obtenerModoNumeracion();
    const esContinua = modo === "continua";
    const inversaContainer = document.getElementById("inversaContainer");

    // El selector del sector inferior cambia segun el tipo de numeracion:
    // Continua -> Escaneo Manual | Pares/Impares -> Asignar a la inversa.
    if (escaneoManualContainer) {
        escaneoManualContainer.classList.toggle("hidden", !esContinua);
    }
    if (inversaContainer) {
        inversaContainer.classList.toggle("hidden", esContinua);
    }

    // Escaneo Manual solo puede existir sobre Continua. Si se cambia a
    // Pares/Impares, se desactiva para que nunca queden dos modos activos.
    if (escaneoManual && !esContinua) {
        escaneoManual.checked = false;
    }

    const activo = manual && esContinua;

    // En modo manual se reemplaza visualmente toda la configuracion
    // automatica por Carril + Posicion. La fila manual esta ubicada
    // debajo de Playa/Bloque, no debajo del selector ON/OFF.
    if (numberingOptions) numberingOptions.classList.toggle("hidden", activo);
    if (numberingHelp) numberingHelp.classList.toggle("hidden", activo);
    if (numeroInicialContainer) numeroInicialContainer.classList.toggle("hidden", activo);
    if (tipoNumeracionLabel) {tipoNumeracionLabel.classList.toggle("hidden", activo);}

    // Fila pertenece exclusivamente a Playa especial + Por fila y nunca
    // debe quedar visible junto al selector de Escaneo Manual.
    const esJ = typeof esPlayaEspecial === "function" && esPlayaEspecial(playaSelect.value);
    const mostrarFila = !activo && esJ && modo === "porFila";
    if (filaInicialContainer) filaInicialContainer.classList.toggle("hidden", !mostrarFila);

    if (manualLocationRow) manualLocationRow.classList.toggle("hidden", !activo);

    const controlesInicioRow = document.getElementById("controlesInicioRow");
    if (controlesInicioRow) controlesInicioRow.classList.toggle("manual-active", activo);

    // En Continua, Asignacion Manual ocupa SIEMPRE la misma celda que
    // Asignar a la inversa (columna derecha). Asi, ocultar Numero inicial
    // no hace que el switch salte a la izquierda.
    if (escaneoManualContainer) {
        escaneoManualContainer.style.gridColumn = "2";
        escaneoManualContainer.style.gridRow = "1";
    }
    if (inversaContainer) {
        inversaContainer.style.gridColumn = "2";
        inversaContainer.style.gridRow = "1";
    }

    // El titulo general sigue siendo "Tipo de numeracion"; "Escaneo Manual"
    // es el nombre del sector con su switch, no reemplaza ese encabezado.
    // if (tipoNumeracionLabel) tipoNumeracionLabel.textContent = "Tipo de numeracion";

    // Evita el parpadeo inicial mostrando por un instante el control
    // incorrecto antes de que JS determine Continua vs Pares/Impares.
    const configGroup = document.getElementById("configNumeracionGroup");
    if (configGroup) configGroup.classList.add("config-numeracion-ready");

    if (activo) {
        if (manualCarril && (!manualCarril.value || Number(manualCarril.value) < 1)) manualCarril.value = 1;
        if (manualPosicion && (!manualPosicion.value || Number(manualPosicion.value) < 1)) manualPosicion.value = 1;
    }
}

function guardarConfiguracionEscaneoManual() {
    const manual = obtenerEscaneoManual();
    const ubicacion = obtenerUbicacionManual();
    configuracionNumeracion.manual = manual;
    configuracionNumeracion.manualCarril = ubicacion.carril;
    configuracionNumeracion.manualPosicion = ubicacion.posicion;
    if (manual) {
        configuracionNumeracion.modo = "continua";
    }
    localStorage.setItem("configNumeracionPlaya", JSON.stringify(configuracionNumeracion));
    aplicarModoEscaneoManual();
    actualizarPantalla();
    if (typeof scannerActivo !== "undefined" && scannerActivo && typeof actualizarPosicionScanner === "function") {
        actualizarPosicionScanner();
    }
}

if (escaneoManual) {
    escaneoManual.addEventListener("change", guardarConfiguracionEscaneoManual);
}
[manualCarril, manualPosicion].forEach(function(input) {
    if (!input) return;
    input.addEventListener("change", function() {
        let valor = parseInt(input.value, 10);
        if (!Number.isFinite(valor) || valor < 1) valor = 1;
        input.value = valor;
        guardarConfiguracionEscaneoManual();
    });
});
