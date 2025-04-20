<template>
  <div class="w-20 bg-gray-800 text-white p-4 flex flex-col justify-between items-center">
    <div>
      <div class="flex justify-center items-center h-full">
        <!-- Icon for demo (adjust as needed) -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </div>
    </div>

    <div>
      <div class="mt-4 w-6 h-6"  >
        <router-link to="/settings">
          <Cog6ToothIcon></Cog6ToothIcon>
        </router-link>

      </div>

    </div>

  </div>

</template>


<script setup lang="ts">
import {Cog6ToothIcon} from "@heroicons/vue/20/solid";


</script>