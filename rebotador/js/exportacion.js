async function confirmarBorrarTodo() {
  if (!datosExcel.workbook) return;

  const borrarTodo = confirm(
    "¿Eliminar el Excel guardado y todos los datos de la sesión?\n\nAceptar = eliminar Excel y todos los datos.\nCancelar = ver la siguiente opción."
  );

  if (borrarTodo) {
    vehiculos = [];
    datosExcel = {
      nombre: "", hoja: "", encabezados: [], columnas: {}, workbook: null,
      worksheet: null, filas: [], filaEncabezados: 1, filaDatosInicio: 2, totalInicial: 0
    };
    excelFileInput.value = "";
    btnBuscarExcel.textContent = "Buscar Excel";
    btnCargarExcel.disabled = true;
    if (typeof eliminarSesionGuardada === "function") await eliminarSesionGuardada();
    actualizarPantalla();
    actualizarEstadoExcel();
    return;
  }

  if (!vehiculos.length) return;
  if (confirm("¿Reiniciar solo las asignaciones y movimientos? El Excel seguirá cargado y la sesión se conservará.")) {
    vehiculos.forEach(v => {
      v.playa = "";
      v.bloque = "";
      v.carril = "";
      v.posicion = "";
      v.movidoDesde = "";
      v.observaciones = "";
    });
    actualizarPantalla();
    actualizarEstadoExcel();
  }
}

function colLetra(n) {
  let s = "";
  n++;

  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }

  return s;
}

function asegurarColumna(campo, titulo) {
  let idx = datosExcel.columnas[campo];

  if (Number.isInteger(idx) && idx >= 0) return idx;

  const headers = datosExcel.encabezados || [];
  idx = headers.length;
  headers[idx] = titulo;
  datosExcel.columnas[campo] = idx;

  const celda = colLetra(idx) + datosExcel.filaEncabezados;
  datosExcel.worksheet[celda] = { t: "s", v: titulo };

  return idx;
}

function escribirCelda(fila, columna, valor) {
  if (columna === null || columna === undefined || columna < 0) return;

  const ref = colLetra(columna) + fila;
  datosExcel.worksheet[ref] = {
    t: "s",
    v: String(valor ?? "")
  };
}

function limpiarFila(fila, maxCol) {
  for (let col = 0; col <= maxCol; col++) {
    delete datosExcel.worksheet[colLetra(col) + fila];
  }
}

function exportarCSV() {
  if (!datosExcel.workbook || !datosExcel.worksheet) {
    alert("No hay un archivo Excel cargado para exportar.");
    return;
  }

  const c = datosExcel.columnas;
  const obs = asegurarColumna("observaciones", "Observaciones");
  const mov = asegurarColumna("movidoDesde", "Movido desde");

  const maxCol = Math.max(
    ...Object.values(datosExcel.columnas).filter(Number.isInteger),
    0
  );

  const filasIniciales = new Set(
    Array.from({ length: Math.max(0, datosExcel.totalInicial || 0) }, (_, i) =>
      datosExcel.filaDatosInicio + i
    )
  );

  const filasActuales = new Set(
    vehiculos
      .map(v => Number(v._filaExcel))
      .filter(Number.isFinite)
  );

  for (const fila of filasIniciales) {
    if (!filasActuales.has(fila)) {
      limpiarFila(fila, maxCol);
    }
  }

  let proximaFila = Math.max(
    datosExcel.filaDatosInicio - 1,
    ...Array.from(filasActuales),
    datosExcel.filaEncabezados
  ) + 1;

  vehiculos.forEach(v => {
    if (!Number.isFinite(Number(v._filaExcel))) {
      v._filaExcel = proximaFila++;
    }

    const f = v._filaExcel;

    escribirCelda(f, c.chasis, v.chasis);
    escribirCelda(f, c.playa, v.playa);
    escribirCelda(f, c.bloque, v.bloque);
    escribirCelda(f, c.carril, v.carril);
    escribirCelda(f, c.posicion, v.posicion);
    escribirCelda(f, obs, v.observaciones || "");
    escribirCelda(f, mov, v.movidoDesde || "");
  });

  const maxFila = Math.max(
    datosExcel.filaEncabezados,
    ...vehiculos.map(v => Number(v._filaExcel) || 0)
  );

  datosExcel.worksheet["!ref"] =
    `A1:${colLetra(maxCol)}${maxFila}`;

  const nombreBase = (datosExcel.nombre || "rebotador")
    .replace(/\.[^.]+$/, "");

  XLSX.writeFile(
    datosExcel.workbook,
    `${nombreBase}-rebotador.xlsx`
  );
}

function cerrarConfirmacion() {
  document.getElementById("confirmModal").classList.add("hidden");
}
