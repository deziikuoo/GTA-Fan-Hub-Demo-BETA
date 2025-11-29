<!--Characters.vue-->
<script>
export default {
  name: "Characters",
  data() {
    return {
      characters: [
        {
          id: "jason_character",
          name: "Jason Duval",
          bio: `Age: Late 20s | Known Associates: Lucia Caminos
A small-time crook with military training and big ambitions. Grew up hard, learned discipline in the service, and now applies it to high-stakes robberies. Jason is street-smart, loyal to his crew, and quick on the trigger when business gets messy. Don’t let the quiet demeanor fool you — he’s always calculating.`,
          image: "/images/CharacterImgs/JasonA.png",
          left: 45,
          zIndex: 30,
          height: "85%",
          bottom: "0%",
        },
        {
          id: "raul_character",
          name: "Raul",
          bio: `Age: 40s | Occupation: Career Criminal
Raul’s been hitting banks since the early 2000s — a pro who thrives under pressure. Known for leading clean jobs and getting out without a trace. Stays off the radar, but when he’s in town, armored trucks start getting nervous. Old school, but never out of touch.`,
          image: "/images/CharacterImgs/RaulA.png",
          left: 56,
          zIndex: 29,
          height: "85%",
          bottom: "0%",
        },
        {
          id: "boobie_character",
          name: "Boobie",
          bio: `Age: 30s | Occupation: Entrepreneur / Hustler
From street legend to business mogul. Boobie owns clubs, real estate, and a music label, but never forgot his roots. Vice City’s elite respect him, the streets worship him, and his enemies? Well, they tend to vanish. Always one step ahead — and always watching.`,
          image: "/images/CharacterImgs/BoobieA.png",
          left: 63.6,
          zIndex: 28,
          height: "85%",
          bottom: "0%",
        },
        {
          id: "cal_character",
          name: "Cal",
          bio: `Age: Unknown | Status: Monitored
Paranoid? Maybe. Wrong? Rarely. Cal's the go-to guy for surveillance, theories, and underground chatter. Used to work tech support — now hacks satellites in his pajamas. Has a theory for everything and a camera on everyone. If he messages you at 3 AM, don’t ignore it.`,
          image: "/images/CharacterImgs/CalA.png",
          left: 80,
          zIndex: 27,
          height: "75%",
          bottom: "5%",
        },
        {
          id: "lucia_character",
          name: "Lucia",
          bio: `Age: Mid 20s | Known Associates: Jason Duval
Fresh out on parole and already making headlines. Lucia doesn’t wait for opportunity — she makes it. Raised in the chaos of Vice City's underbelly, she knows how to survive and isn’t afraid to break the rules (or bones) to get what she wants. Ride or die, but only if she’s in the driver's seat.`,
          image: "/images/CharacterImgs/LuciaA.png",
          left: 30.5,
          zIndex: 29,
          height: "85%",
          bottom: "0%",
        },
        {
          id: "drequan_character",
          name: "Drequan",
          bio: `Age: 30 | Occupation: CEO, Only Raw Records
Was slinging mixtapes — now he’s signing platinum artists. Drequan made his name on the block and his fortune in the booth. His studio’s got a bulletproof booth and a vault in the back. Keep it real, or get out of his face.`,
          image: "/images/CharacterImgs/Dre'quanA.png",
          left: 21,
          zIndex: 28,
          height: "85%",
          bottom: "0%",
        },
        {
          id: "real_character",
          name: "Real (Bae-Luxe & Roxy)",
          bio: `Status: Artists under Only Raw Records
Vice City's hottest rap duo — bold, brash, and always trending. Bae-Luxe brings the fire, Roxy brings the bars. Together they’re setting the streets (and charts) on fire. Expect glitter, gunplay, and gossip when they’re around.`,
          image: "/images/CharacterImgs/RealA.png",
          left: 10,
          zIndex: 27,
          height: "85%",
          bottom: "0%",
        },
        {
          id: "brian_character",
          name: "Brian",
          bio: `Age: 50s | Occupation: Property Owner / Narcotics Middleman
Landlord by day, runner by night. Brian’s got hands in everything from coke shipments to rent collections. Keeps a clean shirt and a dirty schedule. He’s Jason’s landlord, supplier, and part-time headache. Cross him and you’ll be homeless and buried in the same week.`,
          image: "/images/CharacterImgs/BrianA.png",
          left: -15,
          zIndex: 26,
          height: "93%",
          bottom: "-10%",
        },
      ],
      activeCharacter: null,
      hover: null,
    };
  },
  methods: {
    toggleCharacter(id) {
      const index = this.characters.findIndex((char) => char.id === id);
      this.activeCharacter = this.activeCharacter === index ? null : index;
    },
    closeBioOnOutsideClick(event) {
      const isOutside = !event.target.closest(".character-card");
      if (isOutside && this.activeCharacter !== null) {
        this.activeCharacter = null;
      }
    },
    closeBioOnEsc(event) {
      if (event.key === "Escape" && this.activeCharacter !== null) {
        this.activeCharacter = null;
      }
    },
  },
  computed: {
    characterTransform() {
      return (character) => {
        const isHovered = this.hover === this.characters.indexOf(character);
        const jasonLeft = 45;

        if (isHovered) {
          return {
            transform:
              character.left >= jasonLeft
                ? "translateX(20px)"
                : "translateX(-20px)",
          };
        }

        return {
          transform: "translateX(0px)",
        };
      };
    },
    characterStyles() {
      return (character) => ({
        left: `${character.left}%`,
        zIndex: character.zIndex,
        height: character.height,
        bottom: character.bottom,
      });
    },
  },
  mounted() {
    document.addEventListener("click", this.closeBioOnOutsideClick);
    document.addEventListener("keydown", this.closeBioOnEsc);
  },
  beforeDestroy() {
    document.removeEventListener("click", this.closeBioOnOutsideClick);
    document.removeEventListener("keydown", this.closeBioOnEsc);
  },
};
</script>

