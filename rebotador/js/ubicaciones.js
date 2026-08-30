function opcionesPlayasCambio() {
  return PLAYAS_DISPONIBLES.slice();
}

function opcionesBloquesCambio() {
  return BLOQUES_DISPONIBLES.slice();
}

function obtenerCarrilesExistentes(playa, bloque) {
  return [...new Set(
    vehiculos
      .filter(v =>
        normalizar(v.playa) === normalizar(playa) &&
        normalizar(v.bloque) === normalizar(bloque) &&
        normalizar(v.carril)
      )
      .map(v => normalizar(v.carril))
  )]
    .filter(v => Number.isFinite(Number(v)) && Number(v) >= 1)
    .sort((a, b) => Number(a) - Number(b));
}

function obtenerOpcionesPosicion(playa) {
  return esPlayaEspecial(playa)
    ? ["1", "2", "3", "4", "5"]
    : ["Adelante", "Atrás"];
}

function ubicacionOcupada(playa, bloque, carril, posicion, excluirId = "") {
  return vehiculos.some(v =>
    v.id !== excluirId &&
    normalizar(v.playa) === normalizar(playa) &&
    normalizar(v.bloque) === normalizar(bloque) &&
    normalizar(v.carril) === normalizar(carril) &&
    key(v.posicion) === key(posicion)
  );
}

function posicionesLibres(playa, bloque, carril, excluirId = "") {
  if (!playa || !bloque || !carril || Number(carril) < 1) return [];

  return obtenerOpcionesPosicion(playa).filter(posicion =>
    !ubicacionOcupada(playa, bloque, carril, posicion, excluirId)
  );
}

function obtenerPrimeraUbicacionDisponible(playa, bloque, excluirId = "") {
  if (!playa || !bloque) return null;

  const carriles = obtenerCarrilesExistentes(playa, bloque)
    .map(Number)
    .filter(Number.isFinite);

  const mayor = carriles.length ? Math.max(...carriles) : 0;
  const limite = Math.max(mayor + 1, 1);

  for (let n = 1; n <= limite; n++) {
    const libres = posicionesLibres(playa, bloque, String(n), excluirId);

    if (libres.length) {
      return {
        carril: String(n),
        posicion: libres[0]
      };
    }
  }

  return null;
}

function llenarSelect(id, valores, valorSeleccionado = "", textoInicial = "Seleccionar") {
  const select = document.getElementById(id);

  select.innerHTML =
    `<option value="">${textoInicial}</option>` +
    valores.map(valor =>
      `<option value="${escapeHTML(valor)}">${escapeHTML(valor)}</option>`
    ).join("");

  if (valores.includes(valorSeleccionado)) {
    select.value = valorSeleccionado;
  } else if (valores.length) {
    select.value = valores[0];
  } else {
    select.value = "";
  }
}

function cargarPlayasCambio(valor = "") {
  llenarSelect("cambioPlaya", opcionesPlayasCambio(), valor, "Seleccionar playa");
}

function cargarBloquesCambio(valor = "") {
  llenarSelect("cambioBloque", opcionesBloquesCambio(), valor, "Seleccionar bloque");
}

function cargarCarrilesCambio(playa, bloque, valor = "", excluirId = "") {
  const input = document.getElementById("cambioCarril");
  const lista = document.getElementById("cambioCarrilOpciones");
  const existentes = obtenerCarrilesExistentes(playa, bloque);

  lista.innerHTML = existentes
    .map(carril => `<option value="${escapeHTML(carril)}"></option>`)
    .join("");

  const manual = normalizar(valor);

  if (manual && Number(manual) >= 1) {
    input.value = String(Number(manual));
    return;
  }

  const primera = obtenerPrimeraUbicacionDisponible(playa, bloque, excluirId);
  input.value = primera ? primera.carril : "";
}

