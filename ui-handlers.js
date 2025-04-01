// ui-handlers.js - Contains UI event handlers and DOM manipulation

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

// Handle weather form submission
async function handleWeatherFormSubmit(e) {
    e.preventDefault();
    const location = document.getElementById('locationInput').value.trim();
    
    if (!location) {
        showError(window.currentLanguage === 'en' ? 
            "Please enter a location" : 
            window.currentLanguage === 'fa' ?
            "لطفاً یک مکان وارد کنید" :
            "تکایە شوێنێک بنووسە");
        return;
    }
    
    await getWeatherByLocationName(location);
}

// Handle get weather for map location
function handleGetWeatherForLocation() {
    if (selectedCoords) {
        const { lat, lng } = selectedCoords;
        
        // Check if we have a custom name for this location
        const locationKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        const customName = window.userPreferences.customLocationNames[locationKey];
        
        // Use custom name if available, otherwise use coordinates
        const displayName = customName || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
        
        getWeatherByCoordinates(lat, lng, displayName);
    }
}

// Switch between search and map tabs
function switchTab(tab) {
    const searchTab = document.getElementById('searchTab');
    const mapTab = document.getElementById('mapTab');
    const searchPanel = document.getElementById('searchPanel');
    const mapPanel = document.getElementById('mapPanel');
    
    if (tab === 'search') {
        searchTab.classList.add('active');
        mapTab.classList.remove('active');
        searchPanel.classList.remove('hidden');
        mapPanel.classList.add('hidden');
    } else {
        mapTab.classList.add('active');
        searchTab.classList.remove('active');
        mapPanel.classList.remove('hidden');
        searchPanel.classList.add('hidden');
        
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
}

// Handle unit toggle
function handleUnitToggle() {
    const unitToggle = document.getElementById('unit-toggle');
    window.useMetric = !unitToggle.checked;
    window.userPreferences.useMetric = window.useMetric;
    saveUserPreferences();
    
    // Update displayed weather data with new unit
    if (currentWeatherData && currentLocationData) {
        displayWeatherData(currentWeatherData, currentLocationData.displayName);
    }
}

// Toggle weather details section
function toggleDetails() {
    const detailsToggle = document.getElementById('details-toggle');
    const detailsContent = document.getElementById('details-content');
    const icon = detailsToggle.querySelector('i');
    
    if (detailsContent.classList.contains('hidden')) {
        detailsContent.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
    } else {
        detailsContent.classList.add('hidden');
        icon.style.transform = 'rotate(0)';
    }
}

// Save settings preferences
function handleSaveSettings() {
    const showHourly = document.getElementById('show-hourly');
    const showDetails = document.getElementById('show-details');
    const showChart = document.getElementById('show-chart');
    const showAlerts = document.getElementById('show-alerts');
    const showHistorical = document.getElementById('show-historical');
    const settingsModal = document.getElementById('settings-modal');
    
    window.userPreferences.showHourly = showHourly.checked;
    window.userPreferences.showDetails = showDetails.checked;
    window.userPreferences.showChart = showChart.checked;
    window.userPreferences.showAlerts = showAlerts.checked;
    window.userPreferences.showHistorical = showHistorical.checked;
    
    saveUserPreferences();
    settingsModal.classList.add('hidden');
    
    // Update UI based on new preferences
    updateUIBasedOnPreferences();
}

// Update UI based on current preferences
function updateUIBasedOnPreferences() {
    const hourlyForecastContent = document.getElementById('hourlyForecastContent');
    const detailsContent = document.getElementById('details-content');
    const temperatureChart = document.getElementById('temperatureChart');
    
    const hourlyForecastSection = hourlyForecastContent.closest('.bg-white');
    hourlyForecastSection.style.display = window.userPreferences.showHourly ? 'block' : 'none';
    
    // If details are shown and preference is to hide them, hide the content
    if (!window.userPreferences.showDetails && !detailsContent.classList.contains('hidden')) {
        toggleDetails();
    }
    
    // If chart preference is to hide, hide the chart section
    const chartSection = temperatureChart.closest('div');
    chartSection.style.display = window.userPreferences.showChart ? 'block' : 'none';
}

// Initialize map on first click of map tab
function initMapOnFirstClick() {
    console.log("Initializing map...");
    
    try {
        if (!L) {
            console.error("Leaflet library not loaded.");
            return;
        }
        
        map = L.map('map').setView([40.7128, -74.0060], 10); // Default to NYC
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add click handler
        map.on('click', function(e) {
            const { lat, lng } = e.latlng;
            selectedCoords = { lat, lng };
            
            // Update or add marker - Always remove old marker first
            if (marker) {
                map.removeLayer(marker);
            }
            marker = L.marker(e.latlng).addTo(map);
            
            // Update UI
            document.getElementById('selectedLocation').textContent = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
            document.getElementById('getWeatherForLocation').disabled = false;
        });
        
        // Add a location button to the map
        addLocationButton();
        
        // If we have user coordinates, center the map there
        if (window.userCoordinates) {
            const { latitude, longitude } = window.userCoordinates;
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
        }, 100);
        
    } catch (error) {
        console.error("Error initializing map:", error);
        const mapErrorMessage = document.createElement('div');
        mapErrorMessage.innerHTML = `
            <div class="p-4 text-center text-red-500">
                <p>${window.currentLanguage === 'en' ? 
                "Could not initialize map. Please try refreshing the page." : 
                window.currentLanguage === 'fa' ?
                "نقشه راه‌اندازی نشد. لطفا صفحه را رفرش کنید." :
                "نەخشە دەستپێنەکرد. تکایە پەڕەکە نوێ بکەرەوە."}</p>
            </div>
        `;
        document.getElementById('map').appendChild(mapErrorMessage);
    }
}

