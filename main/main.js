// Update current time every second
function updateCurrentTime() {
    const now = new Date();
    
    // Format time in 12-hour format with AM/PM
    const timeString = now.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true
    });
    
    // Create a new date object for yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // Format the date in Arabic with Islamic calendar
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Riyadh'
    });
    
    // Format the date string and ensure it's in the right format
    let dateString = formatter.format(yesterday);
    // Replace any 'هـ' that might be duplicated
    dateString = dateString.replace(/([0-9]) هـ/g, '$1 هـ').replace('هـ', 'هـ');
    
    // Update the display
    const dateElement = document.getElementById('date');
    const timeElement = document.getElementById('current-time');
    
    if (dateElement) dateElement.textContent = dateString;
    if (timeElement) timeElement.textContent = timeString;
}

// Make sure to call updateCurrentTime immediately and then every second
updateCurrentTime();
setInterval(updateCurrentTime, 1000);

// Function to convert Gregorian to Islamic date
function convertToIslamic(date) {
    // This is a simplified conversion - for production, use a proper library
    // like 'moment-hijri' or 'hijri-date' for accurate conversion
    const islamicStart = new Date(622, 6, 16); // Islamic calendar starts on July 16, 622 (Julian)
    const diffTime = Math.abs(date - islamicStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Approximate conversion (1 Islamic year = 354.367 days)
    const years = Math.floor(diffDays / 354.367);
    const remainingDays = diffDays - (years * 354.367);
    
    // This is a simplified calculation - actual month lengths vary
    const months = Math.floor(remainingDays / 29.53);
    const days = Math.floor(remainingDays % 29.53);
    
    return {
        day: days + 1,  // Adding 1 because the first day is 1, not 0
        month: (months % 12) + 1,
        year: years + 1  // Adding 1 because the first year is 1 AH
    };
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
    if (!notificationSound) {
        return;
    }
    
    try {
        notificationSound.currentTime = 0;
        notificationSound.play().catch(() => {});
    } catch (error) {
        // Silent error handling
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
                        dir: 'rtl',
                        lang: 'ar',
                        tag: 'salawat-reminder',
                        requireInteraction: true // Keep notification visible until clicked
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
                        dir: 'rtl',
                        lang: 'ar',
                        tag: 'salawat-reminder',
                        requireInteraction: true // Keep notification visible until clicked
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

// Counter functionality for tasbeeh with cycle counting
function increment(id) {
    // Get current count from DOM or localStorage
    const current = getCounter(id);
    
    // Decrease by 1 (like azkar system)
    const newCount = current - 1;
    
    if (newCount > 0) {
        setCounter(id, newCount);
    } else if (newCount === 0) {
        // Reset to 100 and increment cycle counter
        setCounter(id, 100);
        incrementCycleCounter(id);
    }
    
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

function incrementCycleCounter(id) {
    // Get current cycle count
    const cycleElement = document.querySelector(`.cycle-counter.${id}`);
    if (cycleElement) {
        const currentCycle = parseInt(cycleElement.textContent) || 0;
        const newCycle = currentCycle + 1;
        cycleElement.textContent = newCycle;
        
        // Save to localStorage
        localStorage.setItem(`cycle_counter_${id}`, newCycle.toString());
        
        // Add animation for cycle completion
        cycleElement.classList.add('counter-update');
        setTimeout(() => cycleElement.classList.remove('counter-update'), 200);
        
        // Haptic feedback for cycle completion
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }
    }
}

function getCounter(id) {
    // Try to get from localStorage first
    const savedValue = localStorage.getItem(`counter_${id}`);
    if (savedValue !== null) {
        return parseInt(savedValue);
    }
    // If not in localStorage, get from DOM or default to 100
    const element = document.querySelector(`.number.${id}`);
    return element ? parseInt(element.textContent) || 100 : 100;
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
    const currentCount = getCounter(id);
    const currentCycle = parseInt(localStorage.getItem(`cycle_counter_${id}`) || '0');
    
    if (currentCount < 100 || currentCycle > 0) {
        if (confirm('هل أنت متأكد من إعادة العداد إلى 100 ومسح الدورات؟')) {
            setCounter(id, 100);
            localStorage.setItem(`cycle_counter_${id}`, '0');
            
            const cycleElement = document.querySelector(`.cycle-counter.${id}`);
            if (cycleElement) {
                cycleElement.textContent = '0';
            }
            
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
    ['one', 'two', 'three', 'four', 'five'].forEach(id => {
        // Load main counter
        const savedValue = localStorage.getItem(`counter_${id}`);
        if (savedValue !== null) {
            const element = document.querySelector(`.number.${id}`);
            if (element) {
                element.textContent = savedValue;
            }
        }
        
        // Load cycle counter
        const savedCycle = localStorage.getItem(`cycle_counter_${id}`);
        if (savedCycle !== null) {
            const cycleElement = document.querySelector(`.cycle-counter.${id}`);
            if (cycleElement) {
                cycleElement.textContent = savedCycle;
            }
        }
    });
}

// Show Salawat notification
function showSalawatNotification() {
    // Check if the browser supports notifications
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return;
    }

    // Check if notification permissions have already been granted
    if (Notification.permission === 'granted') {
        // Create a notification
        const notification = new Notification('اللهم صل على محمد', {
            body: 'اللهم صل وسلم وبارك على سيدنا محمد',
            icon: 'icon-192x192.png',
            dir: 'rtl',
            lang: 'ar',
            tag: 'salawat-reminder',
            requireInteraction: true // Keep notification visible until clicked
        });
        
        // Play a subtle sound when notification appears (optional)
        playNotification();
    }
    // Otherwise, ask the user for permission
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showSalawatNotification();
            }
        });
    }
}

