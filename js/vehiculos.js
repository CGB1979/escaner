function actualizarPantalla() {

    const playa = playaSelect.value;
    const bloque = bloqueSelect.value;

    // EDITABLE: formato de la ubicacion que se muestra arriba
    tituloUbicacion.innerText =
        `Playa ${playa} - Bloque ${bloque}`;

    const registros = vehiculos.filter(function(v) {

        return (
            v.playa === playa &&
            v.bloque === bloque
        );

    });

    cantidadVehiculos.innerText =
        registros.length;

    const siguiente = obtenerProximaPosicion(playa, bloque);
    proximaPosicion.innerText = esPlayaEspecial(playa)
        ? siguiente
        : formatearUbicacionNormal(siguiente);

    mostrarVehiculos();
    actualizarAyudaNumeracion();

}

function mostrarVehiculos() {

    const playa = playaSelect.value;
    const bloque = bloqueSelect.value;

    const registros = vehiculos
        .filter(function(v) {

            return (
                v.playa === playa &&
                v.bloque === bloque
            );

        })
        .sort(function(a, b) {

            if (esPlayaEspecial(playa)) {

                const pa = parsearPosicionEspecial(
                    a.posicion
                );

                const pb = parsearPosicionEspecial(
                    b.posicion
                );

                if (!pa && !pb) {
                    return 0;
                }

                if (!pa) {
                    return 1;
                }

                if (!pb) {
                    return -1;
                }

                if (pa.calle !== pb.calle) {

                    return (
                        pa.calle -
                        pb.calle
                    );

                }

                return (
                    pa.fila -
                    pb.fila
                );

            }

            return (
                Number(a.posicion) -
                Number(b.posicion)
            );

        });

    if (registros.length === 0) {

        // EDITABLE: mensaje cuando no hay vehiculos
        listaVehiculos.innerHTML = `
            <div class="empty">
                No hay vehiculos asignados en esta calle.
            </div>
        `;

        return;

    }

    listaVehiculos.innerHTML = "";

    registros.forEach(function(v) {

        const div = document.createElement("div");

        div.className = "vehicle";

        let etiquetaUbicacion = "";

        if (esPlayaEspecial(v.playa)) {

            const p = parsearPosicionEspecial(
                v.posicion
            );

            if (p) {

                // EDITABLE: textos que describen la ubicacion de vehiculos
                etiquetaUbicacion = `
                    <div class="vehicle-info">
                        Playa ${escapeHTML(v.playa)}
                        -
                        Bloque ${escapeHTML(v.bloque)}
                        -
                        Carril ${escapeHTML(p.calle)}
                        -
                        Posicion ${escapeHTML(p.fila)}
                    </div>
                `;

            } else {

                // EDITABLE: textos que describen la ubicacion de vehiculos
                etiquetaUbicacion = `
                    <div class="vehicle-info">
                        Playa ${escapeHTML(v.playa)}
                        -
                        Bloque ${escapeHTML(v.bloque)}
                    </div>
                `;

            }

        } else {

            // EDITABLE: textos que describen la ubicacion de vehiculos
            etiquetaUbicacion = `
                <div class="vehicle-info">
                    Playa ${escapeHTML(v.playa)}
                    -
                    Bloque ${escapeHTML(v.bloque)}
                </div>
            `;

        }

        div.innerHTML = `

            <div class="vehicle-position">

                <!-- EDITABLE: texto antes de la posicion -->
                Ubicacion ${escapeHTML(v.posicion)}

            </div>

            <div class="vehicle-chassis">
                ${escapeHTML(v.chasis)}
            </div>

            ${etiquetaUbicacion}

            <div class="vehicle-actions">

                <!-- EDITABLE: texto del boton -->
                <button
                    class="btn-warning"
                    onclick="reasignarDesdeLista('${escapeJS(v.chasis)}')">
                    Cambiar ubicacion
                </button>

                <!-- EDITABLE: texto del boton -->
                <button
                    class="btn-danger"
                    onclick="eliminarVehiculo('${escapeJS(v.chasis)}')">
                    Eliminar
                </button>

            </div>
        `;

        listaVehiculos.appendChild(div);

    });

}

async
