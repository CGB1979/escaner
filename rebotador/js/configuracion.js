let vehiculos = [];

// -----------------------------------------------------------------------------
// DIAGNÓSTICO DE CARGA EXCEL
// Se mantiene independiente de la lógica de importación. Registra el recorrido
// completo desde "Buscar Excel" hasta FileReader/XLSX y permite copiar el log.
// -----------------------------------------------------------------------------
const EXCEL_DEBUG_KEY = "rebotador-excel-debug-log";
const excelDebug = {
  inicio: null,
  lineas: []
};

function logExcelDebug(mensaje, datos = null) {
  if (!excelDebug.inicio) excelDebug.inicio = new Date();
  const tiempo = ((Date.now() - excelDebug.inicio.getTime()) / 1000).toFixed(3);
  let linea = `[+${tiempo}s] ${mensaje}`;

  if (datos !== null && datos !== undefined) {
    try {
      linea += " | " + JSON.stringify(datos);
    } catch (_) {
      linea += " | [datos no serializables]";
    }
  }

  excelDebug.lineas.push(linea);
  console.log("[EXCEL DEBUG]", linea);

  try {
    localStorage.setItem(EXCEL_DEBUG_KEY, excelDebug.lineas.join("\n"));
  } catch (_) {}

  actualizarBotonDiagnostico();
}

function iniciarLogExcelDebug(mensaje = "Inicio") {
  excelDebug.inicio = new Date();
  excelDebug.lineas = [];
  logExcelDebug(mensaje);
}

function obtenerLogExcelDebug() {
  return [
    "=== DIAGNÓSTICO REBOTADOR / EXCEL ===",
    "Fecha: " + (excelDebug.inicio ? excelDebug.inicio.toISOString() : new Date().toISOString()),
    "URL: " + window.location.href,
    "Navegador: " + navigator.userAgent,
    "XLSX disponible: " + (typeof XLSX !== "undefined"),
    "XLSX versión: " + (typeof XLSX !== "undefined" && XLSX.version ? XLSX.version : "desconocida"),
    "",
    ...excelDebug.lineas
  ].join("\n");
}

async function copiarLogExcelDebug(mostrarMensaje = true) {
  const texto = obtenerLogExcelDebug();
  let copiado = false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      copiado = true;
    }
  } catch (_) {}

  if (!copiado) {
    try {
      const area = document.createElement("textarea");
      area.value = texto;
      area.style.position = "fixed";
      area.style.left = "-9999px";
      area.style.top = "0";
      document.body.appendChild(area);
      area.focus();
      area.select();
      copiado = document.execCommand("copy");
      area.remove();
    } catch (_) {}
  }

  if (mostrarMensaje) {
    mostrarAlerta(copiado
      ? "El diagnóstico se copió al portapapeles. Pegalo en el chat."
      : "No se pudo copiar automáticamente. Usá el botón 'Copiar diagnóstico'.");
  }

  return copiado;
}

function actualizarBotonDiagnostico() {
  const boton = document.getElementById("btnCopiarDiagnostico");
  if (!boton) return;
  boton.disabled = excelDebug.lineas.length === 0;
}

function registrarErrorExcelDebug(etapa, err) {
  const datos = {
    etapa,
    nombre: err && err.name ? err.name : "Error",
    mensaje: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : ""
  };
  logExcelDebug("ERROR", datos);
}


let datosExcel = {
  nombre: "",
  hoja: "",
  encabezados: [],
  columnas: {},
  workbook: null,
  worksheet: null,
  filas: [],
  filaEncabezados: 1,
  filaDatosInicio: 2,
  totalInicial: 0
};

let scanner = null;
let scannerActivo = false;
let bloqueandoLectura = false;
let vehiculoActual = null;
let modoCambio = "existente";

const PLAYAS_DISPONIBLES = [
  "A","B","C","C1","D","E","E1","F","G","H","I","J",
  "K","L","M","N","O","P","Q","X","Y","Z"
];

const BLOQUES_DISPONIBLES = [
  "A","B","C","D","E","F","G","H","I","J","K","L",
  "M","N","O","P","Q","X","Y","Z"
];

const playaSelect = document.getElementById("playa");
const bloqueSelect = document.getElementById("bloque");
const listaVehiculos = document.getElementById("listaVehiculos");
const excelFileInput = document.getElementById("excelFile");
const btnBuscarExcel = document.getElementById("btnBuscarExcel");
const btnCargarExcel = document.getElementById("btnCargarExcel");

