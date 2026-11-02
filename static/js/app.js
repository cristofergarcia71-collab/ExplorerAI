let mapa;
let marcadores = [];

window.onload = function () {

    navigator.geolocation.getCurrentPosition(

        function (pos) {

            iniciarMapa(
                pos.coords.latitude,
                pos.coords.longitude
            );

            cargarStats();

        },

        function () {

            iniciarMapa(
                41.613,
                2.657
            );

            cargarStats();

        }

    );
};

function iniciarMapa(lat, lon) {

    mapa = L.map("map").setView(
        [lat, lon],
        13
    );

    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19
        }
    ).addTo(mapa);

    L.marker([lat, lon])
        .addTo(mapa)
        .bindPopup("Tu ubicación");
}

function cargarStats() {

    fetch("/stats")
        .then(r => r.json())
        .then(data => {

            document.getElementById(
                "nivel"
            ).innerText =
                "Nivel " + data.nivel;

            document.getElementById(
                "xp"
            ).innerText =
                "XP: " + data.xp;

            let porcentaje =
                (data.xp % 500) / 5;

            document.getElementById(
                "xpFill"
            ).style.width =
                porcentaje + "%";

        });
}

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

                    intencion:
                        document.getElementById(
                            "intencion"
                        ).value

                })

            })

                .then(r => r.json())

                .then(datos => {

                    marcadores.forEach(
                        m => mapa.removeLayer(m)
                    );

                    marcadores = [];

                    datos.forEach(p => {

                        let color =
                            p.rareza >= 95
                                ? "red"
                                : p.rareza >= 80
                                    ? "orange"
                                    : "lime";

                        let sincronicidad =
                            Math.floor(
                                Math.random() * 100
                            ) + 1;

                        let googleMaps =
                            `https://www.google.com/maps?q=${p.lat},${p.lon}`;

                        let marker =
                            L.circleMarker(
                                [p.lat, p.lon],
                                {
                                    radius: 10,
                                    color: color,
                                    fillColor: color,
                                    fillOpacity: 0.8
                                }
                            )
                                .addTo(mapa)
                                .bindPopup(

                                    `<b>${p.tipo}</b>

                                    <br><br>

                                    Rareza:
                                    ${p.rareza}%

                                    <br>

                                    Sincronicidad:
                                    ${sincronicidad}%

                                    <br><br>

                                    Latitud:
                                    ${p.lat.toFixed(6)}

                                    <br>

                                    Longitud:
                                    ${p.lon.toFixed(6)}

                                    <br><br>

                                    <a href="${googleMaps}"
                                       target="_blank">
                                       Abrir en Google Maps
                                    </a>`

                                );

                        marcadores.push(marker);

                    });

                });

        }

    );

}

function cargarHallazgos() {

    fetch("/hallazgos")

        .then(r => r.json())

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
                document.getElementById(
                    "diario"
                );

            diario.style.display =
                diario.style.display === "block"
                    ? "none"
                    : "block";

            diario.innerHTML = html;

        });

}