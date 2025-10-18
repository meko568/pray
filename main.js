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
    if (!navigator.geolocation) {
        document.getElementById('location').textContent = 'Geolocation is not supported by your browser';
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
                    document.getElementById('dhuhr-time').textContent = formatTime(timings.Dhuhr);
                    document.getElementById('asr-time').textContent = formatTime(timings.Asr);
                    document.getElementById('maghrib-time').textContent = formatTime(timings.Maghrib);
                    document.getElementById('isha-time').textContent = formatTime(timings.Isha);
                    
                    // Highlight current prayer
                    highlightCurrentPrayer(timings);
                })
                .catch(error => {
                    console.error('Error fetching prayer times:', error);
                    document.getElementById('location').textContent = 'حدث خطأ في جلب أوقات الصلاة. يرجى تحديث الصفحة.';
                });
        },
        (error) => {
            console.error('Error getting location:', error);
            document.getElementById('location').textContent = 'تعذر الحصول على الموقع. تأكد من تفعيل خدمة الموقع.';
            // Fallback to default location (Mecca) if location access is denied
            getDefaultPrayerTimes();
        }
    );
}

// Get prayer times for a default location (Damanhour, Egypt)
function getDefaultPrayerTimes() {
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
            document.getElementById('dhuhr-time').textContent = formatTime(timings.Dhuhr);
            document.getElementById('asr-time').textContent = formatTime(timings.Asr);
            document.getElementById('maghrib-time').textContent = formatTime(timings.Maghrib);
            document.getElementById('isha-time').textContent = formatTime(timings.Isha);
            
            highlightCurrentPrayer(timings);
            document.getElementById('location').textContent = 'موقعك: دمنهور، مصر';
        })
        .catch(error => {
            console.error('Error fetching default prayer times:', error);
            document.getElementById('location').textContent = 'حدث خطأ في جلب أوقات الصلاة. يرجى المحاولة لاحقًا.';
        });
}

// Format time from 24h to 12h with AM/PM
function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const date = new Date();
    date.setHours(hours, minutes, 0);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

// Highlight the current prayer
function highlightCurrentPrayer(timings) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Reset all highlights
    document.querySelectorAll('.mainpray').forEach(el => {
        el.classList.remove('current-prayer');
    });
    
    // Define prayer times in order
    const prayers = [
        { id: 'fajr-time', time: timings.Fajr },
        { id: 'dhuhr-time', time: timings.Dhuhr },
        { id: 'asr-time', time: timings.Asr },
        { id: 'maghrib-time', time: timings.Maghrib },
        { id: 'isha-time', time: timings.Isha }
    ];
    
    // Find current prayer
    let currentPrayer = null;
    for (let i = 0; i < prayers.length; i++) {
        const prayerTime = prayers[i].time.split(':');
        const prayerMinutes = parseInt(prayerTime[0]) * 60 + parseInt(prayerTime[1]);
        
        if (currentTime < prayerMinutes) {
            currentPrayer = prayers[i];
            break;
        }
    }
    
    // If no current prayer found (after Isha), highlight Fajr of next day
    if (!currentPrayer) {
        currentPrayer = prayers[0];
    }
    
    // Highlight the current prayer
    const prayerElement = document.getElementById(currentPrayer.id).closest('.mainpray');
    if (prayerElement) {
        prayerElement.classList.add('current-prayer');
    }
}

// Initialize the application
function init() {
    // Update current time every second
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Get prayer times
    getPrayerTimes();
    
    // Refresh prayer times every hour
    setInterval(getPrayerTimes, 60 * 60 * 1000);
}

// Start the application when the page loads
window.onload = init;
