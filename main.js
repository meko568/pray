// Update current time every second
function updateCurrentTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        calendar: 'islamic'
    };
    
        // Debug: Log current time and timezone
    console.log('Current time:', now.toString());
    console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // Format time in 12-hour format with AM/PM
    const timeString = now.toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true  // Show 12-hour format with AM/PM
    });
    
    console.log('Formatted time string:', timeString); // Debug log
    
    // Format date in Arabic
    const dateString = now.toLocaleDateString('ar-EG-u-ca-islamic', options);
    
    // Update the display
    document.getElementById('current-time').textContent = timeString;
    document.getElementById('date').textContent = dateString;
    
    // Debug: Log what's being displayed
    console.log('Displayed time:', timeString);
}

// Get prayer times based on user's location
function getPrayerTimes() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            document.getElementById('location').textContent = 'Geolocation is not supported by your browser';
            getDefaultPrayerTimes().then(resolve).catch(reject);
            return;
        }

        // Show loading message
        document.getElementById('location').textContent = 'جاري جلب أوقات الصلاة...';

        // Get user's current position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Get city name using reverse geocoding
                fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
                    .then(response => response.json())
                    .then(data => {
                        const city = data.city || data.locality || 'موقعك الحالي';
                        document.getElementById('location').textContent = `موقعك: ${city}`;
                    })
                    .catch(() => {
                        document.getElementById('location').textContent = 'موقعك الحالي';
                    });
                
                // Get prayer times using Aladhan API
                const date = new Date();
                const day = date.getDate();
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                
                fetch(`https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lng}&method=5`)
                    .then(response => response.json())
                    .then(data => {
                        const timings = data.data.timings;
                        
                        // Update prayer times
                        document.getElementById('fajr-time').textContent = formatTime(timings.Fajr);
                        document.getElementById('sunrise-time').textContent = formatTime(timings.Sunrise);
                        document.getElementById('dhuhr-time').textContent = formatTime(timings.Dhuhr);
                        document.getElementById('asr-time').textContent = formatTime(timings.Asr);
                        document.getElementById('maghrib-time').textContent = formatTime(timings.Maghrib);
                        document.getElementById('isha-time').textContent = formatTime(timings.Isha);
                        
                        // Highlight current prayer
                        highlightCurrentPrayer(timings);
                        
                        // Resolve with the data for notifications
                        resolve(data);
                    })
                    .catch(error => {
                        console.error('Error fetching prayer times:', error);
                        document.getElementById('location').textContent = 'حدث خطأ في جلب أوقات الصلاة. جاري استخدام الموقع الافتراضي.';
                        // Fallback to default location
                        getDefaultPrayerTimes().then(resolve).catch(reject);
                    });
            },
            (error) => {
                console.error('Error getting location:', error);
                document.getElementById('location').textContent = 'تعذر الحصول على الموقع. جاري استخدام الموقع الافتراضي.';
                // Fallback to default location (Damanhour) if location access is denied
                getDefaultPrayerTimes().then(resolve).catch(reject);
            }
        );
    });
}

// Get prayer times for a default location (Damanhour, Egypt)
function getDefaultPrayerTimes() {
    return new Promise((resolve, reject) => {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        // Coordinates for Damanhour, Egypt
        const lat = 31.0341;
        const lng = 30.4685;
    
        fetch(`https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lng}&method=5`)
            .then(response => response.json())
            .then(data => {
                const timings = data.data.timings;
                
                document.getElementById('fajr-time').textContent = formatTime(timings.Fajr);
                document.getElementById('sunrise-time').textContent = formatTime(timings.Sunrise);
                document.getElementById('dhuhr-time').textContent = formatTime(timings.Dhuhr);
                document.getElementById('asr-time').textContent = formatTime(timings.Asr);
                document.getElementById('maghrib-time').textContent = formatTime(timings.Maghrib);
                document.getElementById('isha-time').textContent = formatTime(timings.Isha);
                
                highlightCurrentPrayer(timings);
                document.getElementById('location').textContent = 'موقعك: دمنهور، مصر';
                
                // Resolve with the data
                resolve(data);
            })
            .catch(error => {
                console.error('Error fetching default prayer times:', error);
                document.getElementById('location').textContent = 'حدث خطأ في جلب أوقات الصلاة. يرجى المحاولة لاحقًا.';
                reject(error);
            });
    });
}

// Format time from 24h to 12h with AM/PM
function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const date = new Date();
    date.setHours(hours, minutes, 0);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

// Format time remaining
function formatTimeRemaining(minutes) {
    if (minutes < 0) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return ` (${hours} ساعة و ${mins} دقيقة)`;
    }
    return ` (${mins} دقيقة)`;
}

