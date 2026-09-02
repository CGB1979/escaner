let vehiculos = [];

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
  excelFileInput.click();
}

excelFileInput.addEventListener("change", () => {
  const archivo = excelFileInput.files && excelFileInput.files[0];

  if (!archivo) {
    btnBuscarExcel.textContent = datosExcel.workbook ? "Cargado" : "Buscar Excel";
    btnCargarExcel.disabled = !archivo;
    return;
  }

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
  const f = excelFileInput.files[0];

  if (!f) {
    alert("Seleccione un archivo Excel.");
    return;
  }

  const reader = new FileReader();

  reader.onload = async e => {
    try {
      const wb = XLSX.read(e.target.result, { type: "array" });
      const encontrada = buscarEstructuraEnWorkbook(wb);

      if (!encontrada) {
        alert("No se encontró una columna Chasis en el archivo Excel. El archivo debe contener al menos una columna con un encabezado que incluya la palabra Chasis.");
        return;
      }

      const nombreHoja = encontrada.nombreHoja;
      const ws = encontrada.ws;
      const rows = encontrada.rows;
      const estructura = encontrada.estructura;
      const filaEncabezados = estructura.filaEncabezados;
      const headers = estructura.headers;
      const cols = estructura.cols;
      const filaDatosInicio = filaEncabezados + 2;

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

      btnBuscarExcel.textContent = "Cargado";
      btnBuscarExcel.classList.add("excel-cargado");
      btnCargarExcel.disabled = true;
      requestAnimationFrame(ajustarBotonesExcel);

      actualizarSelectores();
      actualizarPantalla();
      actualizarEstadoExcel();
      if (typeof guardarSesionAhora === "function") {
        await guardarSesionAhora();
      }

    } catch (err) {
      console.error(err);
      alert("No se pudo leer el archivo Excel.");
    }
  };

  reader.readAsArrayBuffer(f);
}

function actualizarSelectores() {
  const playaAnterior = playaSelect.value;
  const bloqueAnterior = bloqueSelect.value;

  const playas = PLAYAS_DISPONIBLES.slice();

  const bloques = BLOQUES_DISPONIBLES.slice();

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
