import Vue from 'vue'
import { Socket, Presence } from "phoenix"
import AgoraRTC from "agora-rtc-sdk";

const chatContainer = document.querySelector("#chat-container")

if (chatContainer) {

  new Vue({
    el: '#chat-container',
    data: {
      channels: [{name: 'global'}],
      messages: [],
      users: [],
      chatMessage: "",
      error: "",
      currentUser: null,
      chatStatus: "",
      rtcClient: null,
    },
    methods: {
      sendChat(event) {
        if (this.chatMessage) {
          this.chatChannel.push("new_chat_message", { body: this.chatMessage })
          this.chatMessage = ""
        }
      },
      joinCallChannel() {
        this.callChannel = this.socket.channel(`calls`, {})

        this.callChannel.on(`calling:${this.currentUser}`, call => {
          console.log('Got a call!', call)

          this.chatStatus = `incoming call from ${call.caller}...`;
          $(this.$refs.callModal).modal('show');
        })

        this.callChannel.join()
          .receive("ok", response => {
            console.log(`Joined calls 📞`)
          })
          .receive("error", response => {
            this.error = `Joining calls failed 🙁`
            console.log(this.error, response)
          })
      },
      joinChatChannel(channelName) {
        this.chatChannel = this.socket.channel(`room:${channelName}`, {})

        this.presences = {}

        this.chatChannel.on('presence_state', state => {
          this.presences = Presence.syncState(this.presences, state)
          this.users = this.toUsers(this.presences)
        })

        this.chatChannel.on('presence_diff', diff => {
          this.presences = Presence.syncDiff(this.presences, diff)
          this.users = this.toUsers(this.presences)
        })

        this.chatChannel.on("new_chat_message", message => {
          this.messages.push(message)
        })

        this.chatChannel.join()
          .receive("ok", response => {
            console.log(`Joined ${channelName} 😊`)
          })
          .receive("error", response => {
            this.error = `Joining ${channelName} failed 🙁`
            console.log(this.error, response)
          })
      },
      toUsers(presences) {
        const listBy = (username, { metas: [first, ...rest] }) => {
          return { username: username }
        }

        return Presence.list(presences, listBy)
      },
      isCurrentUser(username) {
        return username == this.currentUser;
      },
    },
    mounted() {
      const { authToken, channelName, currentUser } = this.$el.dataset

      this.currentUser = currentUser

      // TODO: look into bootstrap-vue to get real vue components
      $(this.$refs.callModal).on("hide.bs.modal", this.endVideoCall)

      this.socket = new Socket("/socket", { params: { token: authToken } })
      this.socket.connect()

      const client = AgoraRTC.createClient({mode: 'live', codec: "h264"});

      // TODO: extract appID to configuration
      client.init("fb3385d52aac4c9c878c944c7e52c073", () => {
        console.log("AgoraRTC client initialized");
        this.rtcClient = client;
      }, (err) => {
        console.log("AgoraRTC client init failed", err);
      });

      this.joinChatChannel(channelName)
    },
    watch: {
      messages(newValue, oldValue) {
        this.$nextTick(() => {
          const messageList = this.$refs.messages
          messageList.scrollTop = messageList.scrollHeight
        })
      }
    }
  })
}
