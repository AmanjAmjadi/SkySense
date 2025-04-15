// app.js - Main application file that initializes everything

// Enhanced Storage Utility
const storageUtil = {
    data: {},
    
    setItem: function(key, value) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                this.data[key] = value;
                sessionStorage.setItem(key, JSON.stringify(value));
            }
        } catch (err) {
            console.error("Storage error (set):", err);
            try {
                sessionStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                this.data[key] = value;
            }
        }
    },
    
    getItem: function(key) {
        try {
            if (typeof localStorage !== 'undefined') {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } else {
                const item = sessionStorage.getItem(key);
                return item ? JSON.parse(item) : this.data[key] || null;
            }
        } catch (err) {
            console.error("Storage error (get):", err);
            try {
                const item = sessionStorage.getItem(key);
                return item ? JSON.parse(item) : this.data[key] || null;
            } catch (e) {
                return this.data[key] || null;
            }
        }
    },
    
    removeItem: function(key) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key);
            } else {
                sessionStorage.removeItem(key);
            }
            delete this.data[key];
        } catch (err) {
            console.error("Storage error (remove):", err);
            try {
                sessionStorage.removeItem(key);
            } catch (e) {
                delete this.data[key];
            }
        }
    }
};

// Global state
window.currentLanguage = 'en';
window.useMetric = true;
window.currentRefreshInterval = null;
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
    dismissedAlerts: [],
    recentSearches: [],
    autoRefresh: true,
    refreshInterval: 600000, // 10 minutes
    dataSaver: false
};

// Improved WebView detection
window.isWebView = (function() {
    // Various ways to detect WebView
    const userAgent = navigator.userAgent.toLowerCase();
    console.log("User Agent:", userAgent); // Debug user agent
    
    // Feature detection for WebView
    const hasLimitedFeatures = !window.opener && document.referrer === '';
    
    // More comprehensive WebView detection combining user agent and features
    return hasLimitedFeatures || 
           userAgent.indexOf('wv') > -1 || // Android WebView
           userAgent.indexOf('flutter') > -1 || // Flutter WebView
           /android.+webview|wv/.test(userAgent) || // More generic Android WebView
           window.navigator.standalone || // iOS standalone mode (from homescreen)
           window.matchMedia('(display-mode: standalone)').matches;
})();

// Network status detection
let isOnline = navigator.onLine;

// Detect network status changes
window.addEventListener('online', () => {
    isOnline = true;
    document.getElementById('offline-alert').classList.add('hidden');
    
    // Refresh weather data if needed
    if (currentLocationData && currentLocationData.latitude && currentLocationData.longitude) {
        getWeatherByCoordinates(currentLocationData.latitude, currentLocationData.longitude, currentLocationData.displayName, true);
    }
});

window.addEventListener('offline', () => {
    isOnline = false;
    document.getElementById('offline-alert').classList.remove('hidden');
    
    // Show a toast notification
    showToast(window.currentLanguage === 'en' ? 
        "You're offline. Using cached data." : 
        window.currentLanguage === 'fa' ?
        "شما آفلاین هستید. از داده‌های ذخیره شده استفاده می‌شود." :
        "تۆ ئۆفلاینیت. داتای خەزنکراو بەکاردەهێنرێت.", 5000);
});

// Input sanitization utility
function sanitizeInput(input) {
    if (!input || typeof input !== 'string') return '';
    return input.replace(/[<>&"'`]/g, function(match) {
        return {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#39;',
            '`': '&#x60;'
        }[match];
    });
}

// Improved application initialization
async function initApp() {
    console.log("Initializing app...");
    console.log("WebView detected:", window.isWebView);
    
    // Check network status first
    if (!navigator.onLine) {
        document.getElementById('offline-alert').classList.remove('hidden');
    }
    
    // Add meta tag for WebView if needed
    if (window.isWebView) {
        addWebViewMetaTags();
    }
    
    // Load user preferences
    loadUserPreferences();
    
    // Set up essential UI elements first
    setupLanguageSelector();
    
    // Apply preferences to UI in the next tick
    setTimeout(() => {
        applyUserPreferences();
    }, 0);
    
    // Set up event listeners (non-blocking)
    setTimeout(() => {
        setupEventListeners();
    }, 10);
    
    // Check for region and location in parallel
    const promises = [
        checkRegion(),
        new Promise(resolve => {
            // Wait a moment before checking location parameters
            setTimeout(() => {
                checkLocationPermissionParameters();
                resolve();
            }, 100);
        })
    ];
    
    // Wait for crucial initialization steps
    await Promise.all(promises);
    
    // For WebView, display a special message about location permissions
    if (window.isWebView) {
        setTimeout(() => {
            showWebViewLocationHelp();
        }, 500);
    }
    
    // Set up refresh timer if enabled
    setupAutoRefresh();
}

