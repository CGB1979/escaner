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

    if (v.manual === true && Number(v.carril) >= 1 && Number(v.posicionManual) >= 1) {
        return `Playa ${v.playa || "—"} - Bloque ${v.bloque || "—"} - Carril ${v.carril} - Posicion ${v.posicionManual}`;
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

    const manual = typeof obtenerEscaneoManual === "function" && obtenerEscaneoManual();
    const siguiente = obtenerProximaPosicion(playa, bloque);

    if (manual) {
        const ubicacion = obtenerUbicacionManual();
        proximaPosicion.innerHTML = `Carril ${ubicacion.carril}<br><span class="next-position-line">Posicion ${ubicacion.posicion}</span>`;
    } else if (esPlayaEspecial(playa)) {

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

            if (a.manual === true || b.manual === true) {
                const ca = a.manual === true ? Number(a.carril) : Number(obtenerUbicacionNormal(a.posicion)?.carril || 0);
                const cb = b.manual === true ? Number(b.carril) : Number(obtenerUbicacionNormal(b.posicion)?.carril || 0);
                if (ca !== cb) return ca - cb;
                const pa = a.manual === true ? Number(a.posicionManual) : Number(a.posicion);
                const pb = b.manual === true ? Number(b.posicionManual) : Number(b.posicion);
                if (pa !== pb) return pa - pb;
                return String(a.chasis || '').localeCompare(String(b.chasis || ''), undefined, { numeric: true, sensitivity: "base" });
            }

            const pa = Number(a.posicion);
            const pb = Number(b.posicion);
            const aVal = Number.isFinite(pa) ? pa : Number.MAX_SAFE_INTEGER;
            const bVal = Number.isFinite(pb) ? pb : Number.MAX_SAFE_INTEGER;
            if (aVal !== bVal) return aVal - bVal;
            return String(a.chasis || '').localeCompare(String(b.chasis || ''), undefined, { numeric: true, sensitivity: "base" });

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
