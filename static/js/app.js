let mapa;
let marcadores = [];
let marcadorUsuario = null;
let miLat = null;
let miLon = null;

// Función auxiliar para calcular distancias en metros (Fórmula de Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
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

            mapa = L.map("map").setView([miLat, miLon], 15);

            // URL CORRECTA Y COMPLETA DE OPENSTREETMAP
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: "&copy; <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors"
            }).addTo(mapa);

            // MEJORA 1: Tu ubicación como un círculo azul brillante
            marcadorUsuario = L.circleMarker([miLat, miLon], {
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
        function (pos) {
            miLat = pos.coords.latitude;
            miLon = pos.coords.longitude;

            // Actualizar la posición visual del usuario por si se ha movido
            if (marcadorUsuario) {
                marcadorUsuario.setLatLng([miLat, miLon]);
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
            .then(response => response.json())
            .then(datos => {
                // Limpiar marcadores viejos
                marcadores.forEach(marker => mapa.removeLayer(marker));
                marcadores = [];

                // Array para auto-ajustar el zoom
                let puntosCoordenadas = [[miLat, miLon]];

                datos.forEach(p => {
                    // MEJORA 2: Definir color y tamaño por rareza
                    let colorAnomalica = "#00ff55"; // Común (Verde)
                    let radioAnomalica = 8;

                    if (p.rareza >= 95) {
                        colorAnomalica = "#ff0055"; // Legendaria (Rojo)
                        radioAnomalica = 14;
                    } else if (p.rareza >= 80) {
                        colorAnomalica = "#ffaa00"; // Rara (Naranja)
                        radioAnomalica = 11;
                    }

                    // MEJORA 3: Calcular distancia en tiempo real
                    const distancia = calcularDistancia(miLat, miLon, p.lat, p.lon);

                    // Crear anomalía como un círculo coloreado
                    const marker = L.circleMarker([p.lat, p.lon], {
                        radius: radioAnomalica,
                        color: "#ffffff",
                        weight: 1.5,
                        fillColor: colorAnomalica,
                        fillOpacity: 0.9
                    }).addTo(mapa);

                    // URL CORRECTA DE GOOGLE MAPS
                    marker.bindPopup(`
                        <b>✨ ${p.tipo}</b><br>
                        🎯 Rareza: ${p.rareza}%<br>
                        📏 Distancia: ${distancia} metros<br>
                        <small>Lat: ${p.lat}, Lon: ${p.lon}</small><br><br>
                        <a href="https://google.com{p.lat},${p.lon}" target="_blank" style="display:inline-block; margin-top:5px; color:#00aaff;">
                            Abrir en Google Maps
                        </a>
                    `);

                    marcadores.push(marker);
                    puntosCoordenadas.push([p.lat, p.lon]);
                });

                // MEJORA 8: Zoom automático adaptado a todos los puntos generados
                if (puntosCoordenadas.length > 1) {
                    mapa.fitBounds(puntosCoordenadas, { padding: [50, 50] });
                }
            });
        },
        { enableHighAccuracy: true }
    );
}

function cargarHallazgos() {
    fetch("/hallazgos")
    .then(response => response.json())
    .then(datos => {
        let html = "";
        datos.forEach(h => {
            // Mapeo seguro según estructura de lista o diccionario
            let titulo = h.titulo || h[1] || "Hallazgo";
            let desc = h.descripcion || h[2] || "";
            let rareza = h.rareza || h[5] || "??";
            let tipo = h.tipo || h[6] || "";

            html += `
                <div class="card">
                    <h3>${titulo}</h3>
                    <p>${desc}</p>
                    <p>Rareza: ${rareza}%</p>
                    <p>Tipo: ${tipo}</p>
                </div>
            `;
        });

        const diario = document.getElementById("diario");
        diario.style.display = diario.style.display === "block" ? "none" : "block";
        diario.innerHTML = html;
    });
}
