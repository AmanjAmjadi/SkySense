// app.js - Main application file that initializes everything

// Global state
window.currentLanguage = 'en';
window.useMetric = true;
window.userPreferences = {
    showHourly: true,
    showDetails: true,
    showChart: true,
    showAlerts: true,
    showHistorical: true,
    useMetric: true,
    language: 'en',
    favorites: [],
    customLocationNames: {},
    dismissedAlerts: []
};

// Detect if running in WebView with improved detection
window.isWebView = (function() {
    // Various ways to detect WebView
    const userAgent = navigator.userAgent.toLowerCase();
    console.log("User Agent:", userAgent); // Debug user agent
    
    // More comprehensive WebView detection
    return userAgent.indexOf('wv') > -1 || // Android WebView
           userAgent.indexOf('flutter') > -1 || // Flutter WebView
           /android.+webview|wv/.test(userAgent) || // More generic Android WebView
           window.navigator.standalone || // iOS standalone mode (from homescreen)
           window.matchMedia('(display-mode: standalone)').matches;
})();

// Initialize application
async function initApp() {
    console.log("Initializing app...");
    console.log("WebView detected:", window.isWebView);
    
    // Add meta tag for WebView if needed
    if (window.isWebView) {
        addWebViewMetaTags();
    }
    
    // Load user preferences
    loadUserPreferences();
    
    // Set up event listeners
    setupEventListeners();
    
    // Apply preferences to UI
    applyUserPreferences();
    
    // Set up language selector
    setupLanguageSelector();
    
    // Detect if user is in Iran by checking connection to OpenWeatherMap
    await checkRegion();
    
    // Check for location permission parameters
    checkLocationPermissionParameters();
    
    // For WebView, display a special message about location permissions
    if (window.isWebView) {
        showWebViewLocationHelp();
    }
}

// Add meta tags for WebView
function addWebViewMetaTags() {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.getElementsByTagName('head')[0].appendChild(meta);
}

// Show WebView location help
function showWebViewLocationHelp() {
    // Create a helper button for location permissions
    const locationHelper = document.createElement('div');
    locationHelper.className = 'fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg z-50';
    locationHelper.innerHTML = '<i class="ti ti-location"></i>';
    locationHelper.addEventListener('click', function() {
        showToast(window.currentLanguage === 'en' ? 
            "Attempting to access your location. Please allow permission if prompted." : 
            window.currentLanguage === 'fa' ? 
            "در حال تلاش برای دسترسی به موقعیت شما. لطفاً در صورت درخواست، اجازه دهید." :
            "هەوڵی دەستگەیشتن بە شوێنی تۆ دەدات. تکایە ڕێگەی پێ بدە ئەگەر داوات لێکرا.");
        getUserLocation(false, true); // Force location request
    });
    document.body.appendChild(locationHelper);
}

// Save user preferences to sessionStorage
function saveUserPreferences() {
    try {
        window.userPreferences.useMetric = window.useMetric;
        window.userPreferences.language = window.currentLanguage;
        window.sessionStorage.setItem('skyweatherPrefs', JSON.stringify(window.userPreferences));
    } catch (err) {
        console.error("Error saving preferences:", err);
    }
}

// Load user preferences from sessionStorage
function loadUserPreferences() {
    try {
        const savedPreferences = window.sessionStorage.getItem('skyweatherPrefs');
        if (savedPreferences) {
            const parsedPrefs = JSON.parse(savedPreferences);
            Object.assign(window.userPreferences, parsedPrefs);
            window.useMetric = window.userPreferences.useMetric;
            window.currentLanguage = window.userPreferences.language || 'en';
            
            // Initialize custom location names if needed
            if (!window.userPreferences.customLocationNames) {
                window.userPreferences.customLocationNames = {};
            }
            
            // Initialize dismissed alerts if needed
            if (!window.userPreferences.dismissedAlerts) {
                window.userPreferences.dismissedAlerts = [];
            }
        }
    } catch (err) {
        console.error("Error loading preferences:", err);
    }
}

