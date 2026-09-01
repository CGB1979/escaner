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

    window.abrirObservaciones = function (vehiculo) {
        if (!vehiculo) return;

        const chasis = String(vehiculo.chasis || "").trim();
        const valorActual = String(vehiculo.observaciones || "");

        mostrarPrompt(
            "Escriba la observación del vehículo." + (chasis ? `\n\nChasis: ${chasis}` : ""),
            valorActual,
            "Observaciones"
        ).then(function (resultado) {
            if (resultado === null) return;

            vehiculo.observaciones = String(resultado || "").trim();

            if (typeof guardarDatos === "function") guardarDatos();
            if (typeof actualizarPantalla === "function") actualizarPantalla();
            if (typeof actualizarEstadoExcel === "function") actualizarEstadoExcel();
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