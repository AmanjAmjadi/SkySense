// weather-data.js - Contains weather data processing, API calls and formatting functions

// Weather code to icon mapping for Open-Meteo
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

// IMPROVED: More detailed weather alert information with recommendations
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

// API Status Detection
let isIranianIP = false;

// Function to detect region by testing API connectivity
async function checkRegion() {
    try {
        // Try accessing OpenWeatherMap with a short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        
        await fetch('https://api.openweathermap.org/data/2.5/weather?lat=35.7&lon=51.4&appid=4d8fb5b93d4af21d66a2948710284366', {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        isIranianIP = false;
        console.log("Using OpenWeatherMap API");
    } catch (error) {
        // If it fails, likely due to network restrictions, use Open-Meteo first
        isIranianIP = true;
        console.log("Using Open-Meteo API as primary");
    }
}

// Fetch with timeout utility
function fetchWithTimeout(url, options = {}) {
    const { timeout = 5000 } = options;
    
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timed out')), timeout)
        )
    ]);
}

// Format temperature with units
function formatTemperature(temp, useMetric) {
    if (!useMetric) {
        // Convert to Fahrenheit
        temp = (temp * 9/5) + 32;
    }
    return `${Math.round(temp)}°${useMetric ? 'C' : 'F'}`;
}

// Shamsi (Persian) calendar conversion functions
const shamsiMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const shamsiDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

function gregorianToShamsi(date) {
    const gregorianYear = date.getFullYear();
    const gregorianMonth = date.getMonth() + 1;
    const gregorianDay = date.getDate();
    
    let jY, jM, jD;
    let gregorianDayNo, shamsiDayNo;
    let leap;

    gregorianYear > 1600 ? (jY = 979, jM = 2, jD = 29) : (jY = 0, jM = 1, jD = 1);
    gregorianDayNo = 365 * gregorianYear + Math.floor((gregorianYear + 3) / 4) - Math.floor((gregorianYear + 99) / 100) + Math.floor((gregorianYear + 399) / 400);
    
    for (let i = 1; i < gregorianMonth; ++i) {
        gregorianDayNo += [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i];
    }
    
    if (gregorianMonth > 2 && ((gregorianYear % 4 === 0 && gregorianYear % 100 !== 0) || (gregorianYear % 400 === 0))) {
        ++gregorianDayNo;
    }
    
    gregorianDayNo += gregorianDay;
    
    shamsiDayNo = gregorianDayNo - 79;
    
    const j_np = Math.floor(shamsiDayNo / 12053);
    shamsiDayNo %= 12053;
    
    jY = 979 + 33 * j_np + 4 * Math.floor(shamsiDayNo / 1461);
    shamsiDayNo %= 1461;
    
    if (shamsiDayNo >= 366) {
        jY += Math.floor((shamsiDayNo - 1) / 365);
        shamsiDayNo = (shamsiDayNo - 1) % 365;
    }
    
    for (let i = 0; i < 11 && shamsiDayNo >= 31; ++i) {
        shamsiDayNo -= i < 6 ? 31 : 30;
        ++jM;
    }
    
    jD = shamsiDayNo + 1;
    
    return {
        year: jY,
        month: jM,
        day: jD,
        dayOfWeek: date.getDay()
    };
}

// Kurdish calendar - using Gregorian with Kurdish month names
const kurdishMonths = ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'];
const kurdishDays = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];

// Format date string from ISO date
function formatDate(dateString, currentLanguage) {
    const date = new Date(dateString);
    
    if (currentLanguage === 'fa') {
        // Convert to Shamsi (Persian) date
        const shamsiDate = gregorianToShamsi(date);
        return `${shamsiDays[shamsiDate.dayOfWeek]}، ${shamsiDate.day} ${shamsiMonths[shamsiDate.month - 1]}`;
    } else if (currentLanguage === 'ku') {
        // Use Kurdish calendar (Gregorian with Kurdish names)
        return `${kurdishDays[date.getDay()]}، ${date.getDate()} ${kurdishMonths[date.getMonth()]}`;
    } else {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    }
}

// Format time from ISO date or hour string
function formatTime(timeString, currentLanguage) {
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
        minute: '2-digit' 
    });
}

