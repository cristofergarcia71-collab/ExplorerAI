let mapa;
let marcadores = [];

let marcadorUsuario;
let objetivoActual = null;

window.onload = function () {

    navigator.geolocation.watchPosition(

        function (pos) {

            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            if (!mapa) {

                iniciarMapa(lat, lon);
                cargarStats();
            }

            actualizarPosicion(lat, lon);
            actualizarDistancia(lat, lon);

        },

        function (error) {

            console.log(error);

        },

        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
        