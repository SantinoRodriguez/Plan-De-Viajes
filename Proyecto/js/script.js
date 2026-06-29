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

    // Event listeners para los contadores (habitaciones, personas, etc.)
    const minusButtons = document.querySelectorAll(".counter-btn-minus");
    const plusButtons = document.querySelectorAll(".counter-btn-plus");

    minusButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const display = btn.parentElement.querySelector(".counter-display");
            if (display) {
                const minVal = parseInt(btn.getAttribute("data-min") || "0");
                let currentVal = parseInt(display.textContent.trim());
                if (currentVal > minVal) {
                    display.textContent = currentVal - 1;
                }
            }
        });
    });

    plusButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const display = btn.parentElement.querySelector(".counter-display");
            if (display) {
                let currentVal = parseInt(display.textContent.trim());
                display.textContent = currentVal + 1;
            }
        });
    });
});

// Función callback global para inicializar Google Maps
window.initMap = function () {
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
            fields: ['place_id', 'geometry.location', 'photos', 'formatted_address', 'name']
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
            fields: ['place_id', 'geometry.location', 'photos', 'formatted_address', 'name']
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
            
            const newLink = document.createElement("a");
            newLink.href = `info.html?place_id=${place.place_id}&name=${encodeURIComponent(place.name)}`;
            newLink.className = "text-decoration-none text-dark d-block mt-2";

            const newItem = document.createElement("div");
            newItem.className = "list-item-row bg-white shadow-sm";

            const mainPhoto = photoUrls.length > 0 ? photoUrls[0] : "../Imagenes/Sites/eiffel.jpeg";

            newItem.innerHTML = `
                <img src="${mainPhoto}" alt="${place.name}" class="item-img">
                <div class="item-content d-flex flex-column justify-content-center ms-2">
                    <span class="fw-bold">${place.name}</span>
                    <span class="text-muted"><i class="fa-solid fa-map-marker-alt text-danger me-1"></i> ${place.formatted_address}</span>
                </div>
            `;
            
            newLink.appendChild(newItem);

            // Insertar antes del botón/fila de agregar
            listSection.insertBefore(newLink, inputLugares.closest('.add-btn-row'));
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
window.hideSidebar = function () {
    document.querySelector('.sidebar').style.display = 'none';
    document.querySelector('.middle-content').style.display = 'none';
    document.getElementById('show-sidebar-btn').style.display = 'flex';
};

window.showSidebar = function () {
    document.querySelector('.sidebar').style.display = 'flex';
    document.querySelector('.middle-content').style.display = 'flex';
    document.getElementById('show-sidebar-btn').style.display = 'none';
};

// Image Carousel Function for info.html
window.changeImage = function (src, element) {
    document.getElementById('mainImage').src = src;

    // Remove active class from all thumbnails
    let thumbnails = document.querySelectorAll('.thumbnail-img');
    thumbnails.forEach(thumb => {
        thumb.classList.remove('active');
    });

    // Add active class to clicked thumbnail
    if (element) {
        element.classList.add('active');
    }
};

// Initialize dynamic info.html page with Google Places API
window.initInfoPage = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const placeId = urlParams.get('place_id');
    const nameParam = urlParams.get('name');

    if (nameParam) {
        document.title = nameParam + " - Información Detallada";
        const titleEl = document.getElementById("info-title");
        if (titleEl) titleEl.textContent = nameParam;
    }

    if (!placeId) {
        // If there's no place_id, we just leave the default HTML layout
        console.log("No place_id provided in URL");
        return;
    }

    // Initialize Map for info-map
    const mapElement = document.getElementById("info-map");
    let map = null;
    if (mapElement) {
        map = new google.maps.Map(mapElement, {
            center: { lat: 0, lng: 0 },
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false
        });
    }

    // Initialize PlacesService
    // We can pass the map or a dummy div
    const service = new google.maps.places.PlacesService(map || document.createElement('div'));

    const request = {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'types', 'editorial_summary', 'international_phone_number', 'website', 'opening_hours', 'price_level']
    };

    service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            
            // 1. Update Title and Address
            if (document.getElementById("info-title")) document.getElementById("info-title").textContent = place.name;
            document.title = place.name + " - Información Detallada";
            
            if (document.getElementById("info-address")) {
                document.getElementById("info-address").innerHTML = `<i class="fa-solid fa-map-marker-alt me-1"></i> ${place.formatted_address || ''}`;
            }
            if (document.getElementById("info-sidebar-address")) {
                document.getElementById("info-sidebar-address").innerHTML = `<i class="fa-solid fa-map-pin text-danger me-1"></i> ${place.formatted_address || ''}`;
            }

            // 2. Update Badge (Type)
            const badgeEl = document.getElementById("info-badge");
            if (badgeEl && place.types && place.types.length > 0) {
                const type = place.types[0].replace(/_/g, ' ');
                badgeEl.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            }

            // 3. Update Photos
            if (place.photos && place.photos.length > 0) {
                const mainImage = document.getElementById("mainImage");
                const thumbnailsContainer = document.getElementById("info-thumbnails");
                
                if (mainImage) mainImage.src = place.photos[0].getUrl({maxWidth: 800});
                
                if (thumbnailsContainer) {
                    let thumbsHtml = "";
                    for (let i = 0; i < Math.min(4, place.photos.length); i++) {
                        const url = place.photos[i].getUrl({maxWidth: 400});
                        thumbsHtml += `
                            <div class="col-3">
                                <img src="${url}" alt="${place.name} Vista ${i+1}" class="tour-thumb-img ${i===0?'active':''} thumbnail-img" style="object-fit:cover; height:80px; width:100%; border-radius: 8px; cursor: pointer;" onclick="changeImage(this.src, this)">
                            </div>
                        `;
                    }
                    thumbnailsContainer.innerHTML = thumbsHtml;
                }
            }

            // 4. Update Description
            const descEl = document.getElementById("info-description");
            if (descEl) {
                if (place.editorial_summary && place.editorial_summary.overview) {
                    descEl.innerHTML = `<p class="fs-5 lh-base">${place.editorial_summary.overview}</p>`;
                } else {
                    descEl.innerHTML = `<p class="fs-5 lh-base">Descubre <strong>${place.name}</strong>, un lugar increíble para visitar durante tu viaje. ${place.formatted_address ? 'Ubicado en ' + place.formatted_address + '.' : ''}</p>`;
                }
            }

            // 5. Update Quick Info
            const quickInfoContainer = document.getElementById("info-quick");
            if (quickInfoContainer) {
                let quickHtml = "";
                
                // Rating
                if (place.rating) {
                    quickHtml += `
                        <div class="col-md-4 col-6">
                            <div class="tour-info-box shadow-sm">
                                <div class="tour-info-box-title">Puntuación</div>
                                <div class="tour-info-box-value"><i class="fa fa-star text-warning"></i> ${place.rating} (${place.user_ratings_total || 0} res.)</div>
                            </div>
                        </div>
                    `;
                }
                
                // Status / Opening Hours
                if (place.opening_hours) {
                    const isOpen = place.opening_hours.isOpen ? place.opening_hours.isOpen() : false;
                    quickHtml += `
                        <div class="col-md-4 col-6">
                            <div class="tour-info-box shadow-sm">
                                <div class="tour-info-box-title">Estado</div>
                                <div class="tour-info-box-value ${isOpen ? 'text-success' : 'text-danger'} fw-bold">${isOpen ? 'Abierto ahora' : 'Cerrado ahora'}</div>
                            </div>
                        </div>
                    `;
                }

                // Price Level
                if (place.price_level !== undefined) {
                    const priceStr = "$$$$$".substring(0, place.price_level + 1);
                    quickHtml += `
                        <div class="col-md-4 col-6">
                            <div class="tour-info-box shadow-sm">
                                <div class="tour-info-box-title">Nivel de Precio</div>
                                <div class="tour-info-box-value">${priceStr}</div>
                            </div>
                        </div>
                    `;
                }

                // Phone
                if (place.international_phone_number) {
                    quickHtml += `
                        <div class="col-md-4 col-6">
                            <div class="tour-info-box shadow-sm text-truncate">
                                <div class="tour-info-box-title">Teléfono</div>
                                <div class="tour-info-box-value">${place.international_phone_number}</div>
                            </div>
                        </div>
                    `;
                }

                // Website
                if (place.website) {
                    quickHtml += `
                        <div class="col-md-4 col-6">
                            <div class="tour-info-box shadow-sm">
                                <div class="tour-info-box-title">Sitio Web</div>
                                <div class="tour-info-box-value text-truncate"><a href="${place.website}" target="_blank" class="text-dark text-decoration-none">Visitar Web <i class="fa-solid fa-external-link-alt ms-1"></i></a></div>
                            </div>
                        </div>
                    `;
                }

                quickInfoContainer.innerHTML = quickHtml;
            }

            // 6. Update Map position and add marker
            if (map && place.geometry && place.geometry.location) {
                map.setCenter(place.geometry.location);
                new google.maps.Marker({
                    map: map,
                    position: place.geometry.location,
                    title: place.name
                });
            }
            
        } else {
            console.error("Error fetching place details:", status);
        }
    });
};

