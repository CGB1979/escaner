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

  for (const [campo, cfg] of Object.entries(CONFIG_EXCEL.campos)) {
    let idx = columnaPorLetra(cfg.columna);

    if (idx === null) {
      idx = encabezados.findIndex(h =>
        cfg.encabezados.map(key).includes(key(h))
      );
    }

    r[campo] = idx;
  }

  return r;
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

function cargarExcel() {
  const f = excelFileInput.files[0];

  if (!f) {
    alert("Seleccione un archivo Excel.");
    return;
  }

  const reader = new FileReader();

  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: "array" });
      const nombreHoja = wb.SheetNames[CONFIG_EXCEL.hoja] || wb.SheetNames[0];
      const ws = wb.Sheets[nombreHoja];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      const filaDatosInicio = Math.max(
        1,
        Number(CONFIG_EXCEL.filaInicial) || 2
      );

      const filaEncabezados = filaDatosInicio - 1;
      const headers = rows[filaEncabezados - 1] || [];
      const cols = detectarColumnas(headers);

      if (cols.chasis < 0 || cols.chasis === undefined) {
        alert("No se encontró la columna Chasis. Revise js/configuracionExcel.js");
        return;
      }

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
      if (typeof guardarSesionAhora === "function") guardarSesionAhora();

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
