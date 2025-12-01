# 弹幕代理转发实现总结

## 改进说明

已将弹幕 API 请求改为通过 LunaTV 后端代理转发，而不是前端直接 fetch。

**最新更新 (2025-12-01)**: 弹幕配置已从环境变量迁移到管理面板的站点配置中，存储在数据库中。

## 架构变化

### 之前的架构
```
前端浏览器 → 直接 fetch → danmu_api (http://localhost:9321)
```

**问题**：
- 前端直接暴露 danmu_api 地址
- 可能存在 CORS 跨域问题
- 无法在后端做统一的缓存和控制

### 现在的架构
```
前端浏览器 → Next.js API 路由 (代理) → danmu_api (http://localhost:9321)
```

**优点**：
- ✅ 前端不直接暴露 danmu_api 地址
- ✅ 避免 CORS 跨域问题
- ✅ 可在后端实现缓存和请求控制
- ✅ 更好的安全性
- ✅ 统一的错误处理
- ✅ 配置存储在数据库中，支持在线修改

## 实现的 API 路由

创建了 4 个 Next.js API 路由作为代理：

1. **`/api/danmaku/search`** (GET)
   - 搜索动漫
   - 参数: `keyword`
   - 转发到: `/api/v2/search/anime`

2. **`/api/danmaku/episodes`** (GET)
   - 获取剧集列表
   - 参数: `animeId`
   - 转发到: `/api/v2/bangumi/{animeId}`

3. **`/api/danmaku/comment`** (GET)
   - 获取弹幕数据
   - 参数: `episodeId` 或 `url`
   - 转发到: `/api/v2/comment/{episodeId}?format=xml` 或 `/api/v2/comment?url=...&format=xml`
   - **特殊处理**: 使用 XML 格式获取完整弹幕数据（避免 JSON 格式丢失数据），后端解析 XML 并转换为 JSON 返回给前端

4. **`/api/danmaku/match`** (POST)
   - 自动匹配弹幕
   - 参数: `fileName`
   - 转发到: `/api/v2/match`

## 修改的文件

### 新增文件
```
src/app/api/danmaku/search/route.ts    # 搜索动漫代理
src/app/api/danmaku/episodes/route.ts  # 获取剧集代理
src/app/api/danmaku/comment/route.ts   # 获取弹幕代理
src/app/api/danmaku/match/route.ts     # 自动匹配代理
```

### 修改文件
```
src/lib/admin.types.ts                 # 添加弹幕配置类型
src/lib/config.ts                      # 添加弹幕配置初始化和自检
src/app/api/admin/site/route.ts        # 添加弹幕配置的保存和读取
src/app/admin/page.tsx                 # 添加弹幕配置 UI
src/lib/danmaku/api.ts                 # 改为调用本地代理 API
DANMAKU_INTEGRATION.md                 # 更新文档说明
```

## 配置方式变化

### 之前（环境变量）
```env
# .env.local
DANMAKU_API_BASE=http://localhost:9321
DANMAKU_API_TOKEN=87654321
```

### 现在（管理面板配置）

弹幕配置现在存储在数据库的站点配置中，可以通过管理面板进行修改：

1. 访问管理面板：`/admin`
2. 展开"站点配置"标签
3. 在"弹幕配置"部分配置以下项：
   - **弹幕 API 地址**: danmu_api 服务器地址（默认: `http://localhost:9321`）
   - **弹幕 API Token**: danmu_api 访问令牌（默认: `87654321`）
4. 点击"保存"按钮

**优点**：
- ✅ 无需重启服务器即可修改配置
- ✅ 配置持久化到数据库
- ✅ 支持在线管理
- ✅ 更直观的用户界面

**注意**：环境变量仍可用作初始配置的后备选项，但优先使用数据库中的配置。

## 代码示例

