import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import vuetify from './plugins/vuetify.js'
import i18n from './i18n/index.js'
import { ElTabs, ElTabPane } from 'element-plus'
import 'element-plus/es/components/tabs/style/css'
import 'element-plus/es/components/tab-pane/style/css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(vuetify)
app.use(i18n)
app.use(ElTabs)
app.use(ElTabPane)
app.mount('#app')
