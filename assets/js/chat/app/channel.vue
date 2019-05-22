<template>
  <div id="chat-window">
    <div class="panel panel-default">
      <div class="panel-body">
        <ul id="messages" class="list-group rounded">
          <message
            v-for="(message, index) in messages"
            :key="index"
            :message="message"
          />
        </ul>
      </div>
    </div>
    <form id="chat-form" v-on:submit.prevent="sendChat">
      <div class="input-group">
        <input id="chat-input"
                type="text"
                class="form-control"
                v-model="chatMessage">
          <span class="input-group-btn">
            <button id="chat-button"
                    class="btn btn-primary"
                    v-bind:disabled="!chatMessage"
                    v-on:click="sendChat">
              <i class="fas fa-comment"></i>
            </button>
          </span>
      </div>
    </form>
  </div>
</template>

<script>
  import Message from '@/app/message';

  export default {
    name: 'Channel',
    components: {
      Message,
    },
    props: {
      channelName: { type: String, default: () => "" },
      socket: { type: Object, default: () => {} },
    },
    data() {
      return {
        chatMessage: "",
        messages: [],
      }
    },
    watch: {
      socket() {
        this.joinChat();
      },
      channelName() {
        this.joinChat();
      },
    },
    mounted() {
      this.joinChat();
      // this.joinCallChannel()
    },
    beforeDestroy() {
      this.disconnectChannel();
    },
    methods: {
      sendChat(event) {
        if (this.chatMessage) {
          this.chatChannel.push("new_chat_message", {
            body: this.chatMessage,
            channel: this.channelName
          });
          this.chatMessage = ""
        }
      },
      joinChat() {
        if (!this.socket.channel) return;
        if (this.chatChannel && this.chatChannel.leave) this.disconnectChannel();

        this.chatChannel = this.socket.channel(`room:${this.channelName}`, {});

        this.chatChannel.on(`new_chat_message:${this.channelName}`, message => {
          this.messages.push(message);
          this.messages = this.messages.slice(-20);
        });

        this.chatChannel.onClose(() => { console.log(`👋`)});

        this.chatChannel.join()
          .receive("ok", response => {
            this.messages = response;
            // console.log(response);
            console.log(`Joined ${this.channelName} 😊`)
          })
          .receive("error", response => {
            this.error = `Joining ${this.channelName} failed 🙁`
            console.log(this.error, response)
          });
      },
      disconnectChannel() {
        if (this.chatChannel.leave) {
          this.chatChannel.leave();
        }
      }
    },
  }
</script>

<style scoped lang="scss">
  #messages {
    border: 1px solid rgba(0, 0, 0, 0.125);
    margin-bottom: 0;
  }

  #messages .list-group-item {
    border: none;
  }

  #messages li:nth-of-type(even){
    background: #f9f9f9;
  }
</style>