// Convert wind speed and direction to human-readable format
function formatWind(speed, direction, useMetric, currentLanguage) {
    let formattedSpeed;
    
    if (useMetric) {
        // Converting m/s to km/h
        formattedSpeed = `${Math.round(speed * 3.6)} ${currentLanguage === 'en' ? 'km/h' : currentLanguage === 'fa' ? 'کیلومتر/ساعت' : 'کیلۆمەتر/کاتژمێر'}`;
    } else {
        // Converting m/s to mph
        formattedSpeed = `${Math.round(speed * 2.237)} ${currentLanguage === 'en' ? 'mph' : currentLanguage === 'fa' ? 'مایل/ساعت' : 'مایل/کاتژمێر'}`;
    }
    
    // Get cardinal direction
    const directions = {
        en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
        fa: ['شمال', 'شمال‌شرق', 'شرق', 'جنوب‌شرق', 'جنوب', 'جنوب‌غرب', 'غرب', 'شمال‌غرب'],
        ku: ['باکوور', 'باکووری ڕۆژهەڵات', 'ڕۆژهەڵات', 'باشووری ڕۆژهەڵات', 'باشوور', 'باشووری ڕۆژئاوا', 'ڕۆژئاوا', 'باکووری ڕۆژئاوا']
    };
    
    const index = Math.round(direction / 45) % 8;
    
    return `${formattedSpeed} ${directions[currentLanguage][index]}`;
}

// Fetch weather data with fallback mechanisms
async function fetchWeatherData(latitude, longitude) {
    try {
        console.log("Fetching weather data for:", latitude, longitude);
        
        // Always use Open-Meteo for weather data as it's reliable worldwide
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset&timezone=auto`;
        
        try {
            const response = await fetchWithTimeout(url, { timeout: 5000 });
            
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error("Open-Meteo API error:", error);
            
            // If Open-Meteo fails, try OpenWeatherMap as a backup for weather data
            try {
                // This is a simplified adaptation that maps OpenWeatherMap data to Open-Meteo format
                const owmUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely&units=metric&appid=4d8fb5b93d4af21d66a2948710284366`;
                const response = await fetchWithTimeout(owmUrl, { timeout: 5000 });
                
                if (!response.ok) {
                    throw new Error(`OpenWeatherMap API error: ${response.status}`);
                }
                
                const owmData = await response.json();
                
                // Map OpenWeatherMap data to Open-Meteo format
                return convertOwmToOpenMeteo(owmData);
            } catch (owmError) {
                console.error("OpenWeatherMap API error:", owmError);
                throw new Error("All weather services are currently unavailable. Please try again later.");
            }
        }
    } catch (err) {
        console.error("Weather API error:", err);
        throw new Error(err.message || "Could not fetch weather data");
    }
}