// Schedule Salawat notifications every 10 minutes
let salawatInterval;

function startSalawatReminder() {
    // Show first notification immediately
    showSalawatNotification();
    
    // Then show every 10 minutes (600,000 milliseconds)
    salawatInterval = setInterval(showSalawatNotification, 10 * 60 * 1000);
}

// Stop the reminder (in case you want to add a way to disable it)
function stopSalawatReminder() {
    if (salawatInterval) {
        clearInterval(salawatInterval);
    }
}

// Function to handle remembrance repeat counter
function handleRemembranceRepeat(e) {
    e.stopPropagation();
    const repeatElement = e.currentTarget;
    const remembranceItem = repeatElement.closest('.remembrance-item');
    
    // Get current count from element text
    let currentCount = repeatElement.textContent;
    
    // Parse the count from Arabic text - handle any number
    let count = 0;
    if (currentCount.includes('تم بحمد الله')) {
        // Already completed, do nothing
        return;
    } else if (currentCount.includes('مرة واحدة')) {
        count = 1;
    } else if (currentCount.includes('مرتين')) {
        count = 2;
    } else if (currentCount.includes('مائة مرة')) {
        count = 100;
    } else {
        // Extract number from text like "99 مرة" or "ثلاث مرات"
        const numberMatch = currentCount.match(/\d+/);
        if (numberMatch) {
            count = parseInt(numberMatch[0]);
        } else {
            // Handle Arabic number words
            const arabicNumbers = {
                'ثلاث': 3, 'أربع': 4, 'خمس': 5, 'ست': 6,
                'سبع': 7, 'ثماني': 8, 'تسع': 9, 'عشر': 10
            };
            for (const [word, num] of Object.entries(arabicNumbers)) {
                if (currentCount.includes(word)) {
                    count = num;
                    break;
                }
            }
        }
    }
    
    // Decrease count by 1
    if (count > 0) {
        count--;
        
        // Update display
        if (count === 0) {
            repeatElement.textContent = 'تم بحمد الله';
            repeatElement.style.background = 'linear-gradient(135deg, #27ae60, #229954)';
            repeatElement.style.color = 'white';
            repeatElement.classList.add('completed');
        } else {
            // Convert back to Arabic text
            repeatElement.textContent = convertCountToArabic(count);
        }
        
        // Add visual feedback
        repeatElement.classList.add('counter-update');
        setTimeout(() => repeatElement.classList.remove('counter-update'), 200);
        
        // Haptic feedback for mobile
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }
}

// Convert number to Arabic text
function convertCountToArabic(count) {
    switch(count) {
        case 1: return 'مرة واحدة';
        case 2: return 'مرتين';
        case 3: return 'ثلاث مرات';
        case 4: return 'أربع مرات';
        case 5: return 'خمس مرات';
        case 6: return 'ست مرات';
        case 7: return 'سبع مرات';
        case 8: return 'ثماني مرات';
        case 9: return 'تسع مرات';
        case 10: return 'عشر مرات';
        case 100: return 'مائة مرة';
        default: return `${count} مرة`;
    }
}

