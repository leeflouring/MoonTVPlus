# LunaTV 弹幕功能集成说明

## 概述

LunaTV 已成功集成弹幕功能，支持自动搜索、手动选择和实时显示弹幕。弹幕数据来自 danmu_api 项目。

## 前置条件

### 1. 启动 danmu_api 服务

在使用弹幕功能之前，需要先启动 danmu_api 服务：

```bash
cd D:\projects\danmu_api
npm install
npm start
```

默认情况下，danmu_api 服务将在 http://localhost:9321 启动。

### 2. 配置环境变量（可选）

弹幕请求通过 LunaTV 后端代理转发，需要在后端配置 danmu_api 的地址。

如果您的 danmu_api 服务运行在不同的地址或使用了自定义 token，可以在项目根目录创建 `.env.local` 文件：

```env
# 弹幕 API 地址（默认: http://localhost:9321）
DANMAKU_API_BASE=http://localhost:9321

# 弹幕 API Token（默认: 87654321）
DANMAKU_API_TOKEN=87654321
```

**注意**：
- 环境变量配置的是服务端地址，不是浏览器端
- 如果 danmu_api 和 LunaTV 在同一台机器，使用默认配置即可
- 如果在不同机器，请使用完整的 URL（如 `http://192.168.1.100:9321`）

## 功能特性

### 1. 弹幕选项卡

- 位置：视频播放页面，在"选集"和"换源"选项卡之上
- 功能：
  - 搜索动漫弹幕
  - 浏览搜索结果
  - 选择剧集并加载弹幕
  - 显示当前选择的弹幕信息

### 2. 自动搜索弹幕

- 视频播放时自动根据视频标题搜索并加载弹幕
- 自动记忆上次选择的弹幕源
- 根据当前集数智能匹配对应的弹幕

### 3. 弹幕播放器控制

在播放器设置菜单中提供以下弹幕控制选项：

#### 弹幕开关
- 一键开启/关闭弹幕显示

#### 弹幕不透明度
- 10%、25%、50%、75%、100% 五档可选
- 默认：75%

#### 弹幕字体大小
- 小（20px）
- 中（25px，默认）
- 大（30px）
- 特大（35px）

#### 弹幕速度
- 很慢、慢（默认）、正常、快、很快

### 4. 弹幕记忆功能

- 自动记忆每个视频的弹幕选择
- 下次播放同一视频时自动加载上次选择的弹幕
- 最多保存 100 个视频的弹幕选择记录

## 使用方法

### 手动搜索和选择弹幕

1. 打开视频播放页面
2. 点击"弹幕"选项卡
3. 在搜索框输入动漫名称
4. 点击"搜索"按钮
5. 在搜索结果中选择对应的动漫
6. 在剧集列表中选择当前集数
7. 弹幕会自动加载到播放器

### 自动搜索弹幕

- 视频播放时，系统会自动根据视频标题搜索弹幕
- 如果找到匹配的弹幕，会自动加载到播放器
- 如果有记忆的弹幕选择，会优先使用记忆的选择

### 控制弹幕显示

1. 点击播放器右下角的设置按钮
2. 在设置菜单中找到"弹幕开关"
3. 点击切换弹幕显示/隐藏
4. 可调整弹幕不透明度、字体大小、速度等参数

## 技术实现

### 架构设计

弹幕功能采用后端代理模式，所有弹幕请求通过 Next.js API 路由转发到 danmu_api：

```
前端组件 → Next.js API 路由 (代理) → danmu_api 服务 → 返回数据
```

**优点**：
- 前端不直接暴露 danmu_api 地址
- 避免 CORS 跨域问题
- 可在后端实现缓存和请求控制
- 更好的安全性

### 集成的文件

1. **类型定义**
   - `src/lib/danmaku/types.ts` - 弹幕相关的类型定义

2. **前端 API 封装**
   - `src/lib/danmaku/api.ts` - 弹幕 API 客户端（调用本地代理）

