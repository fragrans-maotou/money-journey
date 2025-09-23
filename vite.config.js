import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // GitHub Pages 部署配置
  const isGitHubPages = env.VITE_DEPLOY_TARGET === 'github-pages' || mode === 'github-pages'
  const base = isGitHubPages ? '/money-journey/' : '/'

  const plugins = [
    vue(),
    vueDevTools(),
  ]

  // 添加PWA支持
  if (env.VITE_ENABLE_PWA === 'true' || mode === 'production') {
    plugins.push(
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: '月度预算跟踪器',
          short_name: '预算跟踪',
          description: '帮助您管理每月消费预算的智能应用',
          theme_color: '#2D5A27',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: base,
          start_url: base,
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    )
  }

  // 添加构建分析插件
  if (env.VITE_ANALYZE_BUNDLE === 'true') {
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    )
  }

  return {
    base,
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    esbuild: {
      // 跳过 TypeScript 类型检查，只进行语法转换
      target: 'es2020',
      tsconfigRaw: {
        compilerOptions: {
          skipLibCheck: true,
          noEmit: true,
          isolatedModules: true
        }
      }
    },
    build: {
      // 生产构建优化
      target: 'es2015',
      minify: 'terser',
      cssMinify: true,

      // 代码分割配置
      rollupOptions: {
        output: {
          // 手动分割代码块
          manualChunks: {
            // Vue核心库单独打包
            'vue-vendor': ['vue', 'vue-router', 'pinia']
          },
          // 资源文件命名
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
              return `media/[name]-[hash].${ext}`
            }
            if (/\.(png|jpe?g|gif|svg)(\?.*)?$/i.test(assetInfo.name)) {
              return `img/[name]-[hash].${ext}`
            }
            if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
              return `fonts/[name]-[hash].${ext}`
            }
            return `assets/[name]-[hash].${ext}`
          }
        }
      },

      // 压缩配置
      terserOptions: {
        compress: {
          drop_console: true, // 移除console.log
          drop_debugger: true, // 移除debugger
          pure_funcs: ['console.log', 'console.info'] // 移除指定函数调用
        }
      },

      // 资源内联阈值
      assetsInlineLimit: 4096, // 小于4kb的资源内联为base64

      // 启用CSS代码分割
      cssCodeSplit: true,

      // 生成source map用于调试（生产环境可关闭）
      sourcemap: false,

      // 报告压缩详情
      reportCompressedSize: true,

      // 警告阈值
      chunkSizeWarningLimit: 1000
    },

    // 开发服务器配置
    server: {
      // 启用gzip压缩
      compress: true,
      // 预加载模块
      preTransformRequests: true,
      // 移动端开发优化
      host: '0.0.0.0', // 允许外部访问，便于移动设备调试
      port: 3000,
      // 启用HTTP/2
      https: false
    },

    // 预览服务器配置
    preview: {
      // 启用gzip压缩
      compress: true,
      host: '0.0.0.0',
      port: 4173
    },

    // 优化依赖预构建
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia'],
      exclude: ['@vueuse/core'] // 排除不需要预构建的包
    },

    // CSS 预处理器配置
    css: {
      preprocessorOptions: {
        scss: {
          // 自动导入设计系统变量，但排除设计系统文件本身
          additionalData: (content, filename) => {
            // 避免在 design-system.scss 文件中重复导入自己
            if (filename.includes('design-system.scss')) {
              return content
            }
            // 使用 @import 以保持兼容性，直到所有文件都迁移到 @use
            return `@import "@/styles/design-system.scss";\n${content}`
          },
          // 抑制 Sass 弃用警告
          silenceDeprecations: ['import']
        }
      },
      // 启用CSS模块
      modules: {
        localsConvention: 'camelCase'
      }
    },

    // 定义全局常量
    define: {
      __VUE_OPTIONS_API__: false, // 禁用Options API以减小包体积
      __VUE_PROD_DEVTOOLS__: false, // 生产环境禁用devtools
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    }
  }
})