// Set up auto-refresh timer
function setupAutoRefresh() {
    if (window.currentRefreshInterval) {
        clearInterval(window.currentRefreshInterval);
    }
    
    if (window.userPreferences.autoRefresh) {
        window.currentRefreshInterval = setInterval(() => {
            if (isOnline && currentLocationData && currentLocationData.latitude && currentLocationData.longitude) {
                console.log("Auto refreshing weather data...");
                getWeatherByCoordinates(
                    currentLocationData.latitude, 
                    currentLocationData.longitude, 
                    currentLocationData.displayName,
                    true // Silent update
                );
            }
        }, window.userPreferences.refreshInterval);
    }
}

// Add meta tags for WebView
function addWebViewMetaTags() {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.getElementsByTagName('head')[0].appendChild(meta);
    
    // Disable pull-to-refresh
    const style = document.createElement('style');
    style.textContent = `
        html, body {
            overscroll-behavior-y: contain;
            overflow: hidden;
            height: 100%;
        }
        body {
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
    `;
    document.head.appendChild(style);
}

// Show WebView location help
function showWebViewLocationHelp() {
    // Create a helper button for location permissions
    if (document.getElementById('webview-location-helper')) return;
    
    const locationHelper = document.createElement('div');
    locationHelper.id = 'webview-location-helper';
    locationHelper.className = 'fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg z-50 flex items-center justify-center';
    locationHelper.setAttribute('aria-label', 'Use current location');
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

// Enhanced storage for user preferences
function saveUserPreferences() {
    try {
        // Update live preferences
        window.userPreferences.useMetric = window.useMetric;
        window.userPreferences.language = window.currentLanguage;
        
        // Trim recent searches to max 10
        if (window.userPreferences.recentSearches.length > 10) {
            window.userPreferences.recentSearches = window.userPreferences.recentSearches.slice(0, 10);
        }
        
        // Save to storage
        storageUtil.setItem('skyweatherPrefs', window.userPreferences);
    } catch (err) {
        console.error("Error saving preferences:", err);
    }
}

// Load user preferences from storage
function loadUserPreferences() {
    try {
        const savedPreferences = storageUtil.getItem('skyweatherPrefs');
        if (savedPreferences) {
            // Apply saved preferences, keeping defaults where none exist
            window.userPreferences = {
                ...window.userPreferences,
                ...savedPreferences
            };
            
            // Apply to global settings
            window.useMetric = window.userPreferences.useMetric;
            window.currentLanguage = window.userPreferences.language || 'en';
            
            // Initialize collections if needed
            if (!window.userPreferences.customLocationNames) {
                window.userPreferences.customLocationNames = {};
            }
            
            if (!window.userPreferences.dismissedAlerts) {
                window.userPreferences.dismissedAlerts = [];
            }
            
            if (!window.userPreferences.recentSearches) {
                window.userPreferences.recentSearches = [];
            }
        }
    } catch (err) {
        console.error("Error loading preferences:", err);
        
        // Reset to defaults
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
            dismissedAlerts: [],
            recentSearches: [],
            autoRefresh: true,
            refreshInterval: 600000,
            dataSaver: false
        };
        
        window.useMetric = true;
        window.currentLanguage = 'en';
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
    
    // Apply new settings
    document.getElementById('auto-refresh').checked = window.userPreferences.autoRefresh;
    document.getElementById('data-saver').checked = window.userPreferences.dataSaver;
    
    // Set refresh interval in dropdown
    const refreshIntervalSelect = document.getElementById('refresh-interval');
    if (refreshIntervalSelect) {
        for (let i = 0; i < refreshIntervalSelect.options.length; i++) {
            if (parseInt(refreshIntervalSelect.options[i].value) === window.userPreferences.refreshInterval) {
                refreshIntervalSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    // Apply language preference
    setLanguage(window.userPreferences.language || 'en');
    
    // Load favorites
    if (window.userPreferences.favorites && window.userPreferences.favorites.length > 0) {
        renderFavorites();
        document.getElementById('favorites-container').classList.remove('hidden');
    }
    
    // Load recent searches
    renderRecentSearches();
    
    // If weather data is loaded, update the display with the current unit preference
    if (currentWeatherData && currentLocationData) {
        displayWeatherData(currentWeatherData, currentLocationData.displayName);
    }
    
    // Setup auto-refresh timer
    setupAutoRefresh();
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
    
    // Share as image (new)
    document.getElementById('share-as-image').addEventListener('click', createShareableImage);
    document.getElementById('download-image').addEventListener('click', downloadShareImage);
    
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
    
    // Error buttons
    document.getElementById('retry-btn').addEventListener('click', handleRetry);
    document.getElementById('try-default-location-btn').addEventListener('click', () => {
        getWeatherByLocationName('New York');
    });
    
    // Chart type toggles (new)
    document.getElementById('chart-temp-btn').addEventListener('click', () => switchChartType('temperature'));
    document.getElementById('chart-precip-btn').addEventListener('click', () => switchChartType('precipitation'));
    
    // Location input for autocomplete with debounce
    const locationInput = document.getElementById('locationInput');
    locationInput.addEventListener('input', debounce(handleLocationInput, 300));
    locationInput.addEventListener('keydown', handleAutocompleteKeydown);
    
    // Close autocomplete on click outside
    document.addEventListener('click', function(e) {
        const autocompleteList = document.getElementById('autocomplete-list');
        if (!autocompleteList.contains(e.target) && e.target !== locationInput) {
            autocompleteList.innerHTML = '';
            autocompleteList.classList.remove('show');
        }
    });
    
    // Keyboard accessibility for modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close all modals on ESC
            document.getElementById('settings-modal').classList.add('hidden');
            document.getElementById('share-modal').classList.add('hidden');
            document.getElementById('favorites-modal').classList.add('hidden');
            document.getElementById('locationNameModal').classList.remove('show');
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
        
        // Rebuild chart with new colors if it exists
        if (currentWeatherData && currentWeatherData.daily) {
            createWeatherChart(currentWeatherData.daily);
        }
    });
}

// Set up language selector
function setupLanguageSelector() {
    // Set current language in selector
    updateLanguageSelector(window.currentLanguage);
    
    // Set up language selector click handler
    const langSelector = document.getElementById('lang-selector');
    langSelector.addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('lang-options').classList.toggle('show');
    });
    
    // Keyboard support for language selector
    langSelector.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById('lang-options').classList.toggle('show');
        }
    });
    
    // Set up language option click handlers
    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const lang = this.getAttribute('data-lang');
            setLanguage(lang);
            document.getElementById('lang-options').classList.remove('show');
        });
        
        // Keyboard support for language options
        option.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const lang = this.getAttribute('data-lang');
                setLanguage(lang);
                document.getElementById('lang-options').classList.remove('show');
            }
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
            option.setAttribute('aria-selected', 'true');
            const flagImg = option.querySelector('img').src;
            const langName = lang.toUpperCase();
            document.getElementById('current-lang-flag').src = flagImg;
            document.getElementById('current-lang-name').textContent = langName;
        } else {
            option.classList.remove('active');
            option.setAttribute('aria-selected', 'false');
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
        document.documentElement.style.direction = 'rtl';
    } else {
        document.body.setAttribute('dir', 'ltr');
        document.documentElement.style.direction = 'ltr';
    }
    
    // Update all translatable UI elements
    document.querySelectorAll(`[data-${lang}]`).forEach(element => {
        const translation = element.getAttribute(`data-${lang}`);
        if (translation) {
            element.textContent = translation;
        }
    });
    
    // Update placeholder for search input
    const placeholderAttr = `data-placeholder-${lang}`;
    const locationInput = document.getElementById('locationInput');
    if (locationInput.hasAttribute(placeholderAttr)) {
        locationInput.placeholder = locationInput.getAttribute(placeholderAttr);
    }
    
    // Update dropdown options
    document.querySelectorAll('select').forEach(select => {
        Array.from(select.options).forEach(option => {
            const optionTranslation = option.getAttribute(`data-${lang}`);
            if (optionTranslation) {
                option.textContent = optionTranslation;
            }
        });
    });
    
    // Update weather descriptions if weather data is loaded
    if (currentWeatherData && currentLocationData) {
        displayWeatherData(currentWeatherData, currentLocationData.displayName);
    }
    
    // Update error messages if visible
    const errorContainer = document.getElementById('errorContainer');
    if (!errorContainer.classList.contains('hidden') && lastError) {
        showError(getLocalizedErrorMessage(lastError.code || 'unknown', lastError.message));
    }
}

