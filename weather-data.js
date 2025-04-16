// weather-data.js - Contains weather data processing, API calls and formatting functions with improved reliability

// Weather code to icon mapping for Open-Meteo with enhanced icons
const weatherIcons = {
    // Clear, Sunny
    0: '☀️', // Clear sky
    1: '🌤️', // Mainly clear
    2: '⛅', // Partly cloudy
    3: '☁️', // Overcast
    
    // Fog, Mist
    45: '🌫️', // Fog
    48: '🌫️', // Depositing rime fog
    
    // Drizzle
    51: '🌧️', // Light drizzle
    53: '🌧️', // Moderate drizzle
    55: '🌧️', // Dense drizzle
    
    // Freezing Drizzle
    56: '🌧️', // Light freezing drizzle
    57: '🌧️', // Dense freezing drizzle
    
    // Rain
    61: '🌧️', // Slight rain
    63: '🌧️', // Moderate rain
    65: '🌧️', // Heavy rain
    
    // Freezing Rain
    66: '🌨️', // Light freezing rain
    67: '🌨️', // Heavy freezing rain
    
    // Snow
    71: '❄️', // Slight snow fall
    73: '❄️', // Moderate snow fall
    75: '❄️', // Heavy snow fall
    
    // Snow Grains
    77: '❄️', // Snow grains
    
    // Rain Showers
    80: '🌦️', // Slight rain showers
    81: '🌦️', // Moderate rain showers
    82: '🌦️', // Violent rain showers
    
    // Snow Showers
    85: '🌨️', // Slight snow showers
    86: '🌨️', // Heavy snow showers
    
    // Thunderstorm
    95: '⛈️', // Thunderstorm
    96: '⛈️', // Thunderstorm with slight hail
    99: '⛈️', // Thunderstorm with heavy hail
    
    // Default
    undefined: '🌡️'
};

// WMO Weather interpretation codes to text descriptions
const weatherDescriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
    undefined: "Unknown"
};

// Persian weather descriptions
const weatherDescriptionsFa = {
    0: "آسمان صاف",
    1: "عمدتاً صاف",
    2: "نیمه ابری",
    3: "ابری",
    45: "مه",
    48: "مه سرمازده",
    51: "نم‌نم باران سبک",
    53: "نم‌نم باران متوسط",
    55: "نم‌نم باران شدید",
    56: "نم‌نم باران یخ‌زده خفیف",
    57: "نم‌نم باران یخ‌زده شدید",
    61: "باران سبک",
    63: "باران متوسط",
    65: "باران شدید",
    66: "باران یخ‌زده سبک",
    67: "باران یخ‌زده شدید",
    71: "برف سبک",
    73: "برف متوسط",
    75: "برف سنگین",
    77: "دانه‌های برف",
    80: "بارش‌های سبک باران",
    81: "بارش‌های متوسط باران",
    82: "بارش‌های شدید باران",
    85: "بارش‌های سبک برف",
    86: "بارش‌های شدید برف",
    95: "رعد و برق",
    96: "رعد و برق با تگرگ سبک",
    99: "رعد و برق با تگرگ شدید",
    undefined: "نامشخص"
};

// Kurdish weather descriptions
const weatherDescriptionsKu = {
    0: "ئاسمانی ساف",
    1: "زۆربەی ساف",
    2: "کەمێک هەور",
    3: "هەوراوی",
    45: "تەم",
    48: "تەمی بەستوو",
    51: "باران‌نمەی سووک",
    53: "باران‌نمەی مامناوەند",
    55: "باران‌نمەی چڕ",
    56: "باران‌نمەی بەستووی سووک",
    57: "باران‌نمەی بەستووی چڕ",
    61: "بارانی سووک",
    63: "بارانی مامناوەند",
    65: "بارانی بەهێز",
    66: "بارانی بەستووی سووک",
    67: "بارانی بەستووی بەهێز",
    71: "بەفری سووک",
    73: "بەفری مامناوەند",
    75: "بەفری قورس",
    77: "دەنکە بەفر",
    80: "باراناوی سووک",
    81: "باراناوی مامناوەند",
    82: "باراناوی بەهێز",
    85: "بەفراوی سووک",
    86: "بەفراوی بەهێز",
    95: "هەورە تریشقە",
    96: "هەورە تریشقە لەگەڵ تەرزەی سووک",
    99: "هەورە تریشقە لەگەڵ تەرزەی بەهێز",
    undefined: "نەزانراو"
};

// IMPROVED: Weather alert information with detailed recommendations
const weatherAlertInfo = {
    // Rain alerts
    51: { severity: 1, icon: "ti ti-cloud-rain", actions: ["carry_umbrella", "drive_carefully"] },
    53: { severity: 1, icon: "ti ti-cloud-rain", actions: ["carry_umbrella", "drive_carefully"] },
    55: { severity: 2, icon: "ti ti-cloud-rain", actions: ["carry_umbrella", "drive_carefully", "flood_risk"] },
    
    // Freezing rain alerts
    56: { severity: 2, icon: "ti ti-snowflake", actions: ["dress_warmly", "drive_carefully", "ice_risk"] },
    57: { severity: 2, icon: "ti ti-snowflake", actions: ["dress_warmly", "drive_carefully", "ice_risk"] },
    
    // Rain alerts
    61: { severity: 1, icon: "ti ti-cloud-rain", actions: ["carry_umbrella", "drive_carefully"] },
    63: { severity: 2, icon: "ti ti-cloud-rain", actions: ["carry_umbrella", "drive_carefully", "flood_risk"] },
    65: { severity: 3, icon: "ti ti-cloud-rain", actions: ["stay_indoors", "flood_risk", "avoid_rivers"] },
    
    // Freezing Rain
    66: { severity: 2, icon: "ti ti-snowflake", actions: ["dress_warmly", "drive_carefully", "ice_risk"] },
    67: { severity: 3, icon: "ti ti-snowflake", actions: ["stay_indoors", "avoid_travel", "ice_risk"] },
    
    // Snow
    71: { severity: 1, icon: "ti ti-snowflake", actions: ["dress_warmly", "drive_carefully"] },
    73: { severity: 2, icon: "ti ti-snowflake", actions: ["dress_warmly", "drive_carefully", "check_heating"] },
    75: { severity: 3, icon: "ti ti-snowflake", actions: ["stay_indoors", "avoid_travel", "check_heating", "snow_risk"] },
    77: { severity: 2, icon: "ti ti-snowflake", actions: ["dress_warmly", "drive_carefully"] },
    
    // Rain Showers
    80: { severity: 1, icon: "ti ti-cloud-rain", actions: ["carry_umbrella"] },
    81: { severity: 2, icon: "ti ti-cloud-rain", actions: ["carry_umbrella", "drive_carefully"] },
    82: { severity: 3, icon: "ti ti-cloud-rain", actions: ["stay_indoors", "avoid_travel", "flood_risk"] },
    
    // Snow Showers
    85: { severity: 1, icon: "ti ti-snowflake", actions: ["dress_warmly", "drive_carefully"] },
    86: { severity: 2, icon: "ti ti-snowflake", actions: ["dress_warmly", "drive_carefully", "check_heating"] },
    
    // Thunderstorm
    95: { severity: 3, icon: "ti ti-bolt", actions: ["stay_indoors", "unplug_electronics", "avoid_trees"] },
    96: { severity: 3, icon: "ti ti-bolt", actions: ["stay_indoors", "unplug_electronics", "avoid_trees", "hail_risk"] },
    99: { severity: 3, icon: "ti ti-bolt", actions: ["stay_indoors", "unplug_electronics", "avoid_trees", "hail_risk"] }
};

