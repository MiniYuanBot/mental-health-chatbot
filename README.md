# AI 心理健康陪伴与情绪支持系统 Demo

这是一个用于课程作业展示的前后端分离 Demo，面向浏览器演示“学生身份模拟验证、匿名昵称、AI 情绪支持聊天、情绪趋势报告、校园资源推荐、危机提示”等完整流程。

系统默认优先调用 OpenAI-compatible API 进行情绪识别和支持性回复生成；如果没有配置 API Key、接口失败或网络不可用，会自动降级到本地关键词规则和 mock 回复，保证课堂演示流程可以继续进行。

## 功能概览

- 学生身份模拟验证：仅允许 `@pku.edu.cn` 和 `@stu.pku.edu.cn` 邮箱注册。
- 匿名昵称机制：登录档案保存真实邮箱和学号，聊天界面只展示虚拟昵称。
- AI 情绪支持聊天：支持上下文回复、结构化情绪识别和本地降级逻辑。
- 情绪数据持久化：聊天消息和情绪记录主存储在后端 SQLite，前端 localStorage 仅作为缓存。
- 情绪趋势报告：展示最近 7 次情绪强度折线图、情绪分布、平均压力分和高风险次数。
- 校园资源推荐：根据最近情绪类型和风险等级推荐校内咨询、自助练习、朋辈支持等资源。
- 危机提示：识别到高风险关键词时弹出危机提示，并展示现实求助方式和免责声明。
- 路由权限守卫：未登录访问 `/chat`、`/report`、`/profile`、`/resources` 会跳转登录页。

## 技术栈

- 前端：React、Vite、TypeScript、React Router、普通 CSS
- 后端：Python 标准库 `http.server`、`sqlite3`、`hashlib.pbkdf2_hmac`、`uuid`
- 数据：SQLite 主存储，localStorage 缓存前端状态
- 依赖约束：前端不引入 UI/图表库，后端零第三方 Python 依赖

## 项目结构

```text
backend/
  server.py                      # Python HTTP API 入口
  data/
    init_db.py                   # SQLite schema 初始化脚本
    mental_health_demo.sqlite3   # 首次运行后生成的数据库文件
src/
  App.tsx                        # 路由配置与权限守卫
  main.tsx                       # 前端入口
  components/
    CrisisAlert.tsx              # 高风险危机弹窗
    Layout.tsx                   # 应用导航与布局
    ResourceCard.tsx             # 推荐资源卡片
    RiskAlert.tsx                # 页面内风险提示
  data/
    resources.ts                 # 硬编码校园/自助资源数据
  pages/
    Chat.tsx                     # AI 陪伴聊天页
    Dashboard.tsx                # 首页仪表盘
    Login.tsx                    # 登录/注册页
    Profile.tsx                  # 用户档案页
    Report.tsx                   # 情绪趋势报告页
    Resources.tsx                # 资源推荐页
  styles/
    global.css                   # 全局样式与响应式布局
  utils/
    api.ts                       # 后端 API 封装
    aiApi.ts                     # LLM 调用、情绪识别与降级逻辑
    backendApi.ts                # 兼容旧调用的 API re-export
    storage.ts                   # localStorage 缓存与类型定义
```

## 快速启动

请在项目根目录运行。后端和前端需要分别启动。

### 1. 安装前端依赖

```bash
npm install
```

### 2. 启动后端 API

```bash
npm run backend
```

后端默认监听：

```text
http://127.0.0.1:8000
```

首次启动时会自动初始化数据库，也可以手动执行：

```bash
python backend/data/init_db.py
```

SQLite 数据库文件位置：

```text
backend/data/mental_health_demo.sqlite3
```

### 3. 启动前端页面

```bash
npm run dev
```

浏览器访问：

```text
http://localhost:5173
```

如果注册、登录或聊天时报“服务维护中，请稍后重试”，请先确认 `npm run backend` 是否仍在运行，且端口 `8000` 没有被占用。

## Demo 账号规则

本项目只做学生身份模拟验证，不连接真实校园认证系统。

- 邮箱：必须以 `@pku.edu.cn` 或 `@stu.pku.edu.cn` 结尾
- 学号：1 到 32 位非空字符串
- 密码：至少 6 位
- 昵称：可选，默认生成匿名昵称

示例账号：

```text
邮箱：demo@stu.pku.edu.cn
学号：2200010000
密码：123456
昵称：匿名同学
```

## 环境变量

可以在项目根目录创建 `.env.local` 配置前端调用地址和 OpenAI-compatible API。变量会被 Vite 注入到浏览器端。

```bash
VITE_BACKEND_BASE_URL=http://127.0.0.1:8000
VITE_AI_API_KEY=your_api_key_here
VITE_AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
VITE_AI_MODEL=glm-4-flash
```

说明：

