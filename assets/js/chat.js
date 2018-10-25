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
      callStatus: "",
      rtcClient: null,
      localStream: null,
      remoteStream: null,
      callMeta: {
        inCall: false,
        callJoined: false,
        callee: false,
        caller: null
      }
    },
    computed: {
      isCallee() {
        return this.callMeta.callee == this.currentUser;
      },
      callJoined() {
        return this.callMeta.callJoined;
      }
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
          if (this.callMeta.inCall) {
            console.log('Ignoring it because we are already on a call');
            this.callChannel.push(`busy:${call.caller}`);
            return;
          }
          this.callStatus = `incoming call from ${call.caller}...`;
          this.callMeta.inCall = true;
          this.callMeta.caller = call.caller;
          this.callMeta.callee = this.currentUser;
          $(this.$refs.callModal).modal('show');
        });

        this.callChannel.on(`hangup:${this.currentUser}`, call => {
          console.log('Hangup!', call)

          this.callStatus = '';
          this.resetCallMeta();
          $(this.$refs.callModal).modal('hide');
        });

        this.callChannel.on(`busy:${this.currentUser}`, call => {
          console.log('They were busy!');
          this.callStatus = `${this.callMeta.callee} is already in a call, sorry!`
          this.resetCallMeta();
        });

        this.callChannel.on(`call_accepted:${this.currentUser}`, call => {
          console.log(`call_accepted:${this.currentUser}`, call)

          this.callStatus = `connecting you to ${call.callee}...`;
          // TODO: connect over agora

          this.setupAgoraChannel();
        });

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
      startVideoCall(username) {
        this.callChannel.push(`initiate_call:${username}`);
        this.callStatus = `calling ${username}...`;
        this.callMeta.inCall = true;
        this.callMeta.caller = this.currentUser;
        this.callMeta.callee = username;
        $(this.$refs.callModal).modal('show');
      },
      hangUpCall() {
        this.callChannel.push(`hangup:${this.callMeta.callee}`);
        this.callChannel.push(`hangup:${this.callMeta.caller}`);
        this.closeAgoraChannel();
        this.resetCallMeta();
      },
      resetCallMeta() {
        this.callMeta = {
          inCall: false,
          callJoined: false,
          caller: null,
          callee: null,
        }
        if (this.localStream) this.localStream.close();
        if (this.remoteStream) this.remoteStream.close();
      },
      acceptCall() {
        console.log("Accepting call...");
        this.callMeta.callJoined = true;
        this.callChannel.push(`accept_call:${this.callMeta.caller}`);
        this.callStatus = `connecting you to ${this.callMeta.caller}...`;
        // TODO: connect over agora

        this.setupAgoraChannel();
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
      agoraChannelName() {
        return `call:${this.callMeta.caller}:${this.callMeta.callee}`;
      },
      setupAgoraChannel() {
        // TODO: secure channels with server-generated authtoken
        const _client = this.rtcClient;
        this.rtcClient.join(null, this.agoraChannelName(), null, (uid) => {
          console.log("User " + uid + " joined channel successfully");
          const localStream = AgoraRTC.createStream({
            streamID: uid,
            audio: true,
            video: true,
            screen: false
          });

          this.localStream = localStream;
          localStream.init(function() {
            console.log("getUserMedia success");
            localStream.play('my-video');

            _client.publish(localStream, function (err) {
              console.log("Publish local stream error: " + err);
            });
          }, function (err) {
            console.log("getUserMedia failed", err);
          });

          _client.on('stream-published', function (evt) {
            console.log("Published local stream successfully");
          });

          _client.on('stream-added', function (evt) {
            const stream = evt.stream;
            console.log("New stream added: " + stream.getId());

            _client.subscribe(stream, function (err) {
              console.log("Subscribe stream failed", err);
            });
          });

          _client.on('stream-subscribed', (evt) => {
            const remoteStream = evt.stream;
            this.remoteStream = remoteStream;
            console.log("Subscribe remote stream successfully: " + remoteStream.getId());
            remoteStream.play('caller-video');
            this.callStatus = `Connected to ${this.isCallee ? this.callMeta.caller : this.callMeta.callee}`;
            $('#caller-video video').css('position', '');
          });

          _client.on('peer-leave', function (evt) {
            const stream = evt.stream;
            if (stream) {
              console.log(evt.uid + " left this channel");
            }
          });
        }, function(err) {
          console.log("Join channel failed", err);
        });
      },
      closeAgoraChannel() {
        this.rtcClient.leave(function() {
          console.log("we left the channel");
        }, function(err) {
          console.log("client leave failed ", err);
        });
      },
      endVideoCall() {
        $('#my-video > *').remove();
        $('#caller-video > *').remove();
      }
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
      this.joinCallChannel()
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
