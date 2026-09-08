let selectedTimezone = "Asia/Karachi";
let is24Hour = false;
let soundEnabled = false;
let audioContext = null;
let lastPlayedSecond = -1;

const timezoneData = {
    "Asia/Karachi": {
        name: "Pakistan Standard Time"
    },
    "Europe/London": {
        name: "British Time"
    },
    "America/New_York": {
        name: "Eastern Time"
    },
    "Asia/Tokyo": {
        name: "Japan Standard Time"
    },
    "Asia/Dubai": {
        name: "Gulf Standard Time"
    },
    "Australia/Sydney": {
        name: "Australian Eastern Time"
    }
};

const hoursElement = document.getElementById("hours");
const minutesElement = document.getElementById("minutes");
const secondsElement = document.getElementById("seconds");
const periodElement = document.getElementById("period");
const dayElement = document.getElementById("day");
const dateElement = document.getElementById("date");
const timezoneLabel = document.getElementById("timezoneLabel");
const timezoneValue = document.getElementById("timezoneValue");
const timezoneSelect = document.getElementById("timezoneSelect");
const formatBtn = document.getElementById("formatBtn");
const soundBtn = document.getElementById("soundBtn");

function getTimeParts() {
    const now = new Date();

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: selectedTimezone,
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false
    }).formatToParts(now);

    const values = {};

    parts.forEach(part => {
        if (part.type !== "literal") {
            values[part.type] = part.value;
        }
    });

    let hours = Number(values.hour);
    const minutes = Number(values.minute);
    const seconds = Number(values.second);

    const period = hours >= 12 ? "PM" : "AM";

    if (!is24Hour) {
        hours = hours % 12 || 12;
    }

    return {
        hours,
        minutes,
        seconds,
        period
    };
}

function getDateParts() {
    const now = new Date();

    const day = new Intl.DateTimeFormat("en-US", {
        timeZone: selectedTimezone,
        weekday: "long"
    }).format(now);

    const date = new Intl.DateTimeFormat("en-US", {
        timeZone: selectedTimezone,
        month: "long",
        day: "numeric",
        year: "numeric"
    }).format(now);

    return {
        day,
        date
    };
}

function getTimezoneOffset() {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: selectedTimezone,
        timeZoneName: "longOffset"
    });

    const parts = formatter.formatToParts(now);
    const offset = parts.find(part => part.type === "timeZoneName");

    return offset ? offset.value.replace("GMT", "UTC") : "UTC";
}

function updateClock() {
    const time = getTimeParts();
    const date = getDateParts();

    hoursElement.textContent = String(time.hours).padStart(2, "0");
    minutesElement.textContent = String(time.minutes).padStart(2, "0");
    secondsElement.textContent = String(time.seconds).padStart(2, "0");

    periodElement.textContent = is24Hour ? "" : time.period;

    dayElement.textContent = date.day;
    dateElement.textContent = date.date;

    timezoneLabel.textContent = timezoneData[selectedTimezone].name;
    timezoneValue.textContent = getTimezoneOffset();

    if (
        soundEnabled &&
        time.seconds !== lastPlayedSecond
    ) {
        lastPlayedSecond = time.seconds;
        playTick();
    }
}

function playTick() {
    if (!audioContext) {
        audioContext = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
        750,
        audioContext.currentTime
    );

    gain.gain.setValueAtTime(
        0.025,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.05
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(
        audioContext.currentTime + 0.05
    );
}

timezoneSelect.addEventListener("change", function () {
    selectedTimezone = this.value;
    lastPlayedSecond = -1;
    updateClock();
});

formatBtn.addEventListener("click", function () {
    is24Hour = !is24Hour;

    formatBtn.textContent = is24Hour
        ? "24H"
        : "12H";

    updateClock();
});

soundBtn.addEventListener("click", function () {
    soundEnabled = !soundEnabled;

    if (soundEnabled) {
        soundBtn.textContent = "🔊 ON";
        soundBtn.classList.add("active");

        if (!audioContext) {
            audioContext = new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        lastPlayedSecond = -1;
    } else {
        soundBtn.textContent = "🔇 OFF";
        soundBtn.classList.remove("active");
    }
});

updateClock();

setInterval(updateClock, 1000);
