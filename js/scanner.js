async function abrirScanner() {

    guardarConfiguracionNumeracion();

    document
        .getElementById("scannerModal")
        .classList
        .remove("hidden");

    document
        .getElementById("scannerPlaya")
        .innerText = playaSelect.value;

    document
        .getElementById("scannerBloque")
        .innerText = bloqueSelect.value;

    actualizarPosicionScanner();

    document
        .getElementById("scanResult")
        .classList
        .add("hidden");

    bloqueandoLectura = false;
    ultimoCodigo = null;
    scannerActivo = true;

    if (scanner) {

        try {
            await scanner.stop();
        } catch(e) {}

        try {
            scanner.clear();
        } catch(e) {}

    }

    scanner = new Html5Qrcode("reader");

    try {

        await scanner.start(

            {
                facingMode: "environment"
            },

            {

                fps: 10,

                qrbox: function(
                    viewfinderWidth,
                    viewfinderHeight
                ) {

                    const width =
                        Math.floor(
                            viewfinderWidth * 0.92
                        );

                    const height =
                        Math.min(
                            140,
                            Math.floor(
                                viewfinderHeight * 0.45
                            )
                        );

                    return {
                        width: width,
                        height: height
                    };

                },

                formatsToSupport: [

                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.CODE_93,
                    Html5QrcodeSupportedFormats.CODABAR,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.ITF

                ]

            },

            codigoDetectado,

            function(error) {}

        );

        // EDITABLE: mensaje que aparece cuando la camara esta funcionando
        document
            .getElementById("scannerStatus")
            .innerText =
            "Apunte el codigo dentro del recuadro";

    } catch(error) {

        console.error(error);

        // EDITABLE: mensaje cuando no se puede acceder a la camara
        document
            .getElementById("scannerStatus")
            .innerText =
            "No se pudo acceder a la camara. Verifique los permisos.";

    }

}

/* ================================
   SONIDOS DEL ESCANER
   ================================ */

let audioContextScanner = null;

function obtenerAudioScanner() {
    if (!audioContextScanner) {
        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {
            return null;
        }

        audioContextScanner = new AudioContext();
    }

    if (audioContextScanner.state === "suspended") {
        audioContextScanner.resume().catch(function() {});
    }

    return audioContextScanner;
}

// ACA la funcion reproducir sonido scanner
function reproducirSonidoNuevo() {

    const ctx = obtenerAudioScanner();

    if (!ctx) {
        return;
    }

    const ahora = ctx.currentTime;

    function bip(frecuencia, inicio, duracion, volumen) {

        const oscilador = ctx.createOscillator();
        const ganancia = ctx.createGain();

        const tiempo = ahora + inicio;

        oscilador.type = "sine";

        oscilador.frequency.setValueAtTime(
            frecuencia,
            tiempo
        );

        ganancia.gain.setValueAtTime(
            0.0001,
            tiempo
        );

        ganancia.gain.exponentialRampToValueAtTime(
            volumen,
            tiempo + 0.008
        );

        ganancia.gain.exponentialRampToValueAtTime(
            0.0001,
            tiempo + duracion
        );

        oscilador.connect(ganancia);
        ganancia.connect(ctx.destination);

        oscilador.start(tiempo);

        oscilador.stop(
            tiempo + duracion + 0.02
        );
    }

    bip(2100, 0, 0.150, 0.16);

    bip(2800, 0.100, 0.100, 0.19);
}
// ACA la funcion sonido error
function reproducirSonidoError() {

    const ctx = obtenerAudioScanner();

    if (!ctx) {
        return;
    }

    const ahora = ctx.currentTime;

    function bip(frecuencia, inicio, duracion) {

        const oscilador = ctx.createOscillator();
        const ganancia = ctx.createGain();

        oscilador.type = "square";

        oscilador.frequency.setValueAtTime(
            frecuencia,
            ahora + inicio
        );

        ganancia.gain.setValueAtTime(
            0.0001,
            ahora + inicio
        );

        ganancia.gain.exponentialRampToValueAtTime(
            0.16,
            ahora + inicio + 0.01
        );

        ganancia.gain.exponentialRampToValueAtTime(
            0.0001,
            ahora + inicio + duracion
        );

        oscilador.connect(ganancia);
        ganancia.connect(ctx.destination);

        oscilador.start(
            ahora + inicio
        );

        oscilador.stop(
            ahora + inicio + duracion + 0.01
        );
    }

    bip(320, 0, 0.13);
    bip(220, 0.16, 0.18);
}