### 前端调用（修改后）
```typescript
// src/lib/danmaku/api.ts

// 搜索动漫
export async function searchAnime(keyword: string) {
  const url = `/api/danmaku/search?keyword=${encodeURIComponent(keyword)}`;
  const response = await fetch(url);
  return await response.json();
}

// 获取弹幕
export async function getDanmakuById(episodeId: number) {
  const url = `/api/danmaku/comment?episodeId=${episodeId}`;
  const response = await fetch(url);
  return (await response.json()).comments;
}
```

### 后端代理（新增）
```typescript
// src/app/api/danmaku/search/route.ts

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('keyword');

  // 转发到 danmu_api
  const apiUrl = `${DANMAKU_API_BASE}/api/v2/search/anime?keyword=${keyword}`;
  const response = await fetch(apiUrl);
  const data = await response.json();

  return NextResponse.json(data);
}
```

## 测试验证

```bash
# 类型检查通过
pnpm typecheck
✓ 无 TypeScript 错误

# 编译通过
pnpm build
✓ 构建成功
```

## 使用说明

### 1. 配置弹幕服务（首次使用或更新配置）

#### 方式一：通过管理面板配置（推荐）

1. 启动 LunaTV 服务
2. 访问管理面板：`http://localhost:3000/admin`
3. 展开"站点配置"标签
4. 滚动到"弹幕配置"部分
5. 设置以下参数：
   - **弹幕 API 地址**: danmu_api 服务器地址（例如：`http://192.168.1.100:9321`）
   - **弹幕 API Token**: danmu_api 访问令牌（默认：`87654321`）
6. 点击"保存"按钮
7. 配置立即生效，无需重启服务器

#### 方式二：使用环境变量（作为初始配置）

如果 danmu_api 不在默认地址，创建 `.env.local`：

```env
DANMAKU_API_BASE=http://192.168.1.100:9321
DANMAKU_API_TOKEN=your_custom_token
```

**注意**：
- 环境变量仅在首次初始化时使用
- 一旦在管理面板修改配置，将使用数据库中的配置
- 环境变量修改需要重启服务器才能生效

### 2. 启动服务

```bash
# 启动 danmu_api（如果使用）
cd D:\projects\danmu_api
npm start

# 启动 LunaTV
cd D:\projects\LunaTV
pnpm dev
```

### 3. 测试弹幕功能

1. 打开视频播放页面
2. 点击"弹幕"选项卡
3. 搜索并选择弹幕
4. 弹幕自动加载到播放器

## 注意事项

1. **配置管理**
   - **推荐**：使用管理面板进行配置，无需重启服务器
   - 配置存储在数据库中，持久化保存
   - 环境变量可用作初始配置的后备选项
   - 修改配置后立即生效

2. **网络连接**
   - LunaTV 服务器必须能访问 danmu_api
   - 如果在不同机器，确保网络可达
   - 检查防火墙设置

3. **调试方法**
   - 浏览器 Network 标签查看 `/api/danmaku/*` 请求
   - 服务器日志查看后端转发情况
   - 直接访问 danmu_api 测试：`http://localhost:9321/api/v2/search/anime?keyword=测试`
   - 在管理面板查看和修改当前配置

4. **数据库配置**
   - 配置存储在 Redis 数据库中
   - 使用 `NEXT_PUBLIC_STORAGE_TYPE` 环境变量控制存储类型
   - 如果使用 `localstorage`，将无法在管理面板修改配置

## 未来改进

1. **添加缓存机制**
   - 在后端代理层添加 Redis 缓存
   - 减少对 danmu_api 的请求压力
   - 提升响应速度

2. **添加请求限流**
   - 防止恶意频繁请求
   - 保护 danmu_api 服务

3. **添加错误重试**
   - 请求失败时自动重试
   - 提高稳定性

4. **添加监控和日志**
   - 记录所有代理请求
   - 便于排查问题

---

**完成时间**: 2025-12-01
**状态**: ✅ 已完成并测试通过
