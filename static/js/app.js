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

    // Filtro de radio eliminado para máxima simplicidad y testeo rápido
    fetch("/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            lat: miLat,
            lon: miLon,
            intencion: document.getElementById("intencion").value
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(datos) {
        // Limpiar marcadores viejos
        marcadores.forEach(function(m) { mapa.removeLayer(m); });
        marcadores = new Array();

        let puntosCoordenadas = new Array();
        puntosCoordenadas.push(new Array(miLat, miLon));

        datos.forEach(function(p) {
            let colorAnomalica = "#00ff55"; // Común (Verde)
            let radioAnomalica = 8;

            if (p.rareza >= 95) { colorAnomalica = "#ff0055"; radioAnomalica = 14; } 
            else if (p.rareza >= 80) { colorAnomalica = "#ffaa00"; radioAnomalica = 11; }

            const distancia = calcularDistancia(miLat, miLon, p.lat, p.lon);
            const posAnomalia = new Array(p.lat, p.lon);

            // Crear el marcador circular
            const marker = L.circleMarker(posAnomalia, {
                radius: radioAnomalica, 
                color: "#ffffff", 
                weight: 1.5, 
                fillColor: colorAnomalica, 
                fillOpacity: 0.9
            }).addTo(mapa);

            // SINTAXIS NATIVA BLINDADA: Texto plano directo, sin comillas cruzadas ni enlaces que rompan
            const textoPopup = "✨ " + p.tipo + " | Rareza: " + p.rareza + "% | Distancia: " + distancia + "m (Haz doble clic para abrir en Google Maps)";
            marker.bindPopup(textoPopup);

            // EVENTO SEGURO: Al hacer doble clic en la anomalía, se abre Google Maps de forma nativa e instantánea
            marker.on("dblclick", function() {
                const protocolo = String.fromCharCode(104,116,116,112,115,58,47,47,119,119,119,46,103,111,111,103,108,101,46,99,111,109,47,109,97,112,115,63,113,61);
                window.open(protocolo + p.lat + "," + p.lon, "_blank");
            });

            // EVENTO AUTOMÁTICO DIARIO: Al hacer clic normal, pregunta si quieres registrarla en el diario
            marker.on("click", function() {
                setTimeout(function() {
                    const nota = prompt("¿Quieres guardar esta anomalía (" + p.tipo + ") en tu Diario? Escribe un comentario (o cancela):");
                    if (nota !== null) {
                        fetch("/guardar_hallazgo", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                tipo: p.tipo, lat: p.lat, lon: p.lon, rareza: p.rareza, nota: nota
                            })
                        }).then(function() { alert("¡Archivado con éxito!"); });
                    }
                }, 500);
            });

            marcadores.push(marker);
            puntosCoordenadas.push(posAnomalia);
        });

        if (puntosCoordenadas.length > 1) {
            mapa.fitBounds(puntosCoordenadas, { padding: new Array(50, 50) });
        }
    });
}

function cargarHallazgos() {
    fetch("/hallazgos")
    .then(function(res) { return res.json(); })
    .then(function(datos) {
        let html = "";
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
            diario.style.display = diario.style.display === "block" ? "none" : "block";
            diario.innerHTML = html;
        }
    });
}