// Initialize tasbeeh items
function initializeTasbeehItems() {
    const tasbeehItems = document.querySelectorAll('.tasbeeh-item');
    
    tasbeehItems.forEach((item, index) => {
        const id = ['tasbeeh1', 'tasbeeh2', 'tasbeeh3', 'tasbeeh4', 'tasbeeh5'][index];
        
        // Make entire item clickable
        item.style.cursor = 'pointer';
        item.style.transition = 'all 0.3s ease';
        
        // Add click event to the entire item
        item.addEventListener('click', function(e) {
            // Find the repeat button within this item
            const repeatButton = this.querySelector('.repeat');
            if (repeatButton && !repeatButton.textContent.includes('تم بحمد الله')) {
                handleTasbeehRepeat(e, id);
            }
        });
        
        // Add hover effect to the entire item
        item.addEventListener('mouseenter', function() {
            const repeatButton = this.querySelector('.repeat');
            if (repeatButton && !repeatButton.textContent.includes('تم بحمد الله')) {
                this.style.transform = 'translateY(-3px)';
                this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        });
        
        // Add click event directly to repeat button
        const repeatButton = item.querySelector('.repeat');
        if (repeatButton) {
            repeatButton.addEventListener('click', function(e) {
                e.stopPropagation();
                handleTasbeehRepeat(e, id);
            });
        }
        
        // Add click event to individual reset button
        const resetButton = item.querySelector('.reset-individual');
        if (resetButton) {
            resetButton.addEventListener('click', function(e) {
                e.stopPropagation();
                resetIndividualTasbeeh(item, id);
            });
        }
        
        // Load saved values
        loadTasbeehCounter(id);
    });
}

// Handle tasbeeh repeat counter
function handleTasbeehRepeat(e, id) {
    e.stopPropagation();
    const item = e.currentTarget.closest('.tasbeeh-item');
    const repeatElement = item.querySelector('.repeat');
    const cycleElement = item.querySelector('.cycle-counter');
    
    // Get current count from element text
    let currentCount = repeatElement.textContent;
    
    // Parse the count from Arabic text
    let count = 0;
    if (currentCount.includes('تم بحمد الله')) {
        // Already completed, do nothing
        return;
    } else {
        // Extract number from text like "99 مرة" or "100 مرة"
        const numberMatch = currentCount.match(/\d+/);
        if (numberMatch) {
            count = parseInt(numberMatch[0]);
        }
    }
    
    // Decrease count by 1
    if (count > 0) {
        count--;
        
        // Update display
        if (count === 0) {
            repeatElement.textContent = 'تم بحمد الله';
            repeatElement.style.background = 'linear-gradient(135deg, #27ae60, #229954)';
            repeatElement.style.color = 'white';
            repeatElement.classList.add('completed');
            
            // Increment cycle counter
            const currentCycle = parseInt(cycleElement.textContent) || 0;
            const newCycle = currentCycle + 1;
            cycleElement.textContent = newCycle;
            localStorage.setItem(`tasbeeh_cycle_${id}`, newCycle.toString());
            
            // Reset to 100 after a short delay
            setTimeout(() => {
                repeatElement.textContent = '100 مرة';
                repeatElement.style.background = '';
                repeatElement.style.color = '';
                repeatElement.classList.remove('completed');
                localStorage.setItem(`tasbeeh_${id}`, '100');
            }, 1000);
        } else {
            // Convert back to Arabic text
            repeatElement.textContent = `${count} مرة`;
            localStorage.setItem(`tasbeeh_${id}`, count.toString());
        }
        
        // Add visual feedback
        repeatElement.classList.add('counter-update');
        setTimeout(() => repeatElement.classList.remove('counter-update'), 200);
        
        // Haptic feedback for mobile
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }
}

// Load tasbeeh counter values
function loadTasbeehCounter(id) {
    // Get the index from the id (tasbeeh1 -> 1, tasbeeh2 -> 2, etc.)
    const index = parseInt(id.replace('tasbeeh', '')) - 1;
    const item = document.querySelectorAll('.tasbeeh-item')[index];
    if (!item) return;
    
    const repeatElement = item.querySelector('.repeat');
    const cycleElement = item.querySelector('.cycle-counter');
    
    // Load main counter
    const savedValue = localStorage.getItem(`tasbeeh_${id}`);
    if (savedValue !== null && repeatElement) {
        repeatElement.textContent = `${savedValue} مرة`;
    }
    
    // Load cycle counter
    const savedCycle = localStorage.getItem(`tasbeeh_cycle_${id}`);
    if (savedCycle !== null && cycleElement) {
        cycleElement.textContent = savedCycle;
    }
}

// Reset individual tasbeeh counter
function resetIndividualTasbeeh(item, id) {
    const repeatElement = item.querySelector('.repeat');
    const cycleElement = item.querySelector('.cycle-counter');
    const resetButton = item.querySelector('.reset-individual');
    
    // Reset main counter to 100
    if (repeatElement) {
        repeatElement.textContent = '100 مرة';
        repeatElement.style.background = '';
        repeatElement.style.color = '';
        repeatElement.classList.remove('completed');
        localStorage.setItem(`tasbeeh_${id}`, '100');
    }
    
    // Reset cycle counter to 0
    if (cycleElement) {
        cycleElement.textContent = '0';
        localStorage.setItem(`tasbeeh_cycle_${id}`, '0');
    }
    
    // Visual feedback for reset button
    if (resetButton) {
        resetButton.classList.remove('btn-outline-secondary');
        resetButton.classList.add('btn-success');
        resetButton.innerHTML = '<i class="fas fa-check"></i>';
        
        setTimeout(() => {
            resetButton.classList.remove('btn-success');
            resetButton.classList.add('btn-outline-secondary');
            resetButton.innerHTML = '<i class="fas fa-redo"></i>';
        }, 1000);
    }
}

// Reset all tasbeeh counters
function resetAllTasbeehCounters() {
    const tasbeehItems = document.querySelectorAll('.tasbeeh-item');
    
    tasbeehItems.forEach((item, index) => {
        const id = `tasbeeh${index + 1}`;
        const repeatElement = item.querySelector('.repeat');
        const cycleElement = item.querySelector('.cycle-counter');
        
        // Reset main counter to 100
        if (repeatElement) {
            repeatElement.textContent = '100 مرة';
            repeatElement.style.background = '';
            repeatElement.style.color = '';
            repeatElement.classList.remove('completed');
            localStorage.setItem(`tasbeeh_${id}`, '100');
        }
        
        // Reset cycle counter to 0
        if (cycleElement) {
            cycleElement.textContent = '0';
            localStorage.setItem(`tasbeeh_cycle_${id}`, '0');
        }
    });
    
    // Visual feedback
    const resetButton = document.getElementById('reset-tasbeeh');
    if (resetButton) {
        resetButton.textContent = 'تم إعادة التعيين!';
        resetButton.classList.remove('btn-danger');
        resetButton.classList.add('btn-success');
        
        setTimeout(() => {
            resetButton.innerHTML = '<i class="fas fa-redo"></i> إعادة تعيين جميع العدادات';
            resetButton.classList.remove('btn-success');
            resetButton.classList.add('btn-danger');
        }, 2000);
    }
}

// Initialize remembrance buttons for azkar
function initializeRemembranceButtons() {
    const remembranceItems = document.querySelectorAll('.remembrance-item');
    
    remembranceItems.forEach(item => {
        const repeatButton = item.querySelector('.repeat');
        if (repeatButton) {
            // Add click event listener
            repeatButton.addEventListener('click', handleRemembranceRepeat);
        }
    });
}

// Add touch event support for mobile
document.addEventListener('DOMContentLoaded', function() {
    // Request notification permission when app loads
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                startSalawatReminder();
            }
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
    
    // Initialize tasbeeh items if we're on main2.html
    if (window.location.pathname.endsWith('main2.html')) {
        initializeTasbeehItems();
    }
    // Initialize remembrance buttons if we're on main3.html
    else if (window.location.pathname.endsWith('main3.html')) {
        initializeRemembranceButtons();
    }
    // Initialize prayer times for main page
    else {
        init();
    }
    
    // Function to handle counter click
    function handleCounterClick(e) {
        e.stopPropagation(); // Prevent event bubbling
        const counter = e.currentTarget;
        const prayer = counter.getAttribute('data-prayer');
        const countSpan = counter.querySelector('.counter');
        let currentCount = parseInt(countSpan.textContent, 10) || 0;
        
        // Increment by 1
        currentCount++;
        
        // Update display and storage
        countSpan.textContent = currentCount;
        localStorage.setItem(`counter-${prayer}`, currentCount.toString());
    }

    // Handle click counters for prayers with localStorage persistence
    const counters = document.querySelectorAll('.pray-counter');

    // Initialize counters with saved values or 0
    counters.forEach(counter => {
        // Remove any existing click event listeners
        const newCounter = counter.cloneNode(true);
        counter.parentNode.replaceChild(newCounter, counter);
        
        const prayer = newCounter.getAttribute('data-prayer');
        const countSpan = newCounter.querySelector('.counter');
        
        // Load saved count from localStorage or initialize to 0
        const savedCount = localStorage.getItem(`counter-${prayer}`);
        countSpan.textContent = savedCount || '0';
        
        if (!savedCount) {
            localStorage.setItem(`counter-${prayer}`, '0');
        }
        
        // Add click event to the new counter
        newCounter.addEventListener('click', handleCounterClick);
    });
});
