let mapa;
let marcadores = new Array();
let marcadorUsuario = null;
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
    navigator.geolocation.getCurrentPosition(
        function (pos) {
            miLat = pos.coords.latitude;
            miLon = pos.coords.longitude;

            const miPosicion = new Array(miLat, miLon);
            mapa = L.map("map").setView(miPosicion, 15);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: "&copy; OpenStreetMap"
            }).addTo(mapa);

            marcadorUsuario = L.marker(miPosicion).addTo(mapa).bindPopup("📍 Tu ubicación");
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
        .then(function(res) { return res.json(); })
        .then(function(datos) {
            marcadores.forEach(function(marker) { mapa.removeLayer(marker); });
            marcadores = new Array();

            datos.forEach(function(p) {
                const marker = L.marker(new Array(p.lat, p.lon)).addTo(mapa);
                const urlGoogleMaps = "https://google.com" + p.lat + "," + p.lon;

                marker.bindPopup(
                    "<b>" + p.tipo + "</b><br>" +
                    "Rareza: " + p.rareza + "%<br>" +
                    "Lat: " + p.lat + "<br>" +
                    "Lon: " + p.lon + "<br><br>" +
                    "<a href='" + urlGoogleMaps + "' target='_blank'>Abrir en Google Maps</a>"
                );

                marcadores.push(marker);
            });
        });
    });
}

function cargarHallazgos() {
    fetch("/hallazgos")
    .then(function(res) { return res.json(); })
    .then(function(datos) {
        let html = "";
        datos.forEach(function(h) {
            html += '<div class="card">' +
                    '<h3>' + h[1] + '</h3>' +
                    '<p>' + h[2] + '</p>' +
                    '<p>Rareza: ' + h[5] + '</p>' +
                    '<p>Tipo: ' + h[6] + '</p>' +
                '</div>';
        });

        const diario = document.getElementById("diario");
        diario.style.display = diario.style.display === "block" ? "none" : "block";
        diario.innerHTML = html;
    });
}
