<template>
  <transition name="modal-fade">
  <div class="modal-backdrop" @click.self="hangUpCall">
    <div class="modal-call rounded">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="modal-title">{{ callStatus }}</h5>
          <button
            type="button"
            class="close"
            @click="hangUpCall">
            <span>&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div id="caller-video" ref="callerVideo"></div>
          <div id="my-video" ref="myVideo"></div>

          <p v-if="error">{{ error }}</p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-primary"
            v-if="isCallee && !callJoined"
            @click="acceptCall">
            <i class="fas fa-phone"></i>
            Accept
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            v-if="callJoined"
            @click="toggleAudio">
            <i
              class="fas"
              :class="{'fa-microphone': !muteAudio, 'fa-microphone-slash': muteAudio}" ></i>
            {{ muteAudio ? 'Unmute' : 'Mute' }}
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            @click="hangUpCall">
            <i class="fas fa-phone-slash"></i>
            Hang up
          </button>
        </div>
      </div>
    </div>
  </div>
  </transition>
</template>

<script>
  import EventBus from '@/../eventBus';

  import Twilio, { connect, createlocalStreams, createLocalVideoTrack } from 'twilio-video';

  export default {
    name: 'Call',
    props: {
      currentUser: { type: String, default: () => "" },
      twToken: { type: String, default: () => "" },
      callStatus: { type: String, default: () => "" },
      caller: { type: String, default: () => "" },
      callee: { type: String, default: () => "" },
      callJoined: { type: Boolean, default: () => false },
    },
    data() {
      return {
        localStream: null,
        remoteStreams: [],
        muteAudio: false,
        inCall: false,
        error: "",
      }
    },
    computed: {
      isCallee() {
        return this.callee == this.currentUser;
      },
    },
    watch: {
      callJoined() {
        this.setupCall();
      }
    },
    methods: {
      hangUpCall() {
        this.leaveRoomIfJoined();
        if (this.localStream) {
          this.detachTracks([this.localStream]);
          this.localStream = null;
        }
        if (this.remoteStreams.length > 0) {
          this.remoteStreams = [];
        }
        this.muteAudio = false;
        this.$emit('hang-up-call');
      },
      acceptCall() {
        this.$emit('accept-call');
      },
      toggleAudio() {
        this.muteAudio = !this.muteAudio;
        if (!this.activeRoom) return;
        const localParticipant = this.activeRoom.localParticipant;
        localParticipant.audioTracks.forEach((audioTrack) => {
          this.muteAudio ? audioTrack.disable() : audioTrack.enable();
        });
      },
      videoChannelName() {
        return `call:${this.caller}:${this.callee}`;
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
        if (!this.callJoined) return;
        const room_name = this.videoChannelName()

        this.getAccessToken(room_name).then( (data) => {
          const token = this.twToken;
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
          this.$refs.callerVideo.innerHTML = "";

          Twilio.connect(token, connectOptions).then((room) => {
            console.log('Successfully joined a Room: ', room);
            this.activeRoom = room;

            // Attach the Tracks of all the remote Participants.
            // room.participants.forEach(function(participant) {
            //   let previewContainer = document.getElementById('caller-video');
            //   VueThis.attachParticipantTracks(participant, previewContainer);
            // });

            // When a Participant joins the Room, log the event.
            room.on('participantConnected', (participant) => {
              console.log("Joining: '" + participant.identity + "'");
            });

            // When a Participant adds a Track, attach it to the DOM.
            room.on('trackSubscribed', (track, participant) => {
              console.log(participant.identity + " added track: " + track.kind);
              let callerVideoContainer = this.$refs.callerVideo;
              this.attachTracks([track], callerVideoContainer);
            });

            // When a Participant removes a Track, detach it from the DOM.
            room.on('trackUnsubscribed', (track, participant) => {
              console.log(participant.identity + " removed track: " + track.kind);
              this.detachTracks([track]);
            });

            // When a Participant leaves the Room, detach its Tracks.
            room.on('participantDisconnected', (participant) => {
              console.log("Participant '" + participant.identity + "' left the room");
              this.detachParticipantTracks(participant);
            });

            // if local preview is not active, create it
            if(!this.localStream) {
              const options = {
                // 'logLevel': 'debug'
              };
              createLocalVideoTrack(options).then(track => {
                console.log(this);
                let localMediaContainer = this.$refs.myVideo;
                console.log(localMediaContainer);
                this.attachTracks([track], localMediaContainer);
                this.localStream = track;
              });
            }

            this.callStatus = `Connected to ${this.isCallee ? this.caller : this.callee}`;
          });
        });
      },
    },
  }
</script>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.25);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .modal-call {
    background: #FFFFFF;
    box-shadow: 2px 2px 20px 1px;
    overflow-x: auto;
    display: flex;
    flex-direction: column;
    min-height: 10rem;
    min-width: 40rem;
  }

  .modal-content {
    border: none;
  }

  .modal-fade-enter,
  .modal-fade-leave-active {
    opacity: 0;
  }

  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: opacity .5s ease
  }
</style>