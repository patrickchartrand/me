import './assets/style.css'
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n/index'
import { createHead } from '@unhead/vue/legacy'

const app = createApp(App)
const head = createHead()

app.use(i18n)
app.use(head)
app.mount('#app')
