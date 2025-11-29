<template>
  <div class="followers-tab">
    <div class="followers-header">
      <h3>Followers</h3>
      <p>People following @{{ username }}</p>
    </div>

    <FollowersList
      :userId="userId"
      :emptyMessage="`@${username} doesn't have any followers yet`"
      :showFollowButton="true"
    />
  </div>
</template>

<script>
import FollowersList from "@/components/social/FollowersList.vue";

export default {
  name: "FollowersTab",
  components: {
    FollowersList,
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
.followers-tab {
  padding: 24px;
}

.followers-header {
  text-align: center;
  margin-bottom: 24px;
}

.followers-header h3 {
  color: var(--bright-white, #ffffff);
  font-size: 24px;
  margin-bottom: 8px;
}

.followers-header p {
  color: var(--bright-white);
  font-size: 14px;
  font-weight: 400;
}
</style>
