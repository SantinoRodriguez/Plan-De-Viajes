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
};

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