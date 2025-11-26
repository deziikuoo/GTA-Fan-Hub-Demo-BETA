<script>
export default {
  name: "Events",
  methods: {},
  mounted() {},
};
</script>

<template>
  <div class="events"><p>Events Page</p></div>
</template>

<style>
:root {
  --deep-black: rgb(0, 0, 0); /* Deep Black */
  --deep-black2: rgb(60, 60, 60);
  --vibrant-purple: rgb(128, 0, 128); /* Vibrant Purple */
  --soft-lavender: rgb(230, 230, 250); /* Soft Lavender */
  --lavender: rgb(175, 175, 215); /* Soft Lavender */
  --bright-white: rgb(255, 255, 255); /* Bright White */
  --neon-pink: rgb(255, 20, 147); /* Neon Pink */
  --neon-pink2: rgb(231, 22, 225); /* Neon Pink2 */
  --electric-blue: rgb(0, 191, 255); /* Electric Blue */
  --sunset-orange: rgb(255, 99, 71); /* Sunset Orange */
  --mint-green: rgb(152, 255, 152); /* Mint Green */
  --steel-gray: rgb(119, 136, 153); /* Steel Gray */
  --coral-red: rgb(255, 64, 64); /* Coral Red */
}
.events {
  position: absolute;
  top: 40%;
  text-align: center;
  height: auto;
}
.events p {
  color: red;
  height: auto;
  width: 100%;
  font-size: 100px;
  font-weight: bolder;
}
</style>