// Weather alert action recommendations
const weatherAlertActions = {
    // English actions
    en: {
        carry_umbrella: { icon: "ti ti-umbrella", text: "Carry an umbrella" },
        drive_carefully: { icon: "ti ti-car", text: "Drive with caution" },
        dress_warmly: { icon: "ti ti-shirt", text: "Dress warmly in layers" },
        stay_indoors: { icon: "ti ti-home", text: "Stay indoors if possible" },
        avoid_travel: { icon: "ti ti-map", text: "Avoid unnecessary travel" },
        unplug_electronics: { icon: "ti ti-plug", text: "Unplug sensitive electronics" },
        avoid_trees: { icon: "ti ti-tree", text: "Avoid trees and open areas" },
        check_heating: { icon: "ti ti-temperature", text: "Check heating systems" },
        flood_risk: { icon: "ti ti-waves", text: "Be aware of flooding risks" },
        ice_risk: { icon: "ti ti-ice-skating", text: "Watch for icy surfaces" },
        snow_risk: { icon: "ti ti-snowflake", text: "Heavy snow may block roads" },
        hail_risk: { icon: "ti ti-ball-baseball", text: "Take cover from hail" },
        avoid_rivers: { icon: "ti ti-droplet", text: "Avoid rivers and streams" }
    },
    // Persian actions
    fa: {
        carry_umbrella: { icon: "ti ti-umbrella", text: "چتر همراه داشته باشید" },
        drive_carefully: { icon: "ti ti-car", text: "با احتیاط رانندگی کنید" },
        dress_warmly: { icon: "ti ti-shirt", text: "لباس گرم و لایه‌ای بپوشید" },
        stay_indoors: { icon: "ti ti-home", text: "در صورت امکان در خانه بمانید" },
        avoid_travel: { icon: "ti ti-map", text: "از سفرهای غیرضروری خودداری کنید" },
        unplug_electronics: { icon: "ti ti-plug", text: "وسایل الکترونیکی حساس را از برق بکشید" },
        avoid_trees: { icon: "ti ti-tree", text: "از درختان و فضاهای باز دوری کنید" },
        check_heating: { icon: "ti ti-temperature", text: "سیستم‌های گرمایشی را بررسی کنید" },
        flood_risk: { icon: "ti ti-waves", text: "مراقب خطر سیل باشید" },
        ice_risk: { icon: "ti ti-ice-skating", text: "مراقب سطوح یخ‌زده باشید" },
        snow_risk: { icon: "ti ti-snowflake", text: "برف سنگین ممکن است جاده‌ها را مسدود کند" },
        hail_risk: { icon: "ti ti-ball-baseball", text: "از تگرگ پناه بگیرید" },
        avoid_rivers: { icon: "ti ti-droplet", text: "از رودخانه‌ها و جویبارها دوری کنید" }
    },
    // Kurdish actions
    ku: {
        carry_umbrella: { icon: "ti ti-umbrella", text: "چەتر لەگەڵ خۆت ببە" },
        drive_carefully: { icon: "ti ti-car", text: "بە ووریاییەوە بخوڕە" },
        dress_warmly: { icon: "ti ti-shirt", text: "جلی گەرم و چەند چینی لەبەر بکە" },
        stay_indoors: { icon: "ti ti-home", text: "ئەگەر دەکرێت لە ماڵەوە بمێنەوە" },
        avoid_travel: { icon: "ti ti-map", text: "خۆت لە سەفەری ناپێویست بپارێزە" },
        unplug_electronics: { icon: "ti ti-plug", text: "ئامێرە ئەلیکترۆنییە هەستیارەکان لە پریز دەربێنە" },
        avoid_trees: { icon: "ti ti-tree", text: "خۆت لە درەخت و شوێنی کراوە بپارێزە" },
        check_heating: { icon: "ti ti-temperature", text: "سیستەمەکانی گەرمکردنەوە چاک بکە" },
        flood_risk: { icon: "ti ti-waves", text: "ئاگاداری مەترسی لافاو بە" },
        ice_risk: { icon: "ti ti-ice-skating", text: "ئاگاداری ڕوو بەستووەکان بە" },
        snow_risk: { icon: "ti ti-snowflake", text: "بەفری قورس لەوانەیە ڕێگاکان ببەستێت" },
        hail_risk: { icon: "ti ti-ball-baseball", text: "خۆت لە تەرزە بپارێزە" },
        avoid_rivers: { icon: "ti ti-droplet", text: "دووربە لە ڕووبار و جۆگەکان" }
    }
};