// --- Autenticación Supabase (Registro e Inicio de Sesión) ---
document.addEventListener("DOMContentLoaded", () => {
    // Referencias a los formularios
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");

    // Lógica para Registro (sing_up.html)
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const name = document.getElementById("signup-name").value;
            const email = document.getElementById("signup-email").value;
            const password = document.getElementById("signup-password").value;
            const confirmPassword = document.getElementById("signup-confirm-password").value;
            const messageContainer = document.getElementById("signup-message");
            
            // Limpiar mensajes previos
            messageContainer.innerHTML = "";

            if (password !== confirmPassword) {
                messageContainer.innerHTML = `<div class="alert alert-danger">Las contraseñas no coinciden.</div>`;
                return;
            }

            // Registrar usuario en Supabase
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            if (error) {
                let errorMsg = error.message;
                if (errorMsg.toLowerCase().includes("already registered") || 
                    errorMsg.toLowerCase().includes("already in use") ||
                    errorMsg.toLowerCase().includes("exists")) {
                    errorMsg = `Esta cuenta ya está registrada. ¿Quieres <a href="log_in.html" class="alert-link">iniciar sesión aquí</a>?`;
                }
                messageContainer.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
            } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                // Supabase protección de enumeración: usuario ya registrado
                messageContainer.innerHTML = `<div class="alert alert-warning">Esta cuenta ya está registrada. ¿Quieres <a href="log_in.html" class="alert-link">iniciar sesión aquí</a>?</div>`;
            } else {
                messageContainer.innerHTML = `<div class="alert alert-success">¡Registro exitoso! Iniciando sesión y redirigiendo...</div>`;
                signupForm.reset();
                
                // Guardar mensaje de bienvenida
                localStorage.setItem("loginSuccessMessage", "¡Cuenta creada con éxito! Se ha iniciado sesión.");
                
                // Redirigir al inicio después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = "../index.html";
                }, 1500);
            }
        });
    }

    // Lógica para Inicio de Sesión (log_in.html)
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const email = document.getElementById("login-email").value;
            const password = document.getElementById("login-password").value;
            const messageContainer = document.getElementById("login-message");
            
            // Limpiar mensajes previos
            messageContainer.innerHTML = "";

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                let errorMsg = error.message;
                // Si la credencial no es válida o el usuario no existe
                if (errorMsg.toLowerCase().includes("invalid login credentials") || 
                    errorMsg.toLowerCase().includes("not found")) {
                    errorMsg = `La cuenta no existe o las credenciales son incorrectas. ¿No tienes cuenta? <a href="sing_up.html" class="alert-link">Regístrate aquí</a>.`;
                }
                messageContainer.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
            } else {
                messageContainer.innerHTML = `<div class="alert alert-success">¡Inicio de sesión exitoso! Redirigiendo...</div>`;
                
                // Guardar mensaje de éxito
                localStorage.setItem("loginSuccessMessage", "¡Sesión iniciada con éxito! Bienvenido.");
                
                // Redirigir al index 
                setTimeout(() => {
                    window.location.href = "../index.html";
                }, 1500);
            }
        });
    }
});

