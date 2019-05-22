<template>
  <li class="list-group-item">
    <span class="chat-message-name">{{ message.username }}:</span>
    <span class="chat-message-body">{{ message.body }}</span>
  </li>
</template>

<script>
  export default {
    name: 'Message',
    props: {
      message: { type: Object, default: () => {} },
    },
  }
</script>