// Apply user preferences to UI
function applyUserPreferences() {
    // Apply unit toggle state
    document.getElementById('unit-toggle').checked = !window.userPreferences.useMetric;
    
    // Apply settings toggle states
    document.getElementById('show-hourly').checked = window.userPreferences.showHourly;
    document.getElementById('show-details').checked = window.userPreferences.showDetails;
    document.getElementById('show-chart').checked = window.userPreferences.showChart;
    document.getElementById('show-alerts').checked = window.userPreferences.showAlerts;
    document.getElementById('show-historical').checked = window.userPreferences.showHistorical;
    
    // Apply language preference
    setLanguage(window.userPreferences.language || 'en');
    
    // Load favorites
    if (window.userPreferences.favorites && window.userPreferences.favorites.length > 0) {
        renderFavorites();
        document.getElementById('favorites-container').classList.remove('hidden');
    }
    
    // If weather data is loaded, update the display with the current unit preference
    if (currentWeatherData && currentLocationData) {
        displayWeatherData(currentWeatherData, currentLocationData.displayName);
    }
}

// Set up event listeners
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Weather form submission
    document.getElementById('weatherForm').addEventListener('submit', handleWeatherFormSubmit);
    
    // Map location weather button
    document.getElementById('getWeatherForLocation').addEventListener('click', handleGetWeatherForLocation);
    
    // Tab switching
    document.getElementById('searchTab').addEventListener('click', () => switchTab('search'));
    document.getElementById('mapTab').addEventListener('click', () => switchTab('map'));
    
    // Unit toggle
    document.getElementById('unit-toggle').addEventListener('change', handleUnitToggle);
    
    // Details toggle
    document.getElementById('details-toggle').addEventListener('click', toggleDetails);
    
    // Alert dismiss button
    document.getElementById('dismiss-alert').addEventListener('click', dismissWeatherAlert);
    
    // Settings modal
    document.getElementById('settings-button').addEventListener('click', () => 
        document.getElementById('settings-modal').classList.remove('hidden'));
    document.getElementById('settings-backdrop').addEventListener('click', () => 
        document.getElementById('settings-modal').classList.add('hidden'));
    document.getElementById('close-settings').addEventListener('click', () => 
        document.getElementById('settings-modal').classList.add('hidden'));
    document.getElementById('save-settings').addEventListener('click', handleSaveSettings);
    
    // Share modal
    document.getElementById('share-button').addEventListener('click', openShareModal);
    document.getElementById('share-backdrop').addEventListener('click', () => 
        document.getElementById('share-modal').classList.add('hidden'));
    document.getElementById('close-share').addEventListener('click', () => 
        document.getElementById('share-modal').classList.add('hidden'));
    document.getElementById('copy-link').addEventListener('click', copyShareLink);
    
    // Location name modal
    document.getElementById('rename-location').addEventListener('click', showLocationNameModal);
    document.getElementById('saveLocationName').addEventListener('click', saveCustomLocationName);
    document.getElementById('cancelLocationName').addEventListener('click', hideLocationNameModal);
    
    // Favorite button
    document.getElementById('favorite-button').addEventListener('click', toggleFavorite);
    
    // Favorites management
    document.getElementById('manage-favorites').addEventListener('click', openFavoritesModal);
    document.getElementById('favorites-backdrop').addEventListener('click', () => 
        document.getElementById('favorites-modal').classList.add('hidden'));
    document.getElementById('close-favorites').addEventListener('click', () => 
        document.getElementById('favorites-modal').classList.add('hidden'));
    document.getElementById('done-favorites').addEventListener('click', () => 
        document.getElementById('favorites-modal').classList.add('hidden'));
    
    // Location input for autocomplete
    document.getElementById('locationInput').addEventListener('input', handleLocationInput);
    document.getElementById('locationInput').addEventListener('keydown', handleAutocompleteKeydown);
    
    // Close autocomplete on click outside
    document.addEventListener('click', function(e) {
        const autocompleteList = document.getElementById('autocomplete-list');
        const locationInput = document.getElementById('locationInput');
        if (!autocompleteList.contains(e.target) && e.target !== locationInput) {
            autocompleteList.innerHTML = '';
            autocompleteList.classList.remove('show');
        }
    });
    
    // Dark mode detection
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (event.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });
}

