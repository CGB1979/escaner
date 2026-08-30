/* Persistencia local de la sesión mediante IndexedDB.
   Guarda una instantánea del libro Excel y el estado actual de los vehículos. */
const PERSISTENCIA_DB = "rebotador-db";
const PERSISTENCIA_VERSION = 1;
const PERSISTENCIA_STORE = "sesion";
const PERSISTENCIA_KEY = "ultima-sesion";
let guardadoPendiente = false;
let restaurandoSesion = false;

function abrirDBRebotador() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PERSISTENCIA_DB, PERSISTENCIA_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(PERSISTENCIA_STORE)) {
        req.result.createObjectStore(PERSISTENCIA_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function guardarSesionAhora() {
  if (restaurandoSesion || !datosExcel.workbook || !datosExcel.worksheet) return;

  try {
    const excel = XLSX.write(datosExcel.workbook, { bookType: "xlsx", type: "array" });
    const db = await abrirDBRebotador();
    const tx = db.transaction(PERSISTENCIA_STORE, "readwrite");
    tx.objectStore(PERSISTENCIA_STORE).put({
      nombre: datosExcel.nombre,
      hoja: datosExcel.hoja,
      encabezados: datosExcel.encabezados,
      columnas: datosExcel.columnas,
      filaEncabezados: datosExcel.filaEncabezados,
      filaDatosInicio: datosExcel.filaDatosInicio,
      totalInicial: datosExcel.totalInicial,
      vehiculos: vehiculos.map(v => ({ ...v })),
      excel,
      guardadoEn: new Date().toISOString()
    }, PERSISTENCIA_KEY);

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn("No se pudo guardar la sesión local.", err);
  }
}

function programarGuardadoSesion() {
  if (restaurandoSesion || guardadoPendiente) return;
  guardadoPendiente = true;
  setTimeout(async () => {
    guardadoPendiente = false;
    await guardarSesionAhora();
  }, 150);
}

async function leerSesionGuardada() {
  try {
    const db = await abrirDBRebotador();
    const tx = db.transaction(PERSISTENCIA_STORE, "readonly");
    const req = tx.objectStore(PERSISTENCIA_STORE).get(PERSISTENCIA_KEY);
    const sesion = await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return sesion;
  } catch (err) {
    console.warn("No se pudo leer la sesión local.", err);
    return null;
  }
}

async function restaurarSesionGuardada() {
  const sesion = await leerSesionGuardada();
  if (!sesion || !sesion.excel) return false;

  try {
    restaurandoSesion = true;
    const wb = XLSX.read(sesion.excel, { type: "array" });
    const nombreHoja = sesion.hoja && wb.Sheets[sesion.hoja]
      ? sesion.hoja
      : wb.SheetNames[0];

    datosExcel = {
      nombre: sesion.nombre || "Archivo recuperado.xlsx",
      hoja: nombreHoja,
      encabezados: Array.isArray(sesion.encabezados) ? sesion.encabezados : [],
      columnas: sesion.columnas || {},
      workbook: wb,
      worksheet: wb.Sheets[nombreHoja],
      filas: [],
      filaEncabezados: Number(sesion.filaEncabezados) || 1,
      filaDatosInicio: Number(sesion.filaDatosInicio) || 2,
      totalInicial: Number(sesion.totalInicial) || 0
    };

    vehiculos = Array.isArray(sesion.vehiculos) ? sesion.vehiculos.map(v => ({ ...v })) : [];

    if (typeof btnBuscarExcel !== "undefined" && btnBuscarExcel) {
      btnBuscarExcel.textContent = "Cargado";
      btnBuscarExcel.classList.add("excel-cargado");
    }
    if (typeof btnCargarExcel !== "undefined" && btnCargarExcel) {
      btnCargarExcel.disabled = true;
    }

    return true;
  } catch (err) {
    console.error("No se pudo restaurar la sesión guardada.", err);
    await eliminarSesionGuardada();
    return false;
  } finally {
    restaurandoSesion = false;
  }
}

async function eliminarSesionGuardada() {
  try {
    const db = await abrirDBRebotador();
    const tx = db.transaction(PERSISTENCIA_STORE, "readwrite");
    tx.objectStore(PERSISTENCIA_STORE).delete(PERSISTENCIA_KEY);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn("No se pudo eliminar la sesión local.", err);
  }
}
