// app.js - Main application file that initializes everything

// Global state with improved structure
window.app = {
    state: {
        currentLanguage: 'en',
        useMetric: true,
        userCoordinates: null,
        autoRefreshTimer: null,
        isOnline: navigator.onLine,
        lastLocationSearches: [],
        dataCache: {}
    },
    userPreferences: {
        showHourly: true,
        showDetails: true,
        showChart: true,
        showAlerts: true,
        showHistorical: true,
        showRecentSearches: true,
        useMetric: true,
        language: 'en',
        favorites: [],
        customLocationNames: {},
        dismissedAlerts: [],
        dataSaverMode: false,
        autoRefresh: false,
        refreshInterval: 300000 // 5 minutes
    }
};

// Detect if running in WebView with improved detection
window.app.isWebView = (function() {
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
    console.log("WebView detected:", window.app.isWebView);
    
    // Set up online/offline detection
    setupNetworkDetection();
    
    // Add meta tag for WebView if needed
    if (window.app.isWebView) {
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
    
    // Load recent searches
    loadRecentSearches();
    
    // Detect if user is in Iran by checking connection to OpenWeatherMap
    await checkRegion();
    
    // Check for location permission parameters
    checkLocationPermissionParameters();
    
    // For WebView, display a special message about location permissions
    if (window.app.isWebView) {
        showWebViewLocationHelp();
    }
}

// Set up network detection
function setupNetworkDetection() {
    // Check current status
    window.app.state.isOnline = navigator.onLine;
    updateOfflineStatus();
    
    // Add event listeners for online/offline events
    window.addEventListener('online', () => {
        window.app.state.isOnline = true;
        updateOfflineStatus();
        showToast(window.app.state.currentLanguage === 'en' ? 
            "You're back online" : 
            window.app.state.currentLanguage === 'fa' ?
            "شما دوباره آنلاین هستید" :
            "تۆ گەڕایتەوە سەر هێڵ", 3000);
        
        // If we have location data, refresh weather data
        if (currentLocationData) {
            getWeatherByCoordinates(
                currentLocationData.latitude, 
                currentLocationData.longitude, 
                currentLocationData.displayName,
                true // silent refresh
            );
        }
    });
    
    window.addEventListener('offline', () => {
        window.app.state.isOnline = false;
        updateOfflineStatus();
        showToast(window.app.state.currentLanguage === 'en' ? 
            "You're offline. Using cached data." : 
            window.app.state.currentLanguage === 'fa' ?
            "شما آفلاین هستید. از داده‌های ذخیره شده استفاده می‌شود." :
            "تۆ دەرهێڵیت. بەکارهێنانی داتای پاشەکەوتکراو.", 3000);
    });
}

// Update the offline status banner
function updateOfflineStatus() {
    const offlineAlert = document.getElementById('offline-alert');
    if (!window.app.state.isOnline) {
        offlineAlert.classList.remove('hidden');
    } else {
        offlineAlert.classList.add('hidden');
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
    // Create a helper button for location permissions with improved styling
    const locationHelper = document.createElement('div');
    locationHelper.className = 'fixed bottom-4 right-4 bg-primary-600 text-white p-3 rounded-full shadow-lg z-50 flex items-center justify-center animate-pulse-slow';
    locationHelper.innerHTML = '<i class="ti ti-location text-xl"></i>';
    locationHelper.addEventListener('click', function() {
        showToast(window.app.state.currentLanguage === 'en' ? 
            "Attempting to access your location. Please allow permission if prompted." : 
            window.app.state.currentLanguage === 'fa' ? 
            "در حال تلاش برای دسترسی به موقعیت شما. لطفاً در صورت درخواست، اجازه دهید." :
            "هەوڵی دەستگەیشتن بە شوێنی تۆ دەدات. تکایە ڕێگەی پێ بدە ئەگەر داوات لێکرا.");
        getUserLocation(false, true); // Force location request
    });
    document.body.appendChild(locationHelper);
}

// Save user preferences to localStorage with error handling
function saveUserPreferences() {
    try {
        window.app.userPreferences.useMetric = window.app.state.useMetric;
        window.app.userPreferences.language = window.app.state.currentLanguage;
        
        // Try localStorage first, fall back to sessionStorage if unavailable
        try {
            localStorage.setItem('skyweatherPrefs', JSON.stringify(window.app.userPreferences));
        } catch (err) {
            console.warn("localStorage not available, using sessionStorage as fallback");
            sessionStorage.setItem('skyweatherPrefs', JSON.stringify(window.app.userPreferences));
        }
    } catch (err) {
        console.error("Error saving preferences:", err);
    }
}

// Load user preferences from storage with fallback
function loadUserPreferences() {
    try {
        // Try localStorage first, then sessionStorage
        let savedPreferences = localStorage.getItem('skyweatherPrefs');
        if (!savedPreferences) {
            savedPreferences = sessionStorage.getItem('skyweatherPrefs');
        }
        
        if (savedPreferences) {
            const parsedPrefs = JSON.parse(savedPreferences);
            Object.assign(window.app.userPreferences, parsedPrefs);
            window.app.state.useMetric = window.app.userPreferences.useMetric;
            window.app.state.currentLanguage = window.app.userPreferences.language || 'en';
            
            // Initialize custom location names if needed
            if (!window.app.userPreferences.customLocationNames) {
                window.app.userPreferences.customLocationNames = {};
            }
            
            // Initialize dismissed alerts if needed
            if (!window.app.userPreferences.dismissedAlerts) {
                window.app.userPreferences.dismissedAlerts = [];
            }
            
            console.log("Loaded user preferences:", window.app.userPreferences);
        }
    } catch (err) {
        console.error("Error loading preferences:", err);
        // Set defaults if we couldn't load preferences
        window.app.state.useMetric = true;
        window.app.state.currentLanguage = 'en';
    }
}

// Load recent searches
function loadRecentSearches() {
    try {
        const recentSearches = localStorage.getItem('recentSearches');
        if (recentSearches) {
            window.app.state.lastLocationSearches = JSON.parse(recentSearches);
            displayRecentSearches();
        }
    } catch (err) {
        console.error("Error loading recent searches:", err);
        window.app.state.lastLocationSearches = [];
    }
}

// Save a search to recent searches
function saveToRecentSearches(location) {
    try {
        // Don't save if empty or undefined
        if (!location || !location.displayName) return;
        
        // Don't save if we're in data saver mode
        if (window.app.userPreferences.dataSaverMode) return;
        
        // If already exists, move to top
        const index = window.app.state.lastLocationSearches.findIndex(
            item => item.displayName === location.displayName
        );
        
        if (index > -1) {
            window.app.state.lastLocationSearches.splice(index, 1);
        }
        
        // Add to beginning of array
        window.app.state.lastLocationSearches.unshift({
            displayName: location.displayName,
            latitude: location.latitude,
            longitude: location.longitude
        });
        
        // Limit to 5 items
        if (window.app.state.lastLocationSearches.length > 5) {
            window.app.state.lastLocationSearches.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('recentSearches', JSON.stringify(window.app.state.lastLocationSearches));
        
        // Update UI
        displayRecentSearches();
    } catch (err) {
        console.error("Error saving recent search:", err);
    }
}

// Display recent searches in the UI
function displayRecentSearches() {
    const recentSearchesList = document.getElementById('recent-searches-list');
    const recentSearchesContainer = document.getElementById('recent-searches');
    
    // Clear the list
    recentSearchesList.innerHTML = '';
    
    // Check if we have any searches and preferences allow showing them
    if (window.app.state.lastLocationSearches.length === 0 || 
        !window.app.userPreferences.showRecentSearches) {
        recentSearchesContainer.classList.add('hidden');
        return;
    }
    
    // Add each search to the list
    window.app.state.lastLocationSearches.forEach((search, index) => {
        const item = document.createElement('div');
        item.className = 'recent-search-item';
        item.innerHTML = `
            <i class="ti ti-history text-sm"></i>
            <span>${search.displayName}</span>
            <i class="ti ti-x text-xs recent-search-remove" data-index="${index}"></i>
        `;
        
        // Add click handler
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking the remove button
            if (e.target.classList.contains('recent-search-remove')) return;
            
            getWeatherByCoordinates(search.latitude, search.longitude, search.displayName);
        });
        
        // Add remove button handler
        const removeBtn = item.querySelector('.recent-search-remove');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.app.state.lastLocationSearches.splice(index, 1);
            localStorage.setItem('recentSearches', JSON.stringify(window.app.state.lastLocationSearches));
            displayRecentSearches();
        });
        
        recentSearchesList.appendChild(item);
    });
    
    // Show the container
    recentSearchesContainer.classList.remove('hidden');
}