function codigoDetectado(decodedText) {

    if (bloqueandoLectura) {
        return;
    }

    decodedText = String(decodedText).trim();

    if (!decodedText) {
        return;
    }

    if (decodedText === ultimoCodigo) {
        return;
    }

    ultimoCodigo = decodedText;
    bloqueandoLectura = true;

    procesarCodigo(decodedText);

}

function procesarCodigo(chasis) {

    const encontrado = vehiculos.find(function(v) {

        return (
            String(v.chasis).toLowerCase() ===
            String(chasis).toLowerCase()
        );

    });

   if (encontrado) {

    reproducirSonidoError();

    mostrarVehiculoExistente(encontrado);

    return;
}
reproducirSonidoNuevo();

    const ubicacion =
        obtenerUbicacionSeleccionada();

    const posicion =
        obtenerProximaPosicion(
            ubicacion.playa,
            ubicacion.bloque
        );

    resultadoPendiente = {

        tipo: "nuevo",
        chasis: chasis,
        playa: ubicacion.playa,
        bloque: ubicacion.bloque,
        posicion: posicion

    };

    // EDITABLE: titulo del resultado del escaneo
    document
        .getElementById("scanTitulo")
        .innerText =
        "Vehiculo detectado";

    let infoUbicacion = "";

    if (esPlayaEspecial(ubicacion.playa)) {

        const p = parsearPosicionEspecial(posicion);

        if (p) {

            // EDITABLE: textos de informacion del vehiculo detectado
            infoUbicacion = `

                <strong>Bloque:</strong>
                ${escapeHTML(ubicacion.bloque)}

                <br>

                <strong>Carril:</strong>
                ${escapeHTML(p.calle)}

                <br>

                <strong>Posicion:</strong>
                ${escapeHTML(p.fila)}

                <br>

                <strong>Ubicacion:</strong>

                <span
                    style="
                        font-size:22px;
                        font-weight:bold;
                        margin-left:5px;
                    ">
                    ${escapeHTML(posicion)}
                </span>

            `;

        }

    } else {

        // EDITABLE: textos de informacion del vehiculo detectado
        infoUbicacion = `

            <strong>Bloque:</strong>
            ${escapeHTML(ubicacion.bloque)}

            <br>

            <strong>Carril:</strong>
            ${escapeHTML(obtenerUbicacionNormal(posicion).carril)}

            <br>

            <strong>Posicion:</strong>
            ${escapeHTML(obtenerUbicacionNormal(posicion).posicion)}

        `;

    }

    document
        .getElementById("scanInfo")
        .innerHTML = `

        <!-- EDITABLE: etiqueta del chasis -->
        <strong>Chasis:</strong><br>

        ${escapeHTML(chasis)}

        <br><br>

        <!-- EDITABLE: etiqueta de playa -->
        <strong>Playa:</strong>
        ${escapeHTML(ubicacion.playa)}

        <br>

        ${infoUbicacion}

    `;

    // EDITABLE: texto del boton
    document
        .getElementById("btnAceptarScan")
        .innerText =
        "Aceptar y guardar";

    document
        .getElementById("btnAceptarScan")
        .className =
        "btn-success";

    document
        .getElementById("scanResult")
        .classList
        .remove("hidden");

    // EDITABLE: mensaje de confirmacion del escaneo
    document
        .getElementById("scannerStatus")
        .innerText =
        "Verifique los datos y presione Aceptar.";

}

