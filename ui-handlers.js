// ui-handlers.js - Contains UI event handlers and DOM manipulation with enhanced features

// Initialize chart object
let temperatureChart = null;

// Map variables
let map = null;
let marker = null;
let locationButton = null;
let selectedCoords = null;

// Current location data
let currentLocationData = null;
let currentWeatherData = null;

// UI feedback timers
let toastTimer = null;
let refreshTimer = null;

// Handle weather form submission
async function handleWeatherFormSubmit(e) {
    e.preventDefault();
    const location = document.getElementById('locationInput').value.trim();
    
    if (!location) {
        showToast(window.app.state.currentLanguage === 'en' ? 
            "Please enter a location" : 
            window.app.state.currentLanguage === 'fa' ?
            "لطفاً یک مکان وارد کنید" :
            "تکایە شوێنێک بنووسە", 3000);
        return;
    }
    
    // Reset the input field and autocomplete
    const autocompleteList = document.getElementById('autocomplete-list');
    autocompleteList.innerHTML = '';
    autocompleteList.classList.remove('show');
    
    await getWeatherByLocationName(location);
}

// Handle get weather for map location
function handleGetWeatherForLocation() {
    if (selectedCoords) {
        const { lat, lng } = selectedCoords;
        
        // Check if we have a custom name for this location
        const locationKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        const customName = window.app.userPreferences.customLocationNames[locationKey];
        
        // Use custom name if available, otherwise use coordinates
        const displayName = customName || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
        
        getWeatherByCoordinates(lat, lng, displayName);
    }
}

// Switch between search and map tabs with animation
function switchTab(tab) {
    const searchTab = document.getElementById('searchTab');
    const mapTab = document.getElementById('mapTab');
    const searchPanel = document.getElementById('searchPanel');
    const mapPanel = document.getElementById('mapPanel');
    
    if (tab === 'search') {
        searchTab.classList.add('active');
        mapTab.classList.remove('active');
        
        // Use a fade transition
        mapPanel.style.opacity = '1';
        let opacity = 1;
        const fade = setInterval(() => {
            opacity -= 0.1;
            mapPanel.style.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(fade);
                mapPanel.classList.add('hidden');
                searchPanel.classList.remove('hidden');
                searchPanel.style.opacity = '0';
                setTimeout(() => {
                    let fadeIn = 0;
                    const appear = setInterval(() => {
                        fadeIn += 0.1;
                        searchPanel.style.opacity = fadeIn;
                        if (fadeIn >= 1) {
                            clearInterval(appear);
                            searchPanel.style.opacity = '';
                        }
                    }, 20);
                }, 50);
            }
        }, 20);
    } else {
        mapTab.classList.add('active');
        searchTab.classList.remove('active');
        
        // Use a fade transition
        searchPanel.style.opacity = '1';
        let opacity = 1;
        const fade = setInterval(() => {
            opacity -= 0.1;
            searchPanel.style.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(fade);
                searchPanel.classList.add('hidden');
                mapPanel.classList.remove('hidden');
                mapPanel.style.opacity = '0';
                setTimeout(() => {
                    let fadeIn = 0;
                    const appear = setInterval(() => {
                        fadeIn += 0.1;
                        mapPanel.style.opacity = fadeIn;
                        if (fadeIn >= 1) {
                            clearInterval(appear);
                            mapPanel.style.opacity = '';
                        }
                    }, 20);
                }, 50);
                
                // Initialize map if not already done
                if (!map) {
                    initMapOnFirstClick();
                } else {
                    // Refresh map size after tab change
                    setTimeout(() => {
                        if (map) map.invalidateSize();
                    }, 100);
                }
            }
        }, 20);
    }
}

// Handle unit toggle
function handleUnitToggle() {
    const unitToggle = document.getElementById('unit-toggle');
    window.app.state.useMetric = !unitToggle.checked;
    window.app.userPreferences.useMetric = window.app.state.useMetric;
    saveUserPreferences();
    
    // Update displayed weather data with new unit
    if (currentWeatherData && currentLocationData) {
        displayWeatherData(currentWeatherData, currentLocationData.displayName);
    }
    
    // Show a toast notification
    showToast(window.app.state.currentLanguage === 'en' ? 
        `Units changed to ${window.app.state.useMetric ? 'Metric' : 'Imperial'}` : 
        window.app.state.currentLanguage === 'fa' ?
        `واحدها به ${window.app.state.useMetric ? 'متریک' : 'امپریال'} تغییر کرد` :
        `یەکەکان گۆڕان بۆ ${window.app.state.useMetric ? 'مەتری' : 'ئیمپریال'}`, 2000);
}

// Toggle weather details section with animation
function toggleDetails() {
    const detailsToggle = document.getElementById('details-toggle');
    const detailsContent = document.getElementById('details-content');
    const icon = detailsToggle.querySelector('i');
    
    if (detailsContent.classList.contains('hidden')) {
        // Show details
        detailsContent.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
        
        // Add animation class
        detailsContent.classList.add('animate-slide-up');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            detailsContent.classList.remove('animate-slide-up');
        }, 500);
    } else {
        // Hide details with a slide-up animation
        detailsContent.style.maxHeight = `${detailsContent.scrollHeight}px`;
        detailsContent.style.overflow = 'hidden';
        
        // Start animation
        setTimeout(() => {
            detailsContent.style.maxHeight = '0px';
            detailsContent.style.opacity = '0';
            icon.style.transform = 'rotate(0)';
            
            // Hide after animation
            setTimeout(() => {
                detailsContent.classList.add('hidden');
                detailsContent.style.maxHeight = '';
                detailsContent.style.overflow = '';
                detailsContent.style.opacity = '';
            }, 300);
        }, 10);
    }
}

// Save settings preferences with improved features
function handleSaveSettings() {
    const showHourly = document.getElementById('show-hourly');
    const showDetails = document.getElementById('show-details');
    const showChart = document.getElementById('show-chart');
    const showAlerts = document.getElementById('show-alerts');
    const showHistorical = document.getElementById('show-historical');
    const showRecentSearches = document.getElementById('show-recent-searches');
    const autoRefresh = document.getElementById('auto-refresh');
    const dataSaver = document.getElementById('data-saver');
    const settingsModal = document.getElementById('settings-modal');
    
    // Save UI preferences
    window.app.userPreferences.showHourly = showHourly.checked;
    window.app.userPreferences.showDetails = showDetails.checked;
    window.app.userPreferences.showChart = showChart.checked;
    window.app.userPreferences.showAlerts = showAlerts.checked;
    window.app.userPreferences.showHistorical = showHistorical.checked;
    window.app.userPreferences.showRecentSearches = showRecentSearches?.checked ?? true;
    
    // Save data preferences
    window.app.userPreferences.dataSaverMode = dataSaver?.checked ?? false;
    window.app.userPreferences.autoRefresh = autoRefresh?.checked ?? false;
    
    // Save refresh interval preference
    if (autoRefresh?.checked) {
        const selectedInterval = document.querySelector('input[name="refresh-interval"]:checked');
        if (selectedInterval) {
            window.app.userPreferences.refreshInterval = parseInt(selectedInterval.value);
        }
    }
    
    // Save all preferences
    saveUserPreferences();
    
    // Close modal with fade effect
    settingsModal.style.opacity = '1';
    let opacity = 1;
    const fade = setInterval(() => {
        opacity -= 0.1;
        settingsModal.style.opacity = opacity;
        if (opacity <= 0) {
            clearInterval(fade);
            settingsModal.classList.add('hidden');
            settingsModal.style.opacity = '';
            
            // Show confirmation toast
            showToast(window.app.state.currentLanguage === 'en' ? 
                "Settings saved successfully" : 
                window.app.state.currentLanguage === 'fa' ?
                "تنظیمات با موفقیت ذخیره شد" :
                "ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران", 2000);
            
            // Update UI based on new preferences
            updateUIBasedOnPreferences();
            
            // Set up auto-refresh if enabled
            setupAutoRefresh();
            
            // Refresh display of recent searches
            displayRecentSearches();
        }
    }, 20);
}

// Update UI based on current preferences
function updateUIBasedOnPreferences() {
    const hourlyForecastSection = document.getElementById('hourlyForecastContent').closest('.bg-white');
    const detailsContent = document.getElementById('details-content');
    const temperatureChart = document.getElementById('temperatureChart');
    const alertsContainer = document.getElementById('alerts-container');
    const recentSearchesContainer = document.getElementById('recent-searches');
    
    // Show/hide hourly forecast
    hourlyForecastSection.style.display = window.app.userPreferences.showHourly ? 'block' : 'none';
    
    // Show/hide weather details if they were visible
    if (!window.app.userPreferences.showDetails && !detailsContent.classList.contains('hidden')) {
        toggleDetails();
    }
    
    // Show/hide temperature chart
    const chartSection = temperatureChart.closest('div');
    chartSection.style.display = window.app.userPreferences.showChart ? 'block' : 'none';
    
    // Show/hide alerts if present
    if (alertsContainer && !alertsContainer.classList.contains('hidden')) {
        if (!window.app.userPreferences.showAlerts) {
            alertsContainer.classList.add('hidden');
        }
    }
    
    // Show/hide recent searches
    if (recentSearchesContainer) {
        if (window.app.userPreferences.showRecentSearches && window.app.state.lastLocationSearches.length > 0) {
            recentSearchesContainer.classList.remove('hidden');
        } else {
            recentSearchesContainer.classList.add('hidden');
        }
    }
    
    // Update historical comparison visibility
    const historicalSection = document.getElementById('historical-comparison').closest('.rounded-lg');
    if (historicalSection) {
        historicalSection.style.display = window.app.userPreferences.showHistorical ? 'block' : 'none';
    }
}

