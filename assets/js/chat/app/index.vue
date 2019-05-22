<template>
  <div id="chat-app" class="row">
    <div class="col-3">
      <presences
        :users="users"
        :currentUser="currentUser"
        @start-video-call="startCall"
      />

      <hr>

      <channel-list
        :channels="channels"
        :selected="selectedChannel"
        @change-channel="switchChannel"
        @create-channel="createChannel"
      />

      <div
        v-if="error"
        class="alert alert-danger alert-dismissable fade show" role="alert">
        {{ error }}
        <button
          type="button"
          class="close"
          @click="clearError"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>

    <div class="col">
      <channel
        :channelName="selectedChannel"
        :socket="socket"
      />
    </div>

    <call
      v-show="shouldShowCall"
      @hang-up-call="closeCall"
      @accept-call="acceptCall"
      :currentUser="currentUser"
      :twToken="twToken"
      :caller="caller"
      :callee="callee"
      :callStatus="callStatus"
      :callJoined="callJoined"
    />
  </div>
</template>

<script>
  import Presences from '@/app/presences';
  import ChannelList from '@/app/channelList';
  import Channel from '@/app/channel';
  import Call from '@/app/call';
  import storage from '@/../localStorage';
  // import EventBus from '@/../eventBus';

  import { Socket, Presence } from "phoenix";

  import 'emoji-mart-vue-fast/css/emoji-mart.css';

  export default {
    name: 'ChatApp',
    components: {
      Presences,
      ChannelList,
      Channel,
      Call,
    },
    data() {
      return {
        users: [],
        channels: [],
        currentUser: null,
        presences: {},
        socket: {},
        error: null,
        selectedChannel: this.getSelectedChannel(),
        inCall: false,
        twToken: null,
        caller: "",
        callee: "",
        callStatus: "",
        callJoined: false,
      };
    },
    computed: {
      shouldShowCall() {
        return this.inCall;
      },
    },
    mounted() {
      const userEl = document.getElementById('userData');
      const { authToken, currentUser, _uid, _ws, twToken } = userEl.dataset;
      // console.log(authToken, currentUser, twToken);

      this.currentUser = currentUser;
      this.twToken = twToken;

      // TODO: look into bootstrap-vue to get real vue components
      // $(this.$refs.callModal).on("hide.bs.modal", this.endVideoCall)

      this.socket = new Socket("/socket", { params: { token: authToken } });
      this.socket.connect();

      this.joinMattchat();
      this.joinCallChannel()
    },
    // beforeDestroy() {
    //   EventBus.bus.$off('hang-up-call');
    // },
    methods: {
      clearError() {
        this.error = null;
      },
      getSelectedChannel() {
        return storage.getString('selected_channel', 'general');
      },
      switchChannel(toChannel) {
        storage.setString('selected_channel', toChannel);
        this.selectedChannel = toChannel;
      },
      createChannel(newChannelName) {
        this.appChannel.push("create_channel", {
          name: newChannelName
        }).receive('error', (response) => {
          this.error = response.message;
        });
      },
      joinMattchat() {
        this.appChannel = this.socket.channel("mattchat", {});
        this.presenceManager = new Presence(this.appChannel);

        function toUsers(presence) {
          return presence.list((id, user) => {
            return { username: id, inCall: user.metas[0].in_call };
          });
        }

        this.presenceManager.onSync(() => {
          this.users = toUsers(this.presenceManager)
        });

        this.appChannel.on("new_channel", message => {
          this.channels.push(message);
        })

        this.appChannel.join()
          .receive("ok", response => {
            this.channels = response;
            console.log(`Joined MattChat! 🖥`)
          })
          .receive("error", response => {
            this.error = `Joining MattChat failed 😥`
            console.log(this.error, response)
          });
      },
      joinCallChannel() {
        this.callChannel = this.socket.channel(`calls`, {});

        this.callChannel.on(`calling:${this.currentUser}`, call => {
          console.log('Got a call!', call);
          if (this.inCall) {
            console.log('Ignoring it because we are already on a call');
            this.callChannel.push(`busy:${call.caller}`);
            return;
          }

          this.resetCallMeta();
          this.callStatus = `incoming call from ${call.caller}...`;
          this.caller = call.caller;
          this.callee = this.currentUser;
          this.inCall = true;
        });

        this.callChannel.on(`hangup:${this.currentUser}`, call => {
          console.log('Hangup!', call);
          this.inCall = false;
          this.endCall();
        });

        this.callChannel.on(`busy:${this.currentUser}`, call => {
          console.log('They were busy!');
          this.callStatus = `${this.callee} is already in a call, sorry!`
        });

        this.callChannel.on(`call_accepted:${this.currentUser}`, call => {
          console.log(`call_accepted:${this.currentUser}`, call);

          this.callStatus = `connecting you to ${call.callee}...`;
          this.callJoined = true;
        });

        this.callChannel.join()
          .receive("ok", response => {
            console.log(`Joined calls 📞`)
          })
          .receive("error", response => {
            this.error = `Joining calls failed 🙁`
            console.log(this.error, response)
          });
      },
      startCall(withUser) {
        this.callStatus = `calling ${withUser}...`;
        this.caller = this.currentUser;
        this.callee = withUser;
        this.inCall = true;
        this.callChannel.push(`initiate_call:${withUser}`);
        this.appChannel.push('started_call');
      },
      closeCall() {
        this.callChannel.push(`hangup:${this.callee}`);
        this.callChannel.push(`hangup:${this.caller}`);
        this.inCall = false;
      },
      resetCallMeta() {
        this.callStatus = "";
        this.caller = "";
        this.callee = "";
        this.callJoined = false;
      },
      endCall() {
        this.appChannel.push('ended_call');
      },
      acceptCall() {
        this.callJoined = true;
        this.callChannel.push(`accept_call:${this.caller}`);
        this.callStatus = `connecting you to ${this.caller}...`;

        this.appChannel.push('started_call');
      }
    },
  }
</script>

<style scoped lang="scss">
  #chat-app {
    margin-top: 1rem;
  }
</style>