function cargarPosicionesCambio(playa, bloque, carril, valor = "", excluirId = "") {
  const label = document.getElementById("labelCambioPosicion");
  const select = document.getElementById("cambioPosicion");

  const esEspecial = esPlayaEspecial(playa);
  label.textContent = esEspecial ? "Posición" : "Ubicación";

  let libres = posicionesLibres(playa, bloque, carril, excluirId);

  if (esEspecial) {
    libres.sort((a, b) => Number(a) - Number(b));
  }

  select.innerHTML =
    `<option value="">Seleccionar ${esEspecial ? "posición" : "ubicación"}</option>` +
    libres.map(posicion =>
      `<option value="${escapeHTML(posicion)}">${escapeHTML(posicion)}</option>`
    ).join("");

  if (valor && libres.includes(valor)) {
    select.value = valor;
  } else if (libres.length) {
    select.value = libres[0];
  } else {
    select.value = "";
  }
}

function actualizarVistaUbicacion() {
  const preview = document.getElementById("locationPreview");
  const boton = document.getElementById("btnGuardarCambioUbicacion");

  if (!vehiculoActual) {
    preview.textContent = "";
    boton.disabled = true;
    return;
  }

  const playa = normalizar(document.getElementById("cambioPlaya").value);
  const bloque = normalizar(document.getElementById("cambioBloque").value);
  const carril = normalizar(document.getElementById("cambioCarril").value);
  const posicion = normalizar(document.getElementById("cambioPosicion").value);

  const etiqueta = esPlayaEspecial(playa) ? "Posición" : "Ubicación";

  let valido =
    !!playa &&
    !!bloque &&
    /^\d+$/.test(carril) &&
    Number(carril) >= 1 &&
    !!posicion &&
    !ubicacionOcupada(playa, bloque, carril, posicion, vehiculoActual.id);

  if (valido) {
    preview.classList.remove("invalid");
    preview.classList.add("valid");
    preview.innerHTML =
      `Disponible: Playa <strong>${escapeHTML(playa)}</strong> - ` +
      `Bloque <strong>${escapeHTML(bloque)}</strong> - ` +
      `Carril <strong>${escapeHTML(carril)}</strong> - ` +
      `${etiqueta} <strong>${escapeHTML(posicion)}</strong>`;
  } else {
    preview.classList.remove("valid");
    preview.classList.add("invalid");

    if (!playa || !bloque) {
      preview.textContent = "Seleccione Playa y Bloque.";
    } else if (!/^\d+$/.test(carril) || Number(carril) < 1) {
      preview.textContent = "Ingrese un Carril válido mayor o igual a 1.";
    } else if (!posicion) {
      preview.textContent = `No hay ${etiqueta.toLowerCase()} disponible para ese Carril.`;
    } else {
      preview.textContent = "La ubicación seleccionada no está disponible.";
    }
  }

  boton.disabled = !valido;
}

function actualizarCambioDesdePlaya() {
  if (!vehiculoActual) return;

  const playa = document.getElementById("cambioPlaya").value;
  const bloque = document.getElementById("cambioBloque").value;

  cargarCarrilesCambio(playa, bloque, "", vehiculoActual.id);

  const carril = document.getElementById("cambioCarril").value;

  cargarPosicionesCambio(
    playa,
    bloque,
    carril,
    "",
    vehiculoActual.id
  );

  actualizarVistaUbicacion();
}

function actualizarCambioDesdeBloque() {
  actualizarCambioDesdePlaya();
}

function actualizarCambioDesdeCarril() {
  if (!vehiculoActual) return;

  const playa = document.getElementById("cambioPlaya").value;
  const bloque = document.getElementById("cambioBloque").value;
  const carril = normalizar(document.getElementById("cambioCarril").value);

  cargarPosicionesCambio(
    playa,
    bloque,
    carril,
    "",
    vehiculoActual.id
  );

  actualizarVistaUbicacion();
}

function actualizarCambioDesdePosicion() {
  actualizarVistaUbicacion();
}