// Initialize map on first click of map tab with improved loading and error handling
function initMapOnFirstClick() {
    console.log("Initializing map...");
    
    // Show loading indicator in map container
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = `
        <div class="flex justify-center items-center h-full bg-gray-100 dark:bg-gray-800">
            <div class="text-center">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-gray-600 dark:text-gray-300">${
                    window.app.state.currentLanguage === 'en' ? 
                    "Loading map..." : 
                    window.app.state.currentLanguage === 'fa' ?
                    "در حال بارگذاری نقشه..." :
                    "نەخشە بار دەکرێت..."
                }</p>
            </div>
        </div>
    `;
    
    try {
        if (typeof L === 'undefined') {
            throw new Error("Leaflet library not loaded.");
        }
        
        // Create the map with a small delay to allow container to render properly
        setTimeout(() => {
            try {
                map = L.map('map', {
                    attributionControl: false,  // We'll add this back manually for more control
                    zoomControl: true,
                    minZoom: 2,
                    maxZoom: 18
                }).setView([40.7128, -74.0060], 10); // Default to NYC
                
                // Add custom attribution control in bottom-right corner
                L.control.attribution({
                    position: 'bottomright',
                    prefix: '<a href="https://leafletjs.com" target="_blank">Leaflet</a>'
                }).addTo(map);
                
                // Use a modern, cleaner tile provider if possible
                let tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 19
                });
                
                // Detect dark mode and use a dark map if needed
                if (document.documentElement.classList.contains('dark')) {
                    tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                        subdomains: 'abcd',
                        maxZoom: 19
                    });
                }
                
                tileLayer.addTo(map);

                // Add click handler
                map.on('click', function(e) {
                    const { lat, lng } = e.latlng;
                    selectedCoords = { lat, lng };
                    
                    // Update or add marker - Always remove old marker first
                    if (marker) {
                        map.removeLayer(marker);
                    }
                    marker = L.marker(e.latlng).addTo(map);
                    
                    // Add pulsing effect to marker
                    marker._icon.classList.add('animate-pulse-slow');
                    setTimeout(() => {
                        if (marker && marker._icon) {
                            marker._icon.classList.remove('animate-pulse-slow');
                        }
                    }, 2000);
                    
                    // Update UI
                    document.getElementById('selectedLocation').textContent = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
                    document.getElementById('getWeatherForLocation').disabled = false;
                });
                
                // Add a location button to the map
                addLocationButton();
                
                // If we have user coordinates, center the map there
                if (window.app.state.userCoordinates) {
                    const { latitude, longitude } = window.app.state.userCoordinates;
                    map.setView([latitude, longitude], 10);
                    
                    // Add a marker for user's location but ensure we don't keep old markers
                    if (marker) {
                        map.removeLayer(marker);
                    }
                    marker = L.marker([latitude, longitude]).addTo(map);
                } else if (currentLocationData && currentLocationData.latitude && currentLocationData.longitude) {
                    // Use current weather location if available
                    map.setView([currentLocationData.latitude, currentLocationData.longitude], 10);
                    if (marker) {
                        map.removeLayer(marker);
                    }
                    marker = L.marker([currentLocationData.latitude, currentLocationData.longitude]).addTo(map);
                }
                
                // Refresh map on tab change (fixes rendering issues)
                setTimeout(() => {
                    if (map) map.invalidateSize();
                }, 300);
                
            } catch (err) {
                handleMapInitError(err);
            }
        }, 300);
        
    } catch (error) {
        handleMapInitError(error);
    }
}

// Handle map initialization errors in a user-friendly way
function handleMapInitError(error) {
    console.error("Error initializing map:", error);
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = `
        <div class="p-4 text-center bg-red-50 dark:bg-red-900 rounded-lg flex flex-col items-center justify-center h-full">
            <i class="ti ti-map-off text-red-500 dark:text-red-300 text-4xl mb-3"></i>
            <p class="text-red-600 dark:text-red-300 mb-3">${
                window.app.state.currentLanguage === 'en' ? 
                "Could not initialize map. Please try refreshing the page." : 
                window.app.state.currentLanguage === 'fa' ?
                "نقشه راه‌اندازی نشد. لطفا صفحه را تازه کنید." :
                "نەخشە دەستپێنەکرد. تکایە پەڕەکە نوێ بکەرەوە."
            }</p>
            <button id="retry-map-button" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                <i class="ti ti-refresh mr-2"></i> 
                <span>${
                    window.app.state.currentLanguage === 'en' ? 
                    "Retry" : 
                    window.app.state.currentLanguage === 'fa' ?
                    "تلاش مجدد" :
                    "دووبارە هەوڵ بدەرەوە"
                }</span>
            </button>
        </div>
    `;
    
    // Add retry button handler
    document.getElementById('retry-map-button').addEventListener('click', () => {
        // Clear map container first
        mapContainer.innerHTML = '';
        // Try initializing again
        initMapOnFirstClick();
    });
}

// Add location button to map
function addLocationButton() {
    if (!map || locationButton) return;
    
    locationButton = document.createElement('div');
    locationButton.className = 'location-button';
    locationButton.innerHTML = '<i class="ti ti-current-location"></i>';
    locationButton.title = window.app.state.currentLanguage === 'en' ? 
        'Go to my location' : 
        window.app.state.currentLanguage === 'fa' ?
        'برو به موقعیت من' :
        'بڕۆ بۆ شوێنی من';
    
    // Improve location button behavior
    locationButton.addEventListener('click', function() {
        checkLocationServices();
    });
    
    document.getElementById('map').appendChild(locationButton);
}

// Check if location services are enabled before trying to get location
function checkLocationServices() {
    // First, check if the browser supports geolocation
    if (!navigator.geolocation) {
        showToast(window.app.state.currentLanguage === 'en' ? 
            "Your browser doesn't support geolocation" : 
            window.app.state.currentLanguage === 'fa' ?
            "مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند" :
            "وێبگەڕەکەت پشتگیری دۆزینەوەی شوێن ناکات");
        return;
    }
    
    // Display loading indicator on the button itself
    if (locationButton) {
        locationButton.innerHTML = '<div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>';
        locationButton.style.pointerEvents = 'none';
    }
    
    // Try to get permission state if available
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' })
            .then(permissionStatus => {
                if (permissionStatus.state === 'granted') {
                    // We have permission, get location
                    getUserLocationForMap();
                } else if (permissionStatus.state === 'prompt') {
                    // Will prompt the user
                    showToast(window.app.state.currentLanguage === 'en' ? 
                        "Please allow location access when prompted" : 
                        window.app.state.currentLanguage === 'fa' ?
                        "لطفاً هنگام درخواست، اجازه دسترسی به موقعیت مکانی را بدهید" :
                        "تکایە کاتێک داوات لێدەکرێت، ڕێگە بدە بە دەستگەیشتن بە شوێن");
                    getUserLocationForMap();
                } else if (permissionStatus.state === 'denied') {
                    // User has denied permission
                    showToast(window.app.state.currentLanguage === 'en' ? 
                        "Location access denied. Please enable location services in your browser settings." : 
                        window.app.state.currentLanguage === 'fa' ?
                        "دسترسی به موقعیت رد شد. لطفاً خدمات مکان‌یابی را در تنظیمات مرورگر خود فعال کنید." :
                        "دەستگەیشتن بە شوێن ڕەتکرایەوە. تکایە خزمەتگوزاری شوێن لە ڕێکخستنەکانی وێبگەڕەکەت چالاک بکە.");
                    
                    // Reset the button
                    if (locationButton) {
                        locationButton.innerHTML = '<i class="ti ti-current-location"></i>';
                        locationButton.style.pointerEvents = 'auto';
                    }
                }
            })
            .catch(error => {
                console.error("Error checking permission:", error);
                getUserLocationForMap(); // Try anyway
            });
    } else {
        // If permissions API is not available, try directly
        getUserLocationForMap();
    }
}