// Air Quality Index (AQI) descriptions
const aqiDescriptions = {
    en: {
        good: "Good",
        moderate: "Moderate",
        poor: "Poor",
        veryPoor: "Very Poor",
        hazardous: "Hazardous"
    },
    fa: {
        good: "خوب",
        moderate: "متوسط",
        poor: "ضعیف",
        veryPoor: "خیلی ضعیف",
        hazardous: "خطرناک"
    },
    ku: {
        good: "باش",
        moderate: "مامناوەند",
        poor: "خراپ",
        veryPoor: "زۆر خراپ",
        hazardous: "مەترسیدار"
    }
};

// API Status and Cache Management
const API_CACHE = {
    weatherData: {}, // Cache for weather data
    locationData: {} // Cache for location data
};

// Cache expiration times
const CACHE_EXPIRATION = {
    WEATHER: 30 * 60 * 1000, // 30 minutes
    LOCATION: 7 * 24 * 60 * 60 * 1000 // 7 days
};

let isIranianIP = false;

// Function to detect region by testing API connectivity with better reliability
async function checkRegion() {
    try {
        console.log("Checking user region...");
        
        // Create cache key based on navigator properties
        const cacheKey = `region_${navigator.language}_${navigator.userAgent.substring(0, 50)}`;
        
        // Check if we have cached region data
        try {
            const cachedRegion = localStorage.getItem(cacheKey);
            if (cachedRegion) {
                const regionData = JSON.parse(cachedRegion);
                // Use cache if it's less than 24 hours old
                if (Date.now() - regionData.timestamp < 24 * 60 * 60 * 1000) {
                    isIranianIP = regionData.isIranianIP;
                    console.log(`Using cached region data: ${isIranianIP ? "Iranian IP" : "Non-Iranian IP"}`);
                    return;
                }
            }
        } catch (e) {
            console.log("Error reading region cache:", e);
        }
        
        // Try accessing OpenWeatherMap with a short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        try {
            const response = await fetch('https://api.openweathermap.org/data/2.5/weather?lat=35.7&lon=51.4&appid=4d8fb5b93d4af21d66a2948710284366', {
                signal: controller.signal,
                method: 'HEAD' // Just check if the resource is available, don't download data
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                isIranianIP = false;
                console.log("Using OpenWeatherMap API (non-Iranian IP)");
            } else {
                // If status code isn't 2xx, likely region-restricted
                isIranianIP = true;
                console.log("OpenWeatherMap API returned error, using Open-Meteo API as primary (likely Iranian IP)");
            }
        } catch (error) {
            // Connection error - likely due to network restrictions
            clearTimeout(timeoutId);
            isIranianIP = true;
            console.log("OpenWeatherMap API unavailable, using Open-Meteo API as primary");
        }
        
        // Save the region detection result to cache
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                isIranianIP,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.log("Error saving region cache:", e);
        }
    } catch (err) {
        console.error("Region detection error:", err);
        // Default to most reliable API if detection fails
        isIranianIP = true;
    }
}

// Enhanced fetch with timeout, retry, and better error handling
async function enhancedFetch(url, options = {}) {
    const { 
        timeout = 8000, 
        retries = 2,
        retryDelay = 1000,
        ...fetchOptions 
    } = options;
    
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // Create AbortController for this attempt
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, { 
                ...fetchOptions,
                signal: controller.signal 
            });
            
            // Clear the timeout since fetch completed
            clearTimeout(timeoutId);
            
            // Check if the response is ok
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (err) {
            lastError = err;
            
            // Log the error
            console.warn(`Fetch attempt ${attempt + 1}/${retries + 1} failed:`, err.message);
            
            // If we've reached max retries, throw the error
            if (attempt === retries) {
                throw lastError;
            }
            
            // Wait before next retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
    }
    
    // This should never be reached due to the throw in the loop, but just in case
    throw lastError;
}

// Format temperature with units and better rounding
function formatTemperature(temp, useMetric) {
    if (!useMetric) {
        // Convert to Fahrenheit
        temp = (temp * 9/5) + 32;
    }
    
    // Round to 1 decimal place for more precise display
    const roundedTemp = Math.round(temp * 10) / 10;
    
    // If the number has no decimal part, don't display the decimal point
    const formattedTemp = Number.isInteger(roundedTemp) ? Math.round(roundedTemp) : roundedTemp;
    
    return `${formattedTemp}°${useMetric ? 'C' : 'F'}`;
}

