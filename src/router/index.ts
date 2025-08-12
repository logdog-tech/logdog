import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('../views/HomeView.vue'),
        },
        {
            path: '/join/:code',
            name: 'join-workspace',
            component: () => import('../views/JoinWorkspace.vue'),
            props: true
        },


        {
            path: '/huge-list-demo',
            name: 'huge-list-demo',
            component: () => import('../views/HugeListDemo.vue'),
            props: true
        },
    ],
})

export default router