// Get user's location specifically for the map
function getUserLocationForMap() {
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            
            // Save coordinates for later use
            window.app.state.userCoordinates = { latitude, longitude };
            
            // Center map on user location
            if (map) {
                map.setView([latitude, longitude], 13);
                
                // Always remove old marker first
                if (marker) {
                    map.removeLayer(marker);
                }
                
                // Add new marker
                marker = L.marker([latitude, longitude]).addTo(map);
                
                // Add pulsing effect to marker
                marker._icon.classList.add('animate-pulse-slow');
                setTimeout(() => {
                    if (marker && marker._icon) {
                        marker._icon.classList.remove('animate-pulse-slow');
                    }
                }, 2000);
                
                // Update selected coordinates
                selectedCoords = { lat: latitude, lng: longitude };
                document.getElementById('selectedLocation').textContent = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
                document.getElementById('getWeatherForLocation').disabled = false;
            }
            
            // Reset the button with a success indicator
            if (locationButton) {
                locationButton.innerHTML = '<i class="ti ti-check text-green-500"></i>';
                setTimeout(() => {
                    locationButton.innerHTML = '<i class="ti ti-current-location"></i>';
                    locationButton.style.pointerEvents = 'auto';
                }, 1500);
            }
        },
        error => {
            console.error("Geolocation error:", error);
            
            // Reset the button with an error indicator
            if (locationButton) {
                locationButton.innerHTML = '<i class="ti ti-x text-red-500"></i>';
                setTimeout(() => {
                    locationButton.innerHTML = '<i class="ti ti-current-location"></i>';
                    locationButton.style.pointerEvents = 'auto';
                }, 1500);
            }
            
            // Show appropriate error message
            let errorMsg;
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = window.app.state.currentLanguage === 'en' ? 
                        "Location access denied. Please enable location in your device settings." : 
                        window.app.state.currentLanguage === 'fa' ?
                        "دسترسی به موقعیت رد شد. لطفاً مکان‌یابی را در تنظیمات دستگاه خود فعال کنید." :
                        "دەستگەیشتن بە شوێن ڕەتکرایەوە. تکایە شوێن لە ڕێکخستنەکانی ئامێرەکەت چالاک بکە.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = window.app.state.currentLanguage === 'en' ? 
                        "Location information is unavailable. Check your device's location settings." : 
                        window.app.state.currentLanguage === 'fa' ?
                        "اطلاعات موقعیت در دسترس نیست. تنظیمات مکان دستگاه خود را بررسی کنید." :
                        "زانیاری شوێن بەردەست نییە. ڕێکخستنەکانی شوێنی ئامێرەکەت بپشکنە.";
                    break;
                case error.TIMEOUT:
                    errorMsg = window.app.state.currentLanguage === 'en' ? 
                        "Location request timed out. Please try again." : 
                        window.app.state.currentLanguage === 'fa' ?
                        "درخواست موقعیت به پایان رسید. لطفا دوباره تلاش کنید." :
                        "داواکاری شوێن کاتی بەسەرچوو. تکایە دووبارە هەوڵ بدەوە.";
                    break;
                default:
                    errorMsg = window.app.state.currentLanguage === 'en' ? 
                        "An unknown error occurred getting your location." : 
                        window.app.state.currentLanguage === 'fa' ?
                        "خطای ناشناخته در دریافت موقعیت شما رخ داده است." :
                        "هەڵەیەکی نەناسراو ڕوویدا لە کاتی وەرگرتنی شوێنەکەت.";
            }
            showToast(errorMsg, 5000);
        },
        options
    );
}

// Handle location autocomplete with improved UI
let autocompleteTimeout;
let autocompleteResults = [];
let selectedAutocompleteIndex = -1;

async function handleLocationInput() {
    const locationInput = document.getElementById('locationInput');
    const autocompleteList = document.getElementById('autocomplete-list');
    const query = locationInput.value.trim();
    
    // Reset the selected index
    selectedAutocompleteIndex = -1;
    
    if (query.length < 2) {
        autocompleteList.innerHTML = '';
        autocompleteList.classList.remove('show');
        return;
    }
    
    // Clear previous timeout to avoid rapid API calls
    clearTimeout(autocompleteTimeout);
    
    // Set a timeout to allow user to finish typing
    autocompleteTimeout = setTimeout(async () => {
        try {
            // Show a loading indicator
            autocompleteList.innerHTML = `
                <div class="p-3 text-center text-gray-500 dark:text-gray-400">
                    <div class="inline-block animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full mr-2"></div>
                    <span>${
                        window.app.state.currentLanguage === 'en' ? 
                        "Searching..." : 
                        window.app.state.currentLanguage === 'fa' ?
                        "در حال جستجو..." :
                        "گەڕان..."
                    }</span>
                </div>
            `;
            autocompleteList.classList.add('show');
            
            console.log("Fetching autocomplete for:", query);
            
            // Get autocomplete results
            const results = await getAutocompleteResults(query);
            
            // Store results globally for keyboard navigation
            autocompleteResults = results;
            
            if (!results || results.length === 0) {
                autocompleteList.innerHTML = `
                    <div class="p-3 text-center text-gray-500 dark:text-gray-400">
                        <i class="ti ti-search-off mr-2"></i>
                        <span>${
                            window.app.state.currentLanguage === 'en' ? 
                            "No locations found" : 
                            window.app.state.currentLanguage === 'fa' ?
                            "مکانی یافت نشد" :
                            "هیچ شوێنێک نەدۆزرایەوە"
                        }</span>
                    </div>
                `;
                return;
            }
            
            // Display results
            renderAutocompleteResults(results);
        } catch (err) {
            console.error("Autocomplete error:", err);
            autocompleteList.innerHTML = `
                <div class="p-3 text-center text-red-500 dark:text-red-400">
                    <i class="ti ti-alert-circle mr-2"></i>
                    <span>${
                        window.app.state.currentLanguage === 'en' ? 
                        "Error searching locations" : 
                        window.app.state.currentLanguage === 'fa' ?
                        "خطا در جستجوی مکان‌ها" :
                        "هەڵە لە گەڕانی شوێنەکان"
                    }</span>
                </div>
            `;
        }
    }, 300);
}

// Render autocomplete results with improved styling
function renderAutocompleteResults(results) {
    const autocompleteList = document.getElementById('autocomplete-list');
    const weatherForm = document.getElementById('weatherForm');
    const locationInput = document.getElementById('locationInput');
    
    // Clear previous results first
    autocompleteList.innerHTML = '';
    
    console.log("Got autocomplete results:", results.length);
    
    results.forEach((location, index) => {
        const div = document.createElement('div');
        const locationName = [
            location.name,
            location.state,
            location.country
        ].filter(Boolean).join(', ');
        
        // Add a more detailed structure
        div.innerHTML = `
            <i class="ti ti-map-pin mr-2 text-gray-400 dark:text-gray-500"></i>
            <span>${locationName}</span>
        `;
        
        div.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling
            locationInput.value = locationName;
            autocompleteList.innerHTML = '';
            autocompleteList.classList.remove('show');
            // Submit the form
            weatherForm.dispatchEvent(new Event('submit'));
        });
        
        // Add hover event handlers for better UX
        div.addEventListener('mouseenter', () => {
            selectedAutocompleteIndex = index;
            highlightAutocompleteItem();
        });
        
        autocompleteList.appendChild(div);
    });
    
    // Show the autocomplete list
    autocompleteList.classList.add('show');
}

// Handle keyboard navigation in autocomplete
function handleAutocompleteKeydown(e) {
    const autocompleteList = document.getElementById('autocomplete-list');
    
    if (!autocompleteList.classList.contains('show')) return;
    
    const items = autocompleteList.querySelectorAll('div');
    if (items.length === 0) return;
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedAutocompleteIndex = Math.min(selectedAutocompleteIndex + 1, items.length - 1);
            highlightAutocompleteItem();
            break;
        case 'ArrowUp':
            e.preventDefault();
            selectedAutocompleteIndex = Math.max(selectedAutocompleteIndex - 1, 0);
            highlightAutocompleteItem();
            break;
        case 'Enter':
            e.preventDefault();
            if (selectedAutocompleteIndex >= 0) {
                items[selectedAutocompleteIndex].click();
            }
            break;
        case 'Escape':
            autocompleteList.innerHTML = '';
            autocompleteList.classList.remove('show');
            break;
    }
}

