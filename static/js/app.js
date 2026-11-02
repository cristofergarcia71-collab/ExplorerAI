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

            const centroInicial = new Array(miLat, miLon);
            mapa = L.map("map").setView(centroInicial, 15);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: "&copy; <a href='https://openstreetmap.org'>OpenStreetMap</a>"
            }).addTo(mapa);

            // Marcador del usuario (Círculo azul brillante)
            marcadorUsuario = L.circleMarker(centroInicial, {
                radius: 10,
                color: "#ffffff",
                weight: 2,
                fillColor: "#00aaff",
                fillOpacity: 1
            }).addTo(mapa).bindPopup("📍 Tu ubicación actual");
        },
        function (error) {
            console.log(error);
            alert("No se pudo obtener la ubicación inicial");
        },
        { enableHighAccuracy: true }
    );
};

function generarAnomalias() {
    navigator.geolocation.getCurrentPosition(
        // Parámetro 1: Función de éxito
        function (pos) {
            miLat = pos.coords.latitude;
            miLon = pos.coords.longitude;

            if (marcadorUsuario) {
                marcadorUsuario.setLatLng(new Array(miLat, miLon));
            }

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
                // Limpiar marcadores antiguos correctamente
                marcadores.forEach(function(marker) { mapa.removeLayer(marker); });
                marcadores = new Array();

                // Guardaremos las posiciones para ajustar el zoom automáticamente
                let puntosCoordenadas = new Array();
                puntosCoordenadas.push(new Array(miLat, miLon));

                datos.forEach(function(p) {
                    // Colores y tamaños según el porcentaje de rareza
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

                    const marker = L.circleMarker(posAnomalia, {
                        radius: radioAnomalica,
                        color: "#ffffff",
                        weight: 1.5,
                        fillColor: colorAnomalica,
                        fillOpacity: 0.9
                    }).addTo(mapa);

                    // Popup con enlace de Google Maps corregido
                    marker.bindPopup(
                        "<b>✨ " + p.tipo + "</b><br>" +
                        "🎯 Rareza: " + p.rareza + "%<br>" +
                        "📏 Distancia: " + distancia + " metros<br>" +
                        "<small>Lat: " + p.lat + ", Lon: " + p.lon + "</small><br><br>" +
                        "<a href='https://google.com" + p.lat + "," + p.lon + "' target='_blank' style='display:inline-block; margin-top:5px; color:#00aaff;'>Abrir en Google Maps</a>"
                    );

                    marcadores.push(marker);
                    puntosCoordenadas.push(posAnomalia);
                });

                // Zoom automático para englobar todas las anomalías generadas
                if (puntosCoordenadas.length > 1) {
                    mapa.fitBounds(puntosCoordenadas, { padding: new Array(50, 50) });
                }
            })
            .catch(function(err) { console.error("Error al generar anomalías:", err); });
        },
        // SOLUCIÓN: Parámetro 2 añadido (Función de error en caso de fallo de geolocalización)
        function (error) {
            console.error("Error de geolocalización al generar:", error);
            alert("No se pudo obtener tu ubicación para generar las anomalías.");
        },
        { enableHighAccuracy: true }
    );
}

function cargarHallazgos() {
    fetch("/hallazgos")
    .then(function(res) { return res.json(); })
    .then(function(datos) {
        let html = "";
        datos.forEach(function(h) {
            let titulo = h.titulo || (Array.isArray(h) ? h[1] : "Hallazgo");
            let desc = h.descripcion || (Array.isArray(h) ? h[2] : "");
            let rareza = h.rareza || (Array.isArray(h) ? h[5] : "??");
            let tipo = h.tipo || (Array.isArray(h) ? h[6] : "");

            html += '<div class="card">' +
                    '<h3>' + titulo + '</h3>' +
                    '<p>' + desc + '</p>' +
                    '<p>Rareza: ' + rareza + '%</p>' +
                    '<p>Tipo: ' + tipo + '</p>' +
                '</div>';
        });

        const diario = document.getElementById("diario");
        diario.style.display = diario.style.display === "block" ? "none" : "block";
        diario.innerHTML = html;
    })
    .catch(function(err) { console.error("Error al cargar hallazgos:", err); });
}
