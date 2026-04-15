import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// 1. 引入 TresJS 提供的模板编译选项
import { templateCompilerOptions } from '@tresjs/core'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue({
      // 2. 将编译选项展开，告诉 Vue 忽略 Tres 自定义标签
      ...templateCompilerOptions
    })],
})
