<template>
  <div class="panel panel-default">
    <div class="panel-body">
      <ul id="channels" class="list-group">
        <li class="list-group-item"
            v-for="(channel, index) in channels"
            v-bind:key="index">
          <a
            v-if="channel.name === selected"
            class="channel-name active"
          >
            #{{ channel.name }}
          </a>
          <a
            v-else
            class="channel-name selectable"
            @click="changeChannel(channel.name)"
          >
            #{{ channel.name }}
          </a>
        </li>
        <li class="list-group-item">
          <form id="channel-form" v-on:submit.prevent="createChannel">
            <div class="input-group">
              <input id="chat-input"
                      type="text"
                      class="form-control"
                      v-model="newChannel">
                <span class="input-group-btn">
                  <button id="chat-button"
                          class="btn btn-primary"
                          v-bind:disabled="!newChannel">
                    <i class="fas fa-plus-square"></i>
                  </button>
                </span>
            </div>
          </form>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ChannelList',
    props: {
      channels: { type: Array, default: () => [] },
      selected: { type: String, default: () => "" },
    },
    data() {
      return {
        newChannel: "",
      }
    },
    methods: {
      createChannel() {
        if (this.newChannel) {
          this.$emit('create-channel', this.newChannel);
          this.newChannel = "";
        }
      },
      changeChannel(toChannel) {
        this.$emit('change-channel', toChannel);
      },
    }
  }
</script>

<style scoped lang="scss">
  .active {
    font-weight: bold;
  }

  .selectable {
    cursor: pointer;
  }
</style>