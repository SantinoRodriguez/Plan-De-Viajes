document.addEventListener("DOMContentLoaded", () => {
    const days = document.querySelectorAll(".calendar-grid .calendar-day:not(.empty)");
    const clearBtn = document.getElementById("btn-clear-dates");

    let startDay = null;
    let endDay = null;

    // Detectar selección inicial basada en clases HTML existentes
    const activeDays = Array.from(days).filter(day => day.classList.contains("active"));
    if (activeDays.length > 0) {
        const dayNums = activeDays.map(day => parseInt(day.textContent.trim())).sort((a, b) => a - b);
        startDay = dayNums[0];
        endDay = dayNums[dayNums.length - 1];
    }

    // Función para actualizar las clases visuales de la grilla
    function updateCalendarUI() {
        days.forEach(day => {
            const dayNum = parseInt(day.textContent.trim());
            if (startDay !== null) {
                if (endDay !== null) {
                    if (dayNum >= startDay && dayNum <= endDay) {
                        day.classList.add("active", "shadow-sm", "fw-bold");
                    } else {
                        day.classList.remove("active", "shadow-sm", "fw-bold");
                    }
                } else {
                    if (dayNum === startDay) {
                        day.classList.add("active", "shadow-sm", "fw-bold");
                    } else {
                        day.classList.remove("active", "shadow-sm", "fw-bold");
                    }
                }
            } else {
                day.classList.remove("active", "shadow-sm", "fw-bold");
            }
        });
    }

    // Event listener para clics en los días
    days.forEach(day => {
        day.addEventListener("click", () => {
            const dayNum = parseInt(day.textContent.trim());

            if (startDay === null || (startDay !== null && endDay !== null)) {
                // Primer clic o reinicio: seleccionar fecha de inicio
                startDay = dayNum;
                endDay = null;
            } else if (startDay !== null && endDay === null) {
                // Segundo clic: seleccionar fecha de fin (debe ser posterior o igual a la de inicio)
                if (dayNum >= startDay) {
                    endDay = dayNum;
                } else {
                    // Si el usuario hace clic en un día anterior al de inicio, se reestablece como nueva fecha de inicio
                    startDay = dayNum;
                }
            }

            updateCalendarUI();
        });
    });

    // Event listener para borrar las fechas
    if (clearBtn) {
        clearBtn.addEventListener("click", (e) => {
            e.preventDefault(); // Evitar comportamientos por defecto del botón/link
            startDay = null;
            endDay = null;
            updateCalendarUI();
        });
    }
});