// Format date string from ISO date with improved locale support
function formatDate(dateString, currentLanguage) {
    const date = new Date(dateString);
    
    // Handle invalid dates
    if (isNaN(date.getTime())) {
        return dateString; // Return the original string if date is invalid
    }
    
    try {
        // For all languages, use Gregorian calendar with translated month/day names
        if (currentLanguage === 'fa') {
            // Persian month names in Gregorian calendar
            const persianMonths = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];
            const persianDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
            return `${persianDays[date.getDay()]}، ${date.getDate()} ${persianMonths[date.getMonth()]}`;
        } else if (currentLanguage === 'ku') {
            // Kurdish month names in Gregorian calendar
            const kurdishMonths = ['ژانویە', 'فێبریوەری', 'مارس', 'ئەپریل', 'مەی', 'جوون', 'جولای', 'ئۆگەست', 'سێپتەمبەر', 'ئۆکتۆبەر', 'نۆڤەمبەر', 'دیسەمبەر'];
            const kurdishDays = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
            return `${kurdishDays[date.getDay()]}، ${date.getDate()} ${kurdishMonths[date.getMonth()]}`;
        } else {
            // Use browser's built-in formatting for English
            // This handles more locales automatically
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (error) {
        console.error("Date formatting error:", error);
        // Fall back to a simple format if there's an error
        return `${date.getDate()}/${date.getMonth() + 1}`;
    }
}

// Format time from ISO date or hour string with better error handling
function formatTime(timeString, currentLanguage) {
    try {
        let date;
        if (timeString.includes('T')) {
            // Full ISO date
            date = new Date(timeString);
        } else if (timeString.length === 2) {
            // Hour string (e.g., "09")
            date = new Date();
            date.setHours(parseInt(timeString, 10), 0, 0);
        } else {
            return timeString;
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return timeString;
        }
        
        // Time formatting is generally the same across languages
        let locale = 'en-US';
        if (currentLanguage === 'fa') {
            locale = 'fa-IR';
        } else if (currentLanguage === 'ku') {
            // For Kurdish, we'll use Arabic locale which is close to Kurdish formatting
            locale = 'ar-IQ';
        }
        
        return date.toLocaleTimeString(locale, { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: locale === 'en-US' // Use 12-hour format for English, 24-hour for others
        });
    } catch (error) {
        console.error("Time formatting error:", error);
        return timeString;
    }
}

// Convert wind speed and direction to human-readable format with enhanced descriptions
function formatWind(speed, direction, useMetric, currentLanguage) {
    let formattedSpeed;
    
    if (useMetric) {
        // Converting m/s to km/h
        const kmhSpeed = Math.round(speed * 3.6);
        formattedSpeed = `${kmhSpeed} ${currentLanguage === 'en' ? 'km/h' : currentLanguage === 'fa' ? 'کیلومتر/ساعت' : 'کیلۆمەتر/کاتژمێر'}`;
    } else {
        // Converting m/s to mph
        const mphSpeed = Math.round(speed * 2.237);
        formattedSpeed = `${mphSpeed} ${currentLanguage === 'en' ? 'mph' : currentLanguage === 'fa' ? 'مایل/ساعت' : 'مایل/کاتژمێر'}`;
    }
    
    // Get cardinal direction with more precision (16 directions instead of 8)
    const directions = {
        en: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
        fa: ['شمال', 'شمال-شمال‌شرق', 'شمال‌شرق', 'شرق-شمال‌شرق', 'شرق', 'شرق-جنوب‌شرق', 'جنوب‌شرق', 'جنوب-جنوب‌شرق', 'جنوب', 'جنوب-جنوب‌غرب', 'جنوب‌غرب', 'غرب-جنوب‌غرب', 'غرب', 'غرب-شمال‌غرب', 'شمال‌غرب', 'شمال-شمال‌غرب'],
        ku: ['باکوور', 'باکوور-باکووری ڕۆژهەڵات', 'باکووری ڕۆژهەڵات', 'ڕۆژهەڵات-باکووری ڕۆژهەڵات', 'ڕۆژهەڵات', 'ڕۆژهەڵات-باشووری ڕۆژهەڵات', 'باشووری ڕۆژهەڵات', 'باشوور-باشووری ڕۆژهەڵات', 'باشوور', 'باشوور-باشووری ڕۆژئاوا', 'باشووری ڕۆژئاوا', 'ڕۆژئاوا-باشووری ڕۆژئاوا', 'ڕۆژئاوا', 'ڕۆژئاوا-باکووری ڕۆژئاوا', 'باکووری ڕۆژئاوا', 'باکوور-باکووری ڕۆژئاوا']
    };
    
    // More precise calculation using 16 directions
    const index = Math.round(direction / 22.5) % 16;
    
    // Add beaufort scale description for English
    let beaufortDesc = '';
    if (currentLanguage === 'en') {
        if (speed < 0.5) beaufortDesc = ' (Calm)';
        else if (speed < 1.5) beaufortDesc = ' (Light air)';
        else if (speed < 3.3) beaufortDesc = ' (Light breeze)';
        else if (speed < 5.5) beaufortDesc = ' (Gentle breeze)';
        else if (speed < 7.9) beaufortDesc = ' (Moderate breeze)';
        else if (speed < 10.7) beaufortDesc = ' (Fresh breeze)';
        else if (speed < 13.8) beaufortDesc = ' (Strong breeze)';
        else if (speed < 17.1) beaufortDesc = ' (Moderate gale)';
        else if (speed < 20.7) beaufortDesc = ' (Fresh gale)';
        else if (speed < 24.4) beaufortDesc = ' (Strong gale)';
        else if (speed < 28.4) beaufortDesc = ' (Storm)';
        else if (speed < 32.6) beaufortDesc = ' (Violent storm)';
        else beaufortDesc = ' (Hurricane)';
    } else if (currentLanguage === 'fa') {
        if (speed < 0.5) beaufortDesc = ' (آرام)';
        else if (speed < 1.5) beaufortDesc = ' (هوای سبک)';
        else if (speed < 3.3) beaufortDesc = ' (نسیم سبک)';
        else if (speed < 5.5) beaufortDesc = ' (نسیم ملایم)';
        else if (speed < 7.9) beaufortDesc = ' (نسیم متوسط)';
        else if (speed < 10.7) beaufortDesc = ' (نسیم تازه)';
        else if (speed < 13.8) beaufortDesc = ' (نسیم قوی)';
        else if (speed < 17.1) beaufortDesc = ' (باد متوسط)';
        else if (speed < 20.7) beaufortDesc = ' (باد تازه)';
        else if (speed < 24.4) beaufortDesc = ' (باد قوی)';
        else if (speed < 28.4) beaufortDesc = ' (طوفان)';
        else if (speed < 32.6) beaufortDesc = ' (طوفان شدید)';
        else beaufortDesc = ' (گردباد)';
    } else { // Kurdish
        if (speed < 0.5) beaufortDesc = ' (هێمن)';
        else if (speed < 1.5) beaufortDesc = ' (هەوای سووک)';
        else if (speed < 3.3) beaufortDesc = ' (بای سووک)';
        else if (speed < 5.5) beaufortDesc = ' (بای نەرم)';
        else if (speed < 7.9) beaufortDesc = ' (بای مامناوەند)';
        else if (speed < 10.7) beaufortDesc = ' (بای تازە)';
        else if (speed < 13.8) beaufortDesc = ' (بای بەهێز)';
        else if (speed < 17.1) beaufortDesc = ' (بای مامناوەندی بەهێز)';
        else if (speed < 20.7) beaufortDesc = ' (بای تازەی بەهێز)';
        else if (speed < 24.4) beaufortDesc = ' (بای زۆر بەهێز)';
        else if (speed < 28.4) beaufortDesc = ' (ڕەشەبا)';
        else if (speed < 32.6) beaufortDesc = ' (ڕەشەبای توند)';
        else beaufortDesc = ' (گەردەلوول)';
    }
    
    // Don't add description for winds less than 0.5 m/s
    const directionText = directions[currentLanguage][index];
    return speed < 0.5 ? formattedSpeed : `${formattedSpeed} ${directionText}${beaufortDesc}`;
}

// Fetch weather data with enhanced caching, fallback mechanisms, and error handling
async function fetchWeatherData(latitude, longitude) {
    try {
        console.log("Fetching weather data for:", latitude, longitude);
        
        // Generate a cache key
        const cacheKey = `weather_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${window.app.state.useMetric ? 'metric' : 'imperial'}`;
        
        // Check cache first if data saver mode is not enabled
        if (!window.app.userPreferences.dataSaverMode) {
            const cachedData = API_CACHE.weatherData[cacheKey];
            
            if (cachedData) {
                const now = Date.now();
                if (now - cachedData.timestamp < CACHE_EXPIRATION.WEATHER) {
                    console.log("Using cached weather data");
                    return cachedData.data;
                } else {
                    console.log("Cache expired, fetching fresh data");
                }
            }
        }
        
        // Network detection - if offline, throw a specific error
        if (!navigator.onLine) {
            throw new Error(window.app.state.currentLanguage === 'en' ? 
                "You're offline. Please connect to the internet and try again." : 
                window.app.state.currentLanguage === 'fa' ?
                "شما آفلاین هستید. لطفاً به اینترنت متصل شوید و دوباره تلاش کنید." :
                "تۆ دەرهێڵیت. تکایە پەیوەندی بە ئینتەرنێتەوە بکە و دووبارە هەوڵ بدەوە.");
        }
        
        // Always try Open-Meteo first as it's more reliable globally
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset&timezone=auto`;
            
            const response = await enhancedFetch(url, { timeout: 8000 });
            const data = await response.json();
            
            // Cache the successful response
            API_CACHE.weatherData[cacheKey] = {
                data,
                timestamp: Date.now()
            };
            
            return data;
        } catch (error) {
            console.error("Open-Meteo API error:", error);
            
            // Try OpenWeatherMap as fallback
            console.log("Trying OpenWeatherMap as fallback");
            
            try {
                const owmUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely&units=metric&appid=4d8fb5b93d4af21d66a2948710284366`;
                
                const response = await enhancedFetch(owmUrl, { timeout: 8000 });
                const owmData = await response.json();
                
                // Convert OpenWeatherMap data to Open-Meteo format
                const convertedData = convertOwmToOpenMeteo(owmData);
                
                // Cache the successful response
                API_CACHE.weatherData[cacheKey] = {
                    data: convertedData,
                    timestamp: Date.now()
                };
                
                return convertedData;
            } catch (owmError) {
                console.error("OpenWeatherMap API error:", owmError);
                
                // If both APIs fail, throw a user-friendly error
                throw new Error(window.app.state.currentLanguage === 'en' ? 
                    "Weather data services are currently unavailable. Please try again later." : 
                    window.app.state.currentLanguage === 'fa' ?
                    "خدمات داده‌های آب و هوایی در حال حاضر در دسترس نیستند. لطفاً بعداً دوباره تلاش کنید." :
                    "خزمەتگوزاریەکانی زانیاری کەشوهەوا لە ئێستادا بەردەست نین. تکایە دواتر هەوڵ بدەوە.");
            }
        }
    } catch (err) {
        console.error("Weather API error:", err);
        throw new Error(err.message || (window.app.state.currentLanguage === 'en' ? 
            "Could not fetch weather data" : 
            window.app.state.currentLanguage === 'fa' ?
            "نمی‌توان داده‌های آب و هوا را دریافت کرد" :
            "نەتوانرا زانیاری کەشوهەوا وەربگیرێت"));
    }
}

