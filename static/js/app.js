let mapa;
let marcadores = [];

window.onload = function () {

    navigator.geolocation.getCurrentPosition(

        function (pos) {

            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            mapa = L.map("map").setView(
                [lat, lon],
                15
            );

            L.tileLayer(
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    maxZoom: 19,
                    attribution: "&copy; OpenStreetMap"
                }
            ).addTo(mapa);

            L.marker([lat, lon])
                .addTo(mapa)
                .bindPopup("📍 Tu ubicación");

        },

        function (error) {

            console.log(error);
            alert("No se pudo obtener la ubicación");

        },

        {
            enableHighAccuracy: true
        }

    );

};

function generarAnomalias() {

    navigator.geolocation.getCurrentPosition(

        function (pos) {

            fetch("/generar", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    intencion: document.getElementById("intencion").value

                })

            })

            .then(response => response.json())

            .then(datos => {

                marcadores.forEach(
                    marker => mapa.removeLayer(marker)
                );

                marcadores = [];

                datos.forEach(p => {

                    const marker = L.marker([
                        p.lat,
                        p.lon
                    ]).addTo(mapa);

                    marker.bindPopup(
                        `
                        <b>${p.tipo}</b>
                        <br>
                        Rareza: ${p.rareza}%
                        <br>
                        Lat: ${p.lat}
                        <br>
                        Lon: ${p.lon}
                        <br><br>
                        <a href="https://www.google.com/maps?q=${p.lat},${p.lon}" target="_blank">
                        Abrir en Google Maps
                        </a>
                        `
                    );

                    marcadores.push(marker);

                });

            });

        }

    );
}

function cargarHallazgos() {

    fetch("/hallazgos")

    .then(response => response.json())

    .then(datos => {

        let html = "";

        datos.forEach(h => {

            html += `
                <div class="card">
                    <h3>${h[1]}</h3>
                    <p>${h[2]}</p>
                    <p>Rareza: ${h[5]}</p>
                    <p>Tipo: ${h[6]}</p>
                </div>
            `;

        });

        const diario =
            document.getElementById("diario");

        diario.style.display =
            diario.style.display === "block"
            ? "none"
            : "block";

        diario.innerHTML = html;

    });

}