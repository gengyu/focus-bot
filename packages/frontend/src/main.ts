import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index'; // 修改为使用路径别名
import './styles/index.css';

const app = createApp(App);

app.use(router);
app.mount('#app');