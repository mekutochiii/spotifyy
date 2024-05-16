<template>
  <div class="flex items-center justify-between  text-white font-bold mb-4 p-2 mx-10 rounded-lg">
    <div class="text-center ml-10">Chat</div>
    </div>

  <div class="fixed bottom-0 justify-center">
    <div class="flex flex-col items-center w-full">
      <input v-model="messageInput" type="text" placeholder="Enter a message" class="rounded-full text-center border border-white mb-5 h-8  text-black w-56">
      <button @click="sendMessage" class="bg-zinc-700 hover:bg-zinc-600 text-white text-md font-semibold rounded-full h-8 text-center mb-4 w-24 ">Send</button>
    </div>
  </div>

  <!-- Display messages -->
  <ul id="messages" class="mt-8 mx-2">
    <li v-for="msg in messages" :key="msg.id" :class="{ 'text-right': msg.sender === username, 'text-left': msg.sender !== username, 'text-blue-600': msg.sender === username, 'text-white-600': msg.sender !== username, 'font-semibold': true }">


      <!-- Use conditional rendering to style sent messages -->
      <div v-if="msg.sender === username">{{ msg.text }}</div>

      
      <!-- Use conditional rendering to style received messages -->
      <div v-else >{{ msg.sender && msg.sender !== username ? msg.sender + ': ' : '' }}{{ msg.text }}</div>
    </li>
  </ul>
</template>

<script>
import { onMounted, ref } from 'vue';
import io from 'socket.io-client';

export default {
  setup() {
    const messageInput = ref(''); // Reactive variable for message input
    const messages = ref([]); // Reactive array for storing messages
    const socket = io('http://localhost:3000'); // Connect to your server
    
    onMounted(() => {
      socket.on('connect', () => {
        console.log('Connected to server');
      });

      socket.on('chat message', (msg) => {
        messages.value.push(msg);
        setTimeout(() => {
          const messagesContainer = document.getElementById('messages');
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 100);
      });
    });

    const sendMessage = () => {
      if (messageInput.value.trim() !== '') {
        socket.emit('chat message', messageInput.value.trim());
        messageInput.value = '';
      }
    };

    return { messageInput, sendMessage, messages };
  },
};
</script>


