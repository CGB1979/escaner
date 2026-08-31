async function abrirScanner() {
  if (!datosExcel.workbook) {
    alert("Primero cargue un archivo Excel.");
    return;
  }

  document.getElementById("scannerModal").classList.remove("hidden");
  continuarEscaneo();

  if (scannerActivo && scanner) {
    return;
  }

  scannerActivo = true;

  try {
    if (scanner) {
      try { await scanner.stop(); } catch (e) {}
      try { await scanner.clear(); } catch (e) {}
      scanner = null;
    }

    scanner = new Html5Qrcode("reader");

    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 280, height: 130 },
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
      textoDetectado => {
        if (!scannerActivo || bloqueandoLectura) return;
        procesarCodigo(textoDetectado);
      }
    );

    document.getElementById("scannerStatus").textContent =
      "Apunte la cámara al código de barras";

  } catch (e) {
    console.error(e);
    scannerActivo = false;
    sonidoError();
    document.getElementById("scannerStatus").textContent =
      "No se pudo acceder a la cámara. Use el ingreso manual.";
  }
}

function procesarCodigo(codigo) {
  if (bloqueandoLectura || !scannerActivo) return;

  bloqueandoLectura = true;

  const c = normalizar(codigo);
  const exactos = vehiculos.filter(v => key(v.chasis) === key(c));

  if (exactos.length) {
    sonidoExito();
    mostrarVehiculo(exactos[0]);
  } else {
    sonidoError();
    mostrarNoEncontrado(c);
  }
}

function mostrarVehiculo(v) {
  vehiculoActual = v;
  modoCambio = "existente";

  document.getElementById("scanTitulo").textContent =
    "Vehículo encontrado";

  document.getElementById("scanInfo").innerHTML = `
    <div class="scan-info">
      <strong>Chasis:</strong> ${escapeHTML(v.chasis)}
      <br>
      ${escapeHTML(ubicacionTexto(v))}
      ${v.movidoDesde ? `<div class="vehicle-moved">Movido desde: ${escapeHTML(v.movidoDesde)}</div>` : ""}
    </div>
  `;

  document.getElementById("scanButtons").innerHTML = `
    <button class="btn-secondary" type="button" onclick="cancelarResultadoScan()">Cancelar</button>
    <button class="btn-danger" type="button" onclick="borrarDesdeScan()">Borrar</button>
    <button class="btn-warning" type="button" onclick="cambiarDesdeScan()">Cambiar ubicación</button>
  `;

  document.getElementById("scanResult").classList.remove("hidden");
  document.getElementById("btnIngresarManual").classList.add("hidden");
  document.getElementById("scannerStatus").textContent =
    "Vehículo encontrado";
}

function mostrarNoEncontrado(codigo) {
  vehiculoActual = {
    id: "nuevo-" + Date.now(),
    chasis: codigo,
    playa: "",
    bloque: "",
    carril: "",
    posicion: "",
    observaciones: "",
    movidoDesde: ""
  };

  modoCambio = "nuevo";

  document.getElementById("scanTitulo").textContent =
    "El vehículo no está en el listado";

  document.getElementById("scanInfo").innerHTML = `
    <div class="scan-info">
      <strong>Chasis escaneado:</strong> ${escapeHTML(codigo)}
      <br>
      Puede salir o indicar una nueva ubicación para agregarlo al Excel cargado.
    </div>
  `;

  document.getElementById("scanButtons").innerHTML = `
    <button class="btn-secondary" type="button" onclick="cerrarScanner()">Salir</button>
    <button class="btn-warning" type="button" onclick="cambiarDesdeScan()">Cambiar ubicación</button>
  `;

  document.getElementById("scanResult").classList.remove("hidden");
  document.getElementById("btnIngresarManual").classList.add("hidden");
  document.getElementById("scannerStatus").textContent =
    "Vehículo no encontrado";
}

function continuarEscaneo(mensaje = "Apunte la cámara al código de barras") {
  document.getElementById("scanResult").classList.add("hidden");
  document.getElementById("btnIngresarManual").classList.remove("hidden");
  document.getElementById("btnSalirScanner").classList.remove("hidden");
  document.getElementById("scannerStatus").textContent = mensaje;

  vehiculoActual = null;
  modoCambio = "existente";

  if (scannerActivo) {
    bloqueandoLectura = false;
  }
}

function cancelarResultadoScan() {
  continuarEscaneo();
}

function borrarDesdeScan() {
  if (!vehiculoActual) return;

  const borrado = eliminarVehiculo(vehiculoActual.id);

  if (borrado) {
    continuarEscaneo("Vehículo eliminado. Continúe escaneando.");
  }
}

function cambiarDesdeScan() {
  if (!vehiculoActual) return;

  abrirCambioUbicacionVehiculo(
    vehiculoActual.id,
    vehiculoActual
  );
}

async function cerrarScanner() {
  bloqueandoLectura = true;
  scannerActivo = false;

  if (scanner) {
    try { await scanner.stop(); } catch (e) {}
    try { await scanner.clear(); } catch (e) {}
  }

  scanner = null;
  vehiculoActual = null;
  modoCambio = "existente";

  document.getElementById("scannerModal").classList.add("hidden");
  document.getElementById("scanResult").classList.add("hidden");
  document.getElementById("btnIngresarManual").classList.remove("hidden");
  document.getElementById("btnSalirScanner").classList.remove("hidden");

  bloqueandoLectura = false;
}

function abrirIngresoManual() {
  bloqueandoLectura = true;

  document.getElementById("manualCodeModal").classList.remove("hidden");
  document.getElementById("manualCodeInput").value = "";

  setTimeout(() => {
    document.getElementById("manualCodeInput").focus();
  }, 50);
}

function cerrarIngresoManual() {
  document.getElementById("manualCodeModal").classList.add("hidden");
  if (scannerActivo) bloqueandoLectura = false;
}

function confirmarIngresoManual() {
  const c = normalizar(
    document.getElementById("manualCodeInput").value
  );

  if (c.length < 4) {
    sonidoError();
    alert("Ingrese al menos 4 caracteres.");
    return;
  }

  document.getElementById("manualCodeModal").classList.add("hidden");

  const r = vehiculos.filter(v =>
    key(v.chasis).includes(key(c))
  );

  if (r.length === 1) {
    bloqueandoLectura = true;
    sonidoExito();
    mostrarVehiculo(r[0]);
    return;
  }

  if (r.length > 1) {
    bloqueandoLectura = true;
    mostrarCoincidencias(r);
    return;
  }

  bloqueandoLectura = true;
  sonidoError();
  mostrarNoEncontrado(c);
}

function mostrarCoincidencias(resultados) {
  document.getElementById("listaCoincidencias").innerHTML =
    resultados.map(v => `
      <button class="coincidencia-item" type="button" onclick="seleccionarCoincidencia('${v.id}')">
        <strong>${escapeHTML(v.chasis)}</strong>
        <br>
        <span>${escapeHTML(ubicacionTexto(v))}</span>
      </button>
    `).join("");

  document.getElementById("coincidenciasModal").classList.remove("hidden");
}

function cerrarCoincidencias() {
  document.getElementById("coincidenciasModal").classList.add("hidden");
  continuarEscaneo();
}

function seleccionarCoincidencia(id) {
  document.getElementById("coincidenciasModal").classList.add("hidden");

  const v = vehiculos.find(x => x.id === id);

  if (!v) {
    continuarEscaneo();
    return;
  }

  bloqueandoLectura = true;
  mostrarVehiculo(v);
}
