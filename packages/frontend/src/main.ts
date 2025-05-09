import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index'; // 修改为使用路径别名
import './styles/index.css';
import {createPinia} from "pinia";
import log from "loglevel";
log.setLevel("info");
import "vue3-toastify/dist/index.css";

const store = createPinia();

const app = createApp(App);
app.use(store)
app.use(router);
app.mount('#app');