// Track the last error for retries
let lastError = null;

// Get localized error message
function getLocalizedErrorMessage(errorCode, fallbackMessage) {
    const errorMessages = {
        'network_error': {
            'en': "Network connection issue. Please check your connection and try again.",
            'fa': "مشکل اتصال به شبکه. لطفاً اتصال خود را بررسی کرده و دوباره امتحان کنید.",
            'ku': "کێشەی پەیوەندی تۆڕ. تکایە پەیوەندیەکەت بپشکنە و دووبارە هەوڵ بدەوە."
        },
        'location_not_found': {
            'en': "Location not found. Please try a different location.",
            'fa': "مکان پیدا نشد. لطفاً مکان دیگری را امتحان کنید.",
            'ku': "شوێن نەدۆزرایەوە. تکایە شوێنێکی جیاواز تاقی بکەوە."
        },
        'permission_denied': {
            'en': "Location access denied. Please enable location in your device settings.",
            'fa': "دسترسی به موقعیت رد شد. لطفاً مکان‌یابی را در تنظیمات دستگاه خود فعال کنید.",
            'ku': "دەستگەیشتن بە شوێن ڕەتکرایەوە. تکایە شوێن لە ڕێکخستنەکانی ئامێرەکەت چالاک بکە."
        },
        'position_unavailable': {
            'en': "Location information is unavailable. Please check your device settings.",
            'fa': "اطلاعات موقعیت در دسترس نیست. لطفاً تنظیمات دستگاه خود را بررسی کنید.",
            'ku': "زانیاری شوێن بەردەست نییە. تکایە ڕێکخستنەکانی ئامێرەکەت بپشکنە."
        },
        'timeout': {
            'en': "Location request timed out. Please try again.",
            'fa': "درخواست موقعیت به پایان رسید. لطفا دوباره تلاش کنید.",
            'ku': "داواکاری شوێن کاتی بەسەرچوو. تکایە دووبارە هەوڵ بدەوە."
        },
        'weather_api_error': {
            'en': "Error fetching weather data. Please try again later.",
            'fa': "خطا در دریافت اطلاعات آب و هوا. لطفاً بعداً دوباره امتحان کنید.",
            'ku': "هەڵە لە هێنانی زانیاری کەشوهەوا. تکایە دواتر هەوڵ بدەوە."
        },
        'unknown': {
            'en': "An unknown error occurred. Please try again.",
            'fa': "خطای ناشناخته رخ داد. لطفاً دوباره امتحان کنید.",
            'ku': "هەڵەیەکی نەناسراو ڕوویدا. تکایە دووبارە هەوڵ بدەوە."
        }
    };
    
    if (errorMessages[errorCode] && errorMessages[errorCode][window.currentLanguage]) {
        return errorMessages[errorCode][window.currentLanguage];
    }
    
    return fallbackMessage || errorMessages.unknown[window.currentLanguage];
}