// Highlight the selected autocomplete item
function highlightAutocompleteItem() {
    const autocompleteList = document.getElementById('autocomplete-list');
    const items = autocompleteList.querySelectorAll('div');
    
    // Remove active class from all items
    items.forEach(item => item.classList.remove('autocomplete-active'));
    
    // Add active class to selected item
    if (selectedAutocompleteIndex >= 0 && selectedAutocompleteIndex < items.length) {
        items[selectedAutocompleteIndex].classList.add('autocomplete-active');
        
        // Ensure the selected item is visible
        items[selectedAutocompleteIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }
}

// Update wind direction compass with animation
function updateWindCompass(direction) {
    const arrow = document.getElementById('compass-arrow');
    if (arrow) {
        // Add a simple animation effect
        arrow.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        arrow.style.transform = `translate(-50%, -100%) rotate(${direction}deg)`;
    }
}

// Update UV index visualization
function updateUVIndexBar(uvIndex) {
    const uvBar = document.getElementById('uv-bar');
    if (!uvBar) return;
    
    // Remove existing classes
    uvBar.classList.remove('uv-low', 'uv-moderate', 'uv-high', 'uv-very-high');
    
    // Calculate width percentage (0-11+ scale)
    let percentage = Math.min((uvIndex / 11) * 100, 100);
    uvBar.style.width = `${percentage}%`;
    
    // Add appropriate class based on UV level
    if (uvIndex < 3) {
        uvBar.classList.add('uv-low');
    } else if (uvIndex < 6) {
        uvBar.classList.add('uv-moderate');
    } else if (uvIndex < 8) {
        uvBar.classList.add('uv-high');
    } else {
        uvBar.classList.add('uv-very-high');
    }
}

// Update air quality visualization
function updateAirQuality(aqiValue) {
    const aqiBar = document.getElementById('aqi-bar');
    const aqiDescription = document.getElementById('aqi-description');
    const aqiValueElement = document.getElementById('aqi-value');
    
    if (!aqiBar || !aqiDescription || !aqiValueElement) return;
    
    // Reset classes
    aqiBar.classList.remove('aqi-good', 'aqi-moderate', 'aqi-poor');
    
    // Default values if data not available
    if (!aqiValue || aqiValue < 0) {
        aqiValueElement.textContent = '--';
        aqiBar.style.width = '0%';
        aqiDescription.textContent = window.app.state.currentLanguage === 'en' ? 
            "Not available" : 
            window.app.state.currentLanguage === 'fa' ?
            "در دسترس نیست" :
            "بەردەست نییە";
        return;
    }
    
    // Update value
    aqiValueElement.textContent = aqiValue;
    
    // Calculate percentage (0-500 scale for US AQI)
    let percentage = Math.min((aqiValue / 300) * 100, 100);
    aqiBar.style.width = `${percentage}%`;
    
    // Set appropriate class and description based on AQI level
    let description;
    if (aqiValue <= 50) {
        aqiBar.classList.add('aqi-good');
        description = window.app.state.currentLanguage === 'en' ? 
            "Good" : 
            window.app.state.currentLanguage === 'fa' ?
            "خوب" :
            "باش";
    } else if (aqiValue <= 100) {
        aqiBar.classList.add('aqi-moderate');
        description = window.app.state.currentLanguage === 'en' ? 
            "Moderate" : 
            window.app.state.currentLanguage === 'fa' ?
            "متوسط" :
            "مامناوەند";
    } else {
        aqiBar.classList.add('aqi-poor');
        description = window.app.state.currentLanguage === 'en' ? 
            "Poor" : 
            window.app.state.currentLanguage === 'fa' ?
            "ضعیف" :
            "خراپ";
    }
    
    aqiDescription.textContent = description;
}

// Check weather conditions for alerts with more detailed information
function checkWeatherAlerts(data) {
    const alertsContainer = document.getElementById('alerts-container');
    const alertTitle = document.getElementById('alert-title');
    const alertMessage = document.getElementById('alert-message');
    const alertIcon = document.getElementById('alert-icon');
    const alertActions = document.getElementById('alert-actions');
    
    if (!window.app.userPreferences.showAlerts) {
        alertsContainer.classList.add('hidden');
        return;
    }
    
    // Check current weather code for severe conditions
    const currentWeatherCode = data.current.weather_code;
    
    // Check if this alert has been dismissed
    if (window.app.userPreferences.dismissedAlerts.includes(currentWeatherCode)) {
        alertsContainer.classList.add('hidden');
        return;
    }
    
    // Get alert info for this weather code
    const alertInfo = weatherAlertInfo[currentWeatherCode];
    
    // Check if precipitation is high
    const hasPrecipitation = (data.daily && data.daily.precipitation_sum && 
                           data.daily.precipitation_sum[0] > 20); // More than 20mm is significant
    
    // Check wind speed for high winds
    const highWinds = data.current.wind_speed_10m > 15; // More than 15 m/s is significant
    
    // Create a custom alert if precipitation or high winds without a specific code alert
    if (!alertInfo && (hasPrecipitation || highWinds)) {
        // Clear any previous alert classes
        alertsContainer.className = 'relative border-l-4 p-4 rounded-lg mb-4 animate-pulse-slow shadow-sm';
        
        // Add the appropriate severity class
        const severityClass = hasPrecipitation && highWinds ? 'alert-severity-3' : 'alert-severity-2';
        alertsContainer.classList.add(severityClass);
        
        // Update alert icon
        alertIcon.className = hasPrecipitation ? 'ti ti-cloud-rain text-xl mr-2 mt-0.5' : 'ti ti-wind text-xl mr-2 mt-0.5';
        
        // Create alert message
        let weatherDesc;
        if (window.app.state.currentLanguage === 'en') {
            weatherDesc = weatherDescriptions[currentWeatherCode];
        } else if (window.app.state.currentLanguage === 'fa') {
            weatherDesc = weatherDescriptionsFa[currentWeatherCode];
        } else { // 'ku'
            weatherDesc = weatherDescriptionsKu[currentWeatherCode];
        }
        
        let alertText = weatherDesc;
        
        if (hasPrecipitation) {
            if (window.app.state.currentLanguage === 'en') {
                alertText += ` | Heavy precipitation expected (${data.daily.precipitation_sum[0]}mm)`;
            } else if (window.app.state.currentLanguage === 'fa') {
                alertText += ` | بارش شدید پیش‌بینی می‌شود (${data.daily.precipitation_sum[0]} میلی‌متر)`;
            } else { // 'ku'
                alertText += ` | بارینێکی بەهێز چاوەڕوان دەکرێت (${data.daily.precipitation_sum[0]} ملم)`;
            }
        }
        
        if (highWinds) {
            if (window.app.state.currentLanguage === 'en') {
                alertText += ` | Strong winds (${formatWind(data.current.wind_speed_10m, data.current.wind_direction_10m, window.app.state.useMetric, window.app.state.currentLanguage)})`;
            } else if (window.app.state.currentLanguage === 'fa') {
                alertText += ` | بادهای شدید (${formatWind(data.current.wind_speed_10m, data.current.wind_direction_10m, window.app.state.useMetric, window.app.state.currentLanguage)})`;
            } else { // 'ku'
                alertText += ` | بای بەهێز (${formatWind(data.current.wind_speed_10m, data.current.wind_direction_10m, window.app.state.useMetric, window.app.state.currentLanguage)})`;
            }
        }
        
        // Display alert
        alertTitle.textContent = window.app.state.currentLanguage === 'en' ? 
            "Weather Alert" : 
            window.app.state.currentLanguage === 'fa' ? 
            "هشدار آب و هوا" : 
            "ئاگاداری کەشوهەوا";
        alertMessage.textContent = alertText;
        
        // Add appropriate actions
        alertActions.innerHTML = '';
        const recommendedActions = [];
        
        if (hasPrecipitation) {
            recommendedActions.push('carry_umbrella', 'drive_carefully');
            if (data.daily.precipitation_sum[0] > 30) {
                recommendedActions.push('flood_risk');
            }
        }
        
        if (highWinds) {
            recommendedActions.push('drive_carefully');
            if (data.current.wind_speed_10m > 20) {
                recommendedActions.push('avoid_travel');
            }
        }
        
        recommendedActions.forEach(action => {
            const actionInfo = weatherAlertActions[window.app.state.currentLanguage][action];
            const actionEl = document.createElement('div');
            actionEl.className = 'alert-action-item';
            actionEl.innerHTML = `<i class="${actionInfo.icon}"></i> <span>${actionInfo.text}</span>`;
            alertActions.appendChild(actionEl);
        });
        
        alertsContainer.classList.remove('hidden');
    }
    // If we have specific alert info for this weather code
    else if (alertInfo && alertInfo.severity > 0) {
        // Clear any previous alert classes
        alertsContainer.className = 'relative border-l-4 p-4 rounded-lg mb-4 animate-pulse-slow shadow-sm';
        
        // Add the appropriate severity class
        alertsContainer.classList.add(`alert-severity-${alertInfo.severity}`);
        
        // Update alert icon
        alertIcon.className = `${alertInfo.icon} text-xl mr-2 mt-0.5`;
        
        // Create alert message
        let descriptionText;
        if (window.app.state.currentLanguage === 'en') {
            descriptionText = weatherDescriptions[currentWeatherCode];
        } else if (window.app.state.currentLanguage === 'fa') {
            descriptionText = weatherDescriptionsFa[currentWeatherCode];
        } else { // 'ku'
            descriptionText = weatherDescriptionsKu[currentWeatherCode];
        }
        
        // Display alert
        alertTitle.textContent = window.app.state.currentLanguage === 'en' ? 
            "Weather Alert" : 
            window.app.state.currentLanguage === 'fa' ? 
            "هشدار آب و هوا" : 
            "ئاگاداری کەشوهەوا";
        alertMessage.textContent = descriptionText;
        
        // Add recommended actions
        alertActions.innerHTML = '';
        alertInfo.actions.forEach(action => {
            const actionInfo = weatherAlertActions[window.app.state.currentLanguage][action];
            const actionEl = document.createElement('div');
            actionEl.className = 'alert-action-item';
            actionEl.innerHTML = `<i class="${actionInfo.icon}"></i> <span>${actionInfo.text}</span>`;
            alertActions.appendChild(actionEl);
        });
        
        alertsContainer.classList.remove('hidden');
    } else {
        alertsContainer.classList.add('hidden');
    }
}

// Dismiss weather alert
function dismissWeatherAlert() {
    if (!currentWeatherData || !currentWeatherData.current) return;
    
    // Add current weather code to dismissed alerts
    const weatherCode = currentWeatherData.current.weather_code;
    
    if (!window.app.userPreferences.dismissedAlerts.includes(weatherCode)) {
        window.app.userPreferences.dismissedAlerts.push(weatherCode);
        saveUserPreferences();
    }
    
    // Hide alert with animation
    const alertsContainer = document.getElementById('alerts-container');
    
    // Fade out animation
    alertsContainer.style.opacity = '1';
    let opacity = 1;
    const fade = setInterval(() => {
        opacity -= 0.1;
        alertsContainer.style.opacity = opacity;
        if (opacity <= 0) {
            clearInterval(fade);
            alertsContainer.classList.add('hidden');
            alertsContainer.style.opacity = '';
        }
    }, 30);
}

// Open share modal with improved content
function openShareModal() {
    if (!currentLocationData) return;
    
    const shareModal = document.getElementById('share-modal');
    const shareUrl = document.getElementById('share-url');
    const shareTwitter = document.getElementById('share-twitter');
    const shareFacebook = document.getElementById('share-facebook');
    const shareWhatsapp = document.getElementById('share-whatsapp');
    const shareTelegram = document.getElementById('share-telegram');
    
    // Create share URL
    let shareUrlText = "https://skysenseapp.ir/";
    
    if (currentLocationData.latitude && currentLocationData.longitude) {
        shareUrlText += `?lat=${currentLocationData.latitude}&lon=${currentLocationData.longitude}`;
    } else if (currentLocationData.name) {
        shareUrlText += `?loc=${encodeURIComponent(currentLocationData.name)}`;
    }
    
    // Add language parameter if not English
    if (window.app.state.currentLanguage !== 'en') {
        shareUrlText += shareUrlText.includes('?') ? '&' : '?';
        shareUrlText += `lang=${window.app.state.currentLanguage}`;
    }
    
    shareUrl.value = shareUrlText;
    
    // Set up social sharing links
    let weatherDesc;
    if (window.app.state.currentLanguage === 'en') {
        weatherDesc = weatherDescriptions[currentWeatherData.current.weather_code];
    } else if (window.app.state.currentLanguage === 'fa') {
        weatherDesc = weatherDescriptionsFa[currentWeatherData.current.weather_code];
    } else { // 'ku'
        weatherDesc = weatherDescriptionsKu[currentWeatherData.current.weather_code];
    }
    
    const shareTitle = window.app.state.currentLanguage === 'en' ? 
        `Check out the weather in ${currentLocationData.displayName}` : 
        window.app.state.currentLanguage === 'fa' ?
        `آب و هوا در ${currentLocationData.displayName} را ببینید` :
        `کەشوهەوا لە ${currentLocationData.displayName} ببینە`;
    
    const temperatureText = document.getElementById('temperature').textContent;
    const weatherText = encodeURIComponent(`${shareTitle}: ${weatherDesc}, ${temperatureText}`);
    
    shareTwitter.href = `https://twitter.com/intent/tweet?text=${weatherText}&url=${encodeURIComponent(shareUrlText)}`;
    shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrlText)}`;
    shareWhatsapp.href = `https://wa.me/?text=${weatherText} ${encodeURIComponent(shareUrlText)}`;
    shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrlText)}&text=${weatherText}`;
    
    // Show modal with fade-in animation
    shareModal.style.opacity = '0';
    shareModal.classList.remove('hidden');
    
    // Animate in
    setTimeout(() => {
        let opacity = 0;
        const fade = setInterval(() => {
            opacity += 0.1;
            shareModal.style.opacity = opacity;
            if (opacity >= 1) {
                clearInterval(fade);
                shareModal.style.opacity = '';
            }
        }, 20);
    }, 50);
}

// Copy share link to clipboard with feedback
function copyShareLink() {
    const shareUrl = document.getElementById('share-url');
    const copyLink = document.getElementById('copy-link');
    
    shareUrl.select();
    
    try {
        navigator.clipboard.writeText(shareUrl.value)
            .then(() => {
                // Success feedback
                copyLink.innerHTML = '<i class="ti ti-check text-green-500"></i>';
                setTimeout(() => {
                    copyLink.innerHTML = '<i class="ti ti-copy"></i>';
                }, 2000);
                
                // Show toast notification
                showToast(window.app.state.currentLanguage === 'en' ? 
                    "Link copied to clipboard" : 
                    window.app.state.currentLanguage === 'fa' ?
                    "لینک در کلیپ‌بورد کپی شد" :
                    "بەستەر کۆپی کرا بۆ کلیپبۆرد", 2000);
            })
            .catch(err => {
                console.error("Clipboard API error:", err);
                // Fallback using document.execCommand
                document.execCommand('copy');
                copyLink.innerHTML = '<i class="ti ti-check text-green-500"></i>';
                setTimeout(() => {
                    copyLink.innerHTML = '<i class="ti ti-copy"></i>';
                }, 2000);
                
                // Show toast notification
                showToast(window.app.state.currentLanguage === 'en' ? 
                    "Link copied to clipboard" : 
                    window.app.state.currentLanguage === 'fa' ?
                    "لینک در کلیپ‌بورد کپی شد" :
                    "بەستەر کۆپی کرا بۆ کلیپبۆرد", 2000);
            });
    } catch (err) {
        console.error("Clipboard error:", err);
        // Fallback using document.execCommand
        document.execCommand('copy');
        copyLink.innerHTML = '<i class="ti ti-check text-green-500"></i>';
        setTimeout(() => {
            copyLink.innerHTML = '<i class="ti ti-copy"></i>';
        }, 2000);
        
        // Show toast notification
        showToast(window.app.state.currentLanguage === 'en' ? 
            "Link copied to clipboard" : 
            window.app.state.currentLanguage === 'fa' ?
            "لینک در کلیپ‌بورد کپی شد" :
            "بەستەر کۆپی کرا بۆ کلیپبۆرد", 2000);
    }
}

// Show the location name modal with animation
function showLocationNameModal() {
    const locationNameModal = document.getElementById('locationNameModal');
    const customLocationNameInput = document.getElementById('customLocationName');
    
    // Pre-fill with current location display name if it's not coordinates
    if (currentLocationData && currentLocationData.displayName) {
        const isCoordinates = /[0-9.-]+°/.test(currentLocationData.displayName);
        if (!isCoordinates) {
            customLocationNameInput.value = currentLocationData.displayName;
        } else {
            customLocationNameInput.value = '';
        }
    }
    
    // Show modal with animation
    locationNameModal.classList.add('show');
    customLocationNameInput.focus();
}

// Hide the location name modal with animation
function hideLocationNameModal() {
    const locationNameModal = document.getElementById('locationNameModal');
    const customLocationNameInput = document.getElementById('customLocationName');
    
    // Hide with animation
    locationNameModal.classList.remove('show');
    
    // Clear after animation completes
    setTimeout(() => {
        customLocationNameInput.value = '';
    }, 300);
}

// Save custom location name with better feedback
function saveCustomLocationName() {
    const customLocationNameInput = document.getElementById('customLocationName');
    const locationName = document.getElementById('locationName');
    
    const newName = customLocationNameInput.value.trim();
    if (!newName || !currentLocationData) {
        hideLocationNameModal();
        return;
    }
    
    // Generate location key
    const locationKey = `${currentLocationData.latitude.toFixed(4)},${currentLocationData.longitude.toFixed(4)}`;
    
    // Save custom name
    window.app.userPreferences.customLocationNames[locationKey] = newName;
    saveUserPreferences();
    
    // Update current display name
    currentLocationData.displayName = newName;
    
    // Animate the name change
    locationName.style.transition = 'opacity 0.3s ease';
    locationName.style.opacity = '0';
    
    setTimeout(() => {
        // Update the text
        locationName.textContent = newName;
        
        // Fade back in
        locationName.style.opacity = '1';
        
        // Remove transition after animation
        setTimeout(() => {
            locationName.style.transition = '';
        }, 300);
    }, 300);
    
    // Update any existing favorites with this location
    window.app.userPreferences.favorites.forEach(favorite => {
        // Check if this is the same location (using close-enough coordinates)
        if (Math.abs(favorite.latitude - currentLocationData.latitude) < 0.01 && 
            Math.abs(favorite.longitude - currentLocationData.longitude) < 0.01) {
            favorite.displayName = newName;
        }
    });
    
    // Re-render favorites
    renderFavorites();
    
    // Hide modal
    hideLocationNameModal();
    
    // Show confirmation
    showToast(window.app.state.currentLanguage === 'en' ? 
        "Location name saved" : 
        window.app.state.currentLanguage === 'fa' ?
        "نام مکان ذخیره شد" :
        "ناوی شوێن هەڵگیرا", 2000);
    
    // Also update any matching recent searches
    window.app.state.lastLocationSearches.forEach(search => {
        if (Math.abs(search.latitude - currentLocationData.latitude) < 0.01 && 
            Math.abs(search.longitude - currentLocationData.longitude) < 0.01) {
            search.displayName = newName;
        }
    });
    localStorage.setItem('recentSearches', JSON.stringify(window.app.state.lastLocationSearches));
    displayRecentSearches();
}

// Toggle favorite status of current location with improved animation
function toggleFavorite() {
    if (!currentLocationData) return;
    
    const favoriteButton = document.getElementById('favorite-button');
    const favoriteIcon = favoriteButton.querySelector('i');
    const isFavorite = favoriteIcon.classList.contains('text-yellow-500');
    
    if (isFavorite) {
        // Remove from favorites
        favoriteIcon.classList.remove('text-yellow-500');
        
        // Add feedback animation
        favoriteIcon.classList.add('animate-bounce');
        setTimeout(() => {
            favoriteIcon.classList.remove('animate-bounce');
        }, 500);
        
        // Update favorites list
        window.app.userPreferences.favorites = window.app.userPreferences.favorites.filter(fav => 
            !(Math.abs(fav.latitude - currentLocationData.latitude) < 0.01 && 
             Math.abs(fav.longitude - currentLocationData.longitude) < 0.01)
        );
        
        // Show toast
        showToast(window.app.state.currentLanguage === 'en' ? 
            "Removed from favorites" : 
            window.app.state.currentLanguage === 'fa' ?
            "از علاقه‌مندی‌ها حذف شد" :
            "لە دڵخوازەکان لابرا", 2000);
    } else {
        // Add to favorites with animation
        favoriteIcon.classList.add('text-yellow-500', 'favorite-animation');
        setTimeout(() => favoriteIcon.classList.remove('favorite-animation'), 500);
        
        // Check if location is coordinates-only
        const isCoordinates = /[0-9.-]+°/.test(currentLocationData.displayName);
        
        // If it's just coordinates, suggest naming it
        if (isCoordinates) {
            showLocationNameModal();
        }
        
        // Add to favorites list
        const favorite = {
            displayName: currentLocationData.displayName,
            name: currentLocationData.name || currentLocationData.displayName,
            latitude: currentLocationData.latitude,
            longitude: currentLocationData.longitude,
            country: currentLocationData.country
        };
        
        // Check if already exists
        const exists = window.app.userPreferences.favorites.some(fav => 
            Math.abs(fav.latitude - favorite.latitude) < 0.01 && 
            Math.abs(fav.longitude - favorite.longitude) < 0.01
        );
        
        if (!exists) {
            window.app.userPreferences.favorites.push(favorite);
            
            // Show toast
            showToast(window.app.state.currentLanguage === 'en' ? 
                "Added to favorites" : 
                window.app.state.currentLanguage === 'fa' ?
                "به علاقه‌مندی‌ها اضافه شد" :
                "زیادکرا بۆ دڵخوازەکان", 2000);
        }
    }
    
    // Save preferences
    saveUserPreferences();
    
    // Update favorites UI
    renderFavorites();
    
    // Show favorites container if there are favorites
    const favoritesContainer = document.getElementById('favorites-container');
    if (window.app.userPreferences.favorites.length > 0) {
        favoritesContainer.classList.remove('hidden');
    } else {
        favoritesContainer.classList.add('hidden');
    }
}

// Render favorites list with improved styling
function renderFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = '';
    
    // Create favorite buttons
    window.app.userPreferences.favorites.forEach(favorite => {
        const button = document.createElement('button');
        button.className = 'px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm text-gray-800 dark:text-white transition-all duration-200 flex items-center gap-1';
        button.innerHTML = `
            <i class="ti ti-star text-yellow-500 text-xs mr-1"></i>
            <span>${favorite.displayName}</span>
        `;
        
        // Add hover effect
        button.addEventListener('mouseenter', function() {
            this.classList.add('shadow-sm');
            this.style.transform = 'translateY(-1px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.classList.remove('shadow-sm');
            this.style.transform = '';
        });
        
        button.addEventListener('click', () => {
            getWeatherByCoordinates(favorite.latitude, favorite.longitude, favorite.displayName);
        });
        
        favoritesList.appendChild(button);
    });
}

// Open favorites management modal with improved UI
function openFavoritesModal() {
    const favoritesModal = document.getElementById('favorites-modal');
    const favoritesManagementList = document.getElementById('favorites-management-list');
    const noFavorites = document.getElementById('no-favorites');
    
    favoritesManagementList.innerHTML = '';
    
    if (window.app.userPreferences.favorites.length === 0) {
        noFavorites.classList.remove('hidden');
    } else {
        noFavorites.classList.add('hidden');
        
        // Create list items for each favorite
        window.app.userPreferences.favorites.forEach((favorite, index) => {
            const li = document.createElement('li');
            li.className = 'py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors';
            li.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="ti ti-star text-yellow-500"></i>
                    <span class="text-gray-800 dark:text-white font-medium">${favorite.displayName}</span>
                    <button class="text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 edit-btn" data-index="${index}">
                        <i class="ti ti-pencil text-sm"></i>
                    </button>
                </div>
                <button class="text-red-500 hover:text-red-700 dark:hover:text-red-400 delete-btn p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-colors" data-index="${index}">
                    <i class="ti ti-trash text-xl"></i>
                </button>
            `;
            
            // Add delete handler
            const deleteButton = li.querySelector('.delete-btn');
            deleteButton.addEventListener('click', () => {
                // Add confirmation animation
                deleteButton.innerHTML = '<i class="ti ti-check text-red-500"></i>';
                li.style.backgroundColor = 'rgba(254, 202, 202, 0.2)';
                
                // Slide up and remove after a brief delay
                setTimeout(() => {
                    li.style.maxHeight = li.scrollHeight + 'px';
                    li.style.overflow = 'hidden';
                    
                    setTimeout(() => {
                        li.style.maxHeight = '0';
                        li.style.opacity = '0';
                        li.style.marginBottom = '0';
                        li.style.marginTop = '0';
                        li.style.paddingTop = '0';
                        li.style.paddingBottom = '0';
                        
                        // Remove from list and update preferences
                        setTimeout(() => {
                            window.app.userPreferences.favorites.splice(index, 1);
                            saveUserPreferences();
                            
                            // Re-render the list
                            openFavoritesModal();
                            
                            // Update favorites UI
                            renderFavorites();
                            
                            // Check if favorites is now empty
                            const favoritesContainer = document.getElementById('favorites-container');
                            if (window.app.userPreferences.favorites.length === 0) {
                                favoritesContainer.classList.add('hidden');
                            }
                        }, 300);
                    }, 50);
                }, 500);
            });
            
            // Add edit handler
            const editButton = li.querySelector('.edit-btn');
            editButton.addEventListener('click', () => {
                const fav = window.app.userPreferences.favorites[index];
                
                // Set current location data to this favorite
                currentLocationData = {
                    latitude: fav.latitude,
                    longitude: fav.longitude,
                    displayName: fav.displayName
                };
                
                // Open rename modal
                showLocationNameModal();
            });
            
            favoritesManagementList.appendChild(li);
        });
    }
    
    // Show modal with animation
    favoritesModal.style.opacity = '0';
    favoritesModal.classList.remove('hidden');
    
    setTimeout(() => {
        let opacity = 0;
        const fadeIn = setInterval(() => {
            opacity += 0.1;
            favoritesModal.style.opacity = opacity;
            if (opacity >= 1) {
                clearInterval(fadeIn);
                favoritesModal.style.opacity = '';
            }
        }, 20);
    }, 50);
}

