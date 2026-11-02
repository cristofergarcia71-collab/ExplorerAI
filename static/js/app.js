let mapa;
let marcadores = new Array();
let marcadorUsuario = null;
let marcadorPareja = null;
let miLat = null;
let miLon = null;

// Variables de Estado del Juego
let objetivoActivo = null;
let xpActual = 0;
let nivelActual = 1;

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
    actualizarInterfazVisual();

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

            verificarObjetivoYProximidad();
        },
        function (error) { console.error(error); },
        { enableHighAccuracy: true }
    );
};

function generarAnomalias() {
    if (!miLat || !miLon) return alert("Esperando señal GPS...");

    fetch("/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            lat: miLat, lon: miLon, intencion: document.getElementById("intencion").value
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(datos) {
        marcadores.forEach(function(m) { mapa.removeLayer(m); });
        marcadores = new Array();

        let puntosCoordenadas = new Array();
        puntosCoordenadas.push(new Array(miLat, miLon));

        datos.forEach(function(p, index) {
            let colorAnomalica = "#00ff55";
            let radioAnomalica = 8;

            if (p.rareza >= 95) { colorAnomalica = "#ff0055"; radioAnomalica = 14; } 
            else if (p.rareza >= 80) { colorAnomalica = "#ffaa00"; radioAnomalica = 11; }

            const distancia = calcularDistancia(miLat, miLon, p.lat, p.lon);
            const posAnomalia = new Array(p.lat, p.lon);

            const marker = L.circleMarker(posAnomalia, {
                radius: radioAnomalica, color: "#ffffff", weight: 1.5, fillColor: colorAnomalica, fillOpacity: 0.9
            }).addTo(mapa);

            // CORRECCIÓN SEGURA: Pasamos los parámetros por separado en lugar de serializar JSON complejo en el HTML string
            window["anomalia_" + index] = p;

            marker.bindPopup(
                "<b>✨ " + p.tipo + "</b><br>" +
                "🎯 Rareza: " + p.rareza + "%<br>" +
                "📏 Distancia: " + distancia + " m<br><br>" +
                "<button onclick=\"fijarIndiceObjetivo(" + index + ")\" style='background:#00ff55; color:#000; border:none; padding:5px 10px; cursor:pointer; font-weight:bold; border-radius:4px; margin-right:5px;'>🎯 Fijar Objetivo</button>" +
                "<button onclick=\"copiarCoords(" + p.lat + "," + p.lon + ")\" style='background:#00aaff; color:#fff; border:none; padding:5px 10px; cursor:pointer; font-weight:bold; border-radius:4px;'>📋 Copiar</button><br><br>" +
                "<a href='https://google.com" + p.lat + "," + p.lon + "' target='_blank' style='display:inline-block; color:#00aaff; font-weight:bold;'>🗺️ Abrir en Google Maps</a>"
            );

            marcadores.push(marker);
            puntosCoordenadas.push(posAnomalia);
        });

        if (puntosCoordenadas.length > 1) {
            mapa.fitBounds(puntosCoordenadas, { padding: new Array(50, 50) });
        }
    });
}

function fijarIndiceObjetivo(index) {
    objetivoActivo = window["anomalia_" + index];
    mapa.closePopup();
    verificarObjetivoYProximidad();
}

function copiarCoords(lat, lon) {
    const texto = lat + ", " + lon;
    navigator.clipboard.writeText(texto).then(function() {
        alert("¡Coordenadas copiadas!: " + texto);
    });
}

function verificarObjetivoYProximidad() {
    const selectorTexto = document.querySelector(".sin-objetivo-seleccionado") || document.getElementById("objetivo-texto");
    
    if (!objetivoActivo) {
        if (selectorTexto) selectorTexto.innerHTML = "Sin objetivo seleccionado";
        return;
    }

    const dist = calcularDistancia(miLat, miLon, objetivoActivo.lat, objetivoActivo.lon);
    
    if (selectorTexto) {
        selectorTexto.id = "objetivo-texto";
        selectorTexto.innerHTML = "🎯 Objetivo: " + objetivoActivo.tipo + " (a " + dist + " metros)";
        selectorTexto.style.color = "#00ffaa";
    }

    if (dist <= 15) {
        alert("🎉 ¡ANOMALÍA ALCANZADA CON ÉXITO!\nHas recolectado energía residual. Ganando +50 XP.");
        
        fetch("/guardar_hallazgo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(objetivoActivo)
        }).catch(function(e){ console.error(e); });

        xpActual += 50;
        if (xpActual >= 100) {
            nivelActual += 1;
            xpActual = xpActual - 100;
            alert("🚀 ¡Subiste de nivel! Ahora eres Nivel " + nivelActual);
        }

        objetivoActivo = null;
        if (selectorTexto) {
            selectorTexto.innerHTML = "Sin objetivo seleccionado";
            selectorTexto.style.color = "";
        }
        actualizarInterfazVisual();
    }
}

function actualizarInterfazVisual() {
    const txtObjetivo = document.getElementById("objetivo-texto");
    if(!txtObjetivo && document.querySelector(".sin-objetivo-seleccionado")){
        document.querySelector(".sin-objetivo-seleccionado").id = "objetivo-texto";
    }
}

function cargarHallazgos() {
    fetch("/hallazgos")
    .then(function(res) { return res.json(); })
    .then(function(datos) {
        let html = "";
        datos.forEach(function(h) {
            let titulo = h.titulo || (Array.isArray(h) ? h[1] : h.tipo || "Anomalía Descubierta");
            let desc = h.descripcion || (Array.isArray(h) ? h[2] : "Coordenadas: " + h.lat + ", " + h.lon);
            let rareza = h.rareza || (Array.isArray(h) ? h[5] : h.rareza || "??");

            html += '<div class="card" style="background:#112233; padding:10px; margin:5px; border-radius:5px; border-left:4px solid #00ffaa;">' +
                    '<h3>' + titulo + '</h3>' +
                    '<p>' + desc + '</p>' +
                    '<p>⭐ Rareza: ' + rareza + '%</p>' +
                '</div>';
        });

        const diario = document.getElementById("diario");
        diario.style.display = diario.style.display === "block" ? "none" : "block";
        diario.innerHTML = html;
    });
}