// Set up language selector
function setupLanguageSelector() {
    // Set current language in selector
    updateLanguageSelector(window.currentLanguage);
    
    // Set up language selector click handler
    document.getElementById('lang-selector').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('lang-options').classList.toggle('show');
    });
    
    // Set up language option click handlers
    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const lang = this.getAttribute('data-lang');
            setLanguage(lang);
            document.getElementById('lang-options').classList.remove('show');
        });
    });
    
    // Close language selector when clicking outside
    document.addEventListener('click', function() {
        document.getElementById('lang-options').classList.remove('show');
    });
}

// Update language selector UI
function updateLanguageSelector(lang) {
    document.querySelectorAll('.lang-option').forEach(option => {
        if (option.getAttribute('data-lang') === lang) {
            option.classList.add('active');
            const flagImg = option.querySelector('img').src;
            const langName = lang.toUpperCase();
            document.getElementById('current-lang-flag').src = flagImg;
            document.getElementById('current-lang-name').textContent = langName;
        } else {
            option.classList.remove('active');
        }
    });
}

// Set application language
function setLanguage(lang) {
    window.currentLanguage = lang;
    window.userPreferences.language = lang;
    saveUserPreferences();
    
    // Update language selector
    updateLanguageSelector(lang);
    
    // Set RTL for Persian and Kurdish
    if (lang === 'fa' || lang === 'ku') {
        document.body.setAttribute('dir', 'rtl');
    } else {
        document.body.setAttribute('dir', 'ltr');
    }
    
    // Update all translatable UI elements
    document.querySelectorAll('[data-' + lang + ']').forEach(element => {
        const translation = element.getAttribute('data-' + lang);
        if (translation) {
            element.textContent = translation;
        }
    });
    
    // Update placeholder for search input
    const placeholderAttr = 'data-placeholder-' + lang;
    const locationInput = document.getElementById('locationInput');
    if (locationInput.hasAttribute(placeholderAttr)) {
        locationInput.placeholder = locationInput.getAttribute(placeholderAttr);
    }
    
    // Update weather descriptions if weather data is loaded
    if (currentWeatherData && currentLocationData) {
        displayWeatherData(currentWeatherData, currentLocationData.displayName);
    }
}

// Check URL parameters for location permission
function checkLocationPermissionParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for language parameter
    if (urlParams.has('lang')) {
        const lang = urlParams.get('lang');
        if (['en', 'fa', 'ku'].includes(lang)) {
            setLanguage(lang);
        }
    }
    
    // Check if loading with location permission
    if (urlParams.has('useLocation') && urlParams.get('useLocation') === 'true') {
        getUserLocation();
        return;
    }
    
    // Check for other parameters
    if (urlParams.has('lat') && urlParams.has('lon')) {
        const lat = parseFloat(urlParams.get('lat'));
        const lon = parseFloat(urlParams.get('lon'));
        getWeatherByCoordinates(lat, lon);
        return;
    } else if (urlParams.has('loc')) {
        const loc = urlParams.get('loc');
        getWeatherByLocationName(loc);
        return;
    }
    
    // Start with permission request for location
    // In WebView, it's better to start with New York than to automatically request location
    if (window.isWebView) {
        getWeatherByLocationName('New York');
    } else {
        getUserLocation();
    }
}