// Show toast notification with improved styling
function showToast(message, duration = 3000) {
    // Clear any existing toast timer
    if (toastTimer) {
        clearTimeout(toastTimer);
    }
    
    const locationToast = document.getElementById('location-toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    
    // Remove any existing animations
    locationToast.classList.remove('hide');
    
    // Show the toast
    locationToast.classList.remove('hidden');
    
    // Set the new timer
    toastTimer = setTimeout(() => {
        locationToast.classList.add('hide');
        setTimeout(() => {
            locationToast.classList.add('hidden');
            locationToast.classList.remove('hide');
        }, 300);
    }, duration);
}

// Create temperature chart with improved styling
function createTemperatureChart(dailyData) {
    if (!window.app.userPreferences.showChart) return;
    
    try {
        const ctx = document.getElementById('temperatureChart').getContext('2d');
        
        // Prepare data
        const labels = dailyData.time.map(date => formatDate(date, window.app.state.currentLanguage));
        const maxTemps = dailyData.temperature_2m_max.map(temp => window.app.state.useMetric ? temp : (temp * 9/5) + 32);
        const minTemps = dailyData.temperature_2m_min.map(temp => window.app.state.useMetric ? temp : (temp * 9/5) + 32);
        
        // Destroy previous chart if it exists
        if (temperatureChart) {
            temperatureChart.destroy();
        }
        
        // Get color theme based on dark mode
        const isDarkMode = document.documentElement.classList.contains('dark');
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDarkMode ? '#f1f1f1' : '#333';
        
        // Create new chart
        temperatureChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: window.app.state.currentLanguage === 'en' ? 'Max Temp' : 
                               window.app.state.currentLanguage === 'fa' ? 'دمای حداکثر' : 'پلەی گەرمی بەرزترین',
                        data: maxTemps,
                        borderColor: '#ef4444', // Tailwind red-500
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: '#ef4444',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 2
                    },
                    {
                        label: window.app.state.currentLanguage === 'en' ? 'Min Temp' : 
                               window.app.state.currentLanguage === 'fa' ? 'دمای حداقل' : 'پلەی گەرمی نزمترین',
                        data: minTemps,
                        borderColor: '#3b82f6', // Tailwind blue-500
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: '#3b82f6',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: {
                                family: "'Inter', 'system-ui', sans-serif",
                                size: 12
                            },
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        titleColor: isDarkMode ? '#f1f1f1' : '#333',
                        bodyColor: isDarkMode ? '#f1f1f1' : '#333',
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        titleFont: {
                            family: "'Inter', 'system-ui', sans-serif",
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: "'Inter', 'system-ui', sans-serif",
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += context.parsed.y + '°' + (window.app.state.useMetric ? 'C' : 'F');
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: textColor,
                            font: {
                                family: "'Inter', 'system-ui', sans-serif"
                            },
                            callback: function(value) {
                                return value + '°' + (window.app.state.useMetric ? 'C' : 'F');
                            }
                        },
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        border: {
                            display: false
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor,
                            font: {
                                family: "'Inter', 'system-ui', sans-serif"
                            },
                            maxRotation: 0
                        },
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 2
                    },
                    point: {
                        hoverRadius: 6,
                        hoverBorderWidth: 2
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error creating temperature chart:", error);
    }
}

// Show loading indicator with improved styling
function showLoading(message = "Loading weather data...") {
    const loadingContainer = document.getElementById('loadingContainer');
    const loadingText = document.getElementById('loadingText');
    const weatherContainer = document.getElementById('weatherContainer');
    const errorContainer = document.getElementById('errorContainer');
    
    loadingText.textContent = message;
    loadingContainer.classList.remove('hidden');
    weatherContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
    
    // Add animation class if not already present
    if (!loadingContainer.classList.contains('animate-pulse')) {
        loadingContainer.classList.add('animate-pulse');
    }
}

// Hide loading indicator with animation
function hideLoading() {
    const loadingContainer = document.getElementById('loadingContainer');
    const permissionText = document.getElementById('permissionText');
    
    // Fade out animation
    loadingContainer.style.opacity = '1';
    let opacity = 1;
    const fade = setInterval(() => {
        opacity -= 0.1;
        loadingContainer.style.opacity = opacity;
        if (opacity <= 0) {
            clearInterval(fade);
            loadingContainer.classList.add('hidden');
            loadingContainer.style.opacity = '';
            permissionText.style.display = 'none';
            loadingContainer.classList.remove('animate-pulse');
        }
    }, 30);
}

// Show error message with retry options
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    const weatherContainer = document.getElementById('weatherContainer');
    
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
    weatherContainer.classList.add('hidden');
    
    // Add animation for the error appearance
    errorContainer.style.animation = 'none';
    errorContainer.offsetHeight; // Trigger reflow
    errorContainer.style.animation = 'fadeIn 0.5s ease-out';
    
    hideLoading();
}

