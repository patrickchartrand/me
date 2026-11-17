import './assets/style.css'
import App from './App.vue'
import { router } from './router'
import { i18n } from './i18n/index'
import { createHead } from '@unhead/vue/legacy'

const app = createApp(App)
const head = createHead()

app.use(router)
app.use(i18n)
app.use(head)
app.mount('#app')