// Get user's location for initial weather display
function getUserLocation(fromMapButton = false, forceRequest = false) {
    if ('geolocation' in navigator) {
        const loadingMsg = window.currentLanguage === 'en' ? 
            'Getting your location...' : 
            window.currentLanguage === 'fa' ?
            'در حال دریافت موقعیت شما...' :
            'شوێنەکەت وەردەگرین...';
        
        const permissionMsg = window.currentLanguage === 'en' ? 
            'Please allow location access when prompted' : 
            window.currentLanguage === 'fa' ?
            'لطفاً هنگام درخواست، اجازه دسترسی به موقعیت مکانی را بدهید' :
            'تکایە کاتێک داوات لێدەکرێت، ڕێگە بدە بە دەستگەیشتن بە شوێن';
        
        if (!fromMapButton) {
            showLoading(loadingMsg);
            document.getElementById('permissionText').textContent = permissionMsg;
            document.getElementById('permissionText').style.display = 'block';
        }
        
        // Set a longer timeout for geolocation (30 seconds)
        const geolocationTimeout = setTimeout(() => {
            console.log("Geolocation timed out, using default location");
            if (!fromMapButton) {
                hideLoading();
                getWeatherByLocationName('New York'); // Fallback to a default city
            }
        }, 30000); // 30 seconds timeout
        
        try {
            // In WebView on Android, we need to use a more direct approach
            const geolocationOptions = { 
                enableHighAccuracy: true,
                timeout: 25000,
                maximumAge: 0
            };
            
            // Debug message for location request
            console.log("Requesting location with options:", geolocationOptions);
            console.log("WebView status:", window.isWebView ? "Running in WebView" : "Not in WebView");
            
            // Special WebView handling - in some WebViews we want to display a message
            // but only if it's not a forced request (which comes from the help button)
            if (window.isWebView && !forceRequest) {
                console.log("In WebView without force request - showing helper UI");
                
                // Show a toast with instructions
                showToast(window.currentLanguage === 'en' ? 
                    "Tap the location button below to get weather for your location" : 
                    window.currentLanguage === 'fa' ?
                    "برای دریافت آب و هوای موقعیت خود، روی دکمه موقعیت در پایین ضربه بزنید" :
                    "بۆ وەرگرتنی کەشوهەوای شوێنەکەت، دەستبنێ بە دوگمەی شوێن لە خوارەوە", 5000);
                
                clearTimeout(geolocationTimeout);
                if (!fromMapButton) {
                    hideLoading();
                    getWeatherByLocationName('New York'); // Start with default city
                }
                return;
            }
            
            // Actual location request
            navigator.geolocation.getCurrentPosition(
                position => {
                    clearTimeout(geolocationTimeout);
                    console.log("Successfully got location:", position.coords);
                    const { latitude, longitude } = position.coords;
                    
                    // Save coordinates for later use
                    window.userCoordinates = { latitude, longitude };
                    
                    if (fromMapButton && map) {
                        map.setView([latitude, longitude], 13);
                        if (marker) {
                            map.removeLayer(marker);
                        }
                        marker = L.marker([latitude, longitude]).addTo(map);
                        selectedCoords = { lat: latitude, lng: longitude };
                        document.getElementById('selectedLocation').textContent = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
                        document.getElementById('getWeatherForLocation').disabled = false;
                    } else {
                        // For current location, we'll use a friendly name
                        const displayName = window.currentLanguage === 'en' ? 
                            'Your Location' : 
                            window.currentLanguage === 'fa' ?
                            'موقعیت شما' :
                            'شوێنی تۆ';
                        
                        // Get weather for the detected coordinates
                        getWeatherByCoordinates(latitude, longitude, displayName);
                        
                        // Show the location renaming option
                        setTimeout(() => {
                            showToast(window.currentLanguage === 'en' ? 
                                "Tip: You can rename this location by clicking the pencil icon" : 
                                window.currentLanguage === 'fa' ?
                                "نکته: می‌توانید با کلیک روی آیکون مداد، نام این مکان را تغییر دهید" :
                                "تێبینی: دەتوانیت ناوی ئەم شوێنە بگۆڕیت بە کرتەکردن لەسەر ئایکۆنی قەڵەم", 5000);
                        }, 2000);
                    }
                }, 
                error => {
                    clearTimeout(geolocationTimeout);
                    console.error("Geolocation error:", error);
                    console.log("Error code:", error.code);
                    console.log("Error message:", error.message);
                    
                    // More detailed error logging for WebView
                    if (window.isWebView) {
                        console.log("WebView geolocation error details:", JSON.stringify({
                            code: error.code,
                            message: error.message,
                            PERMISSION_DENIED: error.PERMISSION_DENIED,
                            POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
                            TIMEOUT: error.TIMEOUT
                        }));
                    }
                    
                    if (!fromMapButton) {
                        hideLoading();
                        
                        // Show error message based on the error code
                        let errorMessage;
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = window.currentLanguage === 'en' ? 
                                    "Location access denied. Please search for a location instead." : 
                                    window.currentLanguage === 'fa' ?
                                    "دسترسی به موقعیت رد شد. لطفاً به جای آن یک مکان را جستجو کنید." :
                                    "دەستگەیشتن بە شوێن ڕەتکرایەوە. تکایە لە جیاتی ئەوە شوێنێک بگەڕێ.";
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = window.currentLanguage === 'en' ? 
                                    "Location information is unavailable. Please search for a location." : 
                                    window.currentLanguage === 'fa' ?
                                    "اطلاعات موقعیت در دسترس نیست. لطفاً یک مکان را جستجو کنید." :
                                    "زانیاری شوێن بەردەست نییە. تکایە شوێنێک بگەڕێ.";
                                break;
                            case error.TIMEOUT:
                                errorMessage = window.currentLanguage === 'en' ? 
                                    "Location request timed out. Please search for a location." : 
                                    window.currentLanguage === 'fa' ?
                                    "درخواست موقعیت به پایان رسید. لطفاً یک مکان را جستجو کنید." :
                                    "داواکاری شوێن کاتی بەسەرچوو. تکایە شوێنێک بگەڕێ.";
                                break;
                            default:
                                errorMessage = window.currentLanguage === 'en' ? 
                                    "An unknown error occurred. Please search for a location." : 
                                    window.currentLanguage === 'fa' ?
                                    "خطای ناشناخته رخ داد. لطفاً یک مکان را جستجو کنید." :
                                    "هەڵەیەکی نەناسراو ڕوویدا. تکایە شوێنێک بگەڕێ.";
                        }
                        showError(errorMessage);
                        
                        // Load a default location
                        getWeatherByLocationName('New York');
                    } else {
                        // If from map button, show a toast instead of an error message
                        let toastMessage;
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                toastMessage = window.currentLanguage === 'en' ? 
                                    "Location access denied. Please enable location in your device settings." : 
                                    window.currentLanguage === 'fa' ?
                                    "دسترسی به موقعیت رد شد. لطفاً مکان‌یابی را در تنظیمات دستگاه خود فعال کنید." :
                                    "دەستگەیشتن بە شوێن ڕەتکرایەوە. تکایە شوێن لە ڕێکخستنەکانی ئامێرەکەت چالاک بکە.";
                                break;
                            default:
                                toastMessage = window.currentLanguage === 'en' ? 
                                    "Couldn't get your location. Please check device settings." : 
                                    window.currentLanguage === 'fa' ?
                                    "نمی‌توان موقعیت شما را دریافت کرد. لطفاً تنظیمات دستگاه را بررسی کنید." :
                                    "نەتوانرا شوێنەکەت وەربگیرێت. تکایە ڕێکخستنەکانی ئامێرەکەت بپشکنە.";
                        }
                        showToast(toastMessage, 5000);
                        
                        // Reset the location button if it exists
                        if (locationButton) {
                            locationButton.innerHTML = '<i class="ti ti-current-location"></i>';
                            locationButton.style.pointerEvents = 'auto';
                        }
                    }
                },
                geolocationOptions
            );
        } catch (e) {
            clearTimeout(geolocationTimeout);
            console.error("Exception in geolocation:", e);
            if (!fromMapButton) {
                hideLoading();
                getWeatherByLocationName('New York'); // Fallback to a default city
            }
        }
    } else {
        console.log("Geolocation not supported");
        if (!fromMapButton) {
            hideLoading();
            showError(window.currentLanguage === 'en' ? 
                "Your browser doesn't support geolocation. Please search for a location." : 
                window.currentLanguage === 'fa' ?
                "مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند. لطفاً یک مکان را جستجو کنید." :
                "وێبگەڕەکەت پشتگیری دۆزینەوەی شوێن ناکات. تکایە شوێنێک بگەڕێ.");
            
            // Load a default location
            getWeatherByLocationName('New York');
        } else {
            showToast(window.currentLanguage === 'en' ? 
                "Your browser doesn't support geolocation" : 
                window.currentLanguage === 'fa' ?
                "مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند" :
                "وێبگەڕەکەت پشتگیری دۆزینەوەی شوێن ناکات");
        }
    }
}

