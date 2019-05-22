<template>
  <li class="list-group-item">
    <span class="chat-message-name">{{ message.username }}:</span>
    <span class="chat-message-body"><fancy-message :value="message.body" /></span>
  </li>
</template>

<script>
  import FancyMessage from '@/app/fancyMessage';

  export default {
    name: 'Message',
    components: {
      FancyMessage,
    },
    props: {
      message: { type: Object, default: () => {} },
    },
  }
</script>

<style>
  .chat-message-body .emoji-mart-emoji {
    padding: 0;
    vertical-align: middle;
    margin-top: -0.1rem;
  }
</style>