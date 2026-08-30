(function () {
    "use strict";

    function obtenerElementos() {
        return {
            modal: document.getElementById("appDialogModal"),
            title: document.getElementById("appDialogTitle"),
            message: document.getElementById("appDialogMessage"),
            inputGroup: document.getElementById("appDialogInputGroup"),
            input: document.getElementById("appDialogInput"),
            cancel: document.getElementById("appDialogCancel"),
            accept: document.getElementById("appDialogAccept")
        };
    }

    function abrirDialogo(opciones) {
        return new Promise(function (resolve) {
            var el = obtenerElementos();

            if (!el.modal) {
                console.error("No se encontró el modal reutilizable.");
                resolve(opciones.type === "prompt" ? null : false);
                return;
            }

            var resuelto = false;

            function cerrar(resultado) {
                if (resuelto) return;
                resuelto = true;

                document.removeEventListener("keydown", alPresionarTecla);
                el.modal.removeEventListener("click", alClickFuera);

                el.modal.classList.add("hidden");
                el.accept.onclick = null;
                el.cancel.onclick = null;

                resolve(resultado);
            }

            function alPresionarTecla(event) {
                if (event.key === "Escape") {
                    event.preventDefault();
                    cerrar(opciones.type === "prompt" ? null : false);
                }

                if (event.key === "Enter") {
                    event.preventDefault();

                    if (opciones.type === "prompt") {
                        cerrar(el.input.value);
                    } else {
                        cerrar(true);
                    }
                }
            }

            function alClickFuera(event) {
                if (event.target === el.modal) {
                    cerrar(opciones.type === "prompt" ? null : false);
                }
            }

            el.title.textContent = opciones.title || "Atención";
            el.message.textContent = opciones.message || "";
            el.inputGroup.classList.toggle("hidden", opciones.type !== "prompt");
            el.cancel.classList.toggle("hidden", opciones.type !== "prompt");
            el.accept.parentElement.classList.toggle("app-dialog-one-button", opciones.type !== "prompt");
            el.accept.textContent = opciones.acceptText || (opciones.type === "prompt" ? "Continuar" : "Aceptar");
            el.input.value = opciones.defaultValue || "";

            el.accept.onclick = function () {
                cerrar(opciones.type === "prompt" ? el.input.value : true);
            };

            el.cancel.onclick = function () {
                cerrar(opciones.type === "prompt" ? null : false);
            };

            el.modal.classList.remove("hidden");
            document.addEventListener("keydown", alPresionarTecla);
            el.modal.addEventListener("click", alClickFuera);

            setTimeout(function () {
                (opciones.type === "prompt" ? el.input : el.accept).focus();
                if (opciones.type === "prompt") el.input.select();
            }, 0);
        });
    }

    window.mostrarAlerta = function (mensaje, titulo) {
        return abrirDialogo({
            type: "alert",
            title: titulo || "Atención",
            message: mensaje,
            acceptText: "Aceptar"
        });
    };

    window.mostrarPrompt = function (mensaje, valorInicial, titulo) {
        return abrirDialogo({
            type: "prompt",
            title: titulo || "Ingresar dato",
            message: mensaje,
            defaultValue: valorInicial,
            acceptText: "Continuar"
        });
    };
})();

(function () {
    "use strict";

    var confirmResolver = null;
    var confirmKeyHandler = null;
    var confirmBackdropHandler = null;

    function limpiarConfirmacion(resultado) {
        var modal = document.getElementById("confirmModal");
        if (!modal) {
            if (confirmResolver) {
                var resolverSinModal = confirmResolver;
                confirmResolver = null;
                resolverSinModal(false);
            }
            return;
        }

        if (confirmKeyHandler) {
            document.removeEventListener("keydown", confirmKeyHandler);
            confirmKeyHandler = null;
        }

        if (confirmBackdropHandler) {
            modal.removeEventListener("click", confirmBackdropHandler);
            confirmBackdropHandler = null;
        }

        modal.classList.add("hidden");

        var aceptar = document.getElementById("confirmAceptar");
        if (aceptar) aceptar.onclick = null;

        var resolver = confirmResolver;
        confirmResolver = null;
        if (resolver) resolver(resultado);
    }

    window.mostrarConfirmacion = function (mensaje, titulo, textoAceptar) {
        return new Promise(function (resolve) {
            var modal = document.getElementById("confirmModal");
            var tituloEl = document.getElementById("confirmTitulo");
            var mensajeEl = document.getElementById("confirmMensaje");
            var aceptar = document.getElementById("confirmAceptar");

            if (!modal || !tituloEl || !mensajeEl || !aceptar) {
                console.error("No se encontró el modal de confirmación.");
                resolve(false);
                return;
            }

            if (confirmResolver) limpiarConfirmacion(false);

            confirmResolver = resolve;
            tituloEl.textContent = titulo || "Confirmar";
            mensajeEl.textContent = mensaje || "";
            aceptar.textContent = textoAceptar || "Confirmar";

            aceptar.onclick = function () {
                limpiarConfirmacion(true);
            };

            confirmKeyHandler = function (event) {
                if (event.key === "Escape") {
                    event.preventDefault();
                    limpiarConfirmacion(false);
                } else if (event.key === "Enter") {
                    event.preventDefault();
                    limpiarConfirmacion(true);
                }
            };

            confirmBackdropHandler = function (event) {
                if (event.target === modal) {
                    limpiarConfirmacion(false);
                }
            };

            modal.classList.remove("hidden");
            document.addEventListener("keydown", confirmKeyHandler);
            modal.addEventListener("click", confirmBackdropHandler);

            setTimeout(function () {
                aceptar.focus();
            }, 0);
        });
    };

    window.cerrarConfirmacion = function () {
        limpiarConfirmacion(false);
    };
})();
