/**
 * Horloge numérique avec fuseaux horaires
 */

const timeZones = [
    { city: 'Paris', zone: 'Europe/Paris', emoji: '🇫🇷' },
    { city: 'Londres', zone: 'Europe/London', emoji: '🇬🇧' },
    { city: 'Tokyo', zone: 'Asia/Tokyo', emoji: '🇯🇵' },
    { city: 'New York', zone: 'America/New_York', emoji: '🇺🇸' },
    { city: 'Los Angeles', zone: 'America/Los_Angeles', emoji: '🇺🇸' },
    { city: 'Sydney', zone: 'Australia/Sydney', emoji: '🇦🇺' },
    { city: 'Hong Kong', zone: 'Asia/Hong_Kong', emoji: '🇭🇰' },
    { city: 'Dubaï', zone: 'Asia/Dubai', emoji: '🇦🇪' },
    { city: 'Singapour', zone: 'Asia/Singapore', emoji: '🇸🇬' },
    { city: 'Moscou', zone: 'Europe/Moscow', emoji: '🇷🇺' },
    { city: 'São Paulo', zone: 'America/Sao_Paulo', emoji: '🇧🇷' },
    { city: 'Bangkok', zone: 'Asia/Bangkok', emoji: '🇹🇭' }
];

/**
 * Initialiser les horloges
 */
function initializeClock() {
    const clocksGrid = document.getElementById('clocks-grid');
    clocksGrid.innerHTML = '';

    timeZones.forEach(tz => {
        const clockCard = document.createElement('div');
        clockCard.className = 'clock-card';
        clockCard.innerHTML = `
            <div class="clock-header">
                <span class="city-emoji">${tz.emoji}</span>
                <h3>${tz.city}</h3>
            </div>
            <div class="clock-display" id="clock-${tz.zone}">
                <div class="digital-time">--:--:--</div>
                <div class="timezone-info">${tz.zone}</div>
            </div>
            <div class="analog-clock" id="analog-${tz.zone}">
                <div class="clock-center"></div>
                <div class="hand hour-hand"></div>
                <div class="hand minute-hand"></div>
                <div class="hand second-hand"></div>
                <div class="clock-marker marker-12">12</div>
                <div class="clock-marker marker-3">3</div>
                <div class="clock-marker marker-6">6</div>
                <div class="clock-marker marker-9">9</div>
            </div>
        `;
        clocksGrid.appendChild(clockCard);
    });

    // Mettre à jour les horloges toutes les secondes
    updateClocks();
    setInterval(updateClocks, 1000);
}

/**
 * Mettre à jour les horloges
 */
function updateClocks() {
    timeZones.forEach(tz => {
        updateDigitalClock(tz);
        updateAnalogClock(tz);
    });
}

/**
 * Mettre à jour l'horloge numérique
 */
function updateDigitalClock(tz) {
    const clockElement = document.getElementById(`clock-${tz.zone}`);
    if (!clockElement) return;

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('fr-FR', {
        timeZone: tz.zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const time = formatter.format(now);
    const timeDisplay = clockElement.querySelector('.digital-time');
    timeDisplay.textContent = time;
}

/**
 * Mettre à jour l'horloge analogique
 */
function updateAnalogClock(tz) {
    const analogClock = document.getElementById(`analog-${tz.zone}`);
    if (!analogClock) return;

    const now = new Date();
    
    // Obtenir l'heure dans le fuseau horaire
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz.zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const timeObj = {};
    parts.forEach(part => {
        if (part.type !== 'literal') {
            timeObj[part.type] = parseInt(part.value);
        }
    });

    const hours = timeObj.hour || 0;
    const minutes = timeObj.minute || 0;
    const seconds = timeObj.second || 0;

    // Calculer les angles
    const secondDegrees = (seconds / 60) * 360;
    const minuteDegrees = (minutes / 60) * 360 + (seconds / 60) * 6;
    const hourDegrees = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;

    // Appliquer les rotations
    const hourHand = analogClock.querySelector('.hour-hand');
    const minuteHand = analogClock.querySelector('.minute-hand');
    const secondHand = analogClock.querySelector('.second-hand');

    if (hourHand) hourHand.style.transform = `rotate(${hourDegrees}deg)`;
    if (minuteHand) minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
    if (secondHand) secondHand.style.transform = `rotate(${secondDegrees}deg)`;
}

// Initialiser quand la page se charge
window.addEventListener('load', () => {
    if (document.getElementById('clocks-grid')) {
        initializeClock();
    }
});

// Observer pour les changements de page
const originalShowPage = window.showPage;
window.showPage = function(pageName) {
    originalShowPage(pageName);
    if (pageName === 'clock') {
        setTimeout(() => {
            if (!document.getElementById('clocks-grid').querySelector('.clock-card')) {
                initializeClock();
            }
        }, 100);
    }
};