// Apply user preferences to UI
function applyUserPreferences() {
    // Apply unit toggle state
    document.getElementById('unit-toggle').checked = !window.app.userPreferences.useMetric;
    
    // Apply settings toggle states
    document.getElementById('show-hourly').checked = window.app.userPreferences.showHourly;
    document.getElementById('show-details').checked = window.app.userPreferences.showDetails;
    document.getElementById('show-chart').checked = window.app.userPreferences.showChart;
    document.getElementById('show-alerts').checked = window.app.userPreferences.showAlerts;
    document.getElementById('show-historical').checked = window.app.userPreferences.showHistorical;
    
    // Apply new settings
    if (document.getElementById('show-recent-searches')) {
        document.getElementById('show-recent-searches').checked = 
            window.app.userPreferences.showRecentSearches ?? true;
    }
    
    if (document.getElementById('auto-refresh')) {
        document.getElementById('auto-refresh').checked = window.app.userPreferences.autoRefresh || false;
        if (window.app.userPreferences.autoRefresh) {
            document.getElementById('refresh-interval-container').classList.remove('hidden');
            
            // Set the correct radio button
            const interval = window.app.userPreferences.refreshInterval || 300000;
            const radioButton = document.querySelector(`input[name="refresh-interval"][value="${interval}"]`);
            if (radioButton) {
                radioButton.checked = true;
            }
        }
    }
    
    if (document.getElementById('data-saver')) {
        document.getElementById('data-saver').checked = window.app.userPreferences.dataSaverMode || false;
    }
    
    // Apply language preference
    setLanguage(window.app.userPreferences.language || 'en');
    
    // Load favorites
    if (window.app.userPreferences.favorites && window.app.userPreferences.favorites.length > 0) {
        renderFavorites();
        document.getElementById('favorites-container').classList.remove('hidden');
    }
    
    // If weather data is loaded, update the display with the current unit preference
    if (currentWeatherData && currentLocationData) {
        displayWeatherData(currentWeatherData, currentLocationData.displayName);
    }
    
    // Apply auto-refresh if enabled
    setupAutoRefresh();
}