// --- Control Global de Sesión ---
async function checkSession() {
    if (typeof supabase === 'undefined') return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session ? session.user : null;

        // Mostrar mensaje si existe en localStorage
        const msg = localStorage.getItem("loginSuccessMessage");
        if (msg) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x m-3';
            alertDiv.style.zIndex = '9999';
            alertDiv.role = 'alert';
            alertDiv.innerHTML = `
                ${msg}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            document.body.appendChild(alertDiv);
            localStorage.removeItem("loginSuccessMessage");

            // Auto-cerrar alerta después de 3 segundos
            setTimeout(() => {
                if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
                    const bsAlert = new bootstrap.Alert(alertDiv);
                    bsAlert.close();
                } else {
                    alertDiv.remove();
                }
            }, 3000);
        }

        // Buscar los links de iniciar sesión para actualizarlos
        const loginSpans = document.querySelectorAll(".login-link");
        loginSpans.forEach(span => {
            const parentLink = span.closest('a');
            if (parentLink) {
                if (user) {
                    // Si está autenticado, cambiar a Cerrar Sesión
                    span.innerHTML = `<i class="fa fa-sign-out"></i> Cerrar Sesión`;
                    parentLink.href = "#";
                    parentLink.onclick = async (e) => {
                        e.preventDefault();
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                            console.error("Error al cerrar sesión:", error);
                        } else {
                            localStorage.setItem("loginSuccessMessage", "Sesión cerrada correctamente.");
                            const isSubpage = window.location.pathname.includes("/html's/");
                            window.location.href = isSubpage ? "../index.html" : "index.html";
                        }
                    };
                } else {
                    // Si no está autenticado, asegurar que apunte a log_in.html
                    const isSubpage = window.location.pathname.includes("/html's/");
                    parentLink.href = isSubpage ? "log_in.html" : "html's/log_in.html";
                    // Resetear el click handler
                    parentLink.onclick = null;
                }
            }
        });
    } catch (error) {
        console.error("Error al comprobar la sesión de Supabase:", error);
    }
}

// Función para cargar los viajes desde FastAPI
async function cargarViajes() {
    const viajesGrid = document.getElementById("viajes-grid");
    if (!viajesGrid) return; // Solo ejecutar si estamos en travels.html (donde existe el grid)

    try {
        // Verificar sesión activa
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
            viajesGrid.innerHTML = '<div class="col-12 text-center mt-5"><h4>Debes iniciar sesión para ver tus viajes</h4><a href="log_in.html" class="btn btns mt-3">Iniciar Sesión</a></div>';
            return;
        }

        const token = sessionData.session.access_token;
        
        // Llamada a nuestro backend de FastAPI
        const response = await fetch("http://localhost:8000/api/viajes", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error en el servidor: ${response.status}`);
        }

        const viajes = await response.json();

        // Si no hay viajes, mostrar mensaje
        if (!viajes || viajes.length === 0) {
            viajesGrid.innerHTML = '<div class="col-12 text-center mt-5"><h4>No se han realizado viajes</h4></div>';
            return;
        }

        // Si hay viajes, renderizarlos dinámicamente
        let htmlContent = "";
        viajes.forEach(viaje => {
            // Utilizamos la primera letra del destino como "imagen" provisional ya que aún no hay subidas
            const initial = viaje.Destino_Principal ? viaje.Destino_Principal.charAt(0).toUpperCase() : 'V';
            
            htmlContent += `
                <div class="col-12 col-sm-6 col-lg-3">
                    <a href="#">
                        <div class="ratio ratio-1x1 mb-4">
                            <div class="card-img-top collage-img d-flex align-items-center justify-content-center bg-dark text-white fw-bold display-1 rounded-4">
                                ${initial}
                            </div>
                        </div>
                        <h3 class="text-center fs-4">${viaje.Nombre_Viaje || 'Viaje Sin Nombre'}</h3>
                        <p class="text-center fs-6">${viaje.Destino_Principal || 'Destino Desconocido'}</p>
                    </a>
                </div>
            `;
        });
        viajesGrid.innerHTML = htmlContent;

    } catch (err) {
        console.error("Error al cargar viajes:", err);
        viajesGrid.innerHTML = '<div class="col-12 text-center mt-5 text-danger"><h4>Ocurrió un error al cargar tus viajes. ¿El backend de FastAPI está encendido?</h4></div>';
    }
}

