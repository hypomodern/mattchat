import Vue from 'vue'
import { Socket, Presence } from "phoenix"

const chatContainer = document.querySelector("#chat-container")

if (chatContainer) {

  new Vue({
    el: '#chat-container',
    data: {
      channels: [{name: 'global'}],
      messages: [],
      users: [],
      chatMessage: "",
      error: ""
    },
    methods: {
      sendChat(event) {
        if (this.chatMessage) {
          this.channel.push("new_chat_message", { body: this.chatMessage })
          this.chatMessage = ""
        }
      },
      joinChannel(authToken, channelName) {
        const socket = new Socket("/socket", { params: { token: authToken } })

        socket.connect()

        this.channel = socket.channel(`room:${channelName}`, {})
        
        this.presences = {}

        this.channel.on('presence_state', state => {
          console.log(state)
          this.presences = Presence.syncState(this.presences, state)
          this.users = this.toUsers(this.presences)
        })

        this.channel.on('presence_diff', diff => {
          this.presences = Presence.syncDiff(this.presences, diff)
          this.users = this.toUsers(this.presences)
        })

        this.channel.on("new_chat_message", message => {
          this.messages.push(message)
        })

        this.channel.join()
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
      }
    },
    mounted() {
      const { authToken, channelName } = this.$el.dataset

      this.joinChannel(authToken, channelName)
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