// Get formatted date for the last update
function getFormattedUpdateTime() {
    const now = new Date();
    let formattedTime;
    
    if (window.app.state.currentLanguage === 'en') {
        formattedTime = now.toLocaleTimeString(
            'en-US', 
            { hour: '2-digit', minute: '2-digit' }
        );
    } else if (window.app.state.currentLanguage === 'fa') {
        formattedTime = now.toLocaleTimeString(
            'fa-IR', 
            { hour: '2-digit', minute: '2-digit' }
        );
    } else { // Kurdish
        formattedTime = now.toLocaleTimeString(
            'ar-IQ', 
            { hour: '2-digit', minute: '2-digit' }
        );
    }
    
    return formattedTime;
}

// Display weather data on the page with enhanced UI and features
function displayWeatherData(data, locationNameStr, silentRefresh = false) {
    try {
        console.log("Displaying weather data for:", locationNameStr);
        
        // Save weather data for reference
        currentWeatherData = data;
        
        // DOM elements
        const locationName = document.getElementById('locationName');
        const weatherDescription = document.getElementById('weatherDescription');
        const weatherIconContainer = document.getElementById('weatherIconContainer');
        const temperature = document.getElementById('temperature');
        const feelsLike = document.getElementById('feelsLike');
        const humidity = document.getElementById('humidity');
        const wind = document.getElementById('wind');
        const weatherContainer = document.getElementById('weatherContainer');
        const favoriteButton = document.getElementById('favorite-button');
        const hourlyForecastContent = document.getElementById('hourlyForecastContent');
        const forecastContent = document.getElementById('forecastContent');
        const weatherUpdateTime = document.getElementById('weather-update-time');
        
        // Add update time
        const updateTime = getFormattedUpdateTime();
        if (weatherUpdateTime) {
            weatherUpdateTime.innerHTML = `<i class="ti ti-refresh text-xs mr-1"></i> ${updateTime}`;
        }
        
        // Current weather data
        const current = {
            temperature: formatTemperature(data.current.temperature_2m, window.app.state.useMetric),
            feelsLike: formatTemperature(data.current.apparent_temperature || data.current.temperature_2m, window.app.state.useMetric),
            weatherCode: data.current.weather_code,
            humidity: `${data.current.relative_humidity_2m}%`,
            windSpeed: data.current.wind_speed_10m,
            windDirection: data.current.wind_direction_10m,
            uvIndex: data.current.uv_index || "N/A"
        };
        
        // Check if location is in favorites
        const isFavorite = window.app.userPreferences.favorites.some(fav => 
            Math.abs(fav.latitude - currentLocationData.latitude) < 0.01 && 
            Math.abs(fav.longitude - currentLocationData.longitude) < 0.01
        );
        
        const favoriteIcon = favoriteButton.querySelector('i');
        if (isFavorite) {
            favoriteIcon.classList.add('text-yellow-500');
        } else {
            favoriteIcon.classList.remove('text-yellow-500');
        }
        
        // If it's a silent refresh, use a subtle transition
        if (silentRefresh) {
            // Only update the data without animations
            updateWeatherDataNoAnimation();
        } else {
            // For normal display, use full animations
            
            // First fade out if the container is visible
            if (!weatherContainer.classList.contains('hidden')) {
                weatherContainer.style.opacity = '1';
                let opacity = 1;
                const fade = setInterval(() => {
                    opacity -= 0.1;
                    weatherContainer.style.opacity = opacity;
                    if (opacity <= 0) {
                        clearInterval(fade);
                        // Update content
                        updateWeatherDataWithAnimation();
                        
                        // Fade back in
                        setTimeout(() => {
                            let fadeIn = 0;
                            const appear = setInterval(() => {
                                fadeIn += 0.1;
                                weatherContainer.style.opacity = fadeIn;
                                if (fadeIn >= 1) {
                                    clearInterval(appear);
                                    weatherContainer.style.opacity = '';
                                }
                            }, 20);
                        }, 100);
                    }
                }, 20);
            } else {
                // If hidden, just update and show
                updateWeatherDataWithAnimation();
                weatherContainer.classList.remove('hidden');
            }
        }
        
        // Inner function to update weather data with animation
        function updateWeatherDataWithAnimation() {
            // Display current weather
            locationName.textContent = locationNameStr;
            
            // Select appropriate weather description based on language
            if (window.app.state.currentLanguage === 'en') {
                weatherDescription.textContent = weatherDescriptions[current.weatherCode];
            } else if (window.app.state.currentLanguage === 'fa') {
                weatherDescription.textContent = weatherDescriptionsFa[current.weatherCode];
            } else { // Kurdish
                weatherDescription.textContent = weatherDescriptionsKu[current.weatherCode];
            }
            
            weatherIconContainer.textContent = weatherIcons[current.weatherCode];
            weatherIconContainer.classList.add('scale-in');
            setTimeout(() => {
                weatherIconContainer.classList.remove('scale-in');
            }, 500);
            
            temperature.textContent = current.temperature;
            feelsLike.textContent = current.feelsLike;
            humidity.textContent = current.humidity;
            wind.textContent = formatWind(current.windSpeed, current.windDirection, window.app.state.useMetric, window.app.state.currentLanguage);
            
            // Update weather details
            if (data.current.uv_index !== undefined) {
                document.getElementById('uv-index').textContent = data.current.uv_index.toFixed(1);
                updateUVIndexBar(data.current.uv_index);
            }
            
            if (data.daily && data.daily.precipitation_sum) {
                document.getElementById('precipitation').textContent = `${data.daily.precipitation_sum[0]} mm`;
                
                // Update precipitation icon based on amount
                const precipIcon = document.getElementById('precip-icon');
                if (precipIcon) {
                    const precipAmount = data.daily.precipitation_sum[0];
                    if (precipAmount === 0) {
                        precipIcon.innerHTML = '<i class="ti ti-droplet-off"></i>';
                    } else if (precipAmount < 5) {
                        precipIcon.innerHTML = '<i class="ti ti-droplet"></i>';
                    } else if (precipAmount < 20) {
                        precipIcon.innerHTML = '<i class="ti ti-droplets"></i>';
                    } else {
                        precipIcon.innerHTML = '<i class="ti ti-cloud-rain"></i>';
                    }
                }
            }
            
            if (data.daily && data.daily.sunrise && data.daily.sunset) {
                document.getElementById('sunrise').textContent = formatTime(data.daily.sunrise[0], window.app.state.currentLanguage);
                document.getElementById('sunset').textContent = formatTime(data.daily.sunset[0], window.app.state.currentLanguage);
            }
            
            // Update wind compass
            updateWindCompass(current.windDirection);
            
            // Check for weather alerts with enhanced information
            checkWeatherAlerts(data);
            
            // Display historical comparison (simulated)
            const historicalTemps = [
                data.current.temperature_2m - 2 + Math.random() * 4,
                data.current.temperature_2m - 3 + Math.random() * 6,
                data.current.temperature_2m - 5 + Math.random() * 10
            ];
            const avgHistorical = historicalTemps.reduce((a, b) => a + b, 0) / historicalTemps.length;
            const diff = data.current.temperature_2m - avgHistorical;
            const absDiff = Math.abs(diff);
            
            let comparisonText;
            if (window.app.state.currentLanguage === 'en') {
                if (absDiff < 2) {
                    comparisonText = `Current temperature is about average for this time of year.`;
                } else if (diff > 0) {
                    comparisonText = `${formatTemperature(absDiff, window.app.state.useMetric)} warmer than the historical average for this time.`;
                } else {
                    comparisonText = `${formatTemperature(absDiff, window.app.state.useMetric)} cooler than the historical average for this time.`;
                }
            } else if (window.app.state.currentLanguage === 'fa') {
                if (absDiff < 2) {
                    comparisonText = `دمای فعلی تقریباً متوسط برای این زمان از سال است.`;
                } else if (diff > 0) {
                    comparisonText = `${formatTemperature(absDiff, window.app.state.useMetric)} گرم‌تر از میانگین تاریخی برای این زمان.`;
                } else {
                    comparisonText = `${formatTemperature(absDiff, window.app.state.useMetric)} سردتر از میانگین تاریخی برای این زمان.`;
                }
            } else { // Kurdish
                if (absDiff < 2) {
                    comparisonText = `پلەی گەرمی ئێستا نزیکەی تێکڕایە بۆ ئەم کاتە لە ساڵدا.`;
                } else if (diff > 0) {
                    comparisonText = `${formatTemperature(absDiff, window.app.state.useMetric)} گەرمترە لە تێکڕای مێژوویی بۆ ئەم کاتە.`;
                } else {
                    comparisonText = `${formatTemperature(absDiff, window.app.state.useMetric)} ساردترە لە تێکڕای مێژوویی بۆ ئەم کاتە.`;
                }
            }
            
            document.getElementById('historical-text').textContent = comparisonText;
            
            // Update air quality (simulated)
            // In a real implementation, this would come from an air quality API
            const simulatedAQI = Math.floor(20 + Math.random() * 100);
            updateAirQuality(simulatedAQI);
            
            // Display hourly forecast (next 24 hours)
            hourlyForecastContent.innerHTML = '';
            
            if (data.hourly && data.hourly.time) {
                // Get current hour index
                const now = new Date();
                const currentHourIndex = data.hourly.time.findIndex(time => {
                    const timeDate = new Date(time);
                    return timeDate > now;
                }) - 1;
                
                // Display next 24 hours
                const startIndex = Math.max(0, currentHourIndex);
                const endIndex = Math.min(startIndex + 24, data.hourly.time.length);
                
                for (let i = startIndex; i < endIndex; i++) {
                    const hourData = {
                        time: formatTime(data.hourly.time[i], window.app.state.currentLanguage),
                        temp: formatTemperature(data.hourly.temperature_2m[i], window.app.state.useMetric),
                        weatherCode: data.hourly.weather_code?.[i] || 0,
                        precipitation: data.hourly.precipitation_probability?.[i] || 0
                    };
                    
                    const hourElement = document.createElement('div');
                    hourElement.className = 'forecast-item w-20';
                    hourElement.innerHTML = `
                        <div class="text-xs font-medium text-gray-800 dark:text-white mb-1">${hourData.time}</div>
                        <div class="text-2xl my-2">${weatherIcons[hourData.weatherCode]}</div>
                        <div class="text-sm font-bold text-gray-800 dark:text-white mb-1">${hourData.temp}</div>
                        <div class="text-xs text-blue-500 flex items-center justify-center gap-1">
                            <i class="ti ti-droplet text-xs"></i> ${hourData.precipitation}%
                        </div>
                    `;
                    hourlyForecastContent.appendChild(hourElement);
                }
            }
            
            // Display 7-day forecast
            forecastContent.innerHTML = '';
            
            if (data.daily && data.daily.time) {
                const forecastDays = Math.min(data.daily.time.length, 7);
                
                for (let i = 0; i < forecastDays; i++) {
                    const day = {
                        date: formatDate(data.daily.time[i], window.app.state.currentLanguage),
                        weatherCode: data.daily.weather_code[i],
                        maxTemp: data.daily.temperature_2m_max[i],
                        minTemp: data.daily.temperature_2m_min[i],
                        precipitation: data.daily.precipitation_sum?.[i] || 0
                    };
                    
                    const dayElement = document.createElement('div');
                    dayElement.className = 'forecast-item w-28';
                    
                    // Get appropriate precipitation text based on language
                    let precipText;
                    if (window.app.state.currentLanguage === 'en') {
                        precipText = day.precipitation > 0 ? day.precipitation + ' mm' : 'No rain';
                    } else if (window.app.state.currentLanguage === 'fa') {
                        precipText = day.precipitation > 0 ? day.precipitation + ' میلی‌متر' : 'بدون بارش';
                    } else { // Kurdish
                        precipText = day.precipitation > 0 ? day.precipitation + ' ملم' : 'بێ باران';
                    }
                    
                    // Get appropriate weather description based on language
                    let weatherDesc;
                    if (window.app.state.currentLanguage === 'en') {
                        weatherDesc = weatherDescriptions[day.weatherCode];
                    } else if (window.app.state.currentLanguage === 'fa') {
                        weatherDesc = weatherDescriptionsFa[day.weatherCode];
                    } else { // Kurdish
                        weatherDesc = weatherDescriptionsKu[day.weatherCode];
                    }
                    
                    dayElement.innerHTML = `
                        <div class="font-medium text-gray-800 dark:text-white mb-1 truncate">${day.date}</div>
                        <div class="text-3xl mb-2">${weatherIcons[day.weatherCode]}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-300 truncate h-5" title="${weatherDesc}">${weatherDesc}</div>
                        <div class="text-sm font-bold text-gray-800 dark:text-white mt-2">${formatTemperature(day.maxTemp, window.app.state.useMetric)} / ${formatTemperature(day.minTemp, window.app.state.useMetric)}</div>
                        <div class="text-xs text-blue-500 mt-1 flex items-center justify-center gap-1">
                            <i class="ti ti-droplet text-xs"></i> ${precipText}
                        </div>
                    `;
                    forecastContent.appendChild(dayElement);
                }
            }
            
            // Create temperature chart
            if (data.daily && data.daily.time) {
                createTemperatureChart(data.daily);
            }
            
            // Show the weather container
            weatherContainer.classList.remove('hidden');
            
            // Apply user preferences to UI after displaying weather
            updateUIBasedOnPreferences();
        }
        
        // Inner function to update data without animations (for silent refresh)
        function updateWeatherDataNoAnimation() {
            // Update only the changing data
            temperature.textContent = current.temperature;
            feelsLike.textContent = current.feelsLike;
            humidity.textContent = current.humidity;
            wind.textContent = formatWind(current.windSpeed, current.windDirection, window.app.state.useMetric, window.app.state.currentLanguage);
            
            // Update details
            if (data.current.uv_index !== undefined) {
                document.getElementById('uv-index').textContent = data.current.uv_index.toFixed(1);
                updateUVIndexBar(data.current.uv_index);
            }
            
            // Update wind compass
            updateWindCompass(current.windDirection);
            
            // Check for alerts
            checkWeatherAlerts(data);
        }
    } catch (err) {
        console.error("Error displaying weather data:", err);
        
        // Only show error for non-silent refresh
        if (!silentRefresh) {
            showError(window.app.state.currentLanguage === 'en' ? 
                "Failed to display weather data. Please try again." : 
                window.app.state.currentLanguage === 'fa' ?
                "نمایش اطلاعات آب و هوا با شکست مواجه شد. لطفا دوباره تلاش کنید." :
                "نمایشی زانیاری کەشوهەوا سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەوە.");
        }
    }
}
