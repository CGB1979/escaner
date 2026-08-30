/* CONFIGURACION DEL ARCHIVO EXCEL
   Si cambia la estructura del Excel, modifique solamente este archivo.
   Columna: letra de Excel. Encabezados: alternativas para detectar automaticamente.
*/
const CONFIG_EXCEL = {
  hoja: 0,
  filaInicial: 2,
  campos: {
    chasis: { columna: null, encabezados: ["chasis", "numero de chasis", "n° chasis", "vin"] },
    playa: { columna: null, encabezados: ["playa"] },
    bloque: { columna: null, encabezados: ["bloque"] },
    carril: { columna: null, encabezados: ["carril", "calle"] },
    posicion: { columna: null, encabezados: ["posicion", "posición", "ubicacion", "ubicación"] },
    observaciones: { columna: null, encabezados: ["observaciones", "observacion", "observación", "obs"] },
    movidoDesde: { columna: null, encabezados: ["movido desde", "movido_desde", "origen movimiento", "origen"] }
  }
};