function abrirCambioUbicacionVehiculo(id, obj) {
  const v = obj || vehiculos.find(x => x.id === id);

  if (!v) return;

  vehiculoActual = v;

  document.getElementById("cambioChasis").textContent = v.chasis;

  if (v.playa || v.bloque || v.carril || v.posicion) {
    document.getElementById("cambioUbicacionActual").innerHTML =
      `Playa ${escapeHTML(v.playa || "—")} - Bloque ${escapeHTML(v.bloque || "—")}<br>` +
      `Carril ${escapeHTML(v.carril || "—")} - ${esPlayaEspecial(v.playa) ? "Posición" : "Ubicación"} ${escapeHTML(v.posicion || "—")}`;
  } else {
    document.getElementById("cambioUbicacionActual").textContent =
      "Vehículo no registrado en el listado.";
  }

  const playaInicial =
    (PLAYAS_DISPONIBLES.includes(v.playa) && v.playa) ||
    (PLAYAS_DISPONIBLES.includes(playaSelect.value) && playaSelect.value) ||
    PLAYAS_DISPONIBLES[0];

  const bloqueInicial =
    (BLOQUES_DISPONIBLES.includes(v.bloque) && v.bloque) ||
    (BLOQUES_DISPONIBLES.includes(bloqueSelect.value) && bloqueSelect.value) ||
    BLOQUES_DISPONIBLES[0];

  cargarPlayasCambio(playaInicial);
  cargarBloquesCambio(bloqueInicial);

  // Al abrir el cambio se propone automáticamente la primera ubicación disponible.
  actualizarCambioDesdePlaya();

  document.getElementById("scanResult").classList.add("hidden");
  document.getElementById("locationModal").classList.remove("hidden");
}

function cerrarCambioUbicacion() {
  document.getElementById("locationModal").classList.add("hidden");

  if (scannerActivo) {
    continuarEscaneo();
  }
}

function confirmarCambioUbicacion() {
  if (!vehiculoActual) return;

  const playa = normalizar(document.getElementById("cambioPlaya").value);
  const bloque = normalizar(document.getElementById("cambioBloque").value);
  const carril = normalizar(document.getElementById("cambioCarril").value);
  const posicion = normalizar(document.getElementById("cambioPosicion").value);

  if (!playa || !bloque || !/^\d+$/.test(carril) || Number(carril) < 1 || !posicion) {
    actualizarVistaUbicacion();
    return;
  }

  if (ubicacionOcupada(playa, bloque, carril, posicion, vehiculoActual.id)) {
    actualizarVistaUbicacion();
    return;
  }

  const anterior = (vehiculoActual.playa || vehiculoActual.bloque || vehiculoActual.carril || vehiculoActual.posicion)
    ? ubicacionTexto(vehiculoActual)
    : `Playa ${playaSelect.value || "no informada"} - Bloque ${bloqueSelect.value || "no informado"}`;

  const esNuevo = !vehiculos.some(v => v.id === vehiculoActual.id);

  vehiculoActual.playa = playa;
  vehiculoActual.bloque = bloque;
  vehiculoActual.carril = carril;
  vehiculoActual.posicion = posicion;
  vehiculoActual.movidoDesde = anterior;

  const movimiento = `Movido desde ${anterior}`;

  vehiculoActual.observaciones = vehiculoActual.observaciones
    ? `${vehiculoActual.observaciones} | ${movimiento}`
    : movimiento;

  if (esNuevo) {
    vehiculos.push(vehiculoActual);
  }

  actualizarPantalla();
  actualizarEstadoExcel();

  document.getElementById("locationModal").classList.add("hidden");

  if (scannerActivo) {
    continuarEscaneo("Ubicación guardada. Continúe escaneando.");
  }
}

document.getElementById("cambioPlaya").addEventListener("change", actualizarCambioDesdePlaya);
document.getElementById("cambioBloque").addEventListener("change", actualizarCambioDesdeBloque);
document.getElementById("cambioCarril").addEventListener("input", actualizarCambioDesdeCarril);
document.getElementById("cambioPosicion").addEventListener("change", actualizarCambioDesdePosicion);