// Función callback global para inicializar Google Maps
window.initMap = function() {
    const defaultCenter = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires
    const mapOptions = {
        center: defaultCenter,
        zoom: 12,
        // Estilos para combinar el mapa con la estética cálida y premium del sitio
        styles: [
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{ "color": "#ded2c0" }, { "lightness": 17 }]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [{ "color": "#f8f5f0" }, { "lightness": 20 }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [{ "color": "#ffffff" }, { "lightness": 17 }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{ "color": "#ffffff" }, { "lightness": 29 }, { "weight": 0.2 }]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [{ "color": "#ffffff" }, { "lightness": 18 }]
            },
            {
                "featureType": "road.local",
                "elementType": "geometry",
                "stylers": [{ "color": "#ffffff" }, { "lightness": 16 }]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{ "color": "#ede6db" }, { "lightness": 21 }]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [{ "color": "#d5cbba" }, { "lightness": 21 }]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{ "visibility": "on" }, { "color": "#ffffff" }, { "lightness": 16 }]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{ "saturation": 36 }, { "color": "#333333" }, { "lightness": 40 }]
            },
            {
                "elementType": "labels.icon",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "transit",
                "elementType": "geometry",
                "stylers": [{ "color": "#f2f2f2" }, { "lightness": 19 }]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.fill",
                "stylers": [{ "color": "#fefefe" }, { "lightness": 20 }]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.stroke",
                "stylers": [{ "color": "#fefefe" }, { "lightness": 17 }, { "weight": 1.2 }]
            }
        ]
    };

    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    const map = new google.maps.Map(mapElement, mapOptions);

    // Marcador interactivo inicial en Buenos Aires
    let marker = new google.maps.Marker({
        position: defaultCenter,
        map: map,
        title: "Buenos Aires (Arrastrame para seleccionar)",
        draggable: true,
        animation: google.maps.Animation.DROP
    });

    // Mover el marcador haciendo clic en cualquier parte del mapa
    map.addListener("click", (event) => {
        marker.setPosition(event.latLng);
        // Efecto visual de rebote al posicionarse
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            marker.setAnimation(null);
        }, 750);
        
        console.log("Coordenadas seleccionadas:", event.latLng.lat(), event.latLng.lng());
    });

    // Log de coordenadas al terminar de arrastrar el marcador
    marker.addListener("dragend", () => {
        const position = marker.getPosition();
        console.log("Coordenadas arrastradas:", position.lat(), position.lng());
    });

    // --- INTEGRACIÓN DE GOOGLE PLACES API ---
    const inputLugares = document.getElementById("buscar-lugares");
    const inputDestinos = document.getElementById("buscar-destinos");

    // Configurar Autocomplete para buscar-lugares si existe
    if (inputLugares) {
        const autocompleteLugares = new google.maps.places.Autocomplete(inputLugares, {
            fields: ['geometry.location', 'photos', 'formatted_address', 'name']
        });
        
        autocompleteLugares.addListener('place_changed', () => {
            const place = autocompleteLugares.getPlace();
            if (!place.geometry || !place.geometry.location) {
                console.log("No hay detalles disponibles para: '" + place.name + "'");
                return;
            }
            
            // Centrar mapa y mover marcador
            map.setCenter(place.geometry.location);
            map.setZoom(15);
            marker.setPosition(place.geometry.location);
            
            // Extraer fotos
            let photoUrls = [];
            if (place.photos && place.photos.length > 0) {
                photoUrls = place.photos.map(p => p.getUrl({ maxWidth: 600, maxHeight: 600 }));
            }
            
            mostrarVistaPreviaLugar(place, photoUrls);
        });
    }

    // Configurar Autocomplete para buscar-destinos si existe
    if (inputDestinos) {
        const autocompleteDestinos = new google.maps.places.Autocomplete(inputDestinos, {
            fields: ['geometry.location', 'photos', 'formatted_address', 'name']
        });
        
        autocompleteDestinos.addListener('place_changed', () => {
            const place = autocompleteDestinos.getPlace();
            if (!place.geometry || !place.geometry.location) {
                console.log("No hay detalles disponibles para: '" + place.name + "'");
                return;
            }
            
            // Centrar mapa y mover marcador
            map.setCenter(place.geometry.location);
            map.setZoom(15);
            marker.setPosition(place.geometry.location);
            
            // Extraer fotos
            let photoUrls = [];
            if (place.photos && place.photos.length > 0) {
                photoUrls = place.photos.map(p => p.getUrl({ maxWidth: 600, maxHeight: 600 }));
            }
            
            mostrarVistaPreviaLugar(place, photoUrls);
        });
    }
};