// Calculate time until next prayer and update display
function updateTimeUntilNextPrayer(timings) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Define prayer times in order
    const prayers = [
        { id: 'fajr-time', time: timings.Fajr, name: 'الفجر' },
        { id: 'sunrise-time', time: timings.Sunrise, name: 'الشروق' },
        { id: 'dhuhr-time', time: timings.Dhuhr, name: 'الظهر' },
        { id: 'asr-time', time: timings.Asr, name: 'العصر' },
        { id: 'maghrib-time', time: timings.Maghrib, name: 'المغرب' },
        { id: 'isha-time', time: timings.Isha, name: 'العشاء' }
    ];
    
    // Find next prayer
    let nextPrayer = null;
    for (let i = 0; i < prayers.length; i++) {
        const prayerTime = prayers[i].time.split(':');
        const prayerMinutes = parseInt(prayerTime[0]) * 60 + parseInt(prayerTime[1]);
        
        if (currentTime < prayerMinutes) {
            nextPrayer = { ...prayers[i], minutesUntil: prayerMinutes - currentTime };
            break;
        }
    }
    
    // If no next prayer found (after Isha), use Fajr of next day
    if (!nextPrayer && prayers.length > 0) {
        const prayerTime = prayers[0].time.split(':');
        const prayerMinutes = (24 * 60) + (parseInt(prayerTime[0]) * 60 + parseInt(prayerTime[1]));
        nextPrayer = { 
            ...prayers[0], 
            minutesUntil: prayerMinutes - currentTime,
            nextDay: true 
        };
    }
    
    // Update all prayer time displays
    prayers.forEach(prayer => {
        const element = document.getElementById(prayer.id);
        if (element) {
            // Remove any existing countdown text
            const currentText = element.textContent.split(' (')[0];
            element.textContent = currentText;
            
            // Add countdown to next prayer
            if (nextPrayer && prayer.id === nextPrayer.id) {
                const timeRemaining = nextPrayer.nextDay 
                    ? nextPrayer.minutesUntil - (24 * 60)
                    : nextPrayer.minutesUntil;
                element.textContent = currentText + formatTimeRemaining(timeRemaining);
            }
        }
    });
    
    return nextPrayer;
}

// Highlight the current prayer and update countdowns
function highlightCurrentPrayer(timings) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Reset all highlights
    document.querySelectorAll('.mainpray').forEach(el => {
        el.classList.remove('current-prayer', 'next-prayer');
    });
    
    // Define prayer times in order (excluding sunrise from next prayer highlight)
    const prayers = [
        { id: 'fajr-time', time: timings.Fajr, isPrayer: true },
        { id: 'sunrise-time', time: timings.Sunrise, isPrayer: false },
        { id: 'dhuhr-time', time: timings.Dhuhr, isPrayer: true },
        { id: 'asr-time', time: timings.Asr, isPrayer: true },
        { id: 'maghrib-time', time: timings.Maghrib, isPrayer: true },
        { id: 'isha-time', time: timings.Isha, isPrayer: true }
    ];
    
    // Find current and next prayer
    let currentPrayer = null;
    let nextPrayer = null;
    
    for (let i = 0; i < prayers.length; i++) {
        const prayer = prayers[i];
        const prayerTime = prayer.time.split(':');
        const prayerMinutes = parseInt(prayerTime[0]) * 60 + parseInt(prayerTime[1]);
        
        // Only consider it as next prayer if it's an actual prayer time (not sunrise)
        if (currentTime < prayerMinutes && !nextPrayer && prayer.isPrayer) {
            nextPrayer = prayer;
        }
        
        if (i > 0) {
            const prevPrayer = prayers[i-1];
            const prevPrayerTime = prevPrayer.time.split(':');
            const prevPrayerMinutes = parseInt(prevPrayerTime[0]) * 60 + parseInt(prevPrayerTime[1]);
            
            // Only set as current prayer if it's an actual prayer time (not sunrise)
            if (currentTime >= prevPrayerMinutes && currentTime < prayerMinutes && prevPrayer.isPrayer) {
                currentPrayer = prevPrayer;
            }
        }
    }
    
    // Check if current time is after last prayer of the day
    if (!currentPrayer && prayers.length > 0) {
        const lastPrayerTime = prayers[prayers.length - 1].time.split(':');
        const lastPrayerMinutes = parseInt(lastPrayerTime[0]) * 60 + parseInt(lastPrayerTime[1]);
        
        if (currentTime >= lastPrayerMinutes) {
            currentPrayer = prayers[prayers.length - 1];
            nextPrayer = prayers[0];
        }
    }
    
    // If no current prayer found (shouldn't happen), default to first prayer
    if (!currentPrayer && prayers.length > 0) {
        currentPrayer = prayers[0];
    }
    
    // Highlight the current prayer and next prayer
    if (currentPrayer) {
        const currentElement = document.getElementById(currentPrayer.id)?.closest('.mainpray');
        if (currentElement) {
            currentElement.classList.add('current-prayer');
        }
    }
    
    // Add next-prayer class to the next prayer
    if (nextPrayer) {
        const nextElement = document.getElementById(nextPrayer.id)?.closest('.mainpray');
        if (nextElement) {
            nextElement.classList.add('next-prayer');
        }
    }
    
    // Update countdown for next prayer
    if (nextPrayer) {
        const nextPrayerTime = nextPrayer.time.split(':');
        const nextPrayerMinutes = parseInt(nextPrayerTime[0]) * 60 + parseInt(nextPrayerTime[1]);
        let minutesUntil = nextPrayerMinutes - currentTime;
        
        // If next prayer is tomorrow
        if (minutesUntil < 0) {
            minutesUntil += 24 * 60; // Add 24 hours
        }
        
        const nextPrayerElement = document.getElementById(nextPrayer.id);
        if (nextPrayerElement) {
            const currentText = nextPrayerElement.textContent.split(' (')[0];
            nextPrayerElement.textContent = currentText + formatTimeRemaining(minutesUntil);
        }
    }
}

