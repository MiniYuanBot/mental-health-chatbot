# pku-mental-health-demo

AI 心理健康陪伴与情绪支持系统课程作业 Demo。项目用于在浏览器中演示“学生身份模拟验证、匿名昵称、AI 情绪支持聊天、情绪趋势报告、校园资源推荐”等核心流程。

## 技术栈

- React
- Vite
- TypeScript
- React Router
- Python 标准库 HTTP API
- SQLite
- LocalStorage
- 普通 CSS 响应式布局

## 如何运行

请在 conda 环境 `mental_health` 中运行。项目现在是前后端分离结构，需要同时启动后端 API 和前端页面。

首次运行先安装前端依赖：

```bash
conda activate mental_health
cd mental_health_agent
npm install
```

然后打开两个终端。

### 终端 1：启动后端

后端使用 Python 标准库 HTTP Server 和 SQLite，不需要额外安装 Python 包。

```bash
conda activate mental_health
cd mental_health_agent
npm run backend
```

启动成功后会看到类似输出：

```text
Backend API running at http://127.0.0.1:8000
SQLite database: .../mental_health_agent/backend/data/mental_health_demo.sqlite3
```

后端接口地址：

- 健康检查：`http://127.0.0.1:8000/api/health`
- 注册：`POST http://127.0.0.1:8000/api/signup`
- 登录：`POST http://127.0.0.1:8000/api/login`
- 获取档案：`GET http://127.0.0.1:8000/api/profile`
- 更新档案：`PUT http://127.0.0.1:8000/api/profile`

### 终端 2：启动前端

```bash
conda activate mental_health
cd mental_health_agent
npm run dev
```

浏览器打开前端地址：

```text
http://localhost:5173
```

或：

```text
http://127.0.0.1:5173
```

前端会请求后端默认地址：`http://127.0.0.1:8000`。

SQLite 数据库文件位置：

```text
backend/data/mental_health_demo.sqlite3
```

如果登录或注册时报“后端请求失败”，通常是 `npm run backend` 没有启动，或后端端口 `8000` 被占用。

## Demo 登录方式

本 Demo 仅模拟北京大学学生身份验证，不会连接真实认证系统。首次使用需要注册账号，用户档案会保存到本地 SQLite 数据库。

- 邮箱：任意以 `@pku.edu.cn` 或 `@stu.pku.edu.cn` 结尾的邮箱
- 学号：任意非空内容
- 密码：至少 6 位
- 昵称：可选，默认“匿名同学”

示例：

- 邮箱：`demo@stu.pku.edu.cn`
- 学号：`2200010000`
- 密码：`123456`

## 功能说明

- 注册/登录页：通过后端 API 模拟北大学生邮箱注册与登录。
- 用户档案：邮箱、学号、虚拟昵称保存到 SQLite；聊天中只展示虚拟昵称。
- 匿名设置：修改聊天中展示的虚拟昵称，并同步更新 SQLite。
- AI 陪伴聊天：优先调用 OpenAI-compatible API 做情绪识别和回复生成；失败时回退到本地规则识别和 mock 回复。
- 真实 API 配置：在 `src/utils/aiApi.ts` 中填写 `AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`。
- 情绪记录：用户消息的内容、情绪、分数、风险等级、时间保存到 localStorage。
- 危机提示：识别到高风险关键词时，展示醒目的现实求助提示。
- 趋势报告：展示最近情绪、平均压力分、高风险次数、最近 7 次压力变化和情绪分布。
- 资源推荐：根据最近情绪和风险等级推荐校园与自助支持资源。

## 隐私与安全说明

本项目后端仅用于课程 Demo，SQLite 数据库保存在本机项目目录下。默认不调用真实大模型 API；如果你在 `src/utils/aiApi.ts` 中直接填写 API Key，浏览器打包产物会暴露该 Key，仅适合课程 Demo 或本地演示。聊天记录和情绪记录仍保存在当前浏览器的 localStorage 中；用户档案保存在后端 SQLite 中。

## 免责声明

本系统仅用于课程作业展示，不能替代专业心理咨询、医疗帮助或医学诊断。若你正在经历强烈的自伤或自杀想法，请立即联系身边可信任的人、辅导员、学校心理咨询中心或当地紧急求助电话。
