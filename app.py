from flask import Flask, render_template, request, jsonify
import requests
from geopy.geocoders import Nominatim

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_nearby_places', methods=['POST'])
def get_nearby_places():
    data = request.json
    latitude = data['latitude']
    longitude = data['longitude']
    place_type = data['place_type']
    print(f"Latitud: {latitude}, Longitud: {longitude}")

    # Construir la consulta basada en el tipo de lugar seleccionado
    place_filter = ""
    if place_type == 'restaurant':
        place_filter = '[amenity=restaurant]'
        search_radius = 1000 
    elif place_type == 'hotel':
        place_filter = '[tourism=hotel]'
        search_radius = 2000 
    elif place_type == 'tourism':
        place_filter = '[tourism~"attraction|museum|viewpoint"]'
        search_radius = 5000
    else:
        
        query_part = """
        node[amenity=restaurant](around:200,{latitude},{longitude});
        node[tourism=hotel](around:1000,{latitude},{longitude});
        node[tourism~"attraction|museum|viewpoint"](around:5000,{latitude},{longitude});
        """
        place_filter = query_part.format(latitude=latitude, longitude=longitude)

    if place_type in ['restaurant', 'hotel', 'tourism']:
        overpass_query = f"""
        [out:json];
        (
          node
            {place_filter}
            (around:{search_radius},{latitude},{longitude});
        );
        out body;
        """
    else:
        overpass_query = f"""
        [out:json];
        (
          {place_filter}
        );
        out body;
        """

    overpass_url = "http://overpass-api.de/api/interpreter"
    response = requests.get(overpass_url, params={'data': overpass_query})
    places = response.json()

    # Filtrar y estructurar los resultados
    results = []
    for element in places.get('elements', []):
        tags = element.get('tags', {})
        name = tags.get('name', 'Unnamed')

        if name != 'Unnamed':
            results.append({
                'name': name,
                'latitude': element['lat'],
                'longitude': element['lon'],
                'vicinity': f"{tags.get('addr:street', 'No Street')}, {tags.get('addr:city', 'No City')}"
            })
    #print(results)
    return jsonify(results)

@app.route('/get_location', methods=['POST'])
def get_location():
    geolocator = Nominatim(user_agent="tourism_app")
    location = geolocator.geocode(request.json['address'])
    return jsonify({'latitude': location.latitude, 'longitude': location.longitude})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