// Función para mostrar una tarjeta premium de vista previa del lugar y sus fotos
function mostrarVistaPreviaLugar(place, photoUrls) {
    // Eliminar vista previa anterior si existe
    let existingPreview = document.getElementById("places-preview-card");
    if (existingPreview) {
        existingPreview.remove();
    }
    
    // Crear el contenedor de vista previa
    const previewCard = document.createElement("div");
    previewCard.id = "places-preview-card";
    previewCard.className = "card2 rounded-4 p-3 border border-dark shadow-sm mt-3 bg-white";
    previewCard.style.transition = "all 0.3s ease";
    
    let photosHtml = "";
    if (photoUrls && photoUrls.length > 0) {
        photosHtml = `
            <div class="d-flex gap-2 overflow-x-auto pb-2 mt-2" style="scrollbar-width: thin; -webkit-overflow-scrolling: touch;">
                ${photoUrls.map(url => `
                    <img src="${url}" alt="Foto de ${place.name}" class="rounded-3 border" style="height: 120px; object-fit: cover; min-width: 160px; max-width: 160px;">
                `).join('')}
            </div>
        `;
    } else {
        photosHtml = `<p class="text-muted small mt-2"><i class="fa-solid fa-image-slash me-1"></i> No hay fotos disponibles para este lugar</p>`;
    }
    
    previewCard.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div style="text-align: left; flex-grow: 1;">
                <h5 class="fw-bold mb-1 text-dark" style="font-size: 1.1rem;">${place.name}</h5>
                <p class="text-muted small mb-2"><i class="fa-solid fa-map-marker-alt text-danger me-1"></i> ${place.formatted_address || 'Sin dirección registrada'}</p>
            </div>
            <button type="button" class="btn-close ms-2" onclick="document.getElementById('places-preview-card').remove();" aria-label="Close"></button>
        </div>
        ${photosHtml}
        <div class="d-flex justify-content-between align-items-center mt-3">
            <span class="text-muted small"><i class="fa-solid fa-location-crosshairs me-1"></i> ${place.geometry.location.lat().toFixed(4)}, ${place.geometry.location.lng().toFixed(4)}</span>
            <button class="btn btn-sm btns border border-dark fw-bold px-3 py-1" id="btn-add-lugar-confirm">Agregar Lugar</button>
        </div>
    `;
    
    const inputLugares = document.getElementById("buscar-lugares");
    const inputDestinos = document.getElementById("buscar-destinos");
    
    if (inputLugares) {
        inputLugares.closest('.content-section').appendChild(previewCard);
        
        document.getElementById("btn-add-lugar-confirm").addEventListener("click", () => {
            const listSection = inputLugares.closest('.content-section');
            const newItem = document.createElement("div");
            newItem.className = "list-item-row bg-white shadow-sm mt-2";
            
            const mainPhoto = photoUrls.length > 0 ? photoUrls[0] : "../Imagenes/Sites/eiffel.jpeg";
            
            newItem.innerHTML = `
                <img src="${mainPhoto}" alt="${place.name}" class="item-img">
                <div class="item-content d-flex flex-column justify-content-center ms-2">
                    <span class="fw-bold">${place.name}</span>
                    <span class="text-muted"><i class="fa-solid fa-map-marker-alt text-danger me-1"></i> ${place.formatted_address}</span>
                </div>
            `;
            
            // Insertar antes del botón/fila de agregar
            listSection.insertBefore(newItem, inputLugares.closest('.add-btn-row'));
            previewCard.remove();
            inputLugares.value = "";
        });
    } else if (inputDestinos) {
        inputDestinos.closest('.card2').appendChild(previewCard);
        
        document.getElementById("btn-add-lugar-confirm").addEventListener("click", () => {
            // Mostrar notificación visual en lugar de alert molesto
            const alertBox = document.createElement("div");
            alertBox.className = "alert alert-success mt-2 mb-0 py-2 text-center small border border-success rounded-3";
            alertBox.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i> Destino agregado: <strong>${place.name}</strong>`;
            inputDestinos.closest('.card2').appendChild(alertBox);
            setTimeout(() => alertBox.remove(), 3000);
            
            previewCard.remove();
            inputDestinos.value = "";
        });
    }
}

// Functions to hide/show sidebar in make_travel.html
window.hideSidebar = function() {
    document.querySelector('.sidebar').style.display = 'none';
    document.querySelector('.middle-content').style.display = 'none';
    document.getElementById('show-sidebar-btn').style.display = 'flex';
};

window.showSidebar = function() {
    document.querySelector('.sidebar').style.display = 'flex';
    document.querySelector('.middle-content').style.display = 'flex';
    document.getElementById('show-sidebar-btn').style.display = 'none';
};

// Image Carousel Function for info.html
window.changeImage = function(src, element) {
    document.getElementById('mainImage').src = src;
    
    // Remove active class from all thumbnails
    let thumbnails = document.querySelectorAll('.thumbnail-img');
    thumbnails.forEach(thumb => {
        thumb.classList.remove('active');
    });
    
    // Add active class to clicked thumbnail
    if(element) {
        element.classList.add('active');
    }
};