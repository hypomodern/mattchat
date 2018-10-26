import Vue from 'vue'
import { Socket, Presence } from "phoenix"
import Twilio, { connect, createlocalStreams, createLocalVideoTrack } from 'twilio-video';
import axios from 'axios';

const chatContainer = document.querySelector("#chat-container")

if (chatContainer) {

  new Vue({
    el: '#chat-container',
    data: {
      channels: [{name: 'global'}],
      currentChannel: 'global',
      messages: [],
      users: [],
      chatMessage: "",
      error: "",
      currentUser: null,
      callStatus: "",
      twToken: null,
      localStream: null,
      remoteStreams: [],
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
          this.chatChannel.push("new_chat_message", { body: this.chatMessage, channel: this.currentChannel })
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

          this.setupCall();
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
        this.chatChannel.push('started_call');
        this.callStatus = `calling ${username}...`;
        this.callMeta.inCall = true;
        this.callMeta.caller = this.currentUser;
        this.callMeta.callee = username;
        $(this.$refs.callModal).modal('show');
      },
      hangUpCall() {
        this.callChannel.push(`hangup:${this.callMeta.callee}`);
        this.callChannel.push(`hangup:${this.callMeta.caller}`);
      },
      resetCallMeta() {
        this.callMeta = {
          inCall: false,
          callJoined: false,
          caller: null,
          callee: null,
        }
        this.leaveRoomIfJoined();
        if (this.localStream) {
          this.detachTracks([this.localStream]);
          this.localStream = null;
        }
        if (this.remoteStreams.length > 0) {
          this.remoteStreams = [];
        }
        this.chatChannel.push('ended_call');
      },
      acceptCall() {
        console.log("Accepting call...");
        this.callMeta.callJoined = true;
        this.callChannel.push(`accept_call:${this.callMeta.caller}`);
        this.callStatus = `connecting you to ${this.callMeta.caller}...`;

        this.chatChannel.push('started_call');

        this.setupCall();
      },
      toUsers(presences) {
        const listBy = (username, { metas: [first, ...rest] }) => {
          return { username: username, inCall: first.in_call }
        }

        return Presence.list(presences, listBy)
      },
      isCurrentUser(username) {
        return username == this.currentUser;
      },
      videoChannelName() {
        return `call:${this.callMeta.caller}:${this.callMeta.callee}`;
      },

      // Attach the Tracks to the DOM.
      attachTracks(tracks, container) {
        tracks.forEach(function(track) {
          container.appendChild(track.attach());
        });
      },

      // Attach the Participant's Tracks to the DOM.
      attachParticipantTracks(participant, container) {
        let tracks = Array.from(participant.tracks.values());
        this.remoteStreams = tracks;
        this.attachTracks(tracks, container);
      },

      // Detach the Tracks from the DOM.
      detachTracks(tracks) {
        tracks.forEach( (track) => {
          track.detach().forEach((detachedElement) => {
            console.log(`removing ${detachedElement}`)
            detachedElement.remove();
          });
        });
      },

      // Detach the Participant's Tracks from the DOM.
      detachParticipantTracks(participant) {
        let tracks = Array.from(participant.tracks.values());
        this.detachTracks(tracks);
      },

      // Leave Room.
      leaveRoomIfJoined() {
        console.log("Leaving room", this.activeRoom)
        if (this.localStream) this.localStream.stop();
        if (this.activeRoom) this.activeRoom.disconnect();
      },

      getAccessToken(room_name) {
        return Promise.resolve(this.twToken);
      },

      // Create a new chat
      setupCall() {
        const VueThis = this;
        const room_name = this.videoChannelName()

        this.getAccessToken(room_name).then( (data) => {
          const token = VueThis.twToken;
          let connectOptions = {
            name: room_name,
            // logLevel: 'debug',
            audio: true,
            video: { width: 640 }
          };
          // before a user enters a new room,
          // disconnect the user from they joined already
          this.leaveRoomIfJoined();

          // remove any remote track when joining a new room
          document.getElementById('caller-video').innerHTML = "";

          Twilio.connect(token, connectOptions).then(function(room) {
            console.log('Successfully joined a Room: ', room);
            VueThis.activeRoom = room;

            // Attach the Tracks of all the remote Participants.
            // room.participants.forEach(function(participant) {
            //   let previewContainer = document.getElementById('caller-video');
            //   VueThis.attachParticipantTracks(participant, previewContainer);
            // });

            // When a Participant joins the Room, log the event.
            room.on('participantConnected', function(participant) {
              console.log("Joining: '" + participant.identity + "'");
            });

            // When a Participant adds a Track, attach it to the DOM.
            room.on('trackSubscribed', function(track, participant) {
              console.log(participant.identity + " added track: " + track.kind);
              let callerVideoContainer = document.getElementById('caller-video');
              VueThis.attachTracks([track], callerVideoContainer);
            });

            // When a Participant removes a Track, detach it from the DOM.
            room.on('trackUnsubscribed', function(track, participant) {
              console.log(participant.identity + " removed track: " + track.kind);
              VueThis.detachTracks([track]);
            });

            // When a Participant leaves the Room, detach its Tracks.
            room.on('participantDisconnected', function(participant) {
              console.log("Participant '" + participant.identity + "' left the room");
              VueThis.detachParticipantTracks(participant);
            });

            // if local preview is not active, create it
            if(!VueThis.localStream) {
              const options = {
                // 'logLevel': 'debug'
              };
              createLocalVideoTrack(options).then(track => {
                let localMediaContainer = document.getElementById('my-video');
                VueThis.attachTracks([track], localMediaContainer);
                VueThis.localStream = track;
              });
            }

            VueThis.callStatus = `Connected to ${VueThis.isCallee ? VueThis.callMeta.caller : VueThis.callMeta.callee}`;
          });
        });
      },
    },
    mounted() {
      const { authToken, channelName, currentUser, _uid, _ws, twToken } = this.$el.dataset

      this.currentUser = currentUser;
      this.twToken = twToken;

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
