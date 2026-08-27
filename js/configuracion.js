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

let configuracionNumeracion = JSON.parse(
    localStorage.getItem("configNumeracionPlaya") ||
    '{"modo":"continua","inicio":1,"filaInicio":1}'
);

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