// Handle retry button click
function handleRetry() {
    if (!lastError || !lastError.retry) {
        // Default retry - go to New York
        getWeatherByLocationName('New York');
        return;
    }
    
    // Call the stored retry function with arguments
    lastError.retry(...(lastError.args || []));
}

// Add to recent searches
function addToRecentSearches(location) {
    if (!location) return;
    
    // Don't add duplicates
    const existingIndex = window.userPreferences.recentSearches.findIndex(
        item => item.name === location.name
    );
    
    if (existingIndex !== -1) {
        // Remove existing entry to move it to top
        window.userPreferences.recentSearches.splice(existingIndex, 1);
    }
    
    // Add to beginning of array
    window.userPreferences.recentSearches.unshift(location);
    
    // Limit to 10 entries
    if (window.userPreferences.recentSearches.length > 10) {
        window.userPreferences.recentSearches = window.userPreferences.recentSearches.slice(0, 10);
    }
    
    // Save preferences
    saveUserPreferences();
    
    // Update UI
    renderRecentSearches();
}

// Render recent searches
function renderRecentSearches() {
    const recentSearchesList = document.getElementById('recent-searches-list');
    const recentSearchesContainer = document.getElementById('recent-searches');
    
    if (!recentSearchesList || !window.userPreferences.recentSearches || window.userPreferences.recentSearches.length === 0) {
        if (recentSearchesContainer) {
            recentSearchesContainer.classList.add('hidden');
        }
        return;
    }
    
    recentSearchesList.innerHTML = '';
    recentSearchesContainer.classList.remove('hidden');
    
    window.userPreferences.recentSearches.slice(0, 5).forEach(location => {
        const button = document.createElement('button');
        button.className = 'recent-search-item px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full text-sm text-gray-800 dark:text-white transition-colors flex items-center gap-1';
        button.innerHTML = `
            <i class="ti ti-history text-xs"></i>
            <span>${sanitizeInput(location.displayName || location.name)}</span>
        `;
        button.addEventListener('click', () => {
            if (location.latitude && location.longitude) {
                getWeatherByCoordinates(location.latitude, location.longitude, location.displayName || location.name);
            } else {
                getWeatherByLocationName(location.name);
            }
        });
        
        recentSearchesList.appendChild(button);
    });
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
                    
                    // Track error for retry
                    lastError = {
                        code: error.code === 1 ? 'permission_denied' : 
                              error.code === 2 ? 'position_unavailable' : 
                              error.code === 3 ? 'timeout' : 'unknown',
                        message: error.message,
                        retry: getUserLocation,
                        args: [fromMapButton, forceRequest]
                    };
                    
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
    
    // Show skeleton loader in data saver mode, otherwise show regular loader
    if (window.userPreferences.dataSaver) {
        document.getElementById('skeleton-loader').classList.remove('hidden');
    } else {
        showLoading(loadingMsg);
    }
    
    try {
        // Sanitize input
        locationName = sanitizeInput(locationName);
        
        // Get coordinates from location name
        const locationData = await getCoordinates(locationName);
        
        // Save current location data
        currentLocationData = locationData;
        
        // Add to recent searches
        addToRecentSearches({
            name: locationData.name,
            displayName: locationData.displayName,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            country: locationData.country
        });
        
        const weatherLoadingMsg = window.currentLanguage === 'en' ? 
            "Getting weather data..." : 
            window.currentLanguage === 'fa' ?
            "در حال دریافت داده‌های آب و هوا..." :
            "زانیارییەکانی کەشوهەوا دەهێنرێت...";
        
        if (!window.userPreferences.dataSaver) {
            showLoading(weatherLoadingMsg);
        }
        
        // Get weather data
        const weatherData = await fetchWeatherDataWithCache(
            locationData.latitude, 
            locationData.longitude
        );
        
        // Display the weather
        displayWeatherData(weatherData, locationData.displayName);
        hideLoading();
        document.getElementById('skeleton-loader').classList.add('hidden');
        
        // Update map if it exists
        if (map) {
            map.setView([locationData.latitude, locationData.longitude], 10);
            
            // Always remove old marker before adding a new one
            if (marker) {
                map.removeLayer(marker);
            }
            marker = L.marker([locationData.latitude, locationData.longitude]).addTo(map);
        }
        
        // Clear last error
        lastError = null;
    } catch (err) {
        console.error("Error getting location weather:", err);
        
        // Track error for retry
        lastError = {
            code: err.code || 'location_not_found',
            message: err.message,
            retry: getWeatherByLocationName,
            args: [locationName]
        };
        
        showError(getLocalizedErrorMessage(lastError.code, err.message));
        document.getElementById('skeleton-loader').classList.add('hidden');
    }
}

