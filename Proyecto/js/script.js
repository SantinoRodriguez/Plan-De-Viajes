// Interceptar attachShadow para poder dar estilo al input de gmp-place-autocomplete (Shadow DOM cerrado)
const nativeAttachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function (init) {
    const isAutocomplete = this.localName === "gmp-place-autocomplete";
    const shadow = nativeAttachShadow.call(this, {
        ...init,
        mode: isAutocomplete ? "open" : init.mode
    });
    if (isAutocomplete) {
        const style = document.createElement("style");
        style.textContent = `
            input {
                color: #2b221a !important; /* Color de letra oscuro y legible para la búsqueda */
                font-family: inherit;
            }
            input::placeholder {
                color: #8c8276 !important; /* Color del placeholder */
            }
        `;
        shadow.appendChild(style);
    }
    return shadow;
};

// Función global para corregir imágenes rotas o vacías utilizando Google Places
window.fixPlaceImage = async function(imgElement, placeId) {
    if (!placeId) {
        imgElement.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400';
        return;
    }
    // Prevenir bucle infinito en caso de fallos repetidos
    imgElement.onerror = null;
    
    try {
        if (typeof google === 'undefined' || !google.maps) {
            await new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (typeof google !== 'undefined' && google.maps) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });
        }
        
        const { Place } = await google.maps.importLibrary("places");
        const place = new Place({ id: placeId });
        await place.fetchFields({ fields: ["photos"] });
        
        if (place.photos && place.photos.length > 0) {
            const freshUrl = place.photos[0].getURI({ maxWidth: 400, maxHeight: 400 });
            imgElement.src = freshUrl;
            
            // Actualizar en el estado de actividades si es posible
            if (window.activeActivities) {
                window.activeActivities.forEach(act => {
                    if (act.place_id === placeId) {
                        act.foto_url = freshUrl;
                    }
                });
            }
        } else {
            imgElement.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400';
        }
    } catch (e) {
        console.error("Error al corregir imagen con Google Places:", e);
        imgElement.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400';
    }
};