// Convert OpenWeatherMap data to Open-Meteo format
function convertOwmToOpenMeteo(owmData) {
    // Map OWM weather codes to WMO codes (approximate conversion)
    function mapWeatherCode(owmId) {
        // These are approximate mappings
        if (owmId >= 200 && owmId < 300) return 95; // Thunderstorm
        if (owmId >= 300 && owmId < 400) return 51; // Drizzle
        if (owmId >= 500 && owmId < 510) return 61; // Rain
        if (owmId >= 510 && owmId < 520) return 66; // Freezing rain
        if (owmId >= 520 && owmId < 600) return 80; // Showers
        if (owmId >= 600 && owmId < 700) return 71; // Snow
        if (owmId >= 700 && owmId < 800) return 45; // Fog
        if (owmId === 800) return 0; // Clear
        if (owmId > 800) return 2; // Partly cloudy
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
    
    // Fill daily data
    for (let i = 0; i < Math.min(7, owmData.daily.length); i++) {
        const day = owmData.daily[i];
        dailyData.time.push(new Date(day.dt * 1000).toISOString().split('T')[0]);
        dailyData.weather_code.push(mapWeatherCode(day.weather[0].id));
        dailyData.temperature_2m_max.push(day.temp.max);
        dailyData.temperature_2m_min.push(day.temp.min);
        dailyData.precipitation_sum.push(day.rain || 0);
        dailyData.sunrise.push(new Date(day.sunrise * 1000).toISOString());
        dailyData.sunset.push(new Date(day.sunset * 1000).toISOString());
    }
    
    // Create hourly arrays
    const hourlyData = {
        time: [],
        temperature_2m: [],
        weather_code: [],
        precipitation_probability: []
    };
    
    // Fill hourly data
    for (let i = 0; i < Math.min(24, owmData.hourly.length); i++) {
        const hour = owmData.hourly[i];
        hourlyData.time.push(new Date(hour.dt * 1000).toISOString());
        hourlyData.temperature_2m.push(hour.temp);
        hourlyData.weather_code.push(mapWeatherCode(hour.weather[0].id));
        hourlyData.precipitation_probability.push(hour.pop * 100); // Convert from 0-1 to percentage
    }
    
    // Create current data
    const current = {
        temperature_2m: owmData.current.temp,
        apparent_temperature: owmData.current.feels_like,
        relative_humidity_2m: owmData.current.humidity,
        weather_code: mapWeatherCode(owmData.current.weather[0].id),
        wind_speed_10m: owmData.current.wind_speed,
        wind_direction_10m: owmData.current.wind_deg,
        uv_index: owmData.current.uvi
    };
    
    // Return in Open-Meteo format
    return {
        current,
        hourly: hourlyData,
        daily: dailyData
    };
}

// Get coordinates from location name with fallback mechanisms
async function getCoordinates(locationName) {
    try {
        console.log("Getting coordinates for:", locationName);
        
        // Determine which API to try first based on user location
        if (isIranianIP) {
            try {
                // First try Open-Meteo for Iranian users
                const response = await fetchWithTimeout(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=${window.currentLanguage || 'en'}`,
                    { timeout: 3000 }
                );
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    const location = data.results[0];
                    return {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        name: location.name,
                        country: location.country,
                        displayName: `${location.name}, ${location.country}`
                    };
                }
            } catch (error) {
                console.log("Open-Meteo geocoding failed, trying OpenWeatherMap");
            }
        }
        
        // Try OpenWeatherMap API (or as fallback for Iranian users)
        try {
            const response = await fetchWithTimeout(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationName)}&limit=1&appid=4d8fb5b93d4af21d66a2948710284366`,
                { timeout: 3000 }
            );
            const data = await response.json();
            
            if (data && data.length > 0) {
                const location = data[0];
                return {
                    latitude: location.lat,
                    longitude: location.lon,
                    name: location.name,
                    country: location.country,
                    displayName: `${location.name}, ${location.country}`
                };
            }
        } catch (error) {
            console.error("OpenWeatherMap geocoding failed");
            
            // If we're in Iran and both APIs fail, show a specific error
            if (isIranianIP) {
                throw new Error("Network issues detected. Please check your connection or try a different location.");
            }
        }
        
        throw new Error("Location not found");
    } catch (err) {
        console.error("Geocoding error:", err);
        throw new Error(err.message || "Could not find coordinates for this location");
    }
}

// Get location name from coordinates
async function getReverseGeocode(latitude, longitude) {
    // Try to get the real location name
    try {
        let locationName = null;
        
        // Try to get location name based on region
        if (isIranianIP) {
            try {
                // Use Open-Meteo for Iranian users
                const response = await fetchWithTimeout(
                    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=${window.currentLanguage || 'en'}`,
                    { timeout: 3000 }
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
                }
            } catch (error) {
                console.log("Open-Meteo reverse geocoding failed");
            }
        }
        
        // If we didn't get a name or are not in Iran, try OpenWeatherMap
        if (!locationName) {
            try {
                const response = await fetchWithTimeout(
                    `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=4d8fb5b93d4af21d66a2948710284366`,
                    { timeout: 3000 }
                );
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const location = data[0];
                    locationName = `${location.name}, ${location.country}`;
                }
            } catch (error) {
                console.error("OpenWeatherMap reverse geocoding failed");
            }
        }
        
        return locationName;
    } catch (error) {
        console.error("Error getting location name:", error);
        return null;
    }
}

// Get autocomplete results with fallback
async function getAutocompleteResults(query) {
    let results = [];
    
    // Try Open-Meteo first for Iranian users
    if (isIranianIP) {
        try {
            const response = await fetchWithTimeout(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=${window.currentLanguage || 'en'}`,
                { timeout: 3000 }
            );
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                results = data.results.map(item => ({
                    name: item.name,
                    country: item.country,
                    state: item.admin1
                }));
                return results;
            }
        } catch (error) {
            console.log("Open-Meteo autocomplete failed, trying OpenWeatherMap");
        }
    }
    
    // If no results yet or not in Iran, try OpenWeatherMap
    if (results.length === 0) {
        try {
            const response = await fetchWithTimeout(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=4d8fb5b93d4af21d66a2948710284366`,
                { timeout: 3000 }
            );
            const data = await response.json();
            if (data && data.length > 0) {
                results = data;
                return results;
            }
        } catch (error) {
            console.error("OpenWeatherMap autocomplete failed");
            // If in Iran and both APIs failed, throw error
            if (isIranianIP) {
                throw new Error("All geocoding APIs failed");
            }
        }
    }
    
    return results;
}
