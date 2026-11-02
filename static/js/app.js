let mapa;
let marcadores = [];

let marcadorUsuario;

let objetivoActual = null;

window.onload = function () {

    navigator.geolocation.watchPosition(

        function (pos) {

            let lat = pos.coords.latitude;
            let lon = pos.coords.longitude;

            if (!mapa) {

                iniciarMapa(
                    lat,
                    lon
                );

                cargarStats();
            }

            actualizarPosicion(
                lat,
                lon
            );

            actualizarDistancia(
                lat,
                lon
            );

        },

        function (error) {
            console.log(error);
        },

        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
        }

    );

};

function iniciarMapa(lat, lon) {

    mapa = L.map("map").setView(
        [lat, lon],
        15
    );

    L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 17,
            attribution: "© OpenTopoMap"
        }
    ).addTo(mapa);

}

function actualizarPosicion(lat, lon) {

    if (!marcadorUsuario) {

        marcadorUsuario =
            L.marker([lat, lon])
                .addTo(mapa)
                .bindPopup("📍 Tu ubicación");

    } else {

        marcadorUsuario.setLatLng(
            [lat, lon]
        );

    }

}

function cargarStats() {

    fetch("/stats")
        .then(r => r.json())
        .then(data => {

            document.getElementById(
                "nivel"
            ).innerText =
                "Nivel " +
                data.nivel;

            document.getElementById(
                "xp"
            ).innerText =
                "XP: " +
                data.xp;

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

                    lat:
                        pos.coords.latitude,

                    lon:
                        pos.coords.longitude,

                    intencion:
                        document
                            .getElementById(
                                "intencion"
                            ).value

                })

            })

                .then(r => r.json())

                .then(datos => {

                    marcadores.forEach(
                        m => mapa.removeLayer(m)
            