// Función global para cargar una imagen dinámica de un destino (búsqueda de texto)
window.loadDestinationImage = async function(viajeId, destino, imgId = null, spinnerId = null) {
    const targetImgId = imgId || `viaje-img-${viajeId}`;
    const targetSpinnerId = spinnerId || `viaje-spinner-${viajeId}`;
    
    const img = document.getElementById(targetImgId);
    const spinner = document.getElementById(targetSpinnerId);
    if (!img) return;
    
    try {
        if (typeof google === 'undefined' || !google.maps) {
            await new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (typeof google !== 'undefined' && google.maps) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });
        }
        
        const { Place } = await google.maps.importLibrary("places");
        const { places } = await Place.searchByText({
            textQuery: destino,
            fields: ["photos"],
            maxResultCount: 1
        });
        
        if (places && places.length > 0 && places[0].photos && places[0].photos.length > 0) {
            const url = places[0].photos[0].getURI({ maxWidth: 600, maxHeight: 600 });
            img.src = url;
        } else {
            img.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400";
        }
    } catch (e) {
        console.error(`Error al cargar imagen del destino ${destino}:`, e);
        img.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400";
    } finally {
        if (spinner) spinner.style.display = 'none';
    }
};

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
window.initMap = async function () {
    // Import required libraries dynamically
    let Map, AdvancedMarkerElement, PlaceAutocompleteElement;
    try {
        const mapsLib = await google.maps.importLibrary("maps");
        Map = mapsLib.Map;
        const markerLib = await google.maps.importLibrary("marker");
        AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
        const placesLib = await google.maps.importLibrary("places");
        PlaceAutocompleteElement = placesLib.PlaceAutocompleteElement;
    } catch (e) {
        console.error("No se pudo cargar la API de Google Maps", e);
        return;
    }

    const defaultCenter = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires
    const mapOptions = {
        center: defaultCenter,
        zoom: 12,
        mapId: "DEMO_MAP_ID" // Obligatorio para AdvancedMarkerElement
    };

    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    const map = new Map(mapElement, mapOptions);
    window.mainMap = map;

    // Marcador interactivo inicial en Buenos Aires usando el componente moderno
    let marker = new AdvancedMarkerElement({
        position: defaultCenter,
        map: map,
        title: "Buenos Aires (Arrastrame para seleccionar)",
        gmpDraggable: true // Propiedad moderna para arrastrar
    });

    // Mover el marcador haciendo clic en cualquier parte del mapa
    map.addListener("click", (event) => {
        marker.position = event.latLng;
        console.log("Coordenadas seleccionadas:", event.latLng.lat(), event.latLng.lng());
    });

    // Log de coordenadas al terminar de arrastrar el marcador
    marker.addListener("dragend", () => {
        const position = marker.position;
        // Dependiendo de si es un LatLng o LatLngAltitude, lat/lng pueden ser propiedades o funciones
        const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
        const lng = typeof position.lng === 'function' ? position.lng() : position.lng;
        console.log("Coordenadas arrastradas:", lat, lng);
    });

    // --- INTEGRACIÓN DE GOOGLE PLACES API ---
    const inputLugares = document.getElementById("buscar-lugares");
    const inputDestinos = document.getElementById("buscar-destinos");

    // Función auxiliar para configurar el nuevo componente web de Autocomplete
    function setupPlaceAutocomplete(inputElement) {
        if (!inputElement) return null;

        const autocomplete = new PlaceAutocompleteElement();
        autocomplete.id = inputElement.id || '';
        autocomplete.className = inputElement.className;
        autocomplete.setAttribute("placeholder", inputElement.placeholder || "Buscar...");
        if (inputElement.dataset.diaNumero) {
            autocomplete.dataset.diaNumero = inputElement.dataset.diaNumero;
        }
        
        // Reemplazar el input clásico por el web component moderno
        inputElement.parentNode.replaceChild(autocomplete, inputElement);

        const handleSelection = async (event) => {
            let place = event.place;
            if (!place && event.placePrediction && typeof event.placePrediction.toPlace === 'function') {
                place = event.placePrediction.toPlace();
            }
            if (!place) return;

            // Solicitar los campos necesarios para la vista previa
            await place.fetchFields({ fields: ['id', 'location', 'photos', 'formattedAddress', 'displayName', 'rating'] });
            
            autocomplete.selectedPlace = place;

            if (!place.location) {
                console.log("No hay detalles disponibles para: '" + place.displayName + "'");
                return;
            }

            // Mostrar vista previa solo para los buscadores principales (no para itinerario)
            if (autocomplete.id === "buscar-lugares" || autocomplete.id === "buscar-destinos") {
                // Centrar mapa y mover marcador
                if (map) {
                    map.setCenter(place.location);
                    map.setZoom(15);
                    if (marker) marker.position = place.location;
                }

                // Extraer fotos
                let photoUrls = [];
                if (place.photos && place.photos.length > 0) {
                    photoUrls = place.photos.map(p => p.getURI({ maxWidth: 600, maxHeight: 600 }));
                }

                // Adaptar las propiedades para la función heredada mostrarVistaPreviaLugar
                const legacyPlaceAdapter = {
                    name: place.displayName,
                    formatted_address: place.formattedAddress,
                    place_id: place.id,
                    geometry: {
                        location: {
                            lat: () => typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat,
                            lng: () => typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng
                        }
                    }
                };

                mostrarVistaPreviaLugar(legacyPlaceAdapter, photoUrls);
            }
        };

        autocomplete.addEventListener('gmp-placeselect', handleSelection);
        autocomplete.addEventListener('gmp-select', handleSelection);
        
        return autocomplete;
    }

    const acLugares = setupPlaceAutocomplete(inputLugares);
    const acDestinos = setupPlaceAutocomplete(inputDestinos);
    
    window.activeActivities = [];

    // --- FUNCIONES DE RENDERING Y ESTADO LOCAL PARA MAKE_TRAVEL ---

    window.renderLugares = function() {
        const listContainer = document.getElementById("lugares-list");
        if (!listContainer) return;
        
        const places = window.activeActivities.filter(act => act.dia_numero === 0);
        listContainer.innerHTML = "";
        
        if (places.length === 0) {
            listContainer.innerHTML = `<p class="text-muted small text-center my-3"><i class="fa-solid fa-map-pin me-1"></i> No hay lugares añadidos aún. ¡Busca y añade uno abajo!</p>`;
            window.updateAllItinerarySelects();
            return;
        }
        
        places.forEach((place, index) => {
            const fotoSrc = place.foto_url || (place.place_id ? 'invalid-image' : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400');
            const itemHtml = `
                <div class="list-item-row bg-white shadow-sm mt-2 position-relative">
                    <a href="info.html?place_id=${place.place_id}&name=${encodeURIComponent(place.nombre)}" class="text-decoration-none text-dark d-flex align-items-center w-100">
                        <img src="${fotoSrc}" 
                             alt="${place.nombre}" 
                             class="item-img" 
                             onerror="if(window.fixPlaceImage) window.fixPlaceImage(this, '${place.place_id}')">
                        <div class="item-content d-flex flex-column justify-content-center ms-2">
                            <span class="fw-bold">${place.nombre}</span>
                            <span class="text-muted"><i class="fa fa-star text-warning"></i> ${place.rating || 'N/A'}</span>
                        </div>
                    </a>
                    <button class="btn btn-sm btn-outline-danger border-0 position-absolute end-0 top-50 translate-middle-y me-2" onclick="window.removeActivity(${index}, 'lugares')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', itemHtml);
        });
        
        window.updateAllItinerarySelects();
    };

    window.renderItinerario = function() {
        const container = document.getElementById("itinerario-dias-container");
        if (!container) return;
        
        const inputInicio = document.getElementById("viaje-fecha-inicio");
        const inputFin = document.getElementById("viaje-fecha-fin");
        const dateRangeBadge = document.getElementById("itinerario-fechas-rango");
        
        container.innerHTML = "";
        
        if (!inputInicio.value || !inputFin.value) {
            container.innerHTML = `<p class="text-muted small text-center my-3"><i class="fa-solid fa-calendar-day me-1"></i> Define las fechas del viaje para planificar tu itinerario diario.</p>`;
            if (dateRangeBadge) dateRangeBadge.innerHTML = `<i class="fa fa-calendar-alt me-1"></i> Fechas por definir`;
            return;
        }
        
        const date1 = new Date(inputInicio.value + "T00:00:00");
        const date2 = new Date(inputFin.value + "T00:00:00");
        
        if (isNaN(date1) || isNaN(date2) || date1 > date2) {
            container.innerHTML = `<p class="text-muted small text-center my-3"><i class="fa-solid fa-triangle-exclamation me-1"></i> Fechas inválidas.</p>`;
            return;
        }
        
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        if (dateRangeBadge) {
            dateRangeBadge.innerHTML = `<i class="fa fa-calendar-alt me-1"></i> ${date1.getDate()}/${date1.getMonth()+1} - ${date2.getDate()}/${date2.getMonth()+1}`;
        }
        
        const weekdayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        
        if (typeof window.itinerarioDaysSelected === 'undefined') {
            window.itinerarioDaysSelected = [];
            // Inicializar con los días que tengan actividades
            window.activeActivities.forEach(act => {
                if (act.tipo === "itinerario" && !window.itinerarioDaysSelected.includes(act.dia_numero)) {
                    window.itinerarioDaysSelected.push(act.dia_numero);
                }
            });
            window.itinerarioDaysSelected.sort((a,b) => a - b);
        }
        
        // Trim (borrar) días extras que excedan diffDays y sus actividades
        window.itinerarioDaysSelected = window.itinerarioDaysSelected.filter(d => {
            if (d > diffDays) {
                // Borrar permanentemente las actividades de ese día (fuera de rango)
                window.activeActivities = window.activeActivities.filter(act => !(act.tipo === "itinerario" && act.dia_numero === d));
                return false;
            }
            return true;
        });

        for (const d of window.itinerarioDaysSelected) {
            const currentDate = new Date(date1.getTime());
            currentDate.setDate(date1.getDate() + (d - 1));
            
            const dayLabel = `${weekdayNames[currentDate.getDay()]} ${currentDate.getDate()} de ${monthNames[currentDate.getMonth()]}`;
            const dayActivities = window.activeActivities.filter(act => act.dia_numero === d);
            
            let activitiesHtml = "";
            dayActivities.forEach((act, actIdx) => {
                const fotoSrc = act.foto_url || (act.place_id ? 'invalid-image' : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400');
                activitiesHtml += `
                    <div class="list-item-row bg-white shadow-sm mt-2 position-relative">
                        <div class="timeline-dot"></div>
                        <img src="${fotoSrc}" 
                             alt="${act.nombre}" 
                             class="item-img" 
                             onerror="if(window.fixPlaceImage) window.fixPlaceImage(this, '${act.place_id}')">
                        <div class="item-content d-flex flex-column justify-content-center ms-2">
                            <span class="fw-bold">${act.nombre}</span>
                            <span class="text-muted"><i class="far fa-clock me-1"></i> ${act.horario || 'Por definir'}</span>
                        </div>
                        <button class="btn btn-sm btn-outline-danger border-0 position-absolute end-0 top-50 translate-middle-y me-2" onclick="window.removeDayActivity(${d}, ${actIdx})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
            });
            
            const dayHtml = `
                <div class="mb-4 pt-2 border-top">
                    <div class="day-row-header d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold text-dark"><i class="fa fa-chevron-down me-2"></i> Día ${d} - ${dayLabel}</span>
                    </div>
                    
                    <div id="day-activities-list-${d}">
                        ${activitiesHtml}
                    </div>
                    
                    <div class="add-btn-row mt-3 p-2 bg-light rounded-3 border">
                        <div class="row g-2">
                            <div class="col-12">
                                <label class="form-label fw-bold mb-1 text-secondary text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.5px;">Seleccionar lugar guardado (opcional):</label>
                                <select class="form-select form-select-sm select-saved-place border-dark rounded-3 shadow-none" id="select-saved-place-${d}">
                                    <option value="">-- Seleccionar lugar guardado --</option>
                                </select>
                            </div>
                            <div class="col-12 mt-2">
                                <label class="form-label fw-bold mb-1 text-secondary text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.5px;">O buscar nuevo lugar:</label>
                                <input type="text" class="add-input shadow-sm input-itinerario w-100 rounded-3 border p-1" id="input-itinerario-search-${d}" data-dia-numero="${d}" placeholder="Buscar nuevo lugar...">
                            </div>
                            <div class="col-7 mt-2 d-flex align-items-center">
                                <i class="fa fa-clock text-muted me-2"></i>
                                <input type="text" class="form-control form-control-sm border-dark rounded-3 shadow-none" id="input-itinerario-time-${d}" placeholder="Horario (ej: 10:00 - 12:00)">
                            </div>
                            <div class="col-5 mt-2 d-flex justify-content-end align-items-center">
                                <button class="btn btn-sm btn-dark fw-bold w-100 rounded-3" onclick="window.addActivityToDay(${d})">
                                    <i class="fa fa-plus me-1"></i> Añadir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', dayHtml);
            
            const newSearchInput = document.getElementById(`input-itinerario-search-${d}`);
            if (newSearchInput) {
                setupPlaceAutocomplete(newSearchInput);
            }
        }
        
        if (window.itinerarioDaysSelected.length < diffDays) {
            let optionsHtml = '<option value="">-- Elegir fecha para planificar --</option>';
            for(let i = 1; i <= diffDays; i++) {
                if (!window.itinerarioDaysSelected.includes(i)) {
                    const tempDate = new Date(date1.getTime());
                    tempDate.setDate(date1.getDate() + (i - 1));
                    optionsHtml += `<option value="${i}">Día ${i} - ${weekdayNames[tempDate.getDay()]} ${tempDate.getDate()} de ${monthNames[tempDate.getMonth()]}</option>`;
                }
            }
            
            container.insertAdjacentHTML('beforeend', `
                <div class="mt-4 p-3 bg-light rounded-3 border text-center shadow-sm">
                    <h6 class="fw-bold mb-3 text-dark">Añadir día específico al itinerario</h6>
                    <div class="input-group input-group-sm mb-2" style="max-width: 400px; margin: 0 auto;">
                        <select class="form-select border-dark shadow-none" id="select-new-itinerary-day">
                            ${optionsHtml}
                        </select>
                        <button class="btn btn-dark fw-bold px-3" onclick="window.addSpecificItineraryDay()">
                            <i class="fa fa-plus"></i> Añadir
                        </button>
                    </div>
                    <p class="text-muted small mb-0 mt-2">Días restantes disponibles: <span class="fw-bold">${diffDays - window.itinerarioDaysSelected.length}</span></p>
                </div>
            `);
        }
        
        window.updateAllItinerarySelects();
    };

    window.updateAllItinerarySelects = function() {
        const selects = document.querySelectorAll(".select-saved-place");
        const places = window.activeActivities.filter(act => act.dia_numero === 0);
        
        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = `<option value="">-- Seleccionar lugar guardado --</option>`;
            
            places.forEach((place, index) => {
                select.innerHTML += `<option value="${index}">${place.nombre}</option>`;
            });
            
            if (currentValue && parseInt(currentValue) < places.length) {
                select.value = currentValue;
            }
        });
    };

    window.addActivityToDay = function(d) {
        const selectSaved = document.getElementById(`select-saved-place-${d}`);
        const searchInput = document.getElementById(`input-itinerario-search-${d}`);
        const timeInput = document.getElementById(`input-itinerario-time-${d}`);
        
        let nombre = "";
        let place_id = "";
        let foto_url = "";
        let rating = 0;
        let horario = timeInput ? timeInput.value : "";
        
        if (selectSaved && selectSaved.value) {
            const savedIdx = parseInt(selectSaved.value);
            const places = window.activeActivities.filter(act => act.dia_numero === 0);
            const selectedPlace = places[savedIdx];
            
            if (selectedPlace) {
                nombre = selectedPlace.nombre;
                place_id = selectedPlace.place_id;
                foto_url = selectedPlace.foto_url;
                rating = selectedPlace.rating;
            }
        } else if (searchInput && searchInput.selectedPlace) {
            const place = searchInput.selectedPlace;
            nombre = place.displayName || place.name;
            place_id = place.id || place.place_id;
            rating = place.rating || 0;
            
            if (place.photos && place.photos.length > 0) {
                foto_url = place.photos[0].getURI({ maxWidth: 400, maxHeight: 400 });
            }
        } else if (searchInput) {
            let val = searchInput.inputValue;
            if (!val && searchInput.shadowRoot) {
                const innerInput = searchInput.shadowRoot.querySelector('input');
                if (innerInput) val = innerInput.value;
            }
            if (!val) val = searchInput.value;
            
            if (val && val.trim() !== "") {
                nombre = val.trim();
            } else {
                alert("Por favor selecciona un lugar guardado, busca un lugar o escribe una actividad.");
                return;
            }
        } else {
            alert("Por favor selecciona un lugar guardado, busca un lugar o escribe una actividad.");
            return;
        }
        
        window.activeActivities.push({
            tipo: "itinerario",
            dia_numero: d,
            nombre: nombre,
            place_id: place_id,
            foto_url: foto_url,
            rating: rating,
            horario: horario
        });

        // Duplicar automáticamente en lugares a visitar (dia_numero === 0) si no existe ya
        const alreadyExists = window.activeActivities.some(act => 
            act.dia_numero === 0 && 
            (place_id ? act.place_id === place_id : act.nombre.toLowerCase() === nombre.toLowerCase())
        );
        
        if (!alreadyExists) {
            window.activeActivities.push({
                tipo: "lugares",
                dia_numero: 0,
                nombre: nombre,
                place_id: place_id,
                foto_url: foto_url,
                rating: rating
            });
            window.renderLugares();
        }
        
        // Limpiar inputs
        if (selectSaved) selectSaved.value = "";
        if (searchInput) {
            searchInput.inputValue = "";
            if (searchInput.shadowRoot) {
                const innerInput = searchInput.shadowRoot.querySelector('input');
                if (innerInput) innerInput.value = "";
            }
            searchInput.selectedPlace = null;
        }
        if (timeInput) timeInput.value = "";
        
        window.renderItinerario();
    };

    window.addSpecificItineraryDay = function() {
        const select = document.getElementById("select-new-itinerary-day");
        if (!select || !select.value) return;
        
        const selectedDay = parseInt(select.value);
        if (selectedDay && !window.itinerarioDaysSelected.includes(selectedDay)) {
            window.itinerarioDaysSelected.push(selectedDay);
            window.itinerarioDaysSelected.sort((a,b) => a - b);
            window.renderItinerario();
            
            // Hacer scroll suave al contenedor del nuevo día
            setTimeout(() => {
                const container = document.getElementById("itinerario-dias-container");
                if (container) {
                    const addedRow = container.querySelector(`#day-activities-list-${selectedDay}`);
                    if (addedRow && addedRow.parentElement) {
                        addedRow.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 50);
        }
    };

    window.removeActivity = function(index, tipo) {
        if (tipo === 'lugares') {
            const places = window.activeActivities.filter(act => act.dia_numero === 0);
            const placeToRemove = places[index];
            const globalIndex = window.activeActivities.indexOf(placeToRemove);
            if (globalIndex > -1) {
                window.activeActivities.splice(globalIndex, 1);
            }
            window.renderLugares();
        }
    };

    window.removeDayActivity = function(dia, actIdx) {
        const dayActs = window.activeActivities.filter(act => act.dia_numero === dia);
        const actToRemove = dayActs[actIdx];
        const globalIndex = window.activeActivities.indexOf(actToRemove);
        if (globalIndex > -1) {
            window.activeActivities.splice(globalIndex, 1);
        }
        window.renderItinerario();
    };

    const btnAddLugar = document.getElementById("btn-add-lugar");
    if (btnAddLugar && acLugares) {
        btnAddLugar.addEventListener("click", () => {
            const place = acLugares.selectedPlace;
            if (!place) {
                alert("Por favor busca y selecciona un lugar primero.");
                return;
            }
            
            let photoUrl = "";
            if (place.photos && place.photos.length > 0) {
                photoUrl = place.photos[0].getURI({ maxWidth: 400, maxHeight: 400 });
            }
            
            window.activeActivities.push({
                tipo: "lugares",
                dia_numero: 0,
                nombre: place.displayName || place.name,
                place_id: place.id || place.place_id,
                foto_url: photoUrl,
                rating: place.rating || 0,
                horario: ""
            });
            
            acLugares.inputValue = '';
            acLugares.selectedPlace = null;
            
            const prev = document.getElementById("places-preview-card");
            if (prev) prev.remove();
            
            window.renderLugares();
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
            const mainPhoto = photoUrls.length > 0 ? photoUrls[0] : "";
            
            window.activeActivities.push({
                tipo: "lugares",
                dia_numero: 0,
                nombre: place.name,
                place_id: place.place_id,
                foto_url: mainPhoto,
                rating: place.rating || 0,
                horario: ""
            });
            
            previewCard.remove();
            
            // Limpiar input si es necesario
            const placesInput = document.getElementById("buscar-lugares");
            if (placesInput) {
                placesInput.inputValue = "";
                if (placesInput.shadowRoot) {
                    const innerInput = placesInput.shadowRoot.querySelector('input');
                    if (innerInput) innerInput.value = "";
                }
                placesInput.selectedPlace = null;
            }
            
            window.renderLugares();
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
            
            const destInput = document.getElementById("buscar-destinos");
            if (destInput) {
                destInput.inputValue = "";
                if (destInput.shadowRoot) {
                    const innerInput = destInput.shadowRoot.querySelector('input');
                    if (innerInput) innerInput.value = "";
                }
                destInput.selectedPlace = null;
            }
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
window.initInfoPage = async function () {
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

    // Load libraries
    let Map, PlacesService, AdvancedMarkerElement;
    try {
        const mapsLib = await google.maps.importLibrary("maps");
        Map = mapsLib.Map;
        const placesLib = await google.maps.importLibrary("places");
        PlacesService = placesLib.PlacesService;
        const markerLib = await google.maps.importLibrary("marker");
        AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
    } catch (e) {
        console.error("Failed to load Google Maps API for info page", e);
        return;
    }

    // Initialize Map for info-map
    const mapElement = document.getElementById("info-map");
    let map = null;
    if (mapElement) {
        map = new Map(mapElement, {
            center: { lat: 0, lng: 0 },
            zoom: 15,
            mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
            mapTypeControl: false,
            streetViewControl: false
        });
    }

    // Initialize PlacesService
    // We can pass the map or a dummy div
    const service = new PlacesService(map || document.createElement('div'));

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
                new AdvancedMarkerElement({
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

        // Determinar si nos encontramos dentro de una subcarpeta (html's)
        const isSubpage = window.location.pathname.includes("html's");

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
                            window.location.href = isSubpage ? "../index.html" : "index.html";
                        }
                    };
                } else {
                    // Si no está autenticado, asegurar que apunte a log_in.html
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

// Función para verificar si el servidor de FastAPI está corriendo y actualizar el badge
async function verificarServidorFastAPI() {
    const statusBadge = document.getElementById("backend-status");
    if (!statusBadge) return false;

    try {
        const response = await fetch("http://localhost:8000/api/health", { method: "GET" });
        if (response.ok) {
            statusBadge.textContent = "Servidor Online";
            statusBadge.className = "badge rounded-pill bg-success align-self-start align-self-sm-center";
            return true;
        }
    } catch (e) {
        // Ignorar error de red
    }

    statusBadge.textContent = "Servidor Offline";
    statusBadge.className = "badge rounded-pill bg-danger align-self-start align-self-sm-center";
    return false;
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

        // Si la cuenta no tiene nada para mostrar, decir "Debes subir contenido para poder verlo"
        if (!viajes || viajes.length === 0) {
            viajesGrid.innerHTML = '<div class="col-12 text-center mt-5"><h4>Debes subir contenido para poder verlo</h4></div>';
            return;
        }

        // Si hay viajes, renderizarlos dinámicamente
        let htmlContent = "";
        viajes.forEach(viaje => {
            const lugaresCount = viaje.cantidad_lugares || 0;
            const lugaresTxt = lugaresCount === 1 ? 'lugar' : 'lugares';
            const initial = viaje.destino_principal ? viaje.destino_principal.charAt(0).toUpperCase() : 'V';
            
            let imageHtml = "";
            if (viaje.imagen_url) {
                imageHtml = `<img src="${viaje.imagen_url}" class="w-100 h-100 object-fit-cover rounded-4" alt="${viaje.nombre_viaje}">`;
            } else {
                imageHtml = `
                    <div class="card-img-top collage-img d-flex align-items-center justify-content-center bg-dark text-white fw-bold display-1 rounded-4 w-100 h-100">
                        ${initial}
                    </div>
                `;
            }

            htmlContent += `
                <div class="col-12 col-sm-6 col-lg-3">
                    <a href="make_travel.html?id_viaje=${viaje.id_viaje}" class="text-decoration-none text-dark">
                        <div class="ratio ratio-1x1 mb-4">
                            ${imageHtml}
                        </div>
                        <h3 class="text-center fs-4 mb-1">${viaje.nombre_viaje || 'Viaje Sin Nombre'}</h3>
                        <p class="text-center fs-6 text-muted">${lugaresCount} ${lugaresTxt} a visitar</p>
                    </a>
                </div>
            `;
        });
        viajesGrid.innerHTML = htmlContent;

    } catch (err) {
        console.error("Error al cargar viajes:", err);
        const isOnline = await verificarServidorFastAPI();
        if (!isOnline) {
            viajesGrid.innerHTML = '<div class="col-12 text-center mt-5 text-danger"><h4>El servidor de FastAPI no se está ejecutando</h4><p>Asegúrate de iniciar el backend usando <code>uvicorn main:app --reload</code>.</p></div>';
        } else {
            viajesGrid.innerHTML = '<div class="col-12 text-center mt-5 text-danger"><h4>Ocurrió un error al cargar tus viajes.</h4></div>';
        }
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

        // Si la cuenta no tiene nada para mostrar, decir "Debes subir contenido para poder verlo"
        if (!recuerdos || recuerdos.length === 0) {
            recuerdosGrid.innerHTML = '<div class="col-12 text-center mt-3"><h4>Debes subir contenido para poder verlo</h4></div>';
            return;
        }

        let htmlContent = "";
        recuerdos.forEach(recuerdo => {
            htmlContent += `
                <div class="col-3">
                    <div class="ratio ratio-1x1 memory-card">
                        <img src="${recuerdo.Url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'}" class="img-fluid object-fit-cover rounded-3" alt="${recuerdo.Descripcion || 'Recuerdo'}">
                    </div>
                </div>
            `;
        });
        recuerdosGrid.innerHTML = htmlContent;

    } catch (err) {
        console.error("Error al cargar recuerdos:", err);
        const isOnline = await verificarServidorFastAPI();
        if (!isOnline) {
            recuerdosGrid.innerHTML = '<div class="col-12 text-center mt-3 text-danger"><h4>El servidor de FastAPI no se está ejecutando</h4></div>';
        } else {
            recuerdosGrid.innerHTML = '<div class="col-12 text-center mt-3 text-danger"><h4>Ocurrió un error al cargar tus recuerdos.</h4></div>';
        }
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

        // Si la cuenta no tiene nada para mostrar, decir "Debes subir contenido para poder verlo"
        if (!viajes || viajes.length === 0) {
            const noViajesMsg = '<div class="col-12 text-center mt-3"><h4>Debes subir contenido para poder verlo</h4></div>';
            if (sectionGrid) sectionGrid.innerHTML = noViajesMsg;
            if (mainGrid) mainGrid.innerHTML = noViajesMsg;
            return;
        }

        // Renderizar en la sección de travels.html
        if (sectionGrid) {
            let htmlContent = "";
            viajes.forEach(viaje => {
                const initial = viaje.destino_principal ? viaje.destino_principal.charAt(0).toUpperCase() : 'V';
                let imageHtml = "";
                if (viaje.imagen_url) {
                    imageHtml = `<img src="${viaje.imagen_url}" class="w-100 h-100 object-fit-cover rounded-4" alt="${viaje.nombre_viaje}">`;
                } else {
                    imageHtml = `
                        <div class="card-img-top collage-img d-flex align-items-center justify-content-center bg-dark text-white fw-bold display-1 rounded-4 w-100 h-100">
                            ${initial}
                        </div>
                    `;
                }
                
                htmlContent += `
                    <div class="col-3">
                        <div class="ratio ratio-1x1 memory-card mb-2">
                            ${imageHtml}
                        </div>
                        <p class="fw-bold text-center fs-4 mb-1">${viaje.nombre_viaje || 'Viaje Sin Nombre'}</p>
                    </div>
                `;
            });
            sectionGrid.innerHTML = htmlContent;
        }

        // Renderizar en la página finished_travels.html
        if (mainGrid) {
            let htmlContent = "";
            viajes.forEach(viaje => {
                const initial = viaje.destino_principal ? viaje.destino_principal.charAt(0).toUpperCase() : 'V';
                const year = viaje.fecha_inicio ? new Date(viaje.fecha_inicio).getFullYear() : '2026';
                const fecha = (viaje.fecha_inicio && viaje.fecha_fin) 
                    ? `${new Date(viaje.fecha_inicio).toLocaleDateString()} - ${new Date(viaje.fecha_fin).toLocaleDateString()}`
                    : 'Fechas no definidas';

                let imageHtml = "";
                if (viaje.imagen_url) {
                    imageHtml = `<img src="${viaje.imagen_url}" class="w-100 h-100 object-fit-cover rounded-3" alt="${viaje.nombre_viaje}">`;
                } else {
                    imageHtml = `
                        <div class="w-100 bg-dark text-white d-flex align-items-center justify-content-center fw-bold display-3 rounded-3" style="height: 200px;">
                            ${initial}
                        </div>
                    `;
                }

                htmlContent += `
                    <div class="col-12 col-md-6">
                        <div class="dest-card ratio-card rounded-3 overflow-hidden border">
                            <div class="img-wrapper position-relative" style="height: 200px;">
                                ${imageHtml}
                                <span class="year-badge badge rounded-pill bg-warning text-dark">${year}</span>
                            </div>
                            <div class="p-3">
                                <h3 class="fw-bold fs-6 mb-2">${viaje.nombre_viaje || 'Viaje Sin Nombre'}</h3>
                                <div class="d-flex align-items-center gap-2 mb-2 small text-secondary">
                                    <i class="fa-regular fa-calendar"></i>
                                    <span>${fecha}</span>
                                    <span>${viaje.duracion_dias || 0} Días</span>
                                </div>
                                <span class="tag-pill badge rounded-pill">${viaje.destino_principal || 'Destino'}</span>
                                <div class="btn-ver-link d-flex justify-content-end align-items-center gap-2 mt-2 pt-2 small fw-medium">
                                    <a href="itinerario.html?id=${viaje.id_viaje}">Ver Detalles <i class="fa fa-arrow-right"></i></a>
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
        const isOnline = await verificarServidorFastAPI();
        const errMsg = !isOnline 
            ? '<div class="col-12 text-center mt-3 text-danger"><h4>El servidor de FastAPI no se está ejecutando</h4></div>'
            : '<div class="col-12 text-center mt-3 text-danger"><h4>Ocurrió un error al cargar tus viajes realizados.</h4></div>';
        if (sectionGrid) sectionGrid.innerHTML = errMsg;
        if (mainGrid) mainGrid.innerHTML = errMsg;
    }
}

window.renderPresupuesto = function() {
    const display = document.getElementById("budget-amount-display");
    if (!display) return;
    const amount = window.viajePresupuesto || 0;
    const currency = window.viajeMoneda || "ARS";
    const formatted = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    display.textContent = `${formatted} ${currency}`;

    const modalDisplay = document.querySelector("#budgetModal .modal-budget-box h3");
    if (modalDisplay) {
        modalDisplay.textContent = `${formatted} ${currency}`;
    }
};

// Inicializar make_travel.html de forma dinámica
async function initMakeTravel() {
    const isMakeTravelPage = window.location.pathname.includes('make_travel.html');
    if (!isMakeTravelPage) return;

    const urlParams = new URLSearchParams(window.location.search);
    const idViaje = urlParams.get('id_viaje');

    const btnGuardar = document.getElementById("btn-guardar-viaje");
    const inputNombre = document.getElementById("viaje-nombre");
    const inputDestino = document.getElementById("viaje-destino");
    const inputInicio = document.getElementById("viaje-fecha-inicio");
    const inputFin = document.getElementById("viaje-fecha-fin");
    const inputViajeros = document.getElementById("viaje-viajeros");

    window.viajePresupuesto = 0;
    window.viajeMoneda = "ARS";
    window.viajeImagenUrl = "";
    window.activeActivities = [];

    if (idViaje) {
        // Cargar viaje existente
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData && sessionData.session) {
                const token = sessionData.session.access_token;
                
                // 1. Cargar metadatos del viaje
                const response = await fetch(`http://localhost:8000/api/viajes/${idViaje}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (response.ok) {
                    const viaje = await response.json();
                    inputNombre.value = viaje.nombre_viaje || "";
                    inputDestino.value = viaje.destino_principal || "";
                    if (viaje.fecha_inicio) inputInicio.value = viaje.fecha_inicio.split('T')[0];
                    if (viaje.fecha_fin) inputFin.value = viaje.fecha_fin.split('T')[0];
                    
                    window.viajePresupuesto = viaje.presupuesto || 0;
                    window.viajeMoneda = viaje.moneda || "ARS";
                    window.renderPresupuesto();

                    window.viajeImagenUrl = viaje.imagen_url || "";
                    const headerImg = document.querySelector(".trip-header-img");
                    if (headerImg && window.viajeImagenUrl) {
                        headerImg.src = window.viajeImagenUrl;
                    }
                }

                // 2. Cargar actividades guardadas
                const responseActs = await fetch(`http://localhost:8000/api/viajes/${idViaje}/actividades`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (responseActs.ok) {
                    window.activeActivities = await responseActs.json();
                }
            }
        } catch (error) {
            console.error("Error al cargar el viaje y sus actividades:", error);
        }
    } else {
        // Dejar por defecto para nuevo
        inputNombre.value = "Nuevo Viaje";
        inputDestino.value = "";
        inputInicio.value = "";
        inputFin.value = "";
        inputViajeros.value = 1;
    }

    // Dibujar datos iniciales
    window.renderLugares();
    window.renderItinerario();
    
    // Inicializar sección Explora (SPA)
    window.initExplora(inputDestino.value, window.viajeImagenUrl);
    window.setupExploraEvents();

    // Eventos para recalcular el itinerario si las fechas cambian
    if (inputInicio) {
        inputInicio.addEventListener("change", () => window.renderItinerario());
    }
    if (inputFin) {
        inputFin.addEventListener("change", () => window.renderItinerario());
    }

    // Eventos para el modal del presupuesto
    const budgetModal = document.getElementById("budgetModal");
    const inputBudgetAmount = document.getElementById("budget-amount-input");
    const selectBudgetCurrency = document.getElementById("budget-currency-select");
    const btnSaveBudget = document.getElementById("btn-save-budget");

    if (budgetModal) {
        budgetModal.addEventListener("show.bs.modal", () => {
            if (inputBudgetAmount) inputBudgetAmount.value = window.viajePresupuesto || "";
            if (selectBudgetCurrency) selectBudgetCurrency.value = window.viajeMoneda || "ARS";
        });
    }

    if (btnSaveBudget) {
        btnSaveBudget.addEventListener("click", async () => {
            if (inputBudgetAmount && selectBudgetCurrency) {
                const amount = parseFloat(inputBudgetAmount.value);
                window.viajePresupuesto = isNaN(amount) ? 0 : amount;
                window.viajeMoneda = selectBudgetCurrency.value || "ARS";
                window.renderPresupuesto();
                
                // Guardado automático del viaje al definir presupuesto
                try {
                    if (window.guardarViajeCompleto) {
                        await window.guardarViajeCompleto();
                    }
                } catch (err) {
                    console.error("Error al auto-guardar presupuesto:", err);
                }
            }
        });
    }

    // Eventos para el modal de la imagen de portada
    const imageModal = document.getElementById("imageModal");
    const inputTravelImage = document.getElementById("travel-image-input");
    const btnSaveImage = document.getElementById("btn-save-image");

    if (imageModal) {
        imageModal.addEventListener("show.bs.modal", () => {
            if (inputTravelImage) inputTravelImage.value = window.viajeImagenUrl || "";
        });
    }

    if (btnSaveImage) {
        btnSaveImage.addEventListener("click", async () => {
            if (inputTravelImage) {
                const url = inputTravelImage.value.trim();
                window.viajeImagenUrl = url;
                
                const headerImg = document.querySelector(".trip-header-img");
                if (headerImg) {
                    headerImg.src = url || "../Imagenes/Cities/paris.jpeg";
                }
                
                // Guardado automático al actualizar portada
                try {
                    if (window.guardarViajeCompleto) {
                        await window.guardarViajeCompleto();
                    }
                } catch (err) {
                    console.error("Error al auto-guardar imagen de portada:", err);
                }
            }
        });
    }

    // Configurar ScrollSpy para resaltar la opción activa en la barra lateral según la sección visible
    const scrollContainer = document.querySelector(".middle-scrollable");
    const sidebarBtns = document.querySelectorAll(".sidebar-btn");
    const sections = [
        document.getElementById("resumen"),
        document.getElementById("explora"),
        document.getElementById("notas"),
        document.getElementById("lugares"),
        document.getElementById("itinerario"),
        document.getElementById("fechas"),
        document.getElementById("presupuesto")
    ].filter(el => el !== null);

    if (scrollContainer && sidebarBtns.length > 0) {
        const updateActiveSidebar = () => {
            let activeId = "";
            const containerTop = scrollContainer.getBoundingClientRect().top;
            
            // Evaluamos la distancia de cada sección respecto a la parte superior del contenedor scrollable
            for (const section of sections) {
                const rect = section.getBoundingClientRect();
                const relativeTop = rect.top - containerTop;
                
                // Si la sección ya pasó la parte superior del contenedor o está por entrar
                if (relativeTop <= 120) {
                    activeId = section.id;
                }
            }
            
            if (activeId) {
                sidebarBtns.forEach(btn => {
                    const href = btn.getAttribute("href");
                    if (href === `#${activeId}`) {
                        btn.classList.add("active");
                    } else {
                        btn.classList.remove("active");
                    }
                });
            }
        };

        // Escuchar el evento scroll
        scrollContainer.addEventListener("scroll", updateActiveSidebar);

        // Añadir evento clic para retroalimentación instantánea
        sidebarBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const href = btn.getAttribute("href");
                if (href && href.startsWith("#")) {
                    sidebarBtns.forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                }
            });
        });

        // Añadir evento clic a las secciones para resaltar su botón de la barra lateral al hacerles clic
        sections.forEach(section => {
            section.addEventListener("click", () => {
                sidebarBtns.forEach(btn => {
                    const href = btn.getAttribute("href");
                    if (href === `#${section.id}`) {
                        btn.classList.add("active");
                    } else {
                        btn.classList.remove("active");
                    }
                });
            });
        });

        // Ejecutar inicialmente para activar la sección visible por defecto
        updateActiveSidebar();
    }

    // Inicializar visualización del presupuesto
    window.renderPresupuesto();

    // Función global para guardar silenciosamente
    window.guardarViajeSilencioso = async function() {
        if (!window.supabase) {
            console.warn("window.supabase no está definido. Esperando 500ms para inicialización...");
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!window.supabase) {
                throw new Error("El cliente de Supabase no se pudo inicializar. Por favor, verifica la conexión.");
            }
        }
        const { data: sessionData } = await window.supabase.auth.getSession();
        if (!sessionData || !sessionData.session) {
            throw new Error("No has iniciado sesión");
        }
        const token = sessionData.session.access_token;
        
        // Calcular duración
        const date1 = new Date(inputInicio.value);
        const date2 = new Date(inputFin.value);
        let diffDays = 0;
        if (!isNaN(date1) && !isNaN(date2)) {
            const diffTime = Math.abs(date2 - date1);
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        const payload = {
            nombre_viaje: inputNombre.value || "Nuevo Viaje",
            destino_principal: inputDestino.value,
            fecha_inicio: inputInicio.value || null,
            fecha_fin: inputFin.value || null,
            duracion_dias: diffDays,
            estado: "En planificación",
            presupuesto: window.viajePresupuesto || 0,
            moneda: window.viajeMoneda || "ARS",
            imagen_url: window.viajeImagenUrl || null
        };

        const currentId = new URLSearchParams(window.location.search).get('id_viaje');
        if (currentId) {
            payload.id_viaje = parseInt(currentId);
        }

        const response = await fetch(`http://localhost:8000/api/viajes`, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const savedViaje = await response.json();
            if (!currentId && savedViaje.id_viaje) {
                window.history.replaceState(null, '', `make_travel.html?id_viaje=${savedViaje.id_viaje}`);
            }
            return savedViaje.id_viaje;
        } else {
            throw new Error(await response.text());
        }
    };

    // Función global para guardar metadatos + actividades
    window.guardarViajeCompleto = async function() {
        if (!window.guardarViajeSilencioso) return null;
        
        // 1. Guardar metadatos del viaje
        const savedId = await window.guardarViajeSilencioso();
        
        // 2. Sincronizar actividades
        const { data: sessionData } = await window.supabase.auth.getSession();
        if (!sessionData || !sessionData.session) throw new Error("No has iniciado sesión");
        const token = sessionData.session.access_token;

        const responseSync = await fetch(`http://localhost:8000/api/viajes/${savedId}/sync_actividades`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(window.activeActivities)
        });

        if (!responseSync.ok) {
            throw new Error(await responseSync.text());
        }
        
        return savedId;
    };

    if (btnGuardar) {
        btnGuardar.addEventListener("click", async () => {
            try {
                btnGuardar.disabled = true;
                btnGuardar.innerHTML = '<i class="fa fa-spinner fa-spin me-1"></i> Guardando...';

                await window.guardarViajeCompleto();
                alert("¡Viaje y planificación guardados exitosamente!");
                
                // Recargar listados locales por si acaso
                window.location.reload();
            } catch (error) {
                console.error("Error al guardar el viaje y las actividades:", error);
                alert("Ocurrió un error al guardar: " + error.message);
            } finally {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = '<i class="fa fa-save me-1"></i> Guardar';
            }
        });
    }

    // Auto-guardar al salir de make_travel.html
    const navLinks = document.querySelectorAll('a[href]');
    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            const href = link.getAttribute('href');
            // Ignorar links internos (anclas) o javascript
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
            
            e.preventDefault();
            
            // Mostrar UI de carga
            const overlay = document.createElement("div");
            overlay.innerHTML = `
                <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.85);z-index:9999;display:flex;justify-content:center;align-items:center;flex-direction:column;backdrop-filter:blur(4px);">
                    <i class="fa fa-spinner fa-spin fa-3x mb-3 text-dark"></i>
                    <h5 class="fw-bold text-dark">Guardando información...</h5>
                </div>
            `;
            document.body.appendChild(overlay);

            try {
                if (window.guardarViajeCompleto) {
                    await window.guardarViajeCompleto();
                }
            } catch (err) {
                console.error("Error en autoguardado:", err);
            }
            
            window.location.href = href;
        });
    });
}