// Show welcome notification with next prayer time
function showWelcomeNotification(timings) {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return;
    }

    // Request permission if not already granted
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showNextPrayerNotification(timings);
            }
        });
    } else {
        showNextPrayerNotification(timings);
    }
}

// Show next prayer time in notification
function showNextPrayerNotification(timings) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const prayers = [
        { name: 'الفجر', time: timings.Fajr },
        { name: 'الظهر', time: timings.Dhuhr },
        { name: 'العصر', time: timings.Asr },
        { name: 'المغرب', time: timings.Maghrib },
        { name: 'العشاء', time: timings.Isha }
    ];

    // Find next prayer
    let nextPrayer = null;
    for (const prayer of prayers) {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerTime = hours * 60 + minutes;
        
        if (prayerTime > currentTime) {
            nextPrayer = prayer;
            break;
        }
    }

    // If no prayer found (after Isha), show Fajr of next day
    if (!nextPrayer) {
        nextPrayer = prayers[0];
    }

    // Create and show notification
    const notification = new Notification('مواقيت الصلاة', {
        body: `الصلاة القادمة: ${nextPrayer.name} - ${nextPrayer.time}`,
        icon: 'https://i.imgur.com/4Qz4Q1u.png', // You can replace with your own icon
        tag: 'prayer-notification'
    });

    // Close notification after 10 seconds
    setTimeout(() => notification.close(), 10000);
}

// Play adhan sound
function playAdhan() {
    const adhanAudio = document.getElementById('adhanAudio');
    if (adhanAudio) {
        adhanAudio.play().catch(error => {
            console.error('Error playing adhan:', error);
        });
    }
}

// Play notification sound
function playNotification() {
    const notificationSound = document.getElementById('notificationSound');
    if (notificationSound) {
        notificationSound.currentTime = 0;
        notificationSound.play().catch(error => {
            console.error('Error playing notification sound:', error);
        });
    }
}

// Check if it's time for prayer or time to notify
function checkPrayerTime(timings) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();
    
    // Check each prayer time
    const prayers = [
        { name: 'الفجر', time: timings.Fajr },
        { name: 'الظهر', time: timings.Dhuhr },
        { name: 'العصر', time: timings.Asr },
        { name: 'المغرب', time: timings.Maghrib },
        { name: 'العشاء', time: timings.Isha }
    ];
    
    // Check if we already notified for this prayer
    const lastNotifiedPrayer = localStorage.getItem('lastNotifiedPrayer');
    const lastPrayerTime = localStorage.getItem('lastPrayerTime');
    
    for (const prayer of prayers) {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerTime = hours * 60 + minutes;
        
        // 5 minutes before prayer time
        const notifyTime = prayerTime - 5;
        
        // If current time is 5 minutes before prayer time (within 1 minute window)
        if (currentTime >= notifyTime && currentTime < notifyTime + 1) {
            if (lastNotifiedPrayer !== prayer.name || lastPrayerTime !== prayer.time) {
                // Play notification sound
                playNotification();
                
                // Show notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`اقترب موعد صلاة ${prayer.name}`, {
                        body: `سيحين وقت الصلاة الساعة ${prayer.time}`,
                        icon: 'https://i.imgur.com/4Qz4Q1u.png',
                        requireInteraction: true
                    });
                }
                
                // Update last notified prayer
                localStorage.setItem('lastNotifiedPrayer', prayer.name);
                localStorage.setItem('lastPrayerTime', prayer.time);
                
                console.log(`Notified for ${prayer.name} at ${prayer.time}`);
            }
        }
        
        // At exact prayer time (just show a message, no sound)
        if (Math.abs(currentTime - prayerTime) === 0 && currentSeconds <= 10) {
            if (lastPrayerTime !== prayer.time) {
                // Show notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`حان الآن وقت صلاة ${prayer.name}`, {
                        body: `وقت الصلاة: ${prayer.time}`,
                        icon: 'https://i.imgur.com/4Qz4Q1u.png',
                        requireInteraction: true
                    });
                }
                
                // Update last prayer time
                localStorage.setItem('lastPrayerTime', prayer.time);
                
                console.log(`Prayer time: ${prayer.name} at ${prayer.time}`);
            }
        }
    }
}

