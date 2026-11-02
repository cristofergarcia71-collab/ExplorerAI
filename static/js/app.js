import random
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Base de datos simulada en memoria para simplificar (o la conexión que uses para tu SQLite/PostgreSQL)
HALLAZGOS_DB = [
    # [id, titulo, descripcion, lat, lon, rareza, tipo]
    [1, "Resonancia Magnética", "Una distorsión en el campo detectada cerca del faro.", 41.6120, 2.6520, 96, "Anomalía Legendaria"],
    [2, "Foco Lumínico", "Energía residual flotando sobre la vegetación.", 41.6150, 2.6450, 65, "Anomalía Común"]
]

def obtener_tipo_y_rareza():
    # Determinar rareza aleatoria de 1 a 100
    rareza = random.randint(1, 100)
    if rareza >= 95:
        tipo = "Anomalía Legendaria"
    elif rareza >= 80:
        tipo = "Anomalía Rara"
    else:
        tipo = "Anomalía Común"
    return tipo, rareza

@app.route("/")
def index():
    # Retorna tu plantilla HTML principal
    return render_template("index.html")

@app.route("/generar", methods=["POST"])
def generar():
    datos = request.get_json()
    if not datos:
        return jsonify([]), 400
        
    lat = float(datos.get("lat"))
    lon = float(datos.get("lon"))
    intencion = datos.get("intencion", "")

    anomalias = []
    intentos = 0
    
    # Intentamos generar hasta 4 anomalías válidas por cada petición
    while len(anomalias) < 4 and intentos < 40:
        intentos += 1
        
        # Generar una variación controlada a la redonda (aprox. radio de 500m a 800m)
        nueva_lat = lat + random.uniform(-0.007, 0.007)
        nueva_lon = lon + random.uniform(-0.007, 0.007)
        
        # MEJORA 4: Control marítimo adaptado a la costa de Calella.
        # Al aumentar la longitud (ir hacia el este / sureste), nos metemos en el mar.
        # Descartamos los puntos que se desvíen demasiado hacia aguas abiertas.
        if nueva_lon > lon + 0.0035:
            continue

        tipo, rareza = obtener_tipo_y_rareza()
        
        # Si el usuario escribió una "intención", la acoplamos al tipo de anomalía
        nombre_final = f"{tipo} ({intencion})" if intencion else tipo
        
        anomalias.append({
            "lat": nueva_lat,
            "lon": nueva_lon,
            "tipo": nombre_final,
            "rareza": rareza
        })

    return jsonify(anomalias)

@app.route("/hallazgos", methods=["GET"])
def hallazgos():
    return jsonify(HALLAZGOS_DB)

if __name__ == "__main__":
    app.run(debug=True)