// Ejecutar comprobaciones al cargar el DOM
document.addEventListener("DOMContentLoaded", async () => {
    checkSession();
    await verificarServidorFastAPI();
    cargarViajes();
    cargarRecuerdos();
    cargarViajesRealizados();
    
    // Inicializar Google Maps y Places primero si la función existe
    if (typeof window.initMap === "function") {
        await window.initMap();
    }
    
    await initMakeTravel();
});
// ==========================================
// Lógica para la sección Explora (SPA)
// ==========================================
window.initExplora = async function(destino, imageUrl) {
    if (!destino) return;

    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData && sessionData.session) {
            // Buscamos todas las recomendaciones para la ciudad usando la columna real: nombre_ciudad
            const { data: recomendaciones, error } = await supabase
                .from("recomendaciones_ciudad")
                .select("*")
                .ilike("nombre_ciudad", `%${destino}%`);

            const container = document.getElementById("explora-preview-container");
            const emptyState = document.getElementById("explora-empty-state");
            const btnExplorarTodo = document.getElementById("btn-explorar-todo");
            
            if (error) throw error;

            if (recomendaciones && recomendaciones.length > 0) {
                if (emptyState) emptyState.style.display = "none";
                if (btnExplorarTodo) btnExplorarTodo.style.display = "inline-block";
                
                // Agrupar recomendaciones por categoría para obtener fotos representativas
                const categories = [
                    { key: 'Cafés', label: 'Cafés', defaultImg: '../Imagenes/Sites/bar.jpeg' },
                    { key: 'Museos', label: 'Museos', defaultImg: '../Imagenes/Sites/arte.jpeg' },
                    { key: 'Gastronomía', label: 'Gastronomía', defaultImg: '../Imagenes/Food/comida.jpeg' }
                ];

                categories.forEach(cat => {
                    const found = recomendaciones.find(r => r.categoria && r.categoria.toLowerCase() === cat.key.toLowerCase());
                    cat.img = found ? found.url_foto : cat.defaultImg;
                });

                if (container) {
                    container.innerHTML = "";
                    
                    // Renderizar los 3 explore-item cliqueables
                    categories.forEach(cat => {
                        const div = document.createElement("div");
                        div.className = "explore-item";
                        div.style.cursor = "pointer";
                        div.innerHTML = `<img src="${cat.img}" alt="${cat.label}">`;
                        div.addEventListener("click", () => {
                            window.openExploraDetail(destino, cat.key);
                        });
                        container.appendChild(div);
                    });

                    // Renderizar los 3 explore-label cliqueables
                    categories.forEach(cat => {
                        const label = document.createElement("div");
                        label.className = "explore-label";
                        label.style.cursor = "pointer";
                        label.textContent = cat.label;
                        label.addEventListener("click", () => {
                            window.openExploraDetail(destino, cat.key);
                        });
                        container.appendChild(label);
                    });
                }
            } else {
                if (container) container.innerHTML = "";
                if (btnExplorarTodo) btnExplorarTodo.style.display = "none";
                if (emptyState) {
                    emptyState.style.display = "block";
                    const textEl = document.getElementById("explora-empty-text");
                    if (textEl) {
                        textEl.textContent = `Nuestros expertos aún están recorriendo las calles de ${destino} para traerte los mejores secretos. ¡Vuelve pronto!`;
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error al cargar la sección explora:", e);
    }
};

window.openExploraDetail = async function(destino, filterCategory = null) {
    const btnExplorarTodo = document.getElementById("btn-explorar-todo");
    const exploraPanel = document.getElementById("explorar-detalle-panel");
    const content = document.getElementById("explora-panel-content");
    const coverImg = document.getElementById("explora-panel-cover");
    const titleEl = document.getElementById("explora-panel-title");
    const showSidebarBtn = document.getElementById("show-sidebar-btn");

    if (window.hideSidebar) window.hideSidebar();
    if (exploraPanel) exploraPanel.style.display = "flex";
    if (showSidebarBtn) showSidebarBtn.style.setProperty("display", "none", "important");

    if (titleEl) titleEl.textContent = filterCategory ? `${filterCategory} en ${destino}` : `Recomendaciones en ${destino}`;
    if (coverImg && window.viajeImagenUrl) coverImg.src = window.viajeImagenUrl;
    if (!content) return;

    content.innerHTML = `<div class="text-center mt-5"><div class="spinner-border text-secondary" role="status"></div></div>`;

    try {
        let query = supabase
            .from("recomendaciones_ciudad")
            .select("*")
            .ilike("nombre_ciudad", `%${destino}%`);
            
        if (filterCategory) {
            query = query.ilike("categoria", filterCategory);
        }

        const { data: recomendaciones, error } = await query;
        if (error) throw error;

        content.innerHTML = "";

        if (recomendaciones && recomendaciones.length > 0) {
            // Párrafo introductorio
            const introText = filterCategory 
                ? `Descubre la selección de nuestros expertos sobre los mejores ${filterCategory.toLowerCase()} en ${destino}. Lugares que no puedes dejar de visitar para vivir la ciudad como un local.`
                : `Una guía seleccionada a mano con lo mejor de ${destino}. Desde gastronomía local hasta rincones escondidos, aquí tienes la lista definitiva para tu viaje.`;
            
            content.innerHTML += `<p class="mb-4 text-muted" style="font-size: 0.95rem; line-height: 1.6;">${introText}</p>`;

            const list = document.createElement("div");
            list.className = "explora-article-list";
            
            // Generadores de datos simulados para metadata
            const queueTimes = ["Sin cola", "5-10 min", "15-30 min", "30+ min"];
            const efforts = ["Bajo", "Moderado", "Alto"];
            const bestTimes = ["09:00 AM", "11:30 AM", "16:00 PM", "Al atardecer", "De noche"];

            recomendaciones.forEach(rec => {
                // Asignación pseudo-aleatoria consistente basada en el título
                const hash = rec.titulo_atraccion ? rec.titulo_atraccion.charCodeAt(0) : 0;
                const qTime = queueTimes[hash % queueTimes.length];
                const eff = efforts[(hash * 2) % efforts.length];
                const bTime = bestTimes[(hash * 3) % bestTimes.length];

                const article = document.createElement("div");
                article.className = "explora-article-item";
                article.innerHTML = `
                    <div class="explora-article-img-wrapper">
                        <img src="${rec.url_foto || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400"}" alt="${rec.titulo_atraccion}" class="explora-article-img">
                        <span class="explora-badge-category">${rec.categoria || "Atracción"}</span>
                        <span class="explora-badge-rating"><i class="fa fa-star"></i> ${rec.rating ? parseFloat(rec.rating).toFixed(1) : "N/A"}</span>
                    </div>
                    <div class="explora-article-body">
                        <h3 class="explora-article-title">${rec.titulo_atraccion}</h3>
                        <p class="explora-article-desc">${rec.descripcion || ""}</p>
                        
                        <div class="explora-article-metadata">
                            <span class="explora-meta-badge" title="Tiempo de cola"><i class="fa fa-users"></i> ${qTime}</span>
                            <span class="explora-meta-badge" title="Nivel de esfuerzo"><i class="fa fa-shoe-prints"></i> ${eff}</span>
                            <span class="explora-meta-badge" title="Mejor hora"><i class="fa fa-clock"></i> ${bTime}</span>
                        </div>
                    </div>
                `;
                
                // Interactividad: Centrar el mapa
                article.addEventListener("click", async () => {
                    // Usar global window.mainMap si está disponible
                    if (typeof google !== 'undefined' && google.maps && window.mainMap) {
                        try {
                            const { Place } = await google.maps.importLibrary("places");
                            const searchQuery = `${rec.titulo_atraccion}, ${destino}`;
                            const { places } = await Place.searchByText({
                                textQuery: searchQuery,
                                maxResultCount: 1
                            });
                            
                            if (places && places.length > 0) {
                                window.mainMap.setCenter(places[0].location);
                                window.mainMap.setZoom(16);
                            }
                        } catch(e) {
                            console.error("Error centrando el mapa:", e);
                        }
                    }
                });

                list.appendChild(article);
            });
            
            content.appendChild(list);
        } else {
            content.innerHTML = `<p class="text-muted text-center mt-5">No hay recomendaciones disponibles para ${destino}.</p>`;
        }
    } catch (err) {
        console.error("Error al cargar detalles de explora:", err);
        content.innerHTML = `<p class="text-danger text-center mt-5">Error al cargar las recomendaciones.</p>`;
    }
};

window.setupExploraEvents = function() {
    const btnExplorarTodo = document.getElementById("btn-explorar-todo");
    const btnCerrarExplora = document.getElementById("btn-cerrar-explora");
    const exploraPanel = document.getElementById("explorar-detalle-panel");
    const destinoInput = document.getElementById("viaje-destino");

    if (btnExplorarTodo) {
        btnExplorarTodo.addEventListener("click", (e) => {
            e.preventDefault();
            const destino = destinoInput ? destinoInput.value : "";
            window.openExploraDetail(destino);
        });
    }

    if (btnCerrarExplora) {
        btnCerrarExplora.addEventListener("click", (e) => {
            e.preventDefault();
            if (exploraPanel) exploraPanel.style.display = "none";
            if (window.showSidebar) window.showSidebar();
            
            // Asegurarnos de que el botón se oculta correctamente
            const showSidebarBtn = document.getElementById("show-sidebar-btn");
            if (showSidebarBtn) showSidebarBtn.style.display = "none";
        });
    }
};