// Initialize the application
function init() {
    // Request notification permission
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            console.log('Notification permission:', permission);
        });
    }

    // Update current time every second
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Get prayer times
    getPrayerTimes().then(data => {
        if (data && data.data && data.data.timings) {
            const timings = data.data.timings;
            showWelcomeNotification(timings);
            
            // Check prayer times every minute
            setInterval(() => checkPrayerTime(timings), 60 * 1000);
        }
    });
    
    // Refresh prayer times every hour
    setInterval(getPrayerTimes, 60 * 60 * 1000);
}

// Test function for audio
function testAudio() {
    console.log('Testing adhan sound...');
    const adhanAudio = document.getElementById('adhanAudio');
    if (adhanAudio) {
        // Reset audio to the beginning
        adhanAudio.currentTime = 0;
        
        // Play the audio
        const playPromise = adhanAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Error playing adhan:', error);
                alert('Error playing adhan. Please check console for details.');
            });
        }
    } else {
        console.error('Adhan audio element not found');
        alert('Adhan audio element not found');
    }
}

// Counter functionality for tasbeeh with local storage
function increment(id) {
    const current = getCounter(id);
    setCounter(id, current + 1);
    
    // Add visual feedback
    const element = document.querySelector(`.number.${id}`);
    if (element) {
        element.classList.add('counter-update');
        setTimeout(() => element.classList.remove('counter-update'), 200);
    }
    
    // Haptic feedback for mobile
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

function getCounter(id) {
    // Try to get from localStorage first
    const savedValue = localStorage.getItem(`counter_${id}`);
    if (savedValue !== null) {
        return parseInt(savedValue);
    }
    // If not in localStorage, get from DOM or default to 0
    const element = document.querySelector(`.number.${id}`);
    return element ? parseInt(element.textContent) || 0 : 0;
}

function setCounter(id, value) {
    // Save to localStorage
    localStorage.setItem(`counter_${id}`, value);
    
    // Update the display
    const element = document.querySelector(`.number.${id}`);
    if (element) {
        element.textContent = value;
        // Add animation
        element.classList.add('counter-update');
        setTimeout(() => element.classList.remove('counter-update'), 200);
    }
    
    // Add click effect to both the button and circle
    const elements = [
        document.querySelector(`.plus[onclick*="${id}"]`),
        document.querySelector(`.circle.${id}`)
    ];
    
    elements.forEach(el => {
        if (el) {
            el.classList.add('btn-click');
            setTimeout(() => el.classList.remove('btn-click'), 200);
        }
    });
    
    // Haptic feedback for mobile
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

function resetCounter(id) {
    // Show confirmation for reset
    if (getCounter(id) > 0) {
        if (confirm('هل أنت متأكد من إعادة العداد إلى الصفر؟')) {
            setCounter(id, 0);
            // Add reset effect
            const elements = [
                document.querySelector(`.clear.${id}`),
                document.querySelector(`.circle.${id}`)
            ];
            
            elements.forEach(el => {
                if (el) {
                    el.classList.add('btn-reset');
                    setTimeout(() => el.classList.remove('btn-reset'), 300);
                }
            });
            
            // Haptic feedback for mobile
            if (navigator.vibrate) {
                navigator.vibrate([50, 50, 50]);
            }
        }
    }
}

// Load saved counters when the page loads
function loadCounters() {
    ['one', 'two', 'three'].forEach(id => {
        const savedValue = localStorage.getItem(`counter_${id}`);
        if (savedValue !== null) {
            const element = document.querySelector(`.number.${id}`);
            if (element) {
                element.textContent = savedValue;
            }
        }
    });
}

// Add touch event support for mobile
document.addEventListener('DOMContentLoaded', function() {
    // Initialize counters for tasbeeh page if we're on main2.html
    if (window.location.pathname.endsWith('main2.html')) {
        // Load saved counters
        loadCounters();
        
        // Initialize any empty counters to 0
        ['one', 'two', 'three'].forEach(id => {
            const element = document.querySelector(`.number.${id}`);
            if (element && !element.textContent.trim()) {
                element.textContent = '0';
            }
        });
    } else {
        // Initialize prayer times for main page
        init();
    }
});
