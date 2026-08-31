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
  return `Playa ${v.playa || "—"} - Bloque ${v.bloque || "—"} - Carril ${v.carril || "—"} - ${etiquetaPosicion(v.playa)} ${v.posicion || "—"}`;
}

function actualizarPantalla() {
  const p = playaSelect.value;
  const b = bloqueSelect.value;

  const resultado = vehiculos.filter(v =>
    (!p || v.playa === p) &&
    (!b || v.bloque === b)
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
      ${v.movidoDesde ? `<div class="vehicle-moved">Movido desde: ${escapeHTML(v.movidoDesde)}</div>` : ""}
      <div class="vehicle-actions">
        <button class="btn-warning" type="button" onclick="abrirCambioUbicacionVehiculo('${v.id}')">Cambiar ubicación</button>
        <button class="btn-danger" type="button" onclick="eliminarVehiculo('${v.id}')">Borrar</button>
      </div>
    </div>
  `).join("");
}

function eliminarVehiculo(id, sinConfirmar = false) {
  const v = vehiculos.find(x => x.id === id);
  if (!v) return false;

  if (!sinConfirmar) {
    if (!confirm(`¿Borrar el vehículo ${v.chasis} del listado cargado?`)) {
      return false;
    }
  }

  vehiculos = vehiculos.filter(x => x.id !== id);
  actualizarPantalla();
  actualizarEstadoExcel();
  return true;
}
