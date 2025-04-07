import { createApp } from 'vue';
import App from './App.vue';
import { DraggableList } from '@drag-list/vue';

const app = createApp(App);
app.component('DraggableList', DraggableList);
app.mount('#app'); 