// Función para cargar los recuerdos desde FastAPI
async function cargarRecuerdos() {
    const recuerdosGrid = document.getElementById("recuerdos-grid");
    if (!recuerdosGrid) return; // Solo ejecutar si existe el grid de recuerdos

    try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
            recuerdosGrid.innerHTML = '<div class="col-12 text-center mt-3"><h4>Debes iniciar sesión para ver tus recuerdos</h4></div>';
            return;
        }

        const token = sessionData.session.access_token;
        const response = await fetch("http://localhost:8000/api/recuerdos", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error en el servidor: ${response.status}`);
        }

        const recuerdos = await response.json();

        // En caso de que no haya recuerdos, mostrar el mensaje "No se han realizado viajes" solicitado
        if (!recuerdos || recuerdos.length === 0) {
            recuerdosGrid.innerHTML = '<div class="col-12 text-center mt-3"><h4>No se han realizado viajes</h4></div>';
            return;
        }

        let htmlContent = "";
        recuerdos.forEach(recuerdo => {
            htmlContent += `
                <div class="col-3">
                    <div class="ratio ratio-1x1 memory-card">
                        <img src="${recuerdo.Url || '../Imagenes/placeholder.jpg'}" class="img-fluid object-fit-cover rounded-3" alt="${recuerdo.Descripcion || 'Recuerdo'}">
                    </div>
                </div>
            `;
        });
        recuerdosGrid.innerHTML = htmlContent;

    } catch (err) {
        console.error("Error al cargar recuerdos:", err);
        recuerdosGrid.innerHTML = '<div class="col-12 text-center mt-3 text-danger"><h4>Ocurrió un error al cargar tus recuerdos. ¿El backend está encendido?</h4></div>';
    }
}

// Función para cargar los viajes realizados desde FastAPI
async function cargarViajesRealizados() {
    const sectionGrid = document.getElementById("viajes-realizados-section-grid"); // En travels.html
    const mainGrid = document.getElementById("viajes-realizados-grid"); // En finished_travels.html

    if (!sectionGrid && !mainGrid) return;

    try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
            const loginMsg = '<div class="col-12 text-center mt-3"><h4>Debes iniciar sesión para ver tus viajes realizados</h4></div>';
            if (sectionGrid) sectionGrid.innerHTML = loginMsg;
            if (mainGrid) mainGrid.innerHTML = loginMsg;
            return;
        }

        const token = sessionData.session.access_token;
        // Filtrar por estado 'realizado'
        const response = await fetch("http://localhost:8000/api/viajes?estado=realizado", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error en el servidor: ${response.status}`);
        }

        const viajes = await response.json();

        // En caso de que no haya viajes realizados, mostrar el mensaje "No se han realizado viajes"
        if (!viajes || viajes.length === 0) {
            const noViajesMsg = '<div class="col-12 text-center mt-3"><h4>No se han realizado viajes</h4></div>';
            if (sectionGrid) sectionGrid.innerHTML = noViajesMsg;
            if (mainGrid) mainGrid.innerHTML = noViajesMsg;
            return;
        }

        // Renderizar en la sección de travels.html
        if (sectionGrid) {
            let htmlContent = "";
            viajes.forEach(viaje => {
                const initial = viaje.Destino_Principal ? viaje.Destino_Principal.charAt(0).toUpperCase() : 'V';
                htmlContent += `
                    <div class="col-3">
                        <div class="ratio ratio-1x1 memory-card mb-2">
                            <div class="card-img-top collage-img d-flex align-items-center justify-content-center bg-dark text-white fw-bold display-1 rounded-4">
                                ${initial}
                            </div>
                        </div>
                        <p class="fw-bold text-center fs-4">${viaje.Nombre_Viaje || 'Viaje Sin Nombre'}</p>
                    </div>
                `;
            });
            sectionGrid.innerHTML = htmlContent;
        }

        // Renderizar en la página finished_travels.html
        if (mainGrid) {
            let htmlContent = "";
            viajes.forEach(viaje => {
                const initial = viaje.Destino_Principal ? viaje.Destino_Principal.charAt(0).toUpperCase() : 'V';
                const year = viaje.Fecha_Inicio ? new Date(viaje.Fecha_Inicio).getFullYear() : '2026';
                const fecha = (viaje.Fecha_Inicio && viaje.Fecha_Fin) 
                    ? `${new Date(viaje.Fecha_Inicio).toLocaleDateString()} - ${new Date(viaje.Fecha_Fin).toLocaleDateString()}`
                    : 'Fechas no definidas';

                htmlContent += `
                    <div class="col-12 col-md-6">
                        <div class="dest-card ratio-card rounded-3 overflow-hidden border">
                            <div class="img-wrapper">
                                <div class="w-100 bg-dark text-white d-flex align-items-center justify-content-center fw-bold display-3" style="height: 200px;">
                                    ${initial}
                                </div>
                                <span class="year-badge badge rounded-pill bg-warning text-dark">${year}</span>
                            </div>
                            <div class="p-3">
                                <h3 class="fw-bold fs-6 mb-2">${viaje.Nombre_Viaje || 'Viaje Sin Nombre'}</h3>
                                <div class="d-flex align-items-center gap-2 mb-2 small text-secondary">
                                    <i class="fa-regular fa-calendar"></i>
                                    <span>${fecha}</span>
                                    <span>${viaje.Duracion_Dias || 0} Días</span>
                                </div>
                                <span class="tag-pill badge rounded-pill">${viaje.Destino_Principal || 'Destino'}</span>
                                <div class="btn-ver-link d-flex justify-content-end align-items-center gap-2 mt-2 pt-2 small fw-medium">
                                    <a href="itinerario.html?id=${viaje.Id_Viaje}">Ver Detalles <i class="fa fa-arrow-right"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            mainGrid.innerHTML = htmlContent;
        }

    } catch (err) {
        console.error("Error al cargar viajes realizados:", err);
        const errMsg = '<div class="col-12 text-center mt-3 text-danger"><h4>Ocurrió un error al cargar tus viajes realizados. ¿El backend está encendido?</h4></div>';
        if (sectionGrid) sectionGrid.innerHTML = errMsg;
        if (mainGrid) mainGrid.innerHTML = errMsg;
    }
}

// Ejecutar comprobaciones al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    cargarViajes();
    cargarRecuerdos();
    cargarViajesRealizados();
});