// Get weather by location name
async function getWeatherByLocationName(locationName) {
    const loadingMsg = window.currentLanguage === 'en' ? 
        "Finding location..." : 
        window.currentLanguage === 'fa' ?
        "در حال یافتن مکان..." :
        "شوێن دەدۆزرێتەوە...";
    
    showLoading(loadingMsg);
    
    try {
        // Get coordinates from location name
        const locationData = await getCoordinates(locationName);
        
        // Save current location data
        currentLocationData = locationData;
        
        const weatherLoadingMsg = window.currentLanguage === 'en' ? 
            "Getting weather data..." : 
            window.currentLanguage === 'fa' ?
            "در حال دریافت داده‌های آب و هوا..." :
            "زانیارییەکانی کەشوهەوا دەهێنرێت...";
        
        showLoading(weatherLoadingMsg);
        
        // Get weather data
        const weatherData = await fetchWeatherData(
            locationData.latitude, 
            locationData.longitude
        );
        
        // Display the weather
        displayWeatherData(weatherData, locationData.displayName);
        hideLoading();
        
        // Update map if it exists
        if (map) {
            map.setView([locationData.latitude, locationData.longitude], 10);
            
            // Always remove old marker before adding a new one
            if (marker) {
                map.removeLayer(marker);
            }
            marker = L.marker([locationData.latitude, locationData.longitude]).addTo(map);
        }
    } catch (err) {
        showError(err.message);
    }
}

// Get weather for coordinates
async function getWeatherByCoordinates(latitude, longitude, displayName) {
    const loadingMsg = window.currentLanguage === 'en' ? 
        "Getting weather data..." : 
        window.currentLanguage === 'fa' ?
        "در حال دریافت داده‌های آب و هوا..." :
        "زانیارییەکانی کەشوهەوا دەهێنرێت...";
    
    showLoading(loadingMsg);
    
    try {
        // Check for custom name
        const locationKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
        const customName = window.userPreferences.customLocationNames[locationKey];
        
        // Save current location data
        currentLocationData = {
            latitude,
            longitude,
            displayName: customName || displayName || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`
        };
        
        // Try to get location name if it's coordinates-based
        if (displayName.includes('°') && !customName) {
            const locationName = await getReverseGeocode(latitude, longitude);
            if (locationName) {
                currentLocationData.displayName = locationName;
            }
        }
        
        // Get weather data
        const weatherData = await fetchWeatherData(latitude, longitude);
        
        // Display the weather
        displayWeatherData(weatherData, currentLocationData.displayName);
        hideLoading();
    } catch (err) {
        showError(err.message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