<template>
  <div class="character-container">
    <div
      v-if="activeCharacter !== null"
      class="overlay"
      @click="activeCharacter = null"
    ></div>
    <div
      v-for="character in characters"
      :key="character.id"
      class="character-card"
      :class="{ expanded: activeCharacter === characters.indexOf(character) }"
      :style="[characterStyles(character), characterTransform(character)]"
      @click.stop="toggleCharacter(character.id)"
      @mouseover="hover = characters.indexOf(character)"
      @mouseleave="hover = null"
    >
      <img
        :class="[
          `${character.name.toLowerCase()}-img`,
          { hovered: hover === characters.indexOf(character) },
        ]"
        :src="character.image"
        :alt="character.name"
      />
      <div
        class="character-details"
        v-if="activeCharacter === characters.indexOf(character)"
      >
        <h2>{{ character.name }}</h2>
        <p>{{ character.bio }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes filterFade {
  0% {
    filter: brightness(1) contrast(1) saturate(1) hue-rotate(0deg)
      drop-shadow(0 0 0 var(--bright-white));
  }
  20% {
    filter: brightness(1.4) contrast(1.1) saturate(1.3) hue-rotate(5deg)
      drop-shadow(0 0 5px var(--bright-white));
  }
  40% {
    filter: brightness(1.4) contrast(1.1) saturate(1.3) hue-rotate(5deg)
      drop-shadow(0 0 5px var(--bright-white));
  }
  100% {
    filter: brightness(1) contrast(1) saturate(1) hue-rotate(0deg)
      drop-shadow(0 0 0 var(--bright-white));
  }
}
.character-container {
  position: relative;
  width: 100%;
  height: 100%;
  bottom: 0%;
  overflow: hidden;
  padding: 2%;
  margin-top: 4%;
  gap: 10px;
}

.character-card {
  position: absolute;
  cursor: pointer;
  transition: transform 0.5s ease;
}

/* Apply blur to non-expanded characters when overlay is active */
.overlay ~ .character-card {
  filter: blur(2px);
}

/* Ensure expanded character is not blurred and has the specified filter */
.character-card.expanded {
  filter: brightness(1.4) contrast(1.1) saturate(1.3) hue-rotate(5deg)
    drop-shadow(0 0 5px var(--bright-white)) !important;
  animation: filterFade 10s ease-in-out;
  z-index: 30 !important; /* Above overlay and other characters */
}

/* Remove filter from non-expanded or hovered states */
.character-card:not(.expanded) img.hovered {
  filter: brightness(1.4) contrast(1.1) saturate(1.3) hue-rotate(5deg)
    drop-shadow(0 0 5px var(--bright-white)) !important;
}
.character-card.expanded img.hovered {
  filter: none;
}

.character-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.3s ease;
}
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 30; /* Above non-expanded characters (26-30), below expanded (31) */
  cursor: pointer;
  background: rgba(0, 0, 0, 0.65); /* Slight darkening for visual feedback */
}

.Jason-img,
.Lucia-img,
.Boobie-img,
.Brian-img,
.Cal-img,
.Drequan-img,
.Real-img,
.Raul-img {
  position: absolute;
  object-fit: cover;
  transition: filter 0.3s ease;
}

.character-details {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.character-details p {
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.8);
}
.character-card.expanded .character-details {
  opacity: 1;
  z-index: 15;
  pointer-events: all;
}
</style>
