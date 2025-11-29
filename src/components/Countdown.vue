<!-- GtaFanHub/src/components/Comps/Countdown.vue -->
<script>
// Removed axios import - using hardcoded release date for demo

export default {
  name: "Countdown",
  keepAlive: true, // This component stays cached
  data() {
    return {
      now: new Date().getTime(), // Current time
      targetDate: null, // Target date (in millisecs)
      serverStartTime: null, // Server's current UTC time when fetched
      clientStartFetch: null, // Client's local time when serverStartTime was fetched
      intervalId: null, // ID for setInterval
      sols: 0,
      hrs: 0,
      mins: 0,
      secs: 0,
      expired: false,
      loading: true,
      //fallbackTargetDate: this.getCurrentTime() + 2 * 60000,
      //fallbackTargetTime: this.getCurrentTime() + 2 * 60000,
      //fallbackTargetDate: new Date("2024-03-09T00:00:00").getTime(), // Hardcoded fallback target date
      userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userRegion: null,
      selectedRegion: null, // Default region in mounted()
    };
  },
  props: {
    isMinimized: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    getCurrentTime() {
      const currentTime = new Date();
      console.log(
        "Current Time:",
        currentTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true,
        })
      );
      return currentTime;
    },

    async fetchCountdown() {
      // Use hardcoded release date: November 19, 2026 at midnight EST
      // November 19, 2026 00:00:00 EST (UTC-5)
      const targetDate = new Date("2026-11-19T00:00:00-05:00");
      
      // Store target date
      this.targetDate = targetDate;
      this.serverStartTime = new Date(); // Use current time as server time
      this.clientStartFetch = new Date().getTime();
      this.loading = false;

      // Start the countdown
      this.startCountdown();
    },

    startCountdown() {
      if (!this.targetDate) {
        console.warn("No valid target date provided.");
        return;
      }

      // Clear any existing interval to prevent duplicates
      if (this.intervalId) clearInterval(this.intervalId);

      // Start a new interval to update the timer every second
      this.intervalId = setInterval(() => {
        try {
          // Get the user's current local time
          const clientNow = new Date().getTime(); // Get client's current time from their PC

          const distance = this.targetDate.getTime() - clientNow; // Calculate distance directly

          if (distance <= 0) {
            clearInterval(this.intervalId); // Stop the timer when it expires
            this.expired = true;
            return;
          }

          // Update remaining time dynamically
          this.sols = Math.floor(distance / (1000 * 60 * 60 * 24));
          this.hrs = Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          this.mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          this.secs = Math.floor((distance % (1000 * 60)) / 1000);

          // Log the count down time
          /*console.log(
            `Countdown: ${this.sols} sols, ${this.hrs} hrs, ${this.mins} mins, ${this.secs} secs`
          ); */
        } catch (error) {
          console.error("Error in countdown interval:", error); // Handle errors appropriately
        }
      }, 1000);
    },

    async fetchReleaseTimes() {
      // No API call needed for demo - release date is hardcoded
      console.log("Release date: November 19, 2026");
    },
    getUserRegion(timeZone) {
      const timeZoneMap = {
        // North America (NTSC-U)
        "America/New_York": "Eastern",
        "America/Chicago": "Central",
        "America/Denver": "Mountain",
        "America/Los_Angeles": "Pacific",
        "America/Anchorage": "Alaska",
        "America/Toronto": "Eastern Canada",
        "America/Vancouver": "Pacific Canada",

        // Europe (PAL)
        "Europe/London": "UK",
        "Europe/Paris": "Central Europe",
        "Europe/Berlin": "Central Europe",
        "Europe/Rome": "Central Europe",
        "Europe/Madrid": "Central Europe",
        "Europe/Moscow": "Eastern Europe",

        // Asia (NTSC-J)
        "Asia/Tokyo": "Japan",
        "Asia/Seoul": "Korea",
        "Asia/Shanghai": "China",
        "Asia/Hong_Kong": "Hong Kong",
        "Asia/Taipei": "Taiwan",

        // Oceania (PAL)
        "Australia/Sydney": "Australia",
        "Pacific/Auckland": "New Zealand",

        // South America
        "America/Sao_Paulo": "Brazil",
        "America/Buenos_Aires": "Argentina",
      };
      return timeZoneMap[timeZone] || "Pacific"; // Default to Eastern if not found
    },
  },
  mounted() {
    // Set initial selected region based on user's time zone
    // REMEMBER to create feature to select time zone to allow users to switch regions
    //this.selectedRegion = this.getUserRegion(this.userTimeZone);

    this.userRegion = this.getUserRegion(
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
    this.fetchReleaseTimes();
    this.fetchCountdown(); // Fetch target date when component is mounted
  },

  beforeDestroy() {
    if (this.intervalId) clearInterval(this.intervalId); // Clean up interval on component destruction
  },
};
</script>