// Get weather for coordinates
async function getWeatherByCoordinates(latitude, longitude, displayName, silentUpdate = false) {
    const loadingMsg = window.currentLanguage === 'en' ? 
        "Getting weather data..." : 
        window.currentLanguage === 'fa' ?
        "در حال دریافت داده‌های آب و هوا..." :
        "زانیارییەکانی کەشوهەوا دەهێنرێت...";
    
    if (!silentUpdate) {
        if (window.userPreferences.dataSaver) {
            document.getElementById('skeleton-loader').classList.remove('hidden');
        } else {
            showLoading(loadingMsg);
        }
    }
    
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
        
        // Add to recent searches
        addToRecentSearches({
            name: currentLocationData.displayName,
            displayName: currentLocationData.displayName,
            latitude: latitude,
            longitude: longitude
        });
        
        // Try to get location name if it's coordinates-based
        if (displayName && displayName.includes('°') && !customName && !silentUpdate) {
            const locationName = await getReverseGeocode(latitude, longitude);
            if (locationName) {
                currentLocationData.displayName = locationName;
            }
        }
        
        // Get weather data with caching
        const weatherData = await fetchWeatherDataWithCache(latitude, longitude);
        
        // If this is a silent update (from auto-refresh), update timestamp only
        if (silentUpdate && currentWeatherData) {
            // Update only the timestamp
            document.getElementById('update-time').textContent = new Date().toLocaleTimeString(
                window.currentLanguage === 'en' ? 'en-US' : 
                window.currentLanguage === 'fa' ? 'fa-IR' : 'ku', 
                { hour: '2-digit', minute: '2-digit' }
            );
            
            // Check for significant changes in weather conditions
            const previousTemp = currentWeatherData.current.temperature_2m;
            const newTemp = weatherData.current.temperature_2m;
            const tempDiff = Math.abs(previousTemp - newTemp);
            
            const previousCode = currentWeatherData.current.weather_code;
            const newCode = weatherData.current.weather_code;
            
            // If significant changes, update the full display
            if (tempDiff >= 2 || previousCode !== newCode) {
                currentWeatherData = weatherData;
                displayWeatherData(weatherData, currentLocationData.displayName, true);
            } else {
                // Minor update only
                currentWeatherData = weatherData;
                
                // Just update current temperature and time without full redraw
                updateCurrentConditions(weatherData);
            }
        } else {
            // Normal update - display all weather data
            displayWeatherData(weatherData, currentLocationData.displayName);
            if (!silentUpdate) {
                hideLoading();
                document.getElementById('skeleton-loader').classList.add('hidden');
            }
        }
        
        // Clear last error
        lastError = null;
    } catch (err) {
        console.error("Error getting coordinate weather:", err);
        
        // Don't show error for silent updates
        if (!silentUpdate) {
            // Track error for retry
            lastError = {
                code: err.code || 'weather_api_error',
                message: err.message,
                retry: getWeatherByCoordinates,
                args: [latitude, longitude, displayName, false]
            };
            
            showError(getLocalizedErrorMessage(lastError.code, err.message));
            document.getElementById('skeleton-loader').classList.add('hidden');
        }
    }
}

// Minor update for current conditions only (for silent updates)
function updateCurrentConditions(data) {
    if (!data || !data.current) return;
    
    // Update temperature
    const temperature = document.getElementById('temperature');
    if (temperature) {
        temperature.textContent = formatTemperature(data.current.temperature_2m, window.useMetric);
    }
    
    // Update feels like
    const feelsLike = document.getElementById('feelsLike');
    if (feelsLike) {
        feelsLike.textContent = formatTemperature(data.current.apparent_temperature || data.current.temperature_2m, window.useMetric);
    }
    
    // Update humidity
    const humidity = document.getElementById('humidity');
    if (humidity) {
        humidity.textContent = `${data.current.relative_humidity_2m}%`;
    }
    
    // Update wind
    const wind = document.getElementById('wind');
    if (wind) {
        wind.textContent = formatWind(data.current.wind_speed_10m, data.current.wind_direction_10m, window.useMetric, window.currentLanguage);
    }
    
    // Update wind compass
    updateWindCompass(data.current.wind_direction_10m);
}

// Helper function: Debounce
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
