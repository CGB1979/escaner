function buscarVehiculo() {

    const texto =
        document
            .getElementById("buscarChasis")
            .value
            .trim()
            .toLowerCase();

    const resultado =
        document
            .getElementById("resultadoBusqueda");

    if (!texto) {

        resultado.innerHTML = "";

        return;

    }

    const encontrados =
        vehiculos.filter(
            function(v) {

                return String(v.chasis)
                    .toLowerCase()
                    .includes(texto);

            }
        );

    if (encontrados.length === 0) {

        // EDITABLE: mensaje cuando no se encuentra el vehiculo
        resultado.innerHTML = `

            <div class="danger-message">
                No se encontro ningun vehiculo.
            </div>

        `;

        return;

    }

    resultado.innerHTML =
        encontrados
            .map(function(v) {

                let ubicacion = "";

                if (esPlayaEspecial(v.playa)) {

                    const p =
                        parsearPosicionEspecial(
                            v.posicion
                        );

                    if (p) {

                        // EDITABLE: informacion de ubicacion en resultados de busqueda
                        ubicacion = `

                            Playa ${escapeHTML(v.playa)}
                            -
                            Bloque ${escapeHTML(v.bloque)}

                            <br>

                            Carril ${escapeHTML(p.calle)}
                            -
                            Posicion ${escapeHTML(p.fila)}

                            <br>

                            Ubicacion ${escapeHTML(v.posicion)}

                        `;

                    } else {

                        // EDITABLE: informacion de ubicacion en resultados de busqueda
                        ubicacion = `

                            Playa ${escapeHTML(v.playa)}
                            -
                            Bloque ${escapeHTML(v.bloque)}
                            -
                            Ubicacion ${escapeHTML(v.posicion)}

                        `;

                    }

                } else {

                    // EDITABLE: informacion de ubicacion en resultados de busqueda
                    ubicacion = `

                        Playa ${escapeHTML(v.playa)}
                        -
                        Bloque ${escapeHTML(v.bloque)}
                        -
                        Posicion ${escapeHTML(v.posicion)}

                    `;

                }

                return `

                    <div class="success-message">

                        <strong>
                            ${escapeHTML(v.chasis)}
                        </strong>

                        <br><br>

                        ${ubicacion}

                        <br><br>

                        <!-- EDITABLE: texto del boton -->
                        <button
                            class="btn-warning"
                            onclick="reasignarDesdeLista('${escapeJS(v.chasis)}')">
                            Cambiar ubicacion
                        </button>

                    </div>

                `;

            })
            .join("");

}

function eliminarVehiculo(chasis) {

    const v =
        vehiculos.find(
            function(x) {
                return x.chasis === chasis;
            }
        );

    if (!v) {
        return;
    }

    // EDITABLE: titulo del mensaje de eliminacion
    document
        .getElementById("confirmTitulo")
        .innerText =
        "Eliminar vehiculo";

    let ubicacion = `

        Playa ${escapeHTML(v.playa)}
        -
        Bloque ${escapeHTML(v.bloque)}
        -
        Posicion ${escapeHTML(v.posicion)}

    `;

    if (esPlayaEspecial(v.playa)) {

        const p =
            parsearPosicionEspecial(
                v.posicion
            );

        if (p) {

            ubicacion = `

                Playa ${escapeHTML(v.playa)}
                -
                Bloque ${escapeHTML(v.bloque)}

                <br>

                Carril ${escapeHTML(p.calle)}
                -
                Posicion ${escapeHTML(p.fila)}

                <br>

                Ubicacion ${escapeHTML(v.posicion)}

            `;

        }

    }

    document
        .getElementById("confirmMensaje")
        .innerHTML = `

        <div class="danger-message">

            <!-- EDITABLE: etiqueta -->
            <strong>Chasis:</strong><br>

            ${escapeHTML(v.chasis)}

            <br><br>

            ${ubicacion}

        </div>

        <!-- EDITABLE: pregunta de confirmacion -->
        &iquest;Esta seguro de eliminar este registro?

    `;

    document
        .getElementById("confirmAceptar")
        .onclick =
        function() {

            vehiculos =
                vehiculos.filter(
                    function(x) {
                        return x.id !== v.id;
                    }
                );

            guardarDatos();
            cerrarConfirmacion();
            actualizarPantalla();

        };

    document
        .getElementById("confirmModal")
        .classList
        .remove("hidden");

}

function confirmarBorrarTodo() {

    if (vehiculos.length === 0) {

        // EDITABLE: mensaje cuando no hay registros
        mostrarAlerta(
            "No hay registros para borrar."
        );

        return;

    }

    // EDITABLE: titulo de confirmacion
    document
        .getElementById("confirmTitulo")
        .innerText =
        "Borrar todos los datos";

    document
        .getElementById("confirmMensaje")
        .innerHTML = `

        <div class="danger-message">

            <!-- EDITABLE: mensaje de advertencia -->
            Esta accion eliminara

            <strong>
                ${vehiculos.length}
            </strong>

            <!-- EDITABLE: texto -->
            vehiculos registrados.

            <br><br>

            <!-- EDITABLE: advertencia -->
            Esta accion no se puede deshacer.

        </div>

        <!-- EDITABLE: pregunta de confirmacion -->
        &iquest;Esta seguro?

    `;

    document
        .getElementById("confirmAceptar")
        .onclick =
        function() {

            vehiculos = [];

            guardarDatos();
            cerrarConfirmacion();
            actualizarPantalla();

        };

    document
        .getElementById("confirmModal")
        .classList
        .remove("hidden");

}

