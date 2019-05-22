<template>
  <div class="panel panel-default">
    <div class="panel-body">
      <ul id="users" class="list-group">
        <transition-group name="user-appear">
          <li class="list-group-item"
              v-for="user in users"
              v-bind:key="user.username">
            <button id="call-button"
                    class="btn btn-light"
                    v-bind:disabled="isCurrentUser(user.username) || user.inCall"
                    v-on:click="startVideoCall(user.username)">
              <i
                v-bind:class="{ 'fa-comment': !user.inCall, 'fa-clock': user.inCall }"
                class="fas"
              ></i>
            </button>
            <span class="user-name">{{ user.username }}</span>
            <span v-if="isCurrentUser(user.username)">(you)</span>
          </li>
        </transition-group>
      </ul>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Presences',
    props: {
      users: { type: Array, default: () => [] },
      currentUser: { type: String, default: () => "" },
    },
    methods: {
      isCurrentUser(username) {
        return username === this.currentUser;
      },
      startVideoCall(withUser) {
        this.$emit('start-video-call', withUser);
      }
    }
  }
</script>