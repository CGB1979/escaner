function escapeHTML(t) {
  return String(t ?? "").replace(/[&<>'"]/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[c]));
}

function etiquetaPosicion(playa) {
  return esPlayaEspecial(playa) ? "Posición" : "Ubicación";
}

function ubicacionTexto(v) {
    // Para playas especiales, priorizar los campos carril / posicion cuando estén presentes
    if (esPlayaEspecial(v.playa)) {
      // Si ya vienen separados, úsalos directamente
      if (v.carril || v.posicion) {
        const carril = v.carril ?? (parsearPosicionEspecial(v.posicion)?.calle ?? "—");
        const posicion = v.posicion ?? (parsearPosicionEspecial(v.posicion)?.fila ?? "—");
        return `Playa ${v.playa || "—"} - Bloque ${v.bloque || "—"} - Carril ${carril} - Posicion ${posicion}`;
      }

      // Si no vienen separados, intentar parsear el campo posicion
      const p = parsearPosicionEspecial(v.posicion);

      if (p) {
        return `Playa ${v.playa || "—"} - Bloque ${v.bloque || "—"} - Carril ${p.calle} - Posicion ${p.fila}`;
      }

      // Fallback: mostrar lo que haya en v.posicion
      return `Playa ${v.playa || "—"} - Bloque ${v.bloque || "—"} - ${v.posicion || "—"}`;
    }

    // Playas normales: mantener formato anterior
    if (v.playa || v.bloque || v.posicion) {
      return `Playa ${v.playa || "—"} - Bloque ${v.bloque || "—"} - Ubicacion ${v.posicion || "—"}`;
    }

    return "Sin ubicación";
}
function actualizarPantalla() {
  const p = normalizar(playaSelect.value);
  const b = normalizar(bloqueSelect.value);

  const resultado = vehiculos.filter(v =>
    (!p || key(v.playa) === key(p)) &&
    (!b || key(v.bloque) === key(b))
  );

  document.getElementById("listaTitulo").textContent =
    (p || b)
      ? `Vehículos · ${p ? `Playa ${p}` : "Todas las playas"}${b ? ` · Bloque ${b}` : ""}`
      : "Vehículos cargados";

  if (!datosExcel.workbook) {
    listaVehiculos.innerHTML =
      '<div class="empty">Cargue un archivo Excel para comenzar.</div>';
    return;
  }

  if (!vehiculos.length) {
    listaVehiculos.innerHTML =
      '<div class="empty">No hay vehículos en el listado.</div>';
    return;
  }

  if (!resultado.length) {
    listaVehiculos.innerHTML =
      '<div class="empty">No hay vehículos para el filtro seleccionado.</div>';
    return;
  }

  listaVehiculos.innerHTML = resultado.map(v => `
    <div class="vehicle">
      <div class="vehicle-position">Chasis</div>
      <div class="vehicle-chassis">${escapeHTML(v.chasis)}</div>
      <div class="vehicle-info">${escapeHTML(ubicacionTexto(v))}</div>
      ${v.observaciones ? `<div class="vehicle-observation"><strong>Observación:</strong> ${escapeHTML(v.observaciones)}</div>` : ""}
      ${v.movidoDesde ? `<div class="vehicle-moved">Movido desde: ${escapeHTML(v.movidoDesde)}</div>` : ""}
      <div class="vehicle-actions">
        <button class="btn-warning" type="button" onclick="abrirCambioUbicacionVehiculo('${v.id}')">Cambiar ubicación</button>
        <button class="btn-danger" type="button" onclick="eliminarVehiculo('${v.id}')">Eliminar</button>
      </div>
    </div>
  `).join("");
}
playaSelect.addEventListener("change", actualizarPantalla);
bloqueSelect.addEventListener("change", actualizarPantalla);
async function eliminarVehiculo(id, sinConfirmar = false) {
  const v = vehiculos.find(x => x.id === id);
  if (!v) return false;

  if (!sinConfirmar) {
    if (!(await mostrarConfirm(`¿Borrar el vehículo ${v.chasis} del listado cargado?`, "Eliminar vehículo", "Eliminar"))) {
      return false;
    }
  }

  vehiculos = vehiculos.filter(x => x.id !== id);
  actualizarPantalla();
  actualizarEstadoExcel();
  return true;
}
