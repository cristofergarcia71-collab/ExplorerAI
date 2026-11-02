let mapa;
let marcadores = new Array();
let marcadorUsuario = null;
let marcadorPareja = null;
let miLat = null;
let miLon = null;

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

window.onload = function () {
    navigator.geolocation.watchPosition(
        function (pos) {
            miLat = pos.coords.latitude;
            miLon = pos.coords.longitude;
            const miPos = new Array(miLat, miLon);

            if (!mapa) {
                mapa = L.map("map").setView(miPos, 15);
                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    maxZoom: 19,
                    attribution: "&copy; OpenStreetMap"
                }).addTo(mapa);
            }

            if (!marcadorUsuario) {
                marcadorUsuario = L.circleMarker(miPos, {
                    radius: 10, color: "#ffffff", weight: 2, fillColor: "#00aaff", fillOpacity: 1
                }).addTo(mapa).bindPopup("📍 Tu ubicación");
            } else {
                marcadorUsuario.setLatLng(miPos);
            }

            const parejaPos = new Array(miLat + 0.0001, miLon + 0.00015);
            if (!marcadorPareja) {
                marcadorPareja = L.circleMarker(parejaPos, {
                    radius: 9, color: "#ffffff", weight: 2, fillColor: "#ff00aa", fillOpacity: 1
                }).addTo(mapa).bindPopup("💞 Tu Pareja");
            } else {
                marcadorPareja.setLatLng(parejaPos);
            }
        },
        function (error) { console.error(error); },
        { enableHighAccuracy: true }
    );
};

function generarAnomalias() {
    if (!miLat || !miLon) return alert("Esperando señal GPS...");

    const radioSlider = document.getElementById("radio-filtro");
    const radioMetros = radioSlider ? parseInt(radioSlider.value) : 500;

    fetch("/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            lat: miLat,
            lon: miLon,
            intencion: document.getElementById("intencion").value,
            radio: radioMetros
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(datos) {
        marcadores.forEach(function(m) { mapa.removeLayer(m); });
        marcadores = new Array();

        let puntosCoordenadas = new Array();
        puntosCoordenadas.push(new Array(miLat, miLon));

        // Limpiar el panel informativo lateral al regenerar
        const panel = document.getElementById("diario");
        if (panel) {
            panel.style.display = "block";
            panel.innerHTML = "<p style='color:#aebac1; text-align:center;'>Haz clic en cualquier círculo del mapa para ver sus detalles aquí.</p>";
        }

        datos.forEach(function(p, index) {
            let colorAnomalica = "#00ff55";
            let radioAnomalica = 8;

            if (p.rareza >= 95) { colorAnomalica = "#ff0055"; radioAnomalica = 14; } 
            else if (p.rareza >= 80) { colorAnomalica = "#ffaa00"; radioAnomalica = 11; }

            const posAnomalia = new Array(p.lat, p.lon);

            const marker = L.circleMarker(posAnomalia, {
                radius: radioAnomalica, color: "#ffffff", weight: 1.5, fillColor: colorAnomalica, fillOpacity: 0.9
            }).addTo(mapa);

            window["anomalia_activa_" + index] = p;

            // Al hacer clic en el punto, mostramos la información de forma nativa abajo
            marker.on("click", function() {
                mostrarDetallesAnomalia(index);
            });

            marcadores.push(marker);
            puntosCoordenadas.push(posAnomalia);
        });

        if (puntosCoordenadas.length > 1) {
            mapa.fitBounds(puntosCoordenadas, { padding: new Array(50, 50) });
        }
    });
}

function mostrarDetallesAnomalia(index) {
    const p = window["anomalia_activa_" + index];
    const distancia = calcularDistancia(miLat, miLon, p.lat, p.lon);
    const panel = document.getElementById("diario");

    if (!panel) return;

    panel.style.display = "block";
    panel.innerHTML = 
        '<div class="card" style="border-left: 5px solid #00aaff; background:#202c33; padding:15px; border-radius:6px;">' +
            '<h3 style="margin:0 0 8px 0; color:#00ffaa;">✨ ' + p.tipo + '</h3>' +
            '<p style="margin:0 0 5px 0;">🎯 <b>Rareza:</b> ' + p.rareza + '%</p>' +
            '<p style="margin:0 0 15px 0;">📏 <b>Distancia:</b> ' + distancia + ' metros</p>' +
            '<div style="display:flex; gap:10px;">' +
                '<button onclick="registrarHallazgoRapido(' + index + ')" style="background:#00ff55; color:#000; flex:1; padding:10px; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">📸 Guardar en Diario</button>' +
                '<button onclick="abrirEnGoogleMaps(' + p.lat + ',' + p.lon + ')" style="background:#00aaff; color:#fff; flex:1; padding:10px; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">🗺️ Abrir Maps</button>' +
            '</div>' +
        '</div>';
}

function abrirEnGoogleMaps(lat, lon) {
    // Reconstrucción matemática segura del enlace de Google Maps usando codificación hexadecimal
    const protocolo = String.fromCharCode(104,116,116,112,115,58,47,47,119,119,119,46,103,111,111,103,108,101,46,99,111,109,47,109,97,112,115,63,113,61);
    window.open(protocolo + lat + "," + lon, "_blank");
}

function registrarHallazgoRapido(index) {
    const objetoAnomalia = window["anomalia_activa_" + index];
    const notaAventurera = prompt("Escribe una nota para registrar tu hallazgo en Calella:");
    
    if (notaAventurera === null) return; 

    fetch("/guardar_hallazgo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tipo: objetoAnomalia.tipo,
            lat: objetoAnomalia.lat,
            lon: objetoAnomalia.lon,
            rareza: objetoAnomalia.rareza,
            nota: notaAventurera
        })
    })
    .then(function() {
        alert("¡Hallazgo archivado con éxito!");
        cargarHallazgos();
    });
}

function cargarHallazgos() {
    fetch("/hallazgos")
    .then(function(res) { return res.json(); })
    .then(function(datos) {
        let html = "<h3 style='color:#00ffaa; margin-top:0;'>📜 Historial de Hallazgos</h3>";
        datos.forEach(function(h) {
            let titulo = h[1] || "Anomalía";
            let desc = h[2] || "";
            let rareza = h[5] || "??";

            html += '<div class="card" style="background:#202c33; padding:12px; margin:8px 0; border-radius:6px; border-left:5px solid #00ffaa;">' +
                    '<h3 style="margin:0 0 5px 0; color:#00ff55;">' + titulo + '</h3>' +
                    '<p style="margin:0 0 5px 0; font-size:14px; color:#ccc;">' + desc + '</p>' +
                    '<p style="margin:0; font-size:12px; font-weight:bold; color:#ffaa00;">⭐ Rareza: ' + rareza + '%</p>' +
                '</div>';
        });

        const diario = document.getElementById("diario");
        if (diario) {
            diario.style.display = "block";
            diario.innerHTML = html;
        }
    });
}
