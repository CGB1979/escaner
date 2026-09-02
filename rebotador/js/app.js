async function inicializarRebotador() {
  await restaurarSesionGuardada();
  actualizarSelectores();
  actualizarPantalla();
  actualizarEstadoExcel();
  ajustarBotonesExcel();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarRebotador, { once: true });
} else {
  inicializarRebotador();
}

function volverAlEscanerNormal() {
  window.location.href = "../";
}