// Convert OpenWeatherMap data to Open-Meteo format with improved accuracy
function convertOwmToOpenMeteo(owmData) {
    // Map OWM weather codes to WMO codes (enhanced mapping)
    function mapWeatherCode(owmId) {
        // More accurate mappings based on OpenWeatherMap documentation
        // Thunderstorm
        if (owmId >= 200 && owmId < 210) return 95; // Thunderstorm with rain
        if (owmId >= 210 && owmId < 220) return 95; // Thunderstorm
        if (owmId >= 220 && owmId < 230) return 96; // Thunderstorm with hail
        if (owmId >= 230 && owmId < 300) return 99; // Thunderstorm with heavy hail
        
        // Drizzle
        if (owmId >= 300 && owmId < 310) return 51; // Light drizzle
        if (owmId >= 310 && owmId < 320) return 53; // Moderate drizzle
        if (owmId >= 320 && owmId < 400) return 55; // Dense drizzle
        
        // Rain
        if (owmId === 500) return 61; // Light rain
        if (owmId === 501) return 63; // Moderate rain
        if (owmId >= 502 && owmId <= 504) return 65; // Heavy rain
        if (owmId === 511) return 66; // Freezing rain
        if (owmId >= 520 && owmId < 530) return 80; // Rain showers
        
        // Snow
        if (owmId === 600) return 71; // Light snow
        if (owmId === 601) return 73; // Moderate snow
        if (owmId === 602) return 75; // Heavy snow
        if (owmId === 611 || owmId === 612) return 66; // Sleet
        if (owmId === 613) return 67; // Heavy sleet
        if (owmId === 615 || owmId === 616) return 68; // Rain and snow
        if (owmId >= 620 && owmId < 630) return 85; // Snow showers
        
        // Atmosphere
        if (owmId === 701 || owmId === 721) return 45; // Fog
        if (owmId === 741) return 45; // Fog
        if (owmId === 751 || owmId === 761) return 45; // Dust/Sand
        if (owmId === 762) return 45; // Volcanic ash
        if (owmId === 771) return 82; // Squalls
        if (owmId === 781) return 99; // Tornado
        
        // Clear and clouds
        if (owmId === 800) return 0; // Clear sky
        if (owmId === 801) return 1; // Few clouds (11-25%)
        if (owmId === 802) return 2; // Scattered clouds (25-50%)
        if (owmId === 803) return 2; // Broken clouds (51-84%)
        if (owmId === 804) return 3; // Overcast clouds (85-100%)
        
        return 3; // Default to overcast
    }
    
    // Create daily arrays
    const dailyData = {
        time: [],
        weather_code: [],
        temperature_2m_max: [],
        temperature_2m_min: [],
        precipitation_sum: [],
        sunrise: [],
        sunset: []
    };
    
    // Enhanced error handling for daily data
    try {
        const dailyLength = Math.min(7, owmData.daily?.length || 0);
        
        for (let i = 0; i < dailyLength; i++) {
            const day = owmData.daily[i];
            if (!day) continue;
            
            const date = new Date((day.dt || 0) * 1000);
            dailyData.time.push(date.toISOString().split('T')[0]);
            dailyData.weather_code.push(mapWeatherCode(day.weather?.[0]?.id || 0));
            dailyData.temperature_2m_max.push(day.temp?.max || 0);
            dailyData.temperature_2m_min.push(day.temp?.min || 0);
            dailyData.precipitation_sum.push(day.rain || day.snow || 0);
            
            // Handle missing sunrise/sunset times
            const sunrise = (day.sunrise || 0) * 1000;
            const sunset = (day.sunset || 0) * 1000;
            
            dailyData.sunrise.push(sunrise ? new Date(sunrise).toISOString() : null);
            dailyData.sunset.push(sunset ? new Date(sunset).toISOString() : null);
        }
    } catch (error) {
        console.error("Error processing daily OWM data:", error);
    }
    
    // Create hourly arrays
    const hourlyData = {
        time: [],
        temperature_2m: [],
        weather_code: [],
        precipitation_probability: []
    };
    
    // Enhanced error handling for hourly data
    try {
        const hourlyLength = Math.min(24, owmData.hourly?.length || 0);
        
        for (let i = 0; i < hourlyLength; i++) {
            const hour = owmData.hourly[i];
            if (!hour) continue;
            
            const date = new Date((hour.dt || 0) * 1000);
            hourlyData.time.push(date.toISOString());
            hourlyData.temperature_2m.push(hour.temp || 0);
            hourlyData.weather_code.push(mapWeatherCode(hour.weather?.[0]?.id || 0));
            hourlyData.precipitation_probability.push(Math.round((hour.pop || 0) * 100)); // Convert from 0-1 to percentage
        }
    } catch (error) {
        console.error("Error processing hourly OWM data:", error);
    }
    
    // Create current data
    const current = {
        temperature_2m: owmData.current?.temp || 0,
        apparent_temperature: owmData.current?.feels_like || 0,
        relative_humidity_2m: owmData.current?.humidity || 0,
        weather_code: mapWeatherCode(owmData.current?.weather?.[0]?.id || 0),
        wind_speed_10m: owmData.current?.wind_speed || 0,
        wind_direction_10m: owmData.current?.wind_deg || 0,
        uv_index: owmData.current?.uvi || 0
    };
    
    // Return in Open-Meteo format
    return {
        current,
        hourly: hourlyData,
        daily: dailyData
    };
}

