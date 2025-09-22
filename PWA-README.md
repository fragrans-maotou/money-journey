# PWA 功能说明

## 概述

月度预算跟踪器现已支持 PWA (Progressive Web App) 功能，提供类似原生应用的体验。

## PWA 特性

### 🚀 应用安装
- **自动安装提示**: 用户使用应用30秒后会显示安装提示
- **跨平台支持**: 支持 iOS、Android 和桌面平台
- **主屏幕图标**: 安装后可从主屏幕直接启动

### 📱 离线功能
- **完全离线运行**: 所有核心功能在无网络时仍可使用
- **本地数据存储**: 数据保存在浏览器本地存储中
- **离线提示页面**: 网络断开时显示友好的离线页面

### 🔄 自动更新
- **后台更新**: 应用会在后台自动检查和下载更新
- **更新提示**: 有新版本时会提示用户刷新
- **无缝更新**: 更新过程不会丢失用户数据

### 🎨 原生体验
- **全屏显示**: 隐藏浏览器地址栏，提供沉浸式体验
- **启动画面**: 自定义启动画面和图标
- **系统集成**: 与操作系统深度集成

## 技术实现

### 构建配置
- **Vite PWA Plugin**: 使用 `vite-plugin-pwa` 生成 Service Worker
- **Workbox**: 自动生成缓存策略和离线支持
- **代码分割**: 优化加载性能，支持懒加载

### Service Worker 功能
- **资源缓存**: 自动缓存应用资源（JS、CSS、HTML）
- **运行时缓存**: 缓存 API 请求和动态内容
- **更新策略**: 采用 "stale-while-revalidate" 策略

### Manifest 配置
```json
{
  "name": "月度预算跟踪器",
  "short_name": "预算跟踪",
  "description": "帮助您管理每月消费预算的智能应用",
  "theme_color": "#2D5A27",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "scope": "/"
}
```

## 安装指南

### iOS (Safari)
1. 在 Safari 中打开应用
2. 点击分享按钮 (□↗)
3. 选择"添加到主屏幕"
4. 点击"添加"

### Android (Chrome)
1. 在 Chrome 中打开应用
2. 点击浏览器菜单 (⋮)
3. 选择"添加到主屏幕"
4. 点击"添加"

### 桌面 (Chrome/Edge)
1. 在浏览器中打开应用
2. 点击地址栏的安装图标
3. 或使用菜单中的"安装应用"选项

## 开发命令

### 构建 PWA
```bash
npm run build
```

### 预览 PWA
```bash
npm run preview
```

### 构建分析
```bash
npm run build:analyze
```

## 文件结构

```
public/
├── icon.svg                 # 应用图标源文件
├── pwa-192x192.png         # PWA 图标 192x192
├── pwa-512x512.png         # PWA 图标 512x512
├── apple-touch-icon.png    # Apple Touch 图标
├── masked-icon.svg         # Safari 固定标签图标
├── browserconfig.xml       # Microsoft 瓷砖配置
└── offline.html           # 离线页面

src/components/
├── PWAInstallPrompt.vue    # 安装提示组件
└── PWAUpdatePrompt.vue     # 更新提示组件
```

## 性能优化

### 代码分割
- Vue 组件懒加载
- 工具函数独立打包
- 第三方库单独分块

### 资源优化
- 图片压缩和格式优化
- CSS 和 JS 压缩
- Gzip 压缩支持

### 缓存策略
- 静态资源长期缓存
- 动态内容智能缓存
- 离线优先策略

## 浏览器支持

### 完全支持
- Chrome 67+
- Firefox 63+
- Safari 11.1+
- Edge 79+

### 部分支持
- IE 11 (基础功能)
- 旧版移动浏览器

## 注意事项

### 图标文件
当前使用占位符图标文件，生产环境需要：
1. 使用 `public/icon.svg` 作为设计基础
2. 生成所需尺寸的 PNG 图标
3. 确保图标符合各平台规范

### 推荐工具
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### 测试清单
- [ ] 应用可以离线运行
- [ ] 安装提示正常显示
- [ ] 更新机制工作正常
- [ ] 图标在各平台正确显示
- [ ] 启动画面符合设计
- [ ] Lighthouse PWA 评分 > 90

## 部署建议

### HTTPS 要求
PWA 功能需要 HTTPS 环境，本地开发可使用 `localhost`。

### 服务器配置
确保服务器正确配置：
- 正确的 MIME 类型
- 缓存头设置
- Service Worker 文件可访问

### CDN 配置
如使用 CDN，确保：
- Service Worker 从同源加载
- Manifest 文件正确引用
- 图标文件路径正确