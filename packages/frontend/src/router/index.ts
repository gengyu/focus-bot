import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/HomeView.vue')
    },
    {
        path: '/config/:id?',
        name: 'ConfigView',
        component: () => import('@/views/ConfigView.vue'),
        props: true
    },
    {
        path: '/configs',
        name: 'ConfigList',
        component: () => import('../views/ConfigList.vue'),
        props: true
    },

]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

export default router