// Get coordinates from location name with enhanced caching and error handling
async function getCoordinates(locationName) {
    try {
        console.log("Getting coordinates for:", locationName);
        
        // Normalize location name
        locationName = locationName.trim().toLowerCase();
        
        // Generate a cache key
        const cacheKey = `location_${locationName.replace(/\s+/g, '_')}_${window.app.state.currentLanguage}`;
        
        // Check cache first if data saver mode is not enabled
        if (!window.app.userPreferences.dataSaverMode) {
            const cachedData = API_CACHE.locationData[cacheKey];
            
            if (cachedData) {
                const now = Date.now();
                if (now - cachedData.timestamp < CACHE_EXPIRATION.LOCATION) {
                    console.log("Using cached location data");
                    return cachedData.data;
                }
            }
        }
        
        // Network detection - if offline, throw a specific error
        if (!navigator.onLine) {
            throw new Error(window.app.state.currentLanguage === 'en' ? 
                "You're offline. Please connect to the internet and try again." : 
                window.app.state.currentLanguage === 'fa' ?
                "شما آفلاین هستید. لطفاً به اینترنت متصل شوید و دوباره تلاش کنید." :
                "تۆ دەرهێڵیت. تکایە پەیوەندی بە ئینتەرنێتەوە بکە و دووبارە هەوڵ بدەوە.");
        }
        
        // Determine which API to try first based on user location
        if (isIranianIP) {
            try {
                // First try Open-Meteo for Iranian users
                const response = await enhancedFetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=${window.app.state.currentLanguage || 'en'}`,
                    { timeout: 5000 }
                );
                
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    const location = data.results[0];
                    const result = {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        name: location.name,
                        country: location.country,
                        displayName: `${location.name}, ${location.country}`
                    };
                    
                    // Cache the successful result
                    API_CACHE.locationData[cacheKey] = {
                        data: result,
                        timestamp: Date.now()
                    };
                    
                    return result;
                }
            } catch (error) {
                console.log("Open-Meteo geocoding failed, trying OpenWeatherMap");
            }
        }
        
        // Try OpenWeatherMap API (or as fallback for Iranian users)
        try {
            const response = await enhancedFetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationName)}&limit=1&appid=4d8fb5b93d4af21d66a2948710284366`,
                { timeout: 5000 }
            );
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                const location = data[0];
                const result = {
                    latitude: location.lat,
                    longitude: location.lon,
                    name: location.name,
                    country: location.country,
                    displayName: `${location.name}, ${location.country}`
                };
                
                // Cache the successful result
                API_CACHE.locationData[cacheKey] = {
                    data: result,
                    timestamp: Date.now()
                };
                
                return result;
            }
        } catch (error) {
            console.error("OpenWeatherMap geocoding failed");
            
            // If we're in Iran and already tried Open-Meteo, try third geocoder as last resort
            if (isIranianIP) {
                try {
                    // Try nominatim as last resort
                    const response = await enhancedFetch(
                        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
                        { 
                            timeout: 5000,
                            headers: {
                                'User-Agent': 'SkySenseWeatherApp/1.0'
                            }
                        }
                    );
                    
                    const data = await response.json();
                    
                    if (data && data.length > 0) {
                        const location = data[0];
                        const result = {
                            latitude: parseFloat(location.lat),
                            longitude: parseFloat(location.lon),
                            name: location.display_name.split(',')[0],
                            country: location.display_name.split(',').pop().trim(),
                            displayName: location.display_name.split(',').slice(0, 2).join(',')
                        };
                        
                        // Cache the successful result
                        API_CACHE.locationData[cacheKey] = {
                            data: result,
                            timestamp: Date.now()
                        };
                        
                        return result;
                    }
                } catch (nominatimError) {
                    console.error("Nominatim geocoding failed:", nominatimError);
                }
            }
            
            throw new Error(window.app.state.currentLanguage === 'en' ? 
                "Network issues detected. Please check your connection or try a different location." : 
                window.app.state.currentLanguage === 'fa' ?
                "مشکلات شبکه تشخیص داده شد. لطفاً اتصال خود را بررسی کنید یا مکان دیگری را امتحان کنید." :
                "کێشەکانی تۆڕ دۆزرانەوە. تکایە پەیوەندی خۆت بپشکنە یان شوێنێکی جیاواز تاقی بکەرەوە.");
        }
        
        throw new Error(window.app.state.currentLanguage === 'en' ? 
            "Location not found. Please try a different search term." : 
            window.app.state.currentLanguage === 'fa' ?
            "مکان پیدا نشد. لطفاً عبارت جستجوی دیگری را امتحان کنید." :
            "شوێن نەدۆزرایەوە. تکایە دەستەواژەیەکی جیاوازی گەڕان تاقی بکەرەوە.");
    } catch (err) {
        console.error("Geocoding error:", err);
        throw new Error(err.message || (window.app.state.currentLanguage === 'en' ? 
            "Could not find coordinates for this location" : 
            window.app.state.currentLanguage === 'fa' ?
            "نمی‌توان مختصات این مکان را پیدا کرد" :
            "نەتوانرا دووری ئەم شوێنە بدۆزرێتەوە"));
    }
}

