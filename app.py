import random
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Base de datos simulada en memoria
HALLAZGOS_DB = [
    # Formato: [id, titulo, descripcion, lat, lon, rareza, tipo]
    [1, "Resonancia Magnética", "Una distorsión en el campo detectada cerca del faro.", 41.6120, 2.6520, 96, "Anomalía Legendaria"],
    [2, "Foco Lumínico", "Energía residual flotando sobre la vegetación.", 41.6150, 2.6450, 65, "Anomalía Común"]
]

def obtener_tipo_y_rareza():
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
    return render_template("index.html")

@app.route("/generar", methods=["POST"])
def generar():
    datos = request.get_json()
    if not datos:
        return jsonify([]), 400
        
    lat = float(datos.get("lat"))
    lon = float(datos.get("lon"))
    intencion = datos.get("intencion", "")
    radio_metros = float(datos.get("radio", 500))

    # Convertimos metros aproximados a coordenadas decimales (1 grado aprox = 111,000 metros)
    limite_desviacion = radio_metros / 111000.0

    anomalias = []
    
    for _ in range(30):
        if len(anomalias) >= 4:
            break
            
        nueva_lat = lat + random.uniform(-limite_desviacion, limite_desviacion)
        nueva_lon = lon + random.uniform(-limite_desviacion, limite_desviacion)
        
        # Filtro marítimo dinámico para Calella
        if nueva_lon > lon + 0.0035:
            continue

        tipo, rareza = obtener_tipo_y_rareza()
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

@app.route("/guardar_hallazgo", methods=["POST"])
def guardar_hallazgo():
    datos = request.get_json()
    if not datos:
        return jsonify({"status": "error"}), 400
        
    nuevo_id = len(HALLAZGOS_DB) + 1
    nota = datos.get("nota", "Sin comentarios.")
    
    HALLAZGOS_DB.append([
        nuevo_id, 
        datos.get("tipo", "Anomalía"), 
        f"Nota: {nota} (Coordenadas: {datos.get('lat')}, {datos.get('lon')})", 
        datos.get("lat"), 
        datos.get("lon"), 
        datos.get("rareza", 50), 
        datos.get("tipo")
    ])
    return jsonify({"status": "saved"})

if __name__ == "__main__":
    app.run(debug=True)