function normalizar(v) {
  return String(v ?? "").trim();
}

function key(v) {
  return normalizar(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function columnaPorLetra(l) {
  if (!l) return null;
  let n = 0;

  for (const c of String(l).toUpperCase()) {
    if (c < "A" || c > "Z") return null;
    n = n * 26 + c.charCodeAt(0) - 64;
  }

  return n - 1;
}

function detectarColumnas(encabezados) {
  const r = {};
  const headers = (encabezados || []).map(h => normalizar(h));

  for (const [campo, cfg] of Object.entries(CONFIG_EXCEL.campos)) {
    let idx = columnaPorLetra(cfg.columna);
    const alternativas = (cfg.encabezados || []).map(key).filter(Boolean);

    // Si se indicó una letra de columna, se respeta como primera opción.
    if (idx === null || idx >= headers.length) idx = -1;

    if (idx < 0) {
      // Primero intentamos coincidencia exacta.
      idx = headers.findIndex(h => alternativas.includes(key(h)));
    }

    if (idx < 0) {
      // Después permitimos encabezados más descriptivos.
      idx = headers.findIndex(h => {
        const kh = key(h);
        if (!kh) return false;

        if (campo === "chasis") {
          return kh.includes("chasis");
        }

        return alternativas.some(a => a && kh.includes(a));
      });
    }

    r[campo] = idx;
  }

  return r;
}

function pareceChasis(v) {
  const s = normalizar(v).replace(/\s+/g, "");
  // Los chasis/VIN suelen ser cadenas alfanuméricas largas. No exigimos
  // exactamente 17 caracteres para no descartar archivos particulares.
  return s.length >= 6 && /[a-z0-9]/i.test(s) && !/^(chasis|numero|nro|n|vin)$/i.test(s);
}

function detectarEstructuraExcel(rows) {
  // La única condición obligatoria es que exista una fila de cabeceras
  // con alguna celda cuyo texto contenga la palabra "chasis".
  // No importa en qué fila esté ni cuántas columnas tenga la cabecera.
  for (let i = 0; i < rows.length; i++) {
    const candidatos = rows[i] || [];
    const detectadas = detectarColumnas(candidatos);

    if (Number.isInteger(detectadas.chasis) && detectadas.chasis >= 0) {
      return {
        filaEncabezados: i,
        headers: candidatos.slice(),
        cols: detectadas
      };
    }
  }

  return null;
}

function buscarEstructuraEnWorkbook(wb) {
  // Recorremos todas las hojas. No asumimos que la hoja con los vehículos
  // sea la primera ni que se llame "Planilla" o "Vehiculos".
  for (const nombreHoja of wb.SheetNames) {
    const ws = wb.Sheets[nombreHoja];
    if (!ws) continue;

    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    const estructura = detectarEstructuraExcel(rows);

    if (estructura) {
      return {
        nombreHoja,
        ws,
        rows,
        estructura
      };
    }
  }

  return null;
}

function valorFila(row, idx) {
  return idx >= 0 && idx < row.length
    ? normalizar(row[idx])
    : "";
}


function ajustarBotonesExcel() {
  const botones = [btnBuscarExcel, btnCargarExcel];

  botones.forEach(b => {
    b.style.fontSize = "";
  });

  let size = 16;
  const min = 9;

  function cabe(b, px) {
    b.style.fontSize = px + "px";
    return b.scrollWidth <= b.clientWidth - 2;
  }

  while (size > min && !botones.every(b => cabe(b, size))) {
    size -= 0.5;
  }

  botones.forEach(b => {
    b.style.fontSize = size + "px";
  });
}

function abrirSelectorExcel() {
  iniciarLogExcelDebug("Se presionó 'Buscar Excel'");
  logExcelDebug("Estado antes de abrir selector", {
    archivoAnterior: excelFileInput.files && excelFileInput.files[0] ? excelFileInput.files[0].name : "ninguno",
    vehiculosActuales: vehiculos.length
  });
  excelFileInput.click();
}

excelFileInput.addEventListener("change", () => {
  const archivo = excelFileInput.files && excelFileInput.files[0];

  logExcelDebug("Evento change del selector de archivos", {
    hayArchivo: !!archivo
  });

  if (!archivo) {
    logExcelDebug("El selector se cerró sin seleccionar archivo");
    btnBuscarExcel.textContent = datosExcel.workbook ? "Cargado" : "Buscar Excel";
    btnCargarExcel.disabled = !archivo;
    return;
  }

  logExcelDebug("Archivo seleccionado", {
    nombre: archivo.name,
    tipo: archivo.type || "(sin MIME)",
    tamanoBytes: archivo.size,
    ultimaModificacion: archivo.lastModified ? new Date(archivo.lastModified).toISOString() : "desconocida"
  });

  btnBuscarExcel.textContent = archivo.name;
  btnBuscarExcel.classList.remove("excel-cargado");
  btnCargarExcel.disabled = false;
  requestAnimationFrame(ajustarBotonesExcel);
});

function actualizarEstadoExcel() {
  const nombre = document.getElementById("excelNombreArchivo");
  const cargados = document.getElementById("cantidadVehiculosCargados");
  const encontrados = document.getElementById("cantidadVehiculosEncontrados");

  nombre.textContent = datosExcel.nombre || "No hay ningún archivo cargado.";
  cargados.textContent = String(datosExcel.totalInicial || 0);
  encontrados.textContent = String(vehiculos.length);
  if (typeof programarGuardadoSesion === "function") programarGuardadoSesion();
}

async function cargarExcel() {
  logExcelDebug("Se presionó 'Cargar Excel'");

  const f = excelFileInput.files && excelFileInput.files[0];

  if (!f) {
    logExcelDebug("No hay archivo seleccionado al presionar Cargar");
    await mostrarAlerta("Seleccione un archivo Excel.");
    return;
  }

  logExcelDebug("Preparando FileReader", {
    nombre: f.name,
    tipo: f.type || "(sin MIME)",
    tamanoBytes: f.size
  });

  const reader = new FileReader();

  reader.onloadstart = () => logExcelDebug("FileReader: onloadstart");
  reader.onprogress = e => logExcelDebug("FileReader: onprogress", {
    cargados: e.loaded,
    total: e.lengthComputable ? e.total : "desconocido"
  });
  reader.onerror = () => {
    const err = reader.error || new Error("FileReader.error sin detalle");
    registrarErrorExcelDebug("FileReader", err);
    copiarLogExcelDebug(true);
    mostrarAlerta("No se pudo leer el archivo desde el navegador. El diagnóstico fue copiado al portapapeles.");
  };
  reader.onabort = () => {
    logExcelDebug("FileReader: onabort");
    copiarLogExcelDebug(true);
  };
  reader.onloadend = () => logExcelDebug("FileReader: onloadend");

  reader.onload = async e => {
    logExcelDebug("FileReader: onload", {
      resultadoTipo: e.target && e.target.result ? Object.prototype.toString.call(e.target.result) : "sin resultado",
      bytes: e.target && e.target.result ? e.target.result.byteLength : 0
    });

    try {
      if (!e.target.result) {
        throw new Error("FileReader terminó sin devolver datos.");
      }

      logExcelDebug("Iniciando XLSX.read");
      const wb = XLSX.read(e.target.result, { type: "array" });
      logExcelDebug("XLSX.read completado", {
        hojas: wb.SheetNames,
        cantidadHojas: wb.SheetNames.length
      });

      for (const nombre of wb.SheetNames) {
        const hoja = wb.Sheets[nombre];
        logExcelDebug("Inspeccionando hoja", {
          nombre,
          ref: hoja && hoja["!ref"] ? hoja["!ref"] : "sin !ref"
        });
      }

      logExcelDebug("Buscando cabecera que contenga CHASIS en todas las hojas");
      const encontrada = buscarEstructuraEnWorkbook(wb);

      if (!encontrada) {
        logExcelDebug("No se encontró ninguna cabecera con CHASIS");
        await copiarLogExcelDebug(false);
        await mostrarAlerta("No se encontró una columna Chasis en el archivo Excel. El diagnóstico fue copiado al portapapeles.");
        return;
      }

      const nombreHoja = encontrada.nombreHoja;
      const ws = encontrada.ws;
      const rows = encontrada.rows;
      const estructura = encontrada.estructura;
      const filaEncabezados = estructura.filaEncabezados;
      const headers = estructura.headers;
      const cols = estructura.cols;

      logExcelDebug("Estructura encontrada", {
        hoja: nombreHoja,
        filaCabeceraExcel: filaEncabezados + 1,
        cantidadColumnasCabecera: headers.length,
        cabeceras: headers,
        columnaChasisIndice: cols.chasis,
        columnaChasisExcel: cols.chasis >= 0 ? XLSX.utils.encode_col(cols.chasis) : "no encontrada",
        filasTotales: rows.length
      });

      const filaDatosInicio = filaEncabezados + 2;
      logExcelDebug("Comenzando importación de vehículos", {
        filaDatosExcel: filaDatosInicio,
        columnasDetectadas: cols
      });

      vehiculos = rows
        .slice(filaDatosInicio - 1)
        .map((row, i) => ({
          id: "excel-" + (i + 1),
          chasis: valorFila(row, cols.chasis),
          playa: valorFila(row, cols.playa),
          bloque: valorFila(row, cols.bloque),
          carril: valorFila(row, cols.carril),
          posicion: valorFila(row, cols.posicion),
          observaciones: valorFila(row, cols.observaciones),
          movidoDesde: valorFila(row, cols.movidoDesde),
          _filaExcel: filaDatosInicio + i
        }))
        .filter(v => v.chasis);

      logExcelDebug("Filas procesadas", {
        filasDatosConsideradas: Math.max(0, rows.length - (filaDatosInicio - 1)),
        vehiculosConChasis: vehiculos.length
      });

      if (!vehiculos.length) {
        logExcelDebug("ERROR: se encontró cabecera CHASIS pero no hay valores de chasis debajo de ella");
        await copiarLogExcelDebug(false);
        await mostrarAlerta("Se encontró la cabecera Chasis, pero no se encontraron vehículos debajo. El diagnóstico fue copiado al portapapeles.");
        return;
      }

      datosExcel = {
        nombre: f.name,
        hoja: nombreHoja,
        encabezados: headers,
        columnas: cols,
        workbook: wb,
        worksheet: ws,
        filas: rows,
        filaEncabezados,
        filaDatosInicio,
        totalInicial: vehiculos.length
      };

      logExcelDebug("Importación completada correctamente", {
        archivo: f.name,
        hoja: nombreHoja,
        vehiculos: vehiculos.length
      });

      btnBuscarExcel.textContent = "Cargado";
      btnBuscarExcel.classList.add("excel-cargado");
      btnCargarExcel.disabled = true;
      requestAnimationFrame(ajustarBotonesExcel);

      actualizarSelectores();
      actualizarPantalla();
      actualizarEstadoExcel();
      logExcelDebug("Pantalla y estado actualizados");

      if (typeof guardarSesionAhora === "function") {
        logExcelDebug("Guardando sesión persistente");
        await guardarSesionAhora();
        logExcelDebug("Sesión persistente guardada");
      }

    } catch (err) {
      registrarErrorExcelDebug("Procesamiento XLSX/importación", err);
      await copiarLogExcelDebug(false);
      await mostrarAlerta("No se pudo leer el archivo Excel. El diagnóstico fue copiado al portapapeles. Pegalo en el chat.");
    }
  };

  try {
    logExcelDebug("Llamando reader.readAsArrayBuffer");
    reader.readAsArrayBuffer(f);
  } catch (err) {
    registrarErrorExcelDebug("reader.readAsArrayBuffer", err);
    await copiarLogExcelDebug(false);
    await mostrarAlerta("No se pudo iniciar la lectura del archivo. El diagnóstico fue copiado al portapapeles.");
  }
}

function actualizarSelectores() {
  const playaAnterior = playaSelect.value;
  const bloqueAnterior = bloqueSelect.value;

  const playas = obtenerPlayasFiltro();

  const bloques = obtenerBloquesFiltro();

  playaSelect.innerHTML =
    '<option value="">Todas</option>' +
    playas.map(x =>
      `<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`
    ).join("");

  bloqueSelect.innerHTML =
    '<option value="">Todos</option>' +
    bloques.map(x =>
      `<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`
    ).join("");

  playaSelect.value = playas.includes(playaAnterior) ? playaAnterior : "";
  bloqueSelect.value = bloques.includes(bloqueAnterior) ? bloqueAnterior : "";
}

playaSelect.addEventListener("change", actualizarPantalla);
bloqueSelect.addEventListener("change", actualizarPantalla);

window.addEventListener("resize", ajustarBotonesExcel);