3. **后端代理路由**
   - `src/app/api/danmaku/search/route.ts` - 搜索动漫代理
   - `src/app/api/danmaku/episodes/route.ts` - 获取剧集列表代理
   - `src/app/api/danmaku/comment/route.ts` - 获取弹幕代理
   - `src/app/api/danmaku/match/route.ts` - 自动匹配代理

4. **弹幕管理面板**
   - `src/components/DanmakuPanel.tsx` - 弹幕搜索和选择界面

5. **修改的文件**
   - `src/components/EpisodeSelector.tsx` - 添加弹幕选项卡
   - `src/app/play/page.tsx` - 集成弹幕到播放器

### 使用的插件

- `artplayer-plugin-danmuku` - ArtPlayer 官方弹幕插件

### 弹幕数据流

```
前端: 视频标题 → 调用 /api/danmaku/search
  ↓
后端代理: → 转发到 danmu_api
  ↓
danmu_api: 搜索弹幕 → 返回动漫列表
  ↓
前端: 选择动漫 → 调用 /api/danmaku/episodes
  ↓
后端代理: → 转发到 danmu_api
  ↓
danmu_api: → 返回剧集列表
  ↓
前端: 选择剧集 → 调用 /api/danmaku/comment
  ↓
后端代理: → 转发到 danmu_api
  ↓
danmu_api: → 返回弹幕数据
  ↓
前端: 转换格式 → 加载到播放器 → 显示弹幕
```

## 注意事项

1. **danmu_api 服务必须运行**
   - 弹幕功能依赖 danmu_api 服务
   - 确保服务在配置的地址和端口上运行
   - 后端代理会自动转发请求，前端无需配置

2. **网络连接**
   - LunaTV 服务器必须能够访问 danmu_api 服务
   - 如果 danmu_api 在其他机器，确保网络可达
   - 检查防火墙和端口开放情况

3. **环境变量配置**
   - 配置在后端（`.env.local`），不是前端
   - 修改配置后需要重启 Next.js 服务器
   - 可参考 `.env.example` 文件

4. **弹幕数据源**
   - 弹幕数据来自多个视频平台
   - 部分视频可能没有匹配的弹幕
   - 可在 danmu_api 中配置数据源优先级

5. **性能考虑**
   - 弹幕数量较多时可能影响性能
   - 可通过设置菜单调整弹幕显示数量
   - 后端代理可添加缓存机制（未来实现）

## 常见问题

### Q1: 弹幕无法显示？

**检查项：**
1. danmu_api 服务是否正常运行？
2. 浏览器控制台是否有错误信息？
3. 是否有匹配的弹幕数据？
4. 弹幕开关是否开启？

### Q2: 弹幕搜索失败？

**可能原因：**
1. danmu_api 服务未启动
2. 后端无法连接到 danmu_api（网络问题）
3. 环境变量配置错误（检查 `.env.local`）
4. 视频标题与弹幕库不匹配

**调试方法：**
1. 检查浏览器 Network 标签，查看 `/api/danmaku/search` 请求
2. 检查服务器日志，查看后端转发是否成功
3. 直接访问 danmu_api 测试是否正常：`http://localhost:9321/api/v2/search/anime?keyword=测试`

### Q3: 如何清除弹幕记忆？

打开浏览器开发者工具，在 Console 中执行：
```javascript
localStorage.removeItem('danmaku_memories');
```

### Q4: 如何重置弹幕设置？

在 Console 中执行：
```javascript
localStorage.removeItem('danmaku_settings');
```

## 未来改进方向

1. 支持弹幕发送功能
2. 添加弹幕过滤规则编辑界面
3. 支持更多弹幕数据源
4. 弹幕显示效果优化
5. 弹幕高级搜索功能

## 相关资源

- [danmu_api 项目](D:\projects\danmu_api)
- [ArtPlayer 文档](https://artplayer.org)
- [artplayer-plugin-danmuku 文档](https://github.com/zhw2590582/ArtPlayer/tree/master/packages/artplayer-plugin-danmuku)

---

**版本**: 1.0
**最后更新**: 2025-12-01
