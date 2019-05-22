<template>
  <div id="chat-app" class="row">
    <div class="col-3">
      <presences
        :users="users"
        :currentUser="currentUser"
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
  </div>
</template>

<script>
  import Presences from '@/app/presences';
  import ChannelList from '@/app/channelList';
  import Channel from '@/app/channel';
  import storage from '@/../localStorage';

  import { Socket, Presence } from "phoenix";
  // import Twilio, { connect, createlocalStreams, createLocalVideoTrack } from 'twilio-video';

  export default {
    name: 'ChatApp',
    components: {
      Presences,
      ChannelList,
      Channel,
    },
    data() {
      return {
        users: [],
        channels: [],
        currentUser: null,
        presences: {},
        socket: {},
        error: null,
        selectedChannel: this.getSelectedChannel()
      };
    },
    computed: {
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
      // this.joinCallChannel()
    },
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
    },
  }
</script>

<style scoped lang="scss">
  #chat-app {
    margin-top: 1rem;
  }
</style>
