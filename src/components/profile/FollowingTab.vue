<template>
  <div class="following-tab">
    <div class="following-header">
      <h3>Following</h3>
      <p>People @{{ username }} is following</p>
    </div>

    <FollowingList
      :userId="userId"
      :emptyMessage="`@${username} isn't following anyone yet`"
      :showUnfollowButton="true"
    />
  </div>
</template>

<script>
import FollowingList from "@/components/social/FollowingList.vue";

export default {
  name: "FollowingTab",
  components: {
    FollowingList,
  },
  props: {
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped>
.following-tab {
  padding: 24px;
}

.following-header {
  text-align: center;
  margin-bottom: 24px;
}

.following-header h3 {
  color: var(--bright-white, #ffffff);
  font-size: 24px;
  margin-bottom: 8px;
}

.following-header p {
  color: var(--bright-white);
  font-size: 14px;
  font-weight: 400;
}
</style>