// Setup auto-refresh functionality
function setupAutoRefresh() {
    // Clear any existing timer
    if (window.app.state.autoRefreshTimer) {
        clearInterval(window.app.state.autoRefreshTimer);
        window.app.state.autoRefreshTimer = null;
    }
    
    // If auto-refresh is enabled and we're online, set up timer
    if (window.app.userPreferences.autoRefresh && window.app.state.isOnline) {
        const interval = window.app.userPreferences.refreshInterval || 300000; // Default 5 minutes
        
        window.app.state.autoRefreshTimer = setInterval(() => {
            console.log("Auto-refreshing weather data...");
            
            // Only refresh if we have location data and we're online
            if (currentLocationData && window.app.state.isOnline) {
                getWeatherByCoordinates(
                    currentLocationData.latitude, 
                    currentLocationData.longitude, 
                    currentLocationData.displayName,
                    true // silent refresh
                );
            }
        }, interval);
        
        console.log(`Auto-refresh enabled with interval ${interval}ms`);
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
    
    // Refresh weather button
    document.getElementById('refresh-weather')?.addEventListener('click', () => {
        if (currentLocationData) {
            getWeatherByCoordinates(
                currentLocationData.latitude, 
                currentLocationData.longitude, 
                currentLocationData.displayName
            );
        }
    });
    
    // Error container retry button
    document.getElementById('retry-button')?.addEventListener('click', () => {
        if (currentLocationData) {
            getWeatherByCoordinates(
                currentLocationData.latitude, 
                currentLocationData.longitude, 
                currentLocationData.displayName
            );
        } else {
            getUserLocation();
        }
    });
    
    // Default location button
    document.getElementById('default-location-button')?.addEventListener('click', () => {
        getWeatherByLocationName('New York');
    });
    
    // Settings modal
    document.getElementById('settings-button').addEventListener('click', () => 
        document.getElementById('settings-modal').classList.remove('hidden'));
    document.getElementById('settings-backdrop').addEventListener('click', () => 
        document.getElementById('settings-modal').classList.add('hidden'));
    document.getElementById('close-settings').addEventListener('click', () => 
        document.getElementById('settings-modal').classList.add('hidden'));
    document.getElementById('save-settings').addEventListener('click', handleSaveSettings);
    
    // Auto refresh toggle
    const autoRefreshToggle = document.getElementById('auto-refresh');
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('change', function() {
            const intervalContainer = document.getElementById('refresh-interval-container');
            if (this.checked) {
                intervalContainer.classList.remove('hidden');
            } else {
                intervalContainer.classList.add('hidden');
            }
        });
    }
    
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
        if (autocompleteList && !autocompleteList.contains(e.target) && e.target !== locationInput) {
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
    updateLanguageSelector(window.app.state.currentLanguage);
    
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
    window.app.state.currentLanguage = lang;
    window.app.userPreferences.language = lang;
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
    document.querySelectorAll(`[data-${lang}]`).forEach(element => {
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
    if (window.app.isWebView) {
        getWeatherByLocationName('New York');
    } else {
        getUserLocation();
    }
}

// Get user's location for initial weather display
function getUserLocation(fromMapButton = false, forceRequest = false) {
    if ('geolocation' in navigator) {
        const loadingMsg = window.app.state.currentLanguage === 'en' ? 
            'Getting your location...' : 
            window.app.state.currentLanguage === 'fa' ?
            'در حال دریافت موقعیت شما...' :
            'شوێنەکەت وەردەگرین...';
        
        const permissionMsg = window.app.state.currentLanguage === 'en' ? 
            'Please allow location access when prompted' : 
            window.app.state.currentLanguage === 'fa' ?
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
            console.log("WebView status:", window.app.isWebView ? "Running in WebView" : "Not in WebView");
            
            // Special WebView handling - in some WebViews we want to display a message
            // but only if it's not a forced request (which comes from the help button)
            if (window.app.isWebView && !forceRequest) {
                console.log("In WebView without force request - showing helper UI");
                
                // Show a toast with instructions
                showToast(window.app.state.currentLanguage === 'en' ? 
                    "Tap the location button below to get weather for your location" : 
                    window.app.state.currentLanguage === 'fa' ?
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
                    window.app.state.userCoordinates = { latitude, longitude };
                    
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
                        const displayName = window.app.state.currentLanguage === 'en' ? 
                            'Your Location' : 
                            window.app.state.currentLanguage === 'fa' ?
                            'موقعیت شما' :
                            'شوێنی تۆ';
                        
                        // Get weather for the detected coordinates
                        getWeatherByCoordinates(latitude, longitude, displayName);
                        
                        // Show the location renaming option
                        setTimeout(() => {
                            showToast(window.app.state.currentLanguage === 'en' ? 
                                "Tip: You can rename this location by clicking the pencil icon" : 
                                window.app.state.currentLanguage === 'fa' ?
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
                    if (window.app.isWebView) {
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
                                errorMessage = window.app.state.currentLanguage === 'en' ? 
                                    "Location access denied. Please search for a location instead." : 
                                    window.app.state.currentLanguage === 'fa' ?
                                    "دسترسی به موقعیت رد شد. لطفاً به جای آن یک مکان را جستجو کنید." :
                                    "دەستگەیشتن بە شوێن ڕەتکرایەوە. تکایە لە جیاتی ئەوە شوێنێک بگەڕێ.";
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = window.app.state.currentLanguage === 'en' ? 
                                    "Location information is unavailable. Please search for a location." : 
                                    window.app.state.currentLanguage === 'fa' ?
                                    "اطلاعات موقعیت در دسترس نیست. لطفاً یک مکان را جستجو کنید." :
                                    "زانیاری شوێن بەردەست نییە. تکایە شوێنێک بگەڕێ.";
                                break;
                            case error.TIMEOUT:
                                errorMessage = window.app.state.currentLanguage === 'en' ? 
                                    "Location request timed out. Please search for a location." : 
                                    window.app.state.currentLanguage === 'fa' ?
                                    "درخواست موقعیت به پایان رسید. لطفاً یک مکان را جستجو کنید." :
                                    "داواکاری شوێن کاتی بەسەرچوو. تکایە شوێنێک بگەڕێ.";
                                break;
                            default:
                                errorMessage = window.app.state.currentLanguage === 'en' ? 
                                    "An unknown error occurred. Please search for a location." : 
                                    window.app.state.currentLanguage === 'fa' ?
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
                                toastMessage = window.app.state.currentLanguage === 'en' ? 
                                    "Location access denied. Please enable location in your device settings." : 
                                    window.app.state.currentLanguage === 'fa' ?
                                    "دسترسی به موقعیت رد شد. لطفاً مکان‌یابی را در تنظیمات دستگاه خود فعال کنید." :
                                    "دەستگەیشتن بە شوێن ڕەتکرایەوە. تکایە شوێن لە ڕێکخستنەکانی ئامێرەکەت چالاک بکە.";
                                break;
                            default:
                                toastMessage = window.app.state.currentLanguage === 'en' ? 
                                    "Couldn't get your location. Please check device settings." : 
                                    window.app.state.currentLanguage === 'fa' ?
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
            showError(window.app.state.currentLanguage === 'en' ? 
                "Your browser doesn't support geolocation. Please search for a location." : 
                window.app.state.currentLanguage === 'fa' ?
                "مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند. لطفاً یک مکان را جستجو کنید." :
                "وێبگەڕەکەت پشتگیری دۆزینەوەی شوێن ناکات. تکایە شوێنێک بگەڕێ.");
            
            // Load a default location
            getWeatherByLocationName('New York');
        } else {
            showToast(window.app.state.currentLanguage === 'en' ? 
                "Your browser doesn't support geolocation" : 
                window.app.state.currentLanguage === 'fa' ?
                "مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند" :
                "وێبگەڕەکەت پشتگیری دۆزینەوەی شوێن ناکات");
        }
    }
}

// Get weather by location name
async function getWeatherByLocationName(locationName) {
    const loadingMsg = window.app.state.currentLanguage === 'en' ? 
        "Finding location..." : 
        window.app.state.currentLanguage === 'fa' ?
        "در حال یافتن مکان..." :
        "شوێن دەدۆزرێتەوە...";
    
    showLoading(loadingMsg);
    
    try {
        // Normalize location name
        locationName = locationName.trim();
        
        // First check cache
        const cacheKey = `loc_${locationName}`;
        if (window.app.state.dataCache[cacheKey] && !window.app.userPreferences.dataSaverMode) {
            console.log("Using cached location data for:", locationName);
            const cachedData = window.app.state.dataCache[cacheKey];
            
            // Only use cache if it's less than 1 hour old
            const cacheAge = Date.now() - cachedData.timestamp;
            if (cacheAge < 3600000) { // 1 hour in milliseconds
                // Save current location data
                currentLocationData = cachedData.data;
                
                // Proceed with getting weather
                await getWeatherByCoordinates(
                    currentLocationData.latitude, 
                    currentLocationData.longitude,
                    currentLocationData.displayName
                );
                return;
            }
        }
        
        // Get coordinates from location name
        const locationData = await getCoordinates(locationName);
        
        // Cache the location data
        window.app.state.dataCache[cacheKey] = {
            data: locationData,
            timestamp: Date.now()
        };
        
        // Save current location data
        currentLocationData = locationData;
        
        // Save to recent searches
        saveToRecentSearches(locationData);
        
        const weatherLoadingMsg = window.app.state.currentLanguage === 'en' ? 
            "Getting weather data..." : 
            window.app.state.currentLanguage === 'fa' ?
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
        console.error("Error in getWeatherByLocationName:", err);
        showError(err.message || "Failed to find location");
    }
}

// Get weather for coordinates
async function getWeatherByCoordinates(latitude, longitude, displayName, silentRefresh = false) {
    // Skip loading state for silent refresh
    if (!silentRefresh) {
        const loadingMsg = window.app.state.currentLanguage === 'en' ? 
            "Getting weather data..." : 
            window.app.state.currentLanguage === 'fa' ?
            "در حال دریافت داده‌های آب و هوا..." :
            "زانیارییەکانی کەشوهەوا دەهێنرێت...";
        
        showLoading(loadingMsg);
    }
    
    try {
        // Check for custom name
        const locationKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
        const customName = window.app.userPreferences.customLocationNames[locationKey];
        
        // Save current location data
        currentLocationData = {
            latitude,
            longitude,
            displayName: customName || displayName || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`
        };
        
        // Try to get location name if it's coordinates-based
        if (displayName && displayName.includes('°') && !customName) {
            const locationName = await getReverseGeocode(latitude, longitude);
            if (locationName) {
                currentLocationData.displayName = locationName;
            }
        }
        
        // Save to recent searches (not for silent refreshes)
        if (!silentRefresh) {
            saveToRecentSearches(currentLocationData);
        }
        
        // Get weather data
        const weatherData = await fetchWeatherData(latitude, longitude);
        
        // Display the weather
        displayWeatherData(weatherData, currentLocationData.displayName, silentRefresh);
        
        // Only hide loading if not a silent refresh
        if (!silentRefresh) {
            hideLoading();
        }
        
        // Start auto-refresh if enabled
        setupAutoRefresh();
    } catch (err) {
        console.error("Error in getWeatherByCoordinates:", err);
        
        // Only show error if not a silent refresh
        if (!silentRefresh) {
            showError(err.message || "Failed to get weather data");
        } else {
            console.log("Silent refresh failed, will try again later");
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
