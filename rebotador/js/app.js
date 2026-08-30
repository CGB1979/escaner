document.addEventListener("DOMContentLoaded", async () => {
  await restaurarSesionGuardada();
  actualizarSelectores();
  actualizarPantalla();
  actualizarEstadoExcel();
  ajustarBotonesExcel();
});

function volverAlEscanerNormal() {
  window.location.href = "../";
}