function cerrarConfirmacion() {

    document
        .getElementById("confirmModal")
        .classList
        .add("hidden");

}

function guardarDatos() {

    localStorage.setItem(
        "vehiculosPlaya",
        JSON.stringify(vehiculos)
    );

}

async function exportarCSV() {

    if (vehiculos.length === 0) {

        mostrarAlerta(
            "No hay vehiculos registrados para exportar."
        );

        return;
    }

    try {

        const workbook =
            new ExcelJS.Workbook();

        /*
         * =========================================
         * HOJA PRINCIPAL
         * =========================================
         */

        const worksheet =
            workbook.addWorksheet(
                "Vehiculos"
            );

        /*
         * =========================================
         * COLUMNAS
         * SIN CODIGO DE BARRAS
         * =========================================
         */

        worksheet.columns = [

            {
                header: "Numero de chasis",
                key: "chasis",
                width: 25
            },

            {
                header: "Playa",
                key: "playa",
                width: 15
            },

            {
                header: "Bloque",
                key: "bloque",
                width: 15
            },

            {
                header: "Carril",
                key: "calle",
                width: 15
            },

            {
                header: "Posicion",
                key: "fila",
                width: 15
            },

            {
                header: "Ubicacion",
                key: "ubicacion",
                width: 18
            },

            {
                header: "Observacion",
                key: "observacion",
                width: 35
            }

        ];

        /*
         * =========================================
         * ENCABEZADO
         * =========================================
         */

        const encabezado =
            worksheet.getRow(1);

        encabezado.font = {

            bold: true,

            color: {
                argb: "FFFFFFFF"
            }

        };

        for (let c = 1; c <= 7; c++) {
    encabezado.getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
            argb: "70AD47"
        }
    };
}

        encabezado.alignment = {

            vertical: "middle",

            horizontal: "center"

        };

        encabezado.height = 25;


        /*
         * =========================================
         * CREAR VEHICULOS
         * =========================================
         */

        for (
            let i = 0;
            i < vehiculos.length;
            i++
        ) {

            const v =
                vehiculos[i];

            let calle = "";
            let fila = "";
            let ubicacion = "";

            if (esPlayaEspecial(v.playa)) {
                const p = parsearPosicionEspecial(v.posicion);

                if (p) {
                    calle = String(p.calle);
                    fila = String(p.fila);
                    ubicacion = `${v.playa} - ${v.bloque} - ${p.calle} - ${p.fila}`;
                } else {
                    ubicacion = `${v.playa} - ${v.bloque} - ${String(v.posicion)}`;
                }
            } else {
                const p = obtenerUbicacionNormal(v.posicion);

                if (p) {
                    calle = String(p.carril);
                    fila = String(p.posicion);
                    ubicacion = `${v.playa} - ${v.bloque} - ${p.posicion}`;
                } else {
                    ubicacion = `${v.playa} - ${v.bloque} - ${String(v.posicion)}`;
                }
            }

            /*
             * =========================================
             * DATOS
             * =========================================
             */

            const chasis =
                String(v.chasis);

            const playa =
                String(v.playa);

            const bloque =
                String(v.bloque);



            /*
             * =========================================
             * AGREGAR FILA
             * =========================================
             */

            const filaExcel =
                worksheet.addRow({

                    chasis:
                        chasis,

                    playa:
                        playa,

                    bloque:
                        bloque,

                    calle:
                        String(calle),

                    fila:
                        String(fila),

                    ubicacion:
                        ubicacion,

                    observacion:
                        String(v.observaciones || "")

                });


            /*
             * =========================================
             * TODAS LAS CELDAS COMO TEXTO
             * =========================================
             */

            for (
                let c = 1;
                c <= 7;
                c++
            ) {

                filaExcel
                    .getCell(c)
                    .numFmt = "@";

            }


            /*
             * =========================================
             * ALINEACION
             * =========================================
             */

            filaExcel.height = 15;

            filaExcel.alignment = {

                vertical:
                    "middle",

                horizontal:
                    "center"

            };

        }


        /*
         * =========================================
         * FILTROS
         * =========================================
         */

        worksheet.autoFilter = {

            from:
                "A1",

            to:
                "G" +
                (vehiculos.length + 1)

        };


        /*
         * =========================================
         * CONGELAR ENCABEZADO
         * =========================================
         */

        worksheet.views = [

            {

                state:
                    "frozen",

                ySplit:
                    1

            }

        ];


        /*
         * =========================================
         * GENERAR ARCHIVO XLSX
         * =========================================
         */

        const buffer =
            await workbook.xlsx.writeBuffer();


        const blob =
            new Blob(
                [buffer],
                {

                    type:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const enlace =
            document.createElement(
                "a"
            );


        enlace.href =
            url;


        enlace.download =
            "vehiculos_playa.xlsx";


        document
            .body
            .appendChild(
                enlace
            );


        enlace.click();


        document
            .body
            .removeChild(
                enlace
            );


        URL.revokeObjectURL(
            url
        );


    } catch (error) {

        console.error(
            "Error al generar Excel:",
            error
        );

        mostrarAlerta(
            "No se pudo generar el archivo Excel."
        );

    }

}

function escapeHTML(text) {

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}

function escapeJS(text) {

    return String(text)

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /'/g,
            "\\'"
        );

}
