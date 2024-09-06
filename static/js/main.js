window.getCurrentLocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Este navegador no admite la geolocalización.");
    }
};

function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const placeType = document.getElementById('place-type').value;

    const subtitle = document.getElementById('subtitle');
    switch (placeType) {
        case 'restaurant':
            subtitle.textContent = 'Restaurantes';
            break;
        case 'hotel':
            subtitle.textContent = 'Hoteles';
            break;
        case 'tourism':
            subtitle.textContent = 'Lugares turísticos';
            break;
        default:
            subtitle.textContent = '';
    }

    fetch('/get_nearby_places', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ latitude: latitude, longitude: longitude, place_type: placeType })
    })
    .then(response => response.json())
    .then(data => {
        const placesList = document.getElementById('places-list');
        placesList.innerHTML = '';

        data.forEach(place => {
            const li = document.createElement('li');
            li.textContent = place.name;
            li.dataset.lat = place.latitude;
            li.dataset.lng = place.longitude;
            li.dataset.vicinity = place.vicinity;

            
            li.addEventListener('click', () => {
                console.log(`Latitud: ${li.dataset.lat}, Longitud: ${li.dataset.lng}`);
                showOnMap(parseFloat(li.dataset.lat), parseFloat(li.dataset.lng), place.name);
            });

            placesList.appendChild(li);
        });

        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    })
    .catch(error => {
        console.error('Error fetching places:', error);
    });
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("El usuario denegó la solicitud de geolocalización.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("La información de ubicación no está disponible.");
            break;
        case error.UNKNOWN_ERROR:
            alert("Se produjo un error desconocido.");
            break;
    }
}

var map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var marker = null;

function showOnMap(lat, lng, name) {
    console.log(lat, lng)
    if (marker) {
        map.removeLayer(marker);
    }

    map.setView([lat, lng], 16);

    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(name)
        .openPopup();
}
