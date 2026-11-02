let mapa;
let marcadores = new Array();
let marcadorUsuario = null;
let miLat = null;
let miLon = null;

// Función auxiliar para calcular distancias en metros (Fórmula de Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // Retorna metros enteros
}

window.onload = function () {
    navigator.geolocation.getCurrentPosition(
        function (pos) {
            miLat = pos.coords.latitude;
            miLon = pos.coords.longitude;

            const centroMapa = new Array(miLat, miLon);
            mapa = L.map("map").setView(centroMapa, 15);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: "&copy; OpenStreetMap"
            }).addTo(mapa);

            // Tu ubicación como un círculo azul brillante
            marcadorUsuario = L.circleMarker(centroMapa, {
                radius: 10,
                color: "#ffffff",
                weight: 2,
                fillColor: "#00aaff",
                fillOpacity: 1
            }).addTo(mapa).bindPopup("📍 Tu ubicación");
        },
        function (error) {
            console.log(error);
            alert("No se pudo obtener la ubicación");
        },
        { enableHighAccuracy: true }
    );
};

function generarAnomalias() {
    if (!miLat || !miLon) return alert("Esperando señal GPS...");

    navigator.geolocation.getCurrentPosition(function (pos) {
        miLat = pos.coords.latitude;
        miLon = pos.coords.longitude;

        if (marcadorUsuario) {
            marcadorUsuario.setLatLng(new Array(miLat, miLon));
        }

        fetch("/generar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                lat: miLat,
                lon: miLon,
                intencion: document.getElementById("intencion").value
            })
        })
        .then(function(response) { return response.json(); })
        .then(function(datos) {
            // Limpiar marcadores viejos del mapa de forma segura
            marcadores.forEach(function(marker) { mapa.removeLayer(marker); });
            marcadores = new Array();

            // Array de posiciones inicializado sin usar corchetes planos conflictivos
            let puntosCoordenadas = new Array();
            puntosCoordenadas.push(new Array(miLat, miLon));

            datos.forEach(function(p) {
                let colorAnomalica = "#00ff55"; // Común (Verde)
                let radioAnomalica = 8;

                if (p.rareza >= 95) {
                    colorAnomalica = "#ff0055"; // Legendaria (Rojo)
                    radioAnomalica = 14;
                } else if (p.rareza >= 80) {
                    colorAnomalica = "#ffaa00"; // Rara (Naranja)
                    radioAnomalica = 11;
                }

                const distancia = calcularDistancia(miLat, miLon, p.lat, p.lon);
                const posAnomalia = new Array(p.lat, p.lon);

                // Crear anomalía como un círculo coloreado en el mapa
                const marker = L.circleMarker(posAnomalia, {
                    radius: radioAnomalica,
                    color: "#ffffff",
                    weight: 1.5,
                    fillColor: colorAnomalica,
                    fillOpacity: 0.9
                }).addTo(mapa);

                // URL 100% limpia concatenada a la antigua usanza para evitar bugs de plantillas de texto
                const urlGoogleMaps = "https://google.com" + p.lat + "," + p.lon;

                marker.bindPopup(
                    "<b>✨ " + p.tipo + "</b><br>" +
                    "🎯 Rareza: " + p.rareza + "%<br>" +
                    "📏 Distancia: " + distancia + " metros<br>" +
                    "<small>Lat: " + p.lat + ", Lon: " + p.lon + "</small><br><br>" +
                    "<a href='" + urlGoogleMaps + "' target='_blank' style='display:inline-block; font-weight:bold; color:#00aaff; text-decoration:underline;'>🗺️ Abrir en Google Maps</a>"
                );

                marcadores.push(marker);
                puntosCoordenadas.push(posAnomalia);
            });

            // Zoom automático adaptado sin peligro de borrado de sintaxis
            if (puntosCoordenadas.length > 1) {
                mapa.fitBounds(puntosCoordenadas, { padding: new Array(50, 50) });
            }
        });
    }, function(error) {
        console.log(error);
        alert("Error de ubicación al generar.");
    }, { enableHighAccuracy: true });
}

function cargarHallazgos() {
    fetch("/hallazgos")
    .then(function(response) { return response.json(); })
    .then(function(datos) {
        let html = "";

        datos.forEach(function(h) {
            let titulo = h[1] || "Anomalía";
            let desc = h[2] || "";
            let rareza = h[5] || "??";
            let tipo = h[6] || "";

            html += '<div class="card" style="background:#202c33; padding:12px; margin:8px 0; border-radius:6px; border-left:5px solid #00ffaa;">' +
                    '<h3 style="margin:0 0 5px 0; color:#00ff55;">' + titulo + '</h3>' +
                    '<p style="margin:0 0 5px 0; font-size:14px; color:#ccc;">' + desc + '</p>' +
                    '<p style="margin:0; font-size:12px; color:#ffaa00;">Rareza: ' + rareza + '% | Tipo: ' + tipo + '</p>' +
                '</div>';
        });

        const diario = document.getElementById("diario");
        diario.style.display = diario.style.display === "block" ? "none" : "block";
        diario.innerHTML = html;
    })
    .catch(function(err) {
        console.error("Error en el diario:", err);
    });
}
