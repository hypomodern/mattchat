<template>
  <div id="app-container" class="container-fluid">
    <chat-app/>
  </div>
</template>

<script>
  import ChatApp from '@/app/index';

  export default {
    name: 'AppContainer',
    components: {
      ChatApp,
    },
  }
</script>
