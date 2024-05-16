<template>
  <section class="app-main">
    <div class="min-h-screen flex flex-col bg-zinc-700 text-white">
      <!-- Header -->
      <header class="bg-zinc-600 py-4 shadow-md shadow-white">
        <div class="container mx-auto px-4 flex justify-between items-center">
          <!-- Logo -->
          <div class="flex items-center">
            <img src="/logo2.png" alt="Logo" class="w-10 h-10 mr-2">
            <h1 class="text-3xl font-bold cursor-pointer">SPOTIFY</h1>
          </div>
          <!-- User info and Logout button -->
          <div class="flex items-center">
            <p class="cursor-pointer text-xl">Welcome, <span class="font-bold"> <u>{{ username }}</u> </span> </p>
            <button @click="logout" class="bg-zinc-800 hover:bg-zinc-500 rounded-full px-4 py-1 ml-4 text-xs">Logout</button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <div class="container flex flex-grow justify-center">
        <!-- Left Container for Tracks -->
        <div class="w-full sm:w-3/4 p-4">
          <!-- Search Input -->
          <input v-model="searchQuery" type="text" placeholder="Search music . . ."
            class="text-center w-40 p-2 rounded-lg text-black placeholder-black mb-4">

          <!-- Search Button -->
          <button @click="search"
            class="bg-zinc-800 hover:bg-zinc-600 text-white rounded-md px-6 py-1 ml-5 font-semibold text-md text-center ">Search</button>

          <!-- Track Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div v-for="track in tracks" :key="track.id" class="bg-zinc-800 rounded-lg
                 overflow-hidden shadow-md shadow-zinc-600">
              <iframe :src="generateEmbedUrl(track.id)" width="100%" height="250" frameBorder="" allowfullscreen=""
                allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
              <div class="p-3">
                <div class="font-semibold text-lg">{{ track.name }}</div>
                <p class="text-zinc-400 text-xs">{{ track.artists[0].name }}</p>
              </div>
            </div>
          </div>
        </div>
        <!-- Right Column: Chat Application -->
        <div>
    <!-- Button to toggle chat box -->
    <button @click="toggleChat" class="fixed bottom-4 right-8 bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-full shadow-lg">
      Chat
    </button>

    <!-- Chat box -->
    <div v-if="showChat" class="fixed right-0 z-10 bg-zinc-800 text-white md:w-64 h-full p-4 rounded-l-lg shadow-md shadow-white">
      <!-- Close button -->
      <button @click="toggleChat" class="absolute top-2 right-2 text-white hover:text-gray-300 focus:outline-none">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      
      <!-- Chat content goes here -->
      <ChatComponent/>
      <!-- Add your chat components here -->
    </div>
  </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import ChatComponent from '@/components/ChatComponent.vue';
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router'; // Import useRouter
import Swal from 'sweetalert2'; // Import SweetAlert

const searchQuery = ref('');
const tracks = ref([]);
const isLoggedIn = ref(false);
const message = ref('');
const username = ref('');
const router = useRouter(); // Use useRouter to access the router

// Place the provided code here
const showChat = ref(false);

const toggleChat = () => {
  showChat.value = !showChat.value; // Toggle the value to show/hide chat box
};

const search = async () => {
  try {
    const response = await axios.get('http://localhost:3000/search', { // Change the URL to use a relative path
      params: {
        q: searchQuery.value
      }
    });
    tracks.value = response.data.tracks.items;
  } catch (error) {
    console.error('Error searching tracks:', error);
  }
};

const generateEmbedUrl = (trackId) => {
  return `https://open.spotify.com/embed/track/${trackId}`;
};

const logout = () => {
  console.log("Logged out!");
  localStorage.removeItem('token');
  router.push('/'); // Redirect to the home page or login page
  // Display SweetAlert after logout
  Swal.fire({
    icon: 'success',
    title: 'Logged out successfully',
    position: 'top',
    showConfirmButton: false,
    timer: 1500,
    customClass: {
      popup: 'my-swal-popup', // Apply custom class for styling popup
      title: 'my-swal-title' // Apply custom class for styling title
    }
  });
};

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/dashboard', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    message.value = response.data.message;
    isLoggedIn.value = true;

    // Extract username from JWT token payload
    const token = localStorage.getItem('token');
    const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decodes the payload part of the JWT token
    if (decodedToken) {
      username.value = decodedToken.username;
    }
  } catch (error) {
    console.error('Error fetching dashboard message:', error);
  }
});
</script>


<style>
.my-swal-popup {
  width: 200px;
  /* Adjust width as needed */
  background-color: #4CAF50;
  /* Custom background color */
  color: white;
  /* Custom text color */
}

.my-swal-title {
  font-size: 16px;
  /* Adjust font size as needed */
}
</style>