// Get location name from coordinates with enhanced error handling
async function getReverseGeocode(latitude, longitude) {
    // Try to get the real location name
    try {
        // Check if we have a network connection
        if (!navigator.onLine) {
            return null;
        }
        
        // Generate a cache key
        const cacheKey = `revgeo_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${window.app.state.currentLanguage}`;
        
        // Check cache first if data saver mode is not enabled
        if (!window.app.userPreferences.dataSaverMode) {
            // Try to load from localStorage first for persistent caching
            try {
                const storedCache = localStorage.getItem(cacheKey);
                if (storedCache) {
                    const parsedCache = JSON.parse(storedCache);
                    if (Date.now() - parsedCache.timestamp < CACHE_EXPIRATION.LOCATION) {
                        console.log("Using cached reverse geocode data from localStorage");
                        return parsedCache.data;
                    }
                }
            } catch (e) {
                console.warn("Error reading cached reverse geocode data:", e);
            }
            
            // Then check in-memory cache
            const cachedData = API_CACHE.locationData[cacheKey];
            if (cachedData) {
                if (Date.now() - cachedData.timestamp < CACHE_EXPIRATION.LOCATION) {
                    console.log("Using cached reverse geocode data from memory");
                    return cachedData.data;
                }
            }
        }
        
        let locationName = null;
        
        // Try to get location name based on region
        if (isIranianIP) {
            try {
                // Use Open-Meteo for Iranian users
                const response = await enhancedFetch(
                    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=${window.app.state.currentLanguage || 'en'}`,
                    { timeout: 5000 }
                );
                
                const data = await response.json();
                
                if (data.features && data.features.length > 0) {
                    const location = data.features[0].properties;
                    // Construct location name from available properties
                    const nameParts = [];
                    if (location.name) nameParts.push(location.name);
                    if (location.city) nameParts.push(location.city);
                    if (location.country) nameParts.push(location.country);
                    
                    locationName = nameParts.join(', ');
                    
                    // Cache the successful result
                    API_CACHE.locationData[cacheKey] = {
                        data: locationName,
                        timestamp: Date.now()
                    };
                    
                    // Store in localStorage for persistent caching
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify({
                            data: locationName,
                            timestamp: Date.now()
                        }));
                    } catch (e) {
                        console.warn("Error saving to localStorage:", e);
                    }
                    
                    return locationName;
                }
            } catch (error) {
                console.log("Open-Meteo reverse geocoding failed");
            }
        }
        
        // If we didn't get a name or are not in Iran, try OpenWeatherMap
        if (!locationName) {
            try {
                const response = await enhancedFetch(
                    `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=4d8fb5b93d4af21d66a2948710284366`,
                    { timeout: 5000 }
                );
                
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const location = data[0];
                    locationName = `${location.name}, ${location.country}`;
                    
                    // Cache the successful result
                    API_CACHE.locationData[cacheKey] = {
                        data: locationName,
                        timestamp: Date.now()
                    };
                    
                    // Store in localStorage for persistent caching
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify({
                            data: locationName,
                            timestamp: Date.now()
                        }));
                    } catch (e) {
                        console.warn("Error saving to localStorage:", e);
                    }
                    
                    return locationName;
                }
            } catch (error) {
                console.error("OpenWeatherMap reverse geocoding failed");
                
                // Try Nominatim as a last resort
                try {
                    const response = await enhancedFetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                        { 
                            timeout: 5000,
                            headers: {
                                'User-Agent': 'SkySenseWeatherApp/1.0'
                            }
                        }
                    );
                    
                    const data = await response.json();
                    
                    if (data && data.display_name) {
                        // Extract first 2 parts of display name for cleaner result
                        const parts = data.display_name.split(',');
                        locationName = parts.slice(0, 2).join(',').trim();
                        
                        // Cache the successful result
                        API_CACHE.locationData[cacheKey] = {
                            data: locationName,
                            timestamp: Date.now()
                        };
                        
                        // Store in localStorage for persistent caching
                        try {
                            localStorage.setItem(cacheKey, JSON.stringify({
                                data: locationName,
                                timestamp: Date.now()
                            }));
                        } catch (e) {
                            console.warn("Error saving to localStorage:", e);
                        }
                        
                        return locationName;
                    }
                } catch (nominatimError) {
                    console.error("Nominatim reverse geocoding failed:", nominatimError);
                }
            }
        }
        
        return locationName;
    } catch (error) {
        console.error("Error getting location name:", error);
        return null;
    }
}

// Get autocomplete results with improved response and error handling
async function getAutocompleteResults(query) {
    if (!query || query.length < 2) return [];
    
    // Check if we have a network connection
    if (!navigator.onLine) {
        throw new Error("No internet connection");
    }
    
    // Generate a cache key
    const cacheKey = `autocomplete_${query.toLowerCase().replace(/\s+/g, '_')}_${window.app.state.currentLanguage}`;
    
    // Check cache first if data saver mode is not enabled
    if (!window.app.userPreferences.dataSaverMode) {
        const cachedData = API_CACHE.locationData[cacheKey];
        
        if (cachedData) {
            const now = Date.now();
            // Use a shorter expiration for autocomplete (30 minutes)
            if (now - cachedData.timestamp < 30 * 60 * 1000) {
                console.log("Using cached autocomplete data");
                return cachedData.data;
            }
        }
    }
    
    let results = [];
    
    // Try Open-Meteo first for Iranian users
    if (isIranianIP) {
        try {
            const response = await enhancedFetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=${window.app.state.currentLanguage || 'en'}`,
                { timeout: 3000 }
            );
            
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                results = data.results.map(item => ({
                    name: item.name,
                    country: item.country,
                    state: item.admin1,
                    latitude: item.latitude,
                    longitude: item.longitude
                }));
                
                // Cache the successful results
                API_CACHE.locationData[cacheKey] = {
                    data: results,
                    timestamp: Date.now()
                };
                
                return results;
            }
        } catch (error) {
            console.log("Open-Meteo autocomplete failed, trying OpenWeatherMap");
        }
    }
    
    // If no results yet or not in Iran, try OpenWeatherMap
    if (results.length === 0) {
        try {
            const response = await enhancedFetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=4d8fb5b93d4af21d66a2948710284366`,
                { timeout: 3000 }
            );
            
            const data = await response.json();
            if (data && data.length > 0) {
                results = data.map(item => ({
                    name: item.name,
                    country: item.country,
                    state: item.state,
                    latitude: item.lat,
                    longitude: item.lon
                }));
                
                // Cache the successful results
                API_CACHE.locationData[cacheKey] = {
                    data: results,
                    timestamp: Date.now()
                };
                
                return results;
            }
        } catch (error) {
            console.error("OpenWeatherMap autocomplete failed");
            
            // If in Iran and both APIs failed, try one more source
            if (isIranianIP) {
                try {
                    // Try nominatim as last resort
                    const response = await enhancedFetch(
                        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
                        { 
                            timeout: 3000,
                            headers: {
                                'User-Agent': 'SkySenseWeatherApp/1.0'
                            }
                        }
                    );
                    
                    const data = await response.json();
                    if (data && data.length > 0) {
                        results = data.map(item => {
                            const nameParts = item.display_name.split(',');
                            return {
                                name: nameParts[0],
                                country: nameParts[nameParts.length - 1],
                                state: nameParts.length > 2 ? nameParts[1] : '',
                                latitude: parseFloat(item.lat),
                                longitude: parseFloat(item.lon)
                            };
                        });
                        
                        // Cache the successful results
                        API_CACHE.locationData[cacheKey] = {
                            data: results,
                            timestamp: Date.now()
                        };
                        
                        return results;
                    }
                } catch (nominatimError) {
                    console.error("Nominatim autocomplete failed:", nominatimError);
                }
            }
            
            throw new Error("All geocoding APIs failed");
        }
    }
    
    return results;
}

// Simulate Air Quality data for a location
function simulateAirQualityData(latitude, longitude) {
    // Create a deterministic but seemingly random AQI based on coordinates
    const seed = Math.sin(latitude * 0.5 + longitude * 0.3) * 10000;
    const today = new Date();
    const daySeed = today.getDate() + today.getMonth() * 30;
    
    // Generate a value between 0 and 250
    let aqi = Math.abs(Math.sin(seed + daySeed) * 200);
    
    // Urban areas tend to have worse air quality
    // Check if it's likely an urban area based on lat/long precision
    const isUrban = Math.abs(Math.round(latitude * 100) / 100 - latitude) < 0.001 &&
                 Math.abs(Math.round(longitude * 100) / 100 - longitude) < 0.001;
    
    if (isUrban) {
        aqi += 30; // Add a penalty for urban areas
    }
    
    // Cap at 300
    aqi = Math.min(Math.round(aqi), 300);
    
    return {
        aqi: aqi,
        measurements: {
            pm25: Math.round(aqi * 0.7),
            pm10: Math.round(aqi * 1.2),
            o3: Math.round(aqi * 0.5),
            no2: Math.round(aqi * 0.3)
        },
        location: {
            latitude,
            longitude
        },
        timestamp: Date.now()
    };
}

// Get air quality description
function getAirQualityDescription(aqi, language = 'en') {
    if (aqi <= 50) {
        return aqiDescriptions[language].good;
    } else if (aqi <= 100) {
        return aqiDescriptions[language].moderate;
    } else if (aqi <= 150) {
        return aqiDescriptions[language].poor;
    } else if (aqi <= 200) {
        return aqiDescriptions[language].veryPoor;
    } else {
        return aqiDescriptions[language].hazardous;
    }
}

// Clear weather data cache
function clearWeatherCache() {
    API_CACHE.weatherData = {};
    console.log("Weather cache cleared");
    
    // Try to clear localStorage cache as well
    try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith('weather_')) {
                localStorage.removeItem(key);
            }
        }
    } catch (e) {
        console.warn("Error clearing localStorage weather cache:", e);
    }
}

// Export the simulateAirQualityData function for accessibility in UI handlers
window.simulateAirQualityData = simulateAirQualityData;
window.getAirQualityDescription = getAirQualityDescription;