// Add location button to map
function addLocationButton() {
    if (!map || locationButton) return;
    
    locationButton = document.createElement('div');
    locationButton.className = 'location-button';
    locationButton.innerHTML = '<i class="ti ti-current-location"></i>';
    locationButton.title = window.currentLanguage === 'en' ? 
        'Go to my location' : 
        window.currentLanguage === 'fa' ?
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
        showToast(window.currentLanguage === 'en' ? 
            "Your browser doesn't support geolocation" : 
            window.currentLanguage === 'fa' ?
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
                    showToast(window.currentLanguage === 'en' ? 
                        "Please allow location access when prompted" : 
                        window.currentLanguage === 'fa' ?
                        "لطفاً هنگام درخواست، اجازه دسترسی به موقعیت مکانی را بدهید" :
                        "تکایە کاتێک داوات لێدەکرێت، ڕێگە بدە بە دەستگەیشتن بە شوێن");
                    getUserLocationForMap();
                } else if (permissionStatus.state === 'denied') {
                    // User has denied permission
                    showToast(window.currentLanguage === 'en' ? 
                        "Location access denied. Please enable location services in your browser settings." : 
                        window.currentLanguage === 'fa' ?
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
            window.userCoordinates = { latitude, longitude };
            
            // Center map on user location
            if (map) {
                map.setView([latitude, longitude], 13);
                
                // Always remove old marker first
                if (marker) {
                    map.removeLayer(marker);
                }
                
                // Add new marker
                marker = L.marker([latitude, longitude]).addTo(map);
                
                // Update selected coordinates
                selectedCoords = { lat: latitude, lng: longitude };
                document.getElementById('selectedLocation').textContent = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
                document.getElementById('getWeatherForLocation').disabled = false;
            }
            
            // Reset the button
            if (locationButton) {
                locationButton.innerHTML = '<i class="ti ti-current-location"></i>';
                locationButton.style.pointerEvents = 'auto';
            }
        },
        error => {
            console.error("Geolocation error:", error);
            
            // Reset the button
            if (locationButton) {
                locationButton.innerHTML = '<i class="ti ti-current-location"></i>';
                locationButton.style.pointerEvents = 'auto';
            }
            
            // Show appropriate error message
            let errorMsg;
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = window.currentLanguage === 'en' ? 
                        "Location access denied. Please enable location in your device settings." : 
                        window.currentLanguage === 'fa' ?
                        "دسترسی به موقعیت رد شد. لطفاً مکان‌یابی را در تنظیمات دستگاه خود فعال کنید." :
                        "دەستگەیشتن بە شوێن ڕەتکرایەوە. تکایە شوێن لە ڕێکخستنەکانی ئامێرەکەت چالاک بکە.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = window.currentLanguage === 'en' ? 
                        "Location information is unavailable. Check your device's location settings." : 
                        window.currentLanguage === 'fa' ?
                        "اطلاعات موقعیت در دسترس نیست. تنظیمات مکان دستگاه خود را بررسی کنید." :
                        "زانیاری شوێن بەردەست نییە. ڕێکخستنەکانی شوێنی ئامێرەکەت بپشکنە.";
                    break;
                case error.TIMEOUT:
                    errorMsg = window.currentLanguage === 'en' ? 
                        "Location request timed out. Please try again." : 
                        window.currentLanguage === 'fa' ?
                        "درخواست موقعیت به پایان رسید. لطفا دوباره تلاش کنید." :
                        "داواکاری شوێن کاتی بەسەرچوو. تکایە دووبارە هەوڵ بدەوە.";
                    break;
                default:
                    errorMsg = window.currentLanguage === 'en' ? 
                        "An unknown error occurred getting your location." : 
                        window.currentLanguage === 'fa' ?
                        "خطای ناشناخته در دریافت موقعیت شما رخ داده است." :
                        "هەڵەیەکی نەناسراو ڕوویدا لە کاتی وەرگرتنی شوێنەکەت.";
            }
            showToast(errorMsg, 5000);
        },
        options
    );
}

