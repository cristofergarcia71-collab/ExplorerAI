let mapa;
let marcadores = [];

let marcadorUsuario;

let objetivoActual = null;

window.onload = function(){

    navigator.geolocation.watchPosition(

        function(pos){

            let lat =
            pos.coords.latitude;

            let lon =
            pos.coords.longitude;

            if(!mapa){

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

        function(error){

            console.log(error);

        },

        {
            enableHighAccuracy:true,
            maximumAge:0,
            timeout:10000
        }

    );

};

function iniciarMapa(lat,lon){

    mapa = L.map("map").setView(
        [lat,lon],
        15
    );

    L.tileLayer(

        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",

        {
            attribution:"© OpenStreetMap"
        }

    ).addTo(mapa);
}

function actualizarPosicion(
    lat,
    lon
){

    if(!marcadorUsuario){

        marcadorUsuario =
        L.marker([
            lat,
            lon
        ])
        .addTo(mapa)
        .bindPopup(
            "Tu ubicación"
        );

    }else{

        marcadorUsuario.setLatLng(
            [lat,lon]
        );
    }
}

function cargarStats(){

    fetch("/stats")
    .then(r=>r.json())
    .then(data=>{

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
        (data.xp%500)/5;

        document.getElementById(
            "xpFill"
        ).style.width =
        porcentaje+"%";
    });
}

function generarAnomalias(){

    navigator.geolocation.getCurrentPosition(

        function(pos){

            fetch("/generar",{

                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({

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

            .then(r=>r.json())
            .then(datos=>{

                marcadores.forEach(m=>{
                    mapa.removeLayer(m);
                });

                marcadores=[];

                objetivoActual=null;

                datos.forEach(p=>{

                    let color =
                    p.rareza>=95
                    ? "red"
                    : p.rareza>=80
                    ? "orange"
                    : "lime";

                    let marker =
                    L.circleMarker(

                        [p.lat,p.lon],

                        {
                            radius:10,
                            color:color,
                            fillColor:color,
                            fillOpacity:0.8
                        }

                    )
                    .addTo(mapa);

                    marker.on(

                        "click",

                        function(){

                            objetivoActual =
                            p;

                            document
                            .getElementById(
                                "objetivo"
                            )
                            .innerHTML =

                            `
                            🎯 Objetivo

                            <br>

                            Rareza:
                            ${p.rareza}%

                            <br>

                            Coordenadas:

                            <br>

                            ${p.lat}

                            ,

                            ${p.lon}
                            `;
                        }
                    );

                    marker.bindPopup(

                    `
                    <b>${p.tipo}</b>

                    <br>

                    Rareza:
                    ${p.rareza}%

                    <br><br>

                    ${p.lat}

                    ,

                    ${p.lon}

                    <br><br>

                    <a
                    target="_blank"
                    href="https://www.google.com/maps?q=${p.lat},${p.lon}">
                    Abrir Google Maps
                    </a>
                    `
                    );

                    marcadores.push(
                        marker
                    );
                });

            });

        }

    );
}

function actualizarDistancia(
    lat,
    lon
){

    if(!objetivoActual)
        return;

    let d = calcularDistancia(

        lat,
        lon,

        objetivoActual.lat,
        objetivoActual.lon

    );

    document.getElementById(
        "objetivo"
    ).innerHTML =

    `
    🎯 Objetivo

    <br>

    Distancia:

    ${Math.round(d)}
    metros

    <br>

    Rareza:
    ${objetivoActual.rareza}%
    `;

    if(d<25){

        alert(
        "🎉 Anomalía alcanzada"
        );

        objetivoActual=null;
    }

}

function calcularDistancia(
lat1,
lon1,
lat2,
lon2
){

    let R = 6371e3;

    let p1 =
    lat1*Math.PI/180;

    let p2 =
    lat2*Math.PI/180;

    let dp =
    (lat2-lat1)
    *Math.PI/180;

    let dl =
    (lon2-lon1)
    *Math.PI/180;

    let a =

    Math.sin(dp/2)
    *
    Math.sin(dp/2)

    +

    Math.cos(p1)
    *
    Math.cos(p2)

    *

    Math.sin(dl/2)
    *
    Math.sin(dl/2);

    let c =
    2*Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1-a)
    );

    return R*c;
}

function cargarHallazgos(){

    fetch("/hallazgos")

    .then(r=>r.json())

    .then(datos=>{

        let html="";

        datos.forEach(h=>{

            html +=

            `
            <div class="card">

                <h3>${h[1]}</h3>

                <p>${h[2]}</p>

                <p>
                Rareza:
                ${h[5]}
                </p>

                <p>
                Tipo:
                ${h[6]}
                </p>

            </div>
            `;
        });

        let diario =
        document.getElementById(
            "diario"
        );

        diario.style.display =
        diario.style.display
        ===
        "block"
        ? "none"
        : "block";

        diario.innerHTML =
        html;

    });

}