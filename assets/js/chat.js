import Vue from 'vue'
import { Socket, Presence } from "phoenix"
import Peer from "simple-peer"
import getUserMedia from "getusermedia"

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
      chatStatus: ""
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

          this.acceptVideoCall(call.caller);
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
      createPeer(initiator, stream) {
        return new Peer({
          initiator: initiator,
          trickle: true,
          stream: stream, 
          // offerConstraints: { 
          //   offerToReceiveAudio: initiator, 
          //   offerToReceiveVideo: initiator 
          // },
          config: {
            iceServers: [
              {
                urls: "stun:numb.viagenie.ca",
                username: "mhw@hypomodern.com",
                credential: "tf02bls"
              },
              {
                urls: "turn:numb.viagenie.ca",
                username: "mhw@hypomodern.com",
                credential: "tf02bls"
              }
            ]
          }
        });
      },
      acceptVideoCall(fromUsername) {
        getUserMedia({video: true, audio: true}, (err, stream) => {
          if(err) {
            console.log(err);
            this.error = "There was a problem with your Webcam/Microphone. Please check your settings and try again.";
            this.chatStatus = "The call failed!";
            return;
          }

          let vendorURL = window.URL || window.webkitURL;
          const myVideo = this.$refs.myVideo;
          myVideo.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
          myVideo.muted = true
          myVideo.play()
          
          const callerVideo = this.$refs.callerVideo;

          this.stream = stream;

          let peer = this.createPeer(false, stream);
          
          peer.on('error', err => {
            try {
              peer.destroy()
              myVideo.removeAttribute("src");
              // myVideo.load();
              callerVideo.removeAttribute("src");
              // callerVideo.load();
              this.chatStatus = "User lost 😔 ";
            } catch(err) {
              console.log('Error in peering', err);
            }
          })

          peer.on('close', () => {
            try {
              peer.destroy()
              myVideo.removeAttribute("src");
              // myVideo.load();
              callerVideo.removeAttribute("src");
              // callerVideo.load();
            } catch(err) {
              // Ignore
            }
          })

          peer.on(`signal`, signal => {
            console.log('Peer got signal, pushing to channel: ', signal);
            this.callChannel.push(`signal`, signal)
          });

          this.callChannel.on(`signal:from_${fromUsername}`, signal => {
            console.log(`got a signal from ${fromUsername}, sending it to peer: `, signal);
            if (peer && !peer.destroyed) {
              peer.signal(signal)
            }
          });
          this.$refs.callModal.dataset.signalChannel = `signal:${fromUsername}`
          
          peer.on('connect', () => {
            this.chatStatus = "Connected!";
            console.log("CONNECTED!");
          })

          peer.on('stream', (callerStream) => {
            // got remote video stream, now let's show it in a video tag
            callerVideo.src = vendorURL ? vendorURL.createObjectURL(callerStream) : callerStream
            callerVideo.play()
            this.chatStatus = `Now streaming live with ${fromUsername}`;
          })
          /* end getUserMedia callback */
        });
      },
      startVideoCall(username) {
        this.error = "";
        const $modal = $('#call-modal');
        $modal.modal('show');

        this.chatStatus = `calling ${username} now...`;

        getUserMedia({video: true, audio: true}, (err, stream) => {
          if(err) {
            console.log(err);
            this.error = "There was a problem with your Webcam/Microphone. Please check your settings and try again.";
            this.chatStatus = "The call failed!";
            return;
          }

          let vendorURL = window.URL || window.webkitURL;
          const myVideo = this.$refs.myVideo;
          myVideo.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
          myVideo.muted = true
          myVideo.play()
          
          const callerVideo = this.$refs.callerVideo;
          let callerVideoPlayingPromise = null;

          this.stream = stream;

          // TODO: actually agree to things and handshake!
          this.callChannel.push(`initiate_call:${username}`, {});

          let peer = this.createPeer(true, stream);

          peer.on('error', err => {
            try {
              console.log('Error in peering', err);
              peer.destroy()
              peer = null
              myVideo.removeAttribute("src");
              // myVideo.load();
              callerVideo.removeAttribute("src");
              // callerVideo.load();
              this.chatStatus = "User lost 😔 ";
            } catch(err) {
              // Ignore
            }
          })

          peer.on('close', () => {
            try {
              peer.destroy()
              peer = null
              myVideo.removeAttribute("src");
              // myVideo.load();
              callerVideo.removeAttribute("src");
              // callerVideo.load();
            } catch(err) {
              // Ignore
            }
          })

          peer.on(`signal`, signal => {
            console.log('Peer got signal, pushing to channel: ', signal);
            this.callChannel.push(`signal`, signal)
          });

          this.callChannel.on(`signal:from_${username}`, signal => {
            console.log(`got a signal from ${username}, sending it to peer: `, signal);
            if (peer && !peer.destroyed) {
              peer.signal(signal);
            }
          });
          this.$refs.callModal.dataset.signalChannel = `signal:${username}`
          
          peer.on('connect', () => {
            this.chatStatus = "Connected!";
            console.log("CONNECTED!");
          })
          
          peer.on('stream', (callerStream) => {
            // got remote video stream, now let's show it in a video tag
            callerVideo.src = vendorURL ? vendorURL.createObjectURL(callerStream) : callerStream
            callerVideo.play()
            this.chatStatus = `Now streaming live with ${username}`;
          })
          /* end getUserMedia callback */
        });
      },
      isCurrentUser(username) {
        return username == this.currentUser;
      },
      endVideoCall() {
        console.log("Hanging up call...")
        
        // close out my video
        const myVideo = this.$refs.myVideo;
        myVideo.removeAttribute("src");
        myVideo.load();

        // close old handler, if present
        if (this.$refs.callModal.dataset.signalChannel) {
          this.callChannel.off(this.$refs.callModal.dataset.signalChannel)
        }

        if (this.stream) {
          this.stream.getTracks().forEach( (track) => {
            track.stop();
          });
          this.stream = null;
        }
      }
    },
    mounted() {
      const { authToken, channelName, currentUser } = this.$el.dataset

      this.currentUser = currentUser

      // TODO: look into bootstrap-vue to get real vue components
      $(this.$refs.callModal).on("hide.bs.modal", this.endVideoCall)

      this.socket = new Socket("/socket", { params: { token: authToken } })
      this.socket.connect()

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