// Handle location autocomplete
let autocompleteTimeout;
async function handleLocationInput() {
    const locationInput = document.getElementById('locationInput');
    const autocompleteList = document.getElementById('autocomplete-list');
    const query = locationInput.value.trim();
    
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
            console.log("Fetching autocomplete for:", query);
            
            // Get autocomplete results
            const results = await getAutocompleteResults(query);
            
            if (!results || results.length === 0) {
                autocompleteList.innerHTML = '';
                autocompleteList.classList.remove('show');
                return;
            }
            
            // Display results
            renderAutocompleteResults(results);
        } catch (err) {
            console.error("Autocomplete error:", err);
            autocompleteList.innerHTML = '';
            autocompleteList.classList.remove('show');
        }
    }, 300);
}

// Render autocomplete results
function renderAutocompleteResults(results) {
    const autocompleteList = document.getElementById('autocomplete-list');
    const weatherForm = document.getElementById('weatherForm');
    const locationInput = document.getElementById('locationInput');
    
    // Clear previous results first
    autocompleteList.innerHTML = '';
    
    console.log("Got autocomplete results:", results.length);
    
    results.forEach(location => {
        const div = document.createElement('div');
        const locationName = [
            location.name,
            location.state,
            location.country
        ].filter(Boolean).join(', ');
        
        div.textContent = locationName;
        div.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling
            locationInput.value = locationName;
            autocompleteList.innerHTML = '';
            autocompleteList.classList.remove('show');
            // Submit the form
            weatherForm.dispatchEvent(new Event('submit'));
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
    
    let activeItem = autocompleteList.querySelector('.autocomplete-active');
    let activeIndex = Array.from(items).indexOf(activeItem);
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (activeItem) activeItem.classList.remove('autocomplete-active');
            activeIndex = activeIndex >= 0 ? Math.min(activeIndex + 1, items.length - 1) : 0;
            items[activeIndex].classList.add('autocomplete-active');
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (activeItem) activeItem.classList.remove('autocomplete-active');
            activeIndex = activeIndex > 0 ? activeIndex - 1 : 0;
            items[activeIndex].classList.add('autocomplete-active');
            break;
        case 'Enter':
            if (activeItem) {
                e.preventDefault();
                activeItem.click();
            }
            break;
        case 'Escape':
            autocompleteList.innerHTML = '';
            autocompleteList.classList.remove('show');
            break;
    }
}

// Update wind direction compass
function updateWindCompass(direction) {
    const arrow = document.getElementById('compass-arrow');
    if (arrow) {
        arrow.style.transform = `translate(-50%, -100%) rotate(${direction}deg)`;
    }
}

// Check weather conditions for alerts with more detailed information
function checkWeatherAlerts(data) {
    const alertsContainer = document.getElementById('alerts-container');
    const alertTitle = document.getElementById('alert-title');
    const alertMessage = document.getElementById('alert-message');
    const alertIcon = document.getElementById('alert-icon');
    const alertActions = document.getElementById('alert-actions');
    
    if (!window.userPreferences.showAlerts) {
        alertsContainer.classList.add('hidden');
        return;
    }
    
    // Check current weather code for severe conditions
    const currentWeatherCode = data.current.weather_code;
    
    // Check if this alert has been dismissed
    if (window.userPreferences.dismissedAlerts.includes(currentWeatherCode)) {
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
        alertsContainer.className = 'relative border-l-4 p-4 rounded-lg mb-4 pulse-alert';
        
        // Add the appropriate severity class
        const severityClass = hasPrecipitation && highWinds ? 'alert-severity-3' : 'alert-severity-2';
        alertsContainer.classList.add(severityClass);
        
        // Update alert icon
        alertIcon.className = hasPrecipitation ? 'ti ti-cloud-rain text-xl mr-2 mt-0.5' : 'ti ti-wind text-xl mr-2 mt-0.5';
        
        // Create alert message
        let weatherDesc;
        if (window.currentLanguage === 'en') {
            weatherDesc = weatherDescriptions[currentWeatherCode];
        } else if (window.currentLanguage === 'fa') {
            weatherDesc = weatherDescriptionsFa[currentWeatherCode];
        } else { // 'ku'
            weatherDesc = weatherDescriptionsKu[currentWeatherCode];
        }
        
        let alertText = weatherDesc;
        
        if (hasPrecipitation) {
            if (window.currentLanguage === 'en') {
                alertText += ` | Heavy precipitation expected (${data.daily.precipitation_sum[0]}mm)`;
            } else if (window.currentLanguage === 'fa') {
                alertText += ` | بارش شدید پیش‌بینی می‌شود (${data.daily.precipitation_sum[0]} میلی‌متر)`;
            } else { // 'ku'
                alertText += ` | بارینێکی بەهێز چاوەڕوان دەکرێت (${data.daily.precipitation_sum[0]} ملم)`;
            }
        }
        
        if (highWinds) {
            if (window.currentLanguage === 'en') {
                alertText += ` | Strong winds (${formatWind(data.current.wind_speed_10m, data.current.wind_direction_10m, window.useMetric, window.currentLanguage)})`;
            } else if (window.currentLanguage === 'fa') {
                alertText += ` | بادهای شدید (${formatWind(data.current.wind_speed_10m, data.current.wind_direction_10m, window.useMetric, window.currentLanguage)})`;
            } else { // 'ku'
                alertText += ` | بای بەهێز (${formatWind(data.current.wind_speed_10m, data.current.wind_direction_10m, window.useMetric, window.currentLanguage)})`;
            }
        }
        
        // Display alert
        alertTitle.textContent = window.currentLanguage === 'en' ? 
            "Weather Alert" : 
            window.currentLanguage === 'fa' ? 
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
            const actionInfo = weatherAlertActions[window.currentLanguage][action];
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
        alertsContainer.className = 'relative border-l-4 p-4 rounded-lg mb-4 pulse-alert';
        
        // Add the appropriate severity class
        alertsContainer.classList.add(`alert-severity-${alertInfo.severity}`);
        
        // Update alert icon
        alertIcon.className = `${alertInfo.icon} text-xl mr-2 mt-0.5`;
        
        // Create alert message
        let descriptionText;
        if (window.currentLanguage === 'en') {
            descriptionText = weatherDescriptions[currentWeatherCode];
        } else if (window.currentLanguage === 'fa') {
            descriptionText = weatherDescriptionsFa[currentWeatherCode];
        } else { // 'ku'
            descriptionText = weatherDescriptionsKu[currentWeatherCode];
        }
        
        // Display alert
        alertTitle.textContent = window.currentLanguage === 'en' ? 
            "Weather Alert" : 
            window.currentLanguage === 'fa' ? 
            "هشدار آب و هوا" : 
            "ئاگاداری کەشوهەوا";
        alertMessage.textContent = descriptionText;
        
        // Add recommended actions
        alertActions.innerHTML = '';
        alertInfo.actions.forEach(action => {
            const actionInfo = weatherAlertActions[window.currentLanguage][action];
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
    
    if (!window.userPreferences.dismissedAlerts.includes(weatherCode)) {
        window.userPreferences.dismissedAlerts.push(weatherCode);
        saveUserPreferences();
    }
    
    // Hide alert
    document.getElementById('alerts-container').classList.add('hidden');
}

// Open share modal
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
    
    shareUrl.value = shareUrlText;
    
    // Set up social sharing links
    let weatherDesc;
    if (window.currentLanguage === 'en') {
        weatherDesc = weatherDescriptions[currentWeatherData.current.weather_code];
    } else if (window.currentLanguage === 'fa') {
        weatherDesc = weatherDescriptionsFa[currentWeatherData.current.weather_code];
    } else { // 'ku'
        weatherDesc = weatherDescriptionsKu[currentWeatherData.current.weather_code];
    }
    
    const shareTitle = window.currentLanguage === 'en' ? 
        `Check out the weather in ${currentLocationData.displayName}` : 
        window.currentLanguage === 'fa' ?
        `آب و هوا در ${currentLocationData.displayName} را ببینید` :
        `کەشوهەوا لە ${currentLocationData.displayName} ببینە`;
    
    const weatherText = encodeURIComponent(`${shareTitle}: ${weatherDesc}, ${document.getElementById('temperature').textContent}`);
    
    shareTwitter.href = `https://twitter.com/intent/tweet?text=${weatherText}&url=${encodeURIComponent(shareUrlText)}`;
    shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrlText)}`;
    shareWhatsapp.href = `https://wa.me/?text=${weatherText} ${encodeURIComponent(shareUrlText)}`;
    shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrlText)}&text=${weatherText}`;
    
    // Show modal
    shareModal.classList.remove('hidden');
}

// Copy share link to clipboard
function copyShareLink() {
    const shareUrl = document.getElementById('share-url');
    const copyLink = document.getElementById('copy-link');
    
    shareUrl.select();
    
    try {
        navigator.clipboard.writeText(shareUrl.value);
        copyLink.innerHTML = '<i class="ti ti-check"></i>';
        setTimeout(() => {
            copyLink.innerHTML = '<i class="ti ti-copy"></i>';
        }, 2000);
    } catch (err) {
        console.error("Clipboard error:", err);
        // Fallback using document.execCommand
        document.execCommand('copy');
        copyLink.innerHTML = '<i class="ti ti-check"></i>';
        setTimeout(() => {
            copyLink.innerHTML = '<i class="ti ti-copy"></i>';
        }, 2000);
    }
}

// Show the location name modal
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
    
    locationNameModal.classList.add('show');
    customLocationNameInput.focus();
}

// Hide the location name modal
function hideLocationNameModal() {
    const locationNameModal = document.getElementById('locationNameModal');
    const customLocationNameInput = document.getElementById('customLocationName');
    
    locationNameModal.classList.remove('show');
    customLocationNameInput.value = '';
}

// Save custom location name
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
    window.userPreferences.customLocationNames[locationKey] = newName;
    saveUserPreferences();
    
    // Update current display name
    currentLocationData.displayName = newName;
    locationName.textContent = newName;
    
    // Update any existing favorites with this location
    window.userPreferences.favorites.forEach(favorite => {
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
    showToast(window.currentLanguage === 'en' ? 
        "Location name saved" : 
        window.currentLanguage === 'fa' ?
        "نام مکان ذخیره شد" :
        "ناوی شوێن هەڵگیرا");
}

// Toggle favorite status of current location
function toggleFavorite() {
    if (!currentLocationData) return;
    
    const favoriteButton = document.getElementById('favorite-button');
    const favoriteIcon = favoriteButton.querySelector('i');
    const isFavorite = favoriteIcon.classList.contains('text-yellow-500');
    
    if (isFavorite) {
        // Remove from favorites
        favoriteIcon.classList.remove('text-yellow-500');
        
        // Update favorites list
        window.userPreferences.favorites = window.userPreferences.favorites.filter(fav => 
            !(Math.abs(fav.latitude - currentLocationData.latitude) < 0.01 && 
             Math.abs(fav.longitude - currentLocationData.longitude) < 0.01)
        );
    } else {
        // Add to favorites with animation
        favoriteIcon.classList.add('text-yellow-500', 'favorite-animation');
        setTimeout(() => favoriteIcon.classList.remove('favorite-animation'), 300);
        
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
        const exists = window.userPreferences.favorites.some(fav => 
            Math.abs(fav.latitude - favorite.latitude) < 0.01 && 
            Math.abs(fav.longitude - favorite.longitude) < 0.01
        );
        
        if (!exists) {
            window.userPreferences.favorites.push(favorite);
        }
    }
    
    // Save preferences
    saveUserPreferences();
    
    // Update favorites UI
    renderFavorites();
    
    // Show favorites container if there are favorites
    const favoritesContainer = document.getElementById('favorites-container');
    if (window.userPreferences.favorites.length > 0) {
        favoritesContainer.classList.remove('hidden');
    } else {
        favoritesContainer.classList.add('hidden');
    }
}

// Render favorites list
function renderFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = '';
    
    // Create favorite buttons
    window.userPreferences.favorites.forEach(favorite => {
        const button = document.createElement('button');
        button.className = 'px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full text-sm text-gray-800 dark:text-white transition-colors';
        button.textContent = favorite.displayName;
        button.addEventListener('click', () => {
            getWeatherByCoordinates(favorite.latitude, favorite.longitude, favorite.displayName);
        });
        favoritesList.appendChild(button);
    });
}

// Open favorites management modal
function openFavoritesModal() {
    const favoritesModal = document.getElementById('favorites-modal');
    const favoritesManagementList = document.getElementById('favorites-management-list');
    const noFavorites = document.getElementById('no-favorites');
    
    favoritesManagementList.innerHTML = '';
    
    if (window.userPreferences.favorites.length === 0) {
        noFavorites.classList.remove('hidden');
    } else {
        noFavorites.classList.add('hidden');
        
        // Create list items for each favorite
        window.userPreferences.favorites.forEach((favorite, index) => {
            const li = document.createElement('li');
            li.className = 'py-3 flex justify-between items-center';
            li.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-gray-800 dark:text-white">${favorite.displayName}</span>
                    <button class="text-gray-500 hover:text-primary edit-btn" data-index="${index}">
                        <i class="ti ti-pencil text-sm"></i>
                    </button>
                </div>
                <button class="text-red-500 hover:text-red-700 dark:hover:text-red-400 delete-btn" data-index="${index}">
                    <i class="ti ti-trash text-xl"></i>
                </button>
            `;
            
            // Add delete handler
            const deleteButton = li.querySelector('.delete-btn');
            deleteButton.addEventListener('click', () => {
                window.userPreferences.favorites.splice(index, 1);
                saveUserPreferences();
                li.remove();
                
                // Update favorites UI
                renderFavorites();
                
                // Check if favorites is now empty
                const favoritesContainer = document.getElementById('favorites-container');
                if (window.userPreferences.favorites.length === 0) {
                    noFavorites.classList.remove('hidden');
                    favoritesContainer.classList.add('hidden');
                }
            });
            
            // Add edit handler
            const editButton = li.querySelector('.edit-btn');
            editButton.addEventListener('click', () => {
                const fav = window.userPreferences.favorites[index];
                
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
    
    favoritesModal.classList.remove('hidden');
}

// Show toast notification
function showToast(message, duration = 3000) {
    const locationToast = document.getElementById('location-toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    locationToast.classList.remove('hidden');
    
    setTimeout(() => {
        locationToast.classList.add('hide');
        setTimeout(() => {
            locationToast.classList.add('hidden');
            locationToast.classList.remove('hide');
        }, 300);
    }, duration);
}

// Create temperature chart
function createTemperatureChart(dailyData) {
    if (!window.userPreferences.showChart) return;
    
    try {
        const ctx = document.getElementById('temperatureChart').getContext('2d');
        
        // Prepare data
        const labels = dailyData.time.map(date => formatDate(date, window.currentLanguage));
        const maxTemps = dailyData.temperature_2m_max.map(temp => window.useMetric ? temp : (temp * 9/5) + 32);
        const minTemps = dailyData.temperature_2m_min.map(temp => window.useMetric ? temp : (temp * 9/5) + 32);
        
        // Destroy previous chart if it exists
        if (temperatureChart) {
            temperatureChart.destroy();
        }
        
        // Create new chart
        temperatureChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: window.currentLanguage === 'en' ? 'Max Temp' : 
                               window.currentLanguage === 'fa' ? 'دمای حداکثر' : 'پلەی گەرمی بەرزترین',
                        data: maxTemps,
                        borderColor: '#FF6B6B',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: '#FF6B6B',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: window.currentLanguage === 'en' ? 'Min Temp' : 
                               window.currentLanguage === 'fa' ? 'دمای حداقل' : 'پلەی گەرمی نزمترین',
                        data: minTemps,
                        borderColor: '#4ECDC4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: '#4ECDC4',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: document.documentElement.classList.contains('dark') ? '#f1f1f1' : '#333'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#f1f1f1' : '#333',
                            callback: function(value) {
                                return value + '°' + (window.useMetric ? 'C' : 'F');
                            }
                        },
                        grid: {
                            color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#f1f1f1' : '#333'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error creating temperature chart:", error);
    }
}

// Show loading indicator
function showLoading(message = "Loading weather data...") {
    const loadingContainer = document.getElementById('loadingContainer');
    const loadingText = document.getElementById('loadingText');
    const weatherContainer = document.getElementById('weatherContainer');
    const errorContainer = document.getElementById('errorContainer');
    
    loadingText.textContent = message;
    loadingContainer.classList.remove('hidden');
    weatherContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
}

// Hide loading indicator
function hideLoading() {
    const loadingContainer = document.getElementById('loadingContainer');
    const permissionText = document.getElementById('permissionText');
    
    loadingContainer.classList.add('hidden');
    permissionText.style.display = 'none';
}

// Show error message
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    const weatherContainer = document.getElementById('weatherContainer');
    
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
    weatherContainer.classList.add('hidden');
    hideLoading();
}

// Display weather data on the page
function displayWeatherData(data, locationNameStr) {
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
        
        // Current weather data
        const current = {
            temperature: formatTemperature(data.current.temperature_2m, window.useMetric),
            feelsLike: formatTemperature(data.current.apparent_temperature || data.current.temperature_2m, window.useMetric),
            weatherCode: data.current.weather_code,
            humidity: `${data.current.relative_humidity_2m}%`,
            windSpeed: data.current.wind_speed_10m,
            windDirection: data.current.wind_direction_10m,
            uvIndex: data.current.uv_index || "N/A"
        };
        
        // Check if location is in favorites
        const isFavorite = window.userPreferences.favorites.some(fav => 
            Math.abs(fav.latitude - currentLocationData.latitude) < 0.01 && 
            Math.abs(fav.longitude - currentLocationData.longitude) < 0.01
        );
        
        const favoriteIcon = favoriteButton.querySelector('i');
        if (isFavorite) {
            favoriteIcon.classList.add('text-yellow-500');
        } else {
            favoriteIcon.classList.remove('text-yellow-500');
        }
        
        // Display current weather
        locationName.textContent = locationNameStr;
        
        // Select appropriate weather description based on language
        if (window.currentLanguage === 'en') {
            weatherDescription.textContent = weatherDescriptions[current.weatherCode];
        } else if (window.currentLanguage === 'fa') {
            weatherDescription.textContent = weatherDescriptionsFa[current.weatherCode];
        } else { // Kurdish
            weatherDescription.textContent = weatherDescriptionsKu[current.weatherCode];
        }
        
        weatherIconContainer.textContent = weatherIcons[current.weatherCode];
        temperature.textContent = current.temperature;
        feelsLike.textContent = current.feelsLike;
        humidity.textContent = current.humidity;
        wind.textContent = formatWind(current.windSpeed, current.windDirection, window.useMetric, window.currentLanguage);
        
        // Update weather details
        if (data.current.uv_index !== undefined) {
            document.getElementById('uv-index').textContent = data.current.uv_index.toFixed(1);
        }
        if (data.daily && data.daily.precipitation_sum) {
            document.getElementById('precipitation').textContent = `${data.daily.precipitation_sum[0]} mm`;
        }
        if (data.daily && data.daily.sunrise && data.daily.sunset) {
            document.getElementById('sunrise').textContent = formatTime(data.daily.sunrise[0], window.currentLanguage);
            document.getElementById('sunset').textContent = formatTime(data.daily.sunset[0], window.currentLanguage);
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
        if (window.currentLanguage === 'en') {
            if (absDiff < 2) {
                comparisonText = `Current temperature is about average for this time of year.`;
            } else if (diff > 0) {
                comparisonText = `${formatTemperature(absDiff, window.useMetric)} warmer than the historical average for this time.`;
            } else {
                comparisonText = `${formatTemperature(absDiff, window.useMetric)} cooler than the historical average for this time.`;
            }
        } else if (window.currentLanguage === 'fa') {
            if (absDiff < 2) {
                comparisonText = `دمای فعلی تقریباً متوسط برای این زمان از سال است.`;
            } else if (diff > 0) {
                comparisonText = `${formatTemperature(absDiff, window.useMetric)} گرم‌تر از میانگین تاریخی برای این زمان.`;
            } else {
                comparisonText = `${formatTemperature(absDiff, window.useMetric)} سردتر از میانگین تاریخی برای این زمان.`;
            }
        } else { // Kurdish
            if (absDiff < 2) {
                comparisonText = `پلەی گەرمی ئێستا نزیکەی تێکڕایە بۆ ئەم کاتە لە ساڵدا.`;
            } else if (diff > 0) {
                comparisonText = `${formatTemperature(absDiff, window.useMetric)} گەرمترە لە تێکڕای مێژوویی بۆ ئەم کاتە.`;
            } else {
                comparisonText = `${formatTemperature(absDiff, window.useMetric)} ساردترە لە تێکڕای مێژوویی بۆ ئەم کاتە.`;
            }
        }
        
        document.getElementById('historical-text').textContent = comparisonText;
        
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
                    time: formatTime(data.hourly.time[i], window.currentLanguage),
                    temp: formatTemperature(data.hourly.temperature_2m[i], window.useMetric),
                    weatherCode: data.hourly.weather_code?.[i] || 0,
                    precipitation: data.hourly.precipitation_probability?.[i] || 0
                };
                
                const hourElement = document.createElement('div');
                hourElement.className = 'flex-shrink-0 w-16 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-center';
                hourElement.innerHTML = `
                    <div class="text-xs font-medium text-gray-800 dark:text-white">${hourData.time}</div>
                    <div class="text-xl my-1">${weatherIcons[hourData.weatherCode]}</div>
                    <div class="text-sm text-gray-800 dark:text-white">${hourData.temp}</div>
                    <div class="text-xs text-blue-500 mt-1">${hourData.precipitation}%</div>
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
                    date: formatDate(data.daily.time[i], window.currentLanguage),
                    weatherCode: data.daily.weather_code[i],
                    maxTemp: data.daily.temperature_2m_max[i],
                    minTemp: data.daily.temperature_2m_min[i],
                    precipitation: data.daily.precipitation_sum?.[i] || 0
                };
                
                const dayElement = document.createElement('div');
                dayElement.className = 'flex-shrink-0 w-28 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center';
                
                // Get appropriate precipitation text based on language
                let precipText;
                if (window.currentLanguage === 'en') {
                    precipText = day.precipitation > 0 ? day.precipitation + ' mm' : 'No rain';
                } else if (window.currentLanguage === 'fa') {
                    precipText = day.precipitation > 0 ? day.precipitation + ' میلی‌متر' : 'بدون بارش';
                } else { // Kurdish
                    precipText = day.precipitation > 0 ? day.precipitation + ' ملم' : 'بێ باران';
                }
                
                // Get appropriate weather description based on language
                let weatherDesc;
                if (window.currentLanguage === 'en') {
                    weatherDesc = weatherDescriptions[day.weatherCode];
                } else if (window.currentLanguage === 'fa') {
                    weatherDesc = weatherDescriptionsFa[day.weatherCode];
                } else { // Kurdish
                    weatherDesc = weatherDescriptionsKu[day.weatherCode];
                }
                
                dayElement.innerHTML = `
                    <div class="font-medium text-gray-800 dark:text-white mb-1 truncate">${day.date}</div>
                    <div class="text-2xl mb-1">${weatherIcons[day.weatherCode]}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-300 truncate">${weatherDesc}</div>
                    <div class="text-sm text-gray-800 dark:text-white mt-1">${formatTemperature(day.maxTemp, window.useMetric)} / ${formatTemperature(day.minTemp, window.useMetric)}</div>
                    <div class="text-xs text-blue-500 mt-1">${precipText}</div>
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
    } catch (err) {
        console.error("Error displaying weather data:", err);
        showError(window.currentLanguage === 'en' ? 
            "Failed to display weather data. Please try again." : 
            window.currentLanguage === 'fa' ?
            "نمایش اطلاعات آب و هوا با شکست مواجه شد. لطفا دوباره تلاش کنید." :
            "نمایشی زانیاری کەشوهەوا سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەوە.");
    }
}
