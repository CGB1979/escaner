const PLAYAS_ESPECIALES = ["I", "J"];

function esPlayaEspecial(playa) {
    return PLAYAS_ESPECIALES.includes(
        String(playa || "").trim().toUpperCase()
    );
}