<template>
  <div
    :class="[
      'countdown-container main-backdrop-filter',
      { minimized: isMinimized },
    ]"
  >
    <!--<h2 class="title">COUNTDOWN TIME</h2>-->
    <div v-if="loading">Loading...</div>
    <div v-else-if="expired">TIME EXPIRED</div>
    <div v-else></div>
    <div v-if="expired" class="expired">MISSION TIME EXPIRED</div>

    <div id="countdown" class="timer-container">
      <div class="time-unit">
        <span class="value" :class="{ glow: !expired }">{{ sols }}</span>
        <span class="label">Days</span>
      </div>
      <div class="time-unit">
        <span class="value" :class="{ glow: !expired }">{{ hrs }}</span>
        <span class="label">Hours</span>
      </div>
      <div class="time-unit">
        <span class="value" :class="{ glow: !expired }">{{ mins }}</span>
        <span class="label">Minutes</span>
      </div>
      <div class="time-unit">
        <span class="value" :class="{ glow: !expired }">{{ secs }}</span>
        <span class="label">Seconds</span>
      </div>
    </div>
  </div>
</template>

<style>
body {
  font-family: "Montserrat";
  font-weight: 100;
  color: var(--bright-white);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  margin: 0;
  overflow: hidden;
}

.countdown-container {
  position: absolute;
  display: flex;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  flex-direction: column;
  align-items: center;
  width: 430px;
  height: 47px;
  z-index: 25;
  border: 1px solid var(--neon-pink2);
  border-radius: 20px;
  transition: all 0.2s ease;
  padding: var(--space-md);
  opacity: 1;
  justify-content: center;
  pointer-events: none;
}

.title {
  font-family: "Montserrat";
  position: relative;
  top: 0%;
  text-align: center;
  width: 100%;
  font-weight: normal;
  font-size: 1.1rem;
  color: var(--bright-white);
  letter-spacing: 17px;
  z-index: 5;
}

.expired {
  font-size: 2rem;
  color: var(--coral-red);
  margin-top: 5px;
  text-shadow: 0 0 5px black;
}
/* Controls Background Color and Opacity for the countdown */
#countdown {
  margin-top: 3px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  border-radius: 8px;
  transition: all 0.5s ease; /* Add transition for smooth animation */
  gap: 45px;
}

.time-unit {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: var(--bright-white);
  height: auto;
  width: 100%;
  text-align: center;
}

.value {
  position: relative;
  font-size: 0.8rem;
  font-weight: 500;
  background: none;
  border: none;
  letter-spacing: 7px;
  text-shadow: 0 0 2.5px black, 0 0 2.5px var(--bright-white),
    0 0 12px var(--bright-white);
  margin-bottom: 0px;
}
.label {
  font-family: "Montserrat";
  position: relative;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 3.5px;
  color: var(--bright-white);
  text-shadow: 0 0 5px black, 0 0 2.5px var(--bright-white),
    0 0 6px var(--bright-white);
}

/* countdown Minimized Rules*/

.countdown-container.minimized {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  bottom: 10px;
  right: 10px;
  width: 120px;
  height: 35px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--mint-green);
  border-radius: 20px;
  backdrop-filter: blur(40px);
  transition: all 0.2s ease;
  padding: var(--space-sm);
  opacity: 1;
}

.minimized .title {
  opacity: 0;
  transition: opacity 0.5s ease;
}

.expired {
  font-size: 2rem;
  color: var(--coral-red);
  margin-top: 5px;
  text-shadow: 0 0 5px black;
}
/* Controls Background Color and Opacity for the countdown */
.minimized #countdown {
  color: var(--bright-white);
  background: transparent;
  box-shadow: none;
  border: none;
}
.minimized #countdown .time-unit {
  opacity: 1;
}
.minimized .timer-container {
  position: static;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  height: 100%;
  width: 100%;
  bottom: 19.5%;
  transition: all 0.5s ease; /* Add transition for smooth animation */
}

.minimized .time-unit {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: var(--bright-white);
  height: 100%;
  width: 100%;
  text-align: center;
}

.minimized .value {
  position: absolute;
  top: 33%;
  font-size: 0.84rem;
  font-weight: 400;
  background: none;
  border: none;
  letter-spacing: 3px;
  text-shadow: 0 0 5px black, 0 0 5px var(--bright-white),
    0 0 12px var(--sunset-orange);
  transition: all 0.5s ease-in-out;
}
.minimized .label {
  display: none;
  font-family: "Montserrat";
  position: absolute;
  font-size: 0.625rem;
  font-weight: 500;
  bottom: 10%;
  letter-spacing: 3.5px;
  color: var(--bright-white);
  text-shadow: 0 0 5px black, 0 0 5px var(--bright-white),
    0 0 12px var(--sunset-orange);
}
</style>
