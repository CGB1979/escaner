function ubicacionTexto(v) {
    if (v && v.ubicacion) {
        return String(v.ubicacion);
    }

    if (esPlayaEspecial(v.playa)) {
        const p = parsearPosicionEspecial(v.posicion);

        if (p) {
            return `Playa ${v.playa || "—"} - Bloque ${v.bloque || "—"} - Carril ${p.calle} - Posicion ${p.fila}`;
        }

        return `Playa ${v.playa || "—"} - Bloque ${v.bloque || "—"} - ${v.posicion || "—"}`;
    }

    const u = obtenerUbicacionNormal(v.posicion);

    return u
        ? `Playa ${v.playa || "—"} - Bloque ${v.bloque || "—"} - ${u.posicion}`
        : `Playa ${v.playa || "—"} - Bloque ${v.bloque || "—"} - ${v.posicion || "—"}`;
}

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

    if (esPlayaEspecial(playa)) {

        const p = parsearPosicionEspecial(siguiente);

        proximaPosicion.innerHTML = p
            ? `Carril ${p.calle}<br><span class="next-position-line">Posicion ${p.fila}</span>`
            : String(siguiente);

    } else {

        const u = obtenerUbicacionNormal(siguiente);

        proximaPosicion.innerHTML = u
            ? `Carril ${u.carril}<br><span class="next-position-line">Posicion ${u.posicion}</span>`
            : String(siguiente);

    }

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

        const etiquetaUbicacion = `
            <div class="vehicle-info">
                ${escapeHTML(ubicacionTexto(v))}
            </div>
            ${v.observaciones ? `
                <div class="vehicle-observation">
                    <strong>Observación:</strong> ${escapeHTML(v.observaciones)}
                </div>
            ` : ""}
        `;

        div.innerHTML = `

            <div class="vehicle-position">
                Chasis
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