- 未配置 `VITE_AI_API_KEY` 时，系统会使用本地关键词识别和 mock 回复。
- `VITE_AI_BASE_URL` 需要是 OpenAI-compatible 服务的根路径，前端会请求 `${VITE_AI_BASE_URL}/chat/completions`。
- 由于 API Key 会进入浏览器打包产物，真实生产环境不应在前端直接暴露 Key；课程 Demo 本地演示可以这样配置。

## 后端 API

所有接口返回 JSON。错误格式统一为：

```json
{
  "error": "错误说明",
  "code": 400
}
```

### 公开接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康检查 |
| `POST` | `/api/signup` | 注册，校验邮箱后缀并保存 PBKDF2 密码哈希 |
| `POST` | `/api/login` | 登录，返回 session token 和用户档案 |

### 需要登录的接口

请求头需要携带：

```text
Authorization: Bearer <session_token>
```

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/profile` | 获取当前用户档案 |
| `PUT` | `/api/profile` | 更新昵称 |
| `POST` | `/api/chat` | 保存用户消息和 AI 回复，写入情绪记录 |
| `GET` | `/api/emotion-history` | 获取当前用户的聊天消息和情绪记录 |

## 数据库 Schema

数据库由 `backend/data/init_db.py` 初始化，包含以下核心表：

```text
users(
  id, email, student_id, password_hash, nickname, created_at
)

sessions(
  token, user_id, created_at, expires_at
)

chat_messages(
  id, user_id, role, content, emotion, score, risk_level, analysis_source,
  analysis_model, created_at
)

emotion_records(
  id, user_id, emotion_type, score, risk_level, note, analysis_source,
  analysis_model, created_at
)
```

实现要点：

- 密码使用 `hashlib.pbkdf2_hmac` 加盐哈希，不保存明文密码。
- SQL 操作使用参数化查询，避免字符串拼接。
- 后端对邮箱、学号、密码、昵称和消息长度做基础校验。
- 用户输入内容入库前会做 HTML 特殊字符转义。

## 前端页面说明

- `/login`：登录/注册。已登录用户访问会自动跳转 `/home`。
- `/home`：仪表盘，展示最近情绪、记录数、高风险次数和入口卡片。
- `/chat`：AI 陪伴聊天。输入框在移动端固定底部，消息列表可滚动。
- `/report`：情绪趋势报告，优先从后端拉取情绪记录，失败时使用 localStorage 缓存。
- `/resources`：根据最近情绪和风险等级推荐资源。
- `/profile`：查看邮箱、学号、昵称并更新匿名昵称。

## AI 调用与降级逻辑

`src/utils/aiApi.ts` 包含两类调用：

- `analyzeEmotionWithApi`：使用 JSON mode 要求模型返回结构化结果：

```json
{
  "emotion": "depression",
  "score": 7,
  "risk_level": "medium"
}
```

- `createApiReply`：基于情绪识别结果、最近聊天上下文和安全提示生成中文支持性回复。

如果 API 未配置、请求失败、返回格式异常或 CORS 阻断，系统会自动使用本地规则：

- 自伤、自杀、想死、不想活等关键词：`crisis` / `high` / `10`
- 焦虑、压力、抑郁、愤怒、疲惫、孤独等关键词：映射到对应情绪和分数
- 无明显关键词：`neutral` / `low`

## 验证命令

```bash
npm run build
python -m py_compile backend/server.py backend/data/init_db.py
```

当前实现已通过以上检查。

## 演示检查清单

1. 启动后端：`npm run backend`。
2. 浏览器打开健康检查：`http://127.0.0.1:8000/api/health`，确认返回 JSON。
3. 启动前端：`npm run dev`。
4. 使用 `demo@stu.pku.edu.cn` 这类邮箱注册。
5. 登录后进入聊天页，发送一条普通压力消息，确认有 AI 回复和情绪标签。
6. 发送包含高风险关键词的消息，确认出现危机弹窗和页面风险提示。
7. 打开报告页，确认折线图、情绪分布、平均压力分和高风险次数更新。
8. 打开资源页，确认推荐资源随最近情绪变化。
9. 打开档案页修改昵称，再回到聊天页确认昵称更新。

## 隐私与安全说明

本系统仅用于课程 Demo。SQLite 数据库保存在本机项目目录下，session token 存在浏览器 localStorage 中。为了方便浏览器演示，真实 API Key 也通过前端环境变量注入，因此不适合直接部署到公网生产环境。

聊天与情绪识别结果不构成医学诊断，系统回复只能作为情绪支持和资源导航，不能替代专业心理咨询、医疗帮助或紧急救援。

## 免责声明

本系统仅用于课程作业展示，不能替代专业心理咨询、医疗帮助或医学诊断。若你正在经历强烈的自伤或自杀想法，请立即联系身边可信任的人、辅导员、学校心理咨询中心或当地紧急求助电话，并尽量不要独处。
