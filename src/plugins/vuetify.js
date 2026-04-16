import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          background: '#f0f7ff',
          surface: '#ffffff',
          primary: '#3b82f6',
          secondary: '#60a5fa',
          accent: '#0ea5e9',
          error: '#ef4444',
          info: '#3b82f6',
          success: '#22c55e',
          warning: '#f59e0b',
        },
      },
    },
  },
})
