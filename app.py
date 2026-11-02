from flask import Flask, render_template, jsonify, request
import random
import math
import sqlite3

from database import init_db

app = Flask(__name__)

init_db()


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/generar", methods=["POST"])
def generar():

    data = request.json

    lat = float(data["lat"])
    lon = float(data["lon"])

    intencion = data.get("intencion", "").lower()

    tipos = [
        "Anomalía Energética",
        "Eco Temporal",
        "Ruina Oculta",
        "Bosque Extraño",
        "Evento Inusual",
        "Punto Curioso",
        "Zona Inexplorada",
        "Anomalía Cuántica",
        "Objeto Perdido",
        "Lugar Desconocido"
    ]

    if "naturaleza" in intencion:
        tipos.extend([
            "Bosque Antiguo",
            "Sendero Perdido",
            "Mirador Secreto"
        ])

    elif "misterio" in intencion:
        tipos.extend([
            "Eco Temporal",
            "Ruina Oculta",
            "Anomalía Cuántica"
        ])

    resultados = []

    for _ in range(5):

        rareza = random.randint(1, 100)

        if rareza >= 95:

            distancia = random.uniform(3, 8)

            tipo = "Anomalía Cuántica"

        elif rareza >= 80:

            distancia = random.uniform(1, 5)

            tipo = random.choice([
                "Eco Temporal",
                "Ruina Oculta",
                "Evento Inusual"
            ])

        else:

            distancia = random.uniform(
                0.3,
                2
            )

            tipo = random.choice(tipos)

        angulo = random.uniform(
            0,
            360
        )

        nueva_lat = lat + (
            distancia / 111
        ) * math.cos(
            math.radians(
                angulo
            )
        )

        nueva_lon = lon + (
            distancia /
            (
                111 *
                math.cos(
                    math.radians(
                        lat
                    )
                )
            )
        ) * math.sin(
            math.radians(
                angulo
            )
        )

        resultados.append({

            "id":
                random.randint(
                    100000,
                    999999
                ),

            "lat":
                round(
                    nueva_lat,
                    6
                ),

            "lon":
                round(
                    nueva_lon,
                    6
                ),

            "rareza":
                rareza,

            "sincronicidad":
                random.randint(
                    1,
                    100
                ),

            "tipo":
                tipo

        })

    return jsonify(resultados)


@app.route(
    "/guardar",
    methods=["POST"]
)
def guardar():

    data = request.json

    conn = sqlite3.connect(
        "explorer.db"
    )

    c = conn.cursor()

    c.execute("""
        INSERT INTO hallazgos
        (
            titulo,
            descripcion,
            lat,
            lon,
            rareza,
            tipo
        )
        VALUES
        (?, ?, ?, ?, ?, ?)
    """, (

        data["titulo"],
        data["descripcion"],
        data["lat"],
        data["lon"],
        data["rareza"],
        data["tipo"]

    ))

    xp_ganada = int(
        data["rareza"]
    )

    c.execute("""
        UPDATE usuario
        SET xp = xp + ?
        WHERE id = 1
    """, (
        xp_ganada,
    ))

    c.execute("""
        SELECT xp
        FROM usuario
        WHERE id = 1
    """)

    xp = c.fetchone()[0]

    nivel = (
        xp // 500
    ) + 1

    c.execute("""
        UPDATE usuario
        SET nivel = ?
        WHERE id = 1
    """, (
        nivel,
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "ok": True
    })


@app.route("/hallazgos")
def hallazgos():

    conn = sqlite3.connect(
        "explorer.db"
    )

    c = conn.cursor()

    c.execute("""
        SELECT *
        FROM hallazgos
        ORDER BY id DESC
    """)

    datos = c.fetchall()

    conn.close()

    return jsonify(datos)


@app.route("/stats")
def stats():

    conn = sqlite3.connect(
        "explorer.db"
    )

    c = conn.cursor()

    c.execute("""
        SELECT xp,
               nivel
        FROM usuario
        WHERE id = 1
    """)

    usuario = c.fetchone()

    conn.close()

    return jsonify({

        "xp":
            usuario[0],

        "nivel":
            usuario[1],

        "progreso":
            usuario[0] % 500

    })


if __name__ == "__main__":
    app.run(
        debug=True
    )