function mostrarVehiculoExistente(v) {

    resultadoPendiente = {
        tipo: "existente",
        vehiculo: v
    };

    // EDITABLE: titulo cuando el vehiculo ya existe
    document
        .getElementById("scanTitulo")
        .innerText =
        "Vehiculo ya registrado";

    let ubicacionActual = "";

    if (esPlayaEspecial(v.playa)) {

        const p = parsearPosicionEspecial(
            v.posicion
        );

        if (p) {

            // EDITABLE: informacion de ubicacion existente
            ubicacionActual = `

                Playa ${escapeHTML(v.playa)}
                -
                Bloque ${escapeHTML(v.bloque)}

                <br>

                Carril ${escapeHTML(p.calle)}
                -
                Posicion ${escapeHTML(p.fila)}

                <br>

                <strong>
                    Ubicacion ${escapeHTML(v.posicion)}
                </strong>

            `;

        } else {

            // EDITABLE: informacion de ubicacion existente
            ubicacionActual = `

                Playa ${escapeHTML(v.playa)}
                -
                Bloque ${escapeHTML(v.bloque)}
                -
                <strong>
                    Ubicacion ${escapeHTML(v.posicion)}
                </strong>

            `;

        }

    } else {

        // EDITABLE: informacion de ubicacion existente
        ubicacionActual = `

            Playa ${escapeHTML(v.playa)}
            -
            Bloque ${escapeHTML(v.bloque)}
            -

            <strong>
                Ubicacion ${escapeHTML(v.posicion)}
            </strong>

        `;

    }

    document
        .getElementById("scanInfo")
        .innerHTML = `

        <div class="warning">

            <!-- EDITABLE: etiqueta -->
            <strong>Chasis:</strong><br>

            ${escapeHTML(v.chasis)}

            <br><br>

            <!-- EDITABLE: etiqueta -->
            <strong>Ubicacion actual:</strong><br>

            ${ubicacionActual}

        </div>

        <!-- EDITABLE: pregunta al usuario -->
        <strong>
            &iquest;Desea cambiar la ubicacion?
        </strong>

    `;

    // EDITABLE: texto del boton
    document
        .getElementById("btnAceptarScan")
        .innerText =
        "Cambiar ubicacion";

    document
        .getElementById("btnAceptarScan")
        .className =
        "btn-warning";

    document
        .getElementById("scanResult")
        .classList
        .remove("hidden");

    // EDITABLE: mensaje de estado
    document
        .getElementById("scannerStatus")
        .innerText =
        "Puede modificar playa, bloque y ubicacion.";

}

function aceptarScan() {

    if (!resultadoPendiente) {
        return;
    }

    if (resultadoPendiente.tipo === "nuevo") {

        guardarNuevoVehiculo();

        return;

    }

    if (resultadoPendiente.tipo === "existente") {

        abrirCambioUbicacionVehiculo(
            resultadoPendiente.vehiculo,
            true
        );

    }

}

function guardarNuevoVehiculo() {

    const r = resultadoPendiente;

    const nuevo = {

        id: Date.now(),

        chasis: r.chasis,

        playa: r.playa,

        bloque: r.bloque,

        posicion:
            esPlayaEspecial(r.playa)
                ? String(r.posicion)
                : Number(r.posicion),

        fecha:
            new Date().toISOString()

    };

    if (esPlayaEspecial(nuevo.playa)) {

        const p = parsearPosicionEspecial(
            nuevo.posicion
        );

        if (
            p &&
            posicionEspecialOcupada(
                nuevo.playa,
                nuevo.bloque,
                p.calle,
                p.fila
            )
        ) {

            reproducirSonidoError(); 
            // EDITABLE: mensaje de ubicacion ocupada
            mostrarAlerta(
                `La ubicacion ${nuevo.posicion} ya esta ocupada.`
            );

            ultimoCodigo = null;
            bloqueandoLectura = false;

            return;

        }

    }

    vehiculos.push(nuevo);

    guardarDatos();
    actualizarPantalla();

    document
        .getElementById("scanResult")
        .classList
        .add("hidden");

    resultadoPendiente = null;
    ultimoCodigo = null;
    bloqueandoLectura = false;

    actualizarPosicionScanner();

    // EDITABLE: mensaje despues de guardar
    document
        .getElementById("scannerStatus")
        .innerText =
        `Guardado en posicion ${nuevo.posicion}. Escanee el siguiente vehiculo.`;

}

function cancelarResultadoScan() {

    resultadoPendiente = null;

    document
        .getElementById("scanResult")
        .classList
        .add("hidden");

    ultimoCodigo = null;
    bloqueandoLectura = false;

    // EDITABLE: mensaje despues de cancelar
    document
        .getElementById("scannerStatus")
        .innerText =
        "Apunte la camara al siguiente codigo.";

}
