# NutriKitchen · 今天吃什么

个人厨房与营养管理 App。使用 React Native、Expo、TypeScript、Expo Router 和本地 SQLite，支持原生 iPhone 与浏览器。

项目直接位于 NutriKitchen 工作区根目录，从空目录独立创建。

## 已实现

- 「找灵感」收录 30 道图文菜谱（19 道中式家常菜，11 道美国日常菜）。手机双列、宽屏三列浏览。照片下方可直接收录；点「看大图」可全屏逐张翻看并打开做法。
- 首页右上角地球图标可切换中文或 English。界面与内置菜谱支持两种语言，自己录入的内容照原样保存。
- 首次打开时，为空白栏目添加一批可编辑的菜谱、餐单、库存和购物项。营养参考记录不导出，首次录入真实食物后自动清除。
- 菜谱支持新增、编辑、删除、分类、搜索和收藏，详情提供备料勾选与逐步烹饪。
- 保存小红书链接或分享文字。链接先保存为「待整理」，可手动补全菜名、食材与步骤。
- 选择多道菜，保存带日期的私人菜单，支持修改与删除。
- 冰箱食材记录及菜谱匹配。
- 按菜单汇总食材并扣除库存。自动缺料与手动购物项目均支持编辑、移除和勾选。
- 按日期记录食物、重量和每 100 克营养含量，计算实际热量、蛋白质、碳水与脂肪。
- 支持千卡与千焦输入，提供每日及周一至周日的汇总。
- 营养记录导出为 UTF-8 CSV，使用 iPhone 系统分享菜单保存或分享。
- SQLite 数据库保存菜谱、菜单、库存、购物状态与营养记录，支持关闭后重新读取。

## iPhone 运行

当前项目采用 Expo SDK 58、React Native 0.88.1、React 19.3.0。2026 年 11 月 10 日核对的 App Store 记录显示，Expo Go 58.0.5 已支持 SDK 58，要求 iOS 16.4 或更高版本。创建指南中仍有 SDK 57 过渡期说明，因此本项目依据商店实际版本选择 SDK 58。[Expo Go 商店版本](https://apps.apple.com/cn/app/expo-go/id982107779)

1. 在 iPhone 安装或更新 Expo Go。
2. Mac 和 iPhone 连接同一 Wi-Fi。
3. 在已打开的 Expo 官方登录页完成授权，并在 Expo Go 登录同一个账号。
4. 用 iPhone 相机扫描 Expo 开发服务器显示的二维码，选择 Expo Go 打开。
5. 如系统询问本地网络权限，允许 Expo Go 连接开发服务器。

Expo 要求 iPhone 上的 Expo Go 和电脑 CLI 使用同一个账号。[Expo 登录说明](https://expo.dev/changelog/expo-go-57-login)

开发时保持 Metro 服务运行。开发项目的冷启动通常需要重新从电脑加载代码。

### 下次重新启动开发服务器

在项目根目录执行以下命令。首次在另一台电脑使用时先执行 npm ci。

```sh
npm ci
npm start
```

需要重新授权 Expo 时执行以下命令，随后在浏览器完成登录。

```sh
npx expo login --browser
```

终端显示二维码和以 exp:// 开头的地址。局域网 IP 会随网络变化，请使用当次服务器显示的二维码。

### 模拟器和签名

当前这台 Mac 的 xcode-select 指向 CommandLineTools，xcrun 找不到 simctl。模拟器运行需要完整 Xcode 和 iOS Simulator runtime。安装并选择完整 Xcode 后，可运行 npm run ios。

本阶段通过 Expo Go 加载项目。将来使用 Xcode 安装独立开发版本时，免费 Apple Account 的 Personal Team 可用于个人设备测试，配置描述文件有效期为 7 天，最多登记 3 台设备并在每台设备安装 3 个 App。[Apple 个人开发团队说明](https://developer.apple.com/help/account/basics/about-your-developer-account)

TestFlight 与 App Store 发布使用 Apple Developer Program，官方标准费用为每年 99 美元，地区价格以实际页面为准。[Apple 会员说明](https://developer.apple.com/programs/enroll/)

## 网页版

执行 `npm run web`，打开 [http://localhost:8082](http://localhost:8082)。网页使用浏览器里的 SQLite，不要求登录。浏览器数据与 iPhone 数据各自保存；不同域名或浏览器之间也不会自动同步。

`npm run build:web` 生成可发布的 `dist/`。正式托管使用 HTTPS，将页面路由回退到 `index.html`，并设置 `Cross-Origin-Opener-Policy: same-origin` 和 `Cross-Origin-Embedder-Policy: require-corp`，供 SQLite WebAssembly 运行。Expo Hosting 支持这些响应头，项目已经配置。[Expo SQLite 网页配置](https://docs.expo.dev/versions/latest/sdk/sqlite/#web-setup) · [Expo Hosting 发布说明](https://docs.expo.dev/eas/hosting/get-started/)

旧站 `what-to-cook` 的记录保存在原浏览器的 IndexedDB。换站前，在旧站的「我的厨房 → 导出」备份 JSON。当前 NutriKitchen 不会自动导入旧站备份。

## 最短功能验收

在「找灵感」向下浏览照片，试用「看大图」、卡片书签、备料勾选和「开始做菜」。点击「收入我的菜谱」后，可以在「我的菜谱」和菜单选菜页找到它。

1. 添加「烤甜椒」，食材填甜椒 300 克，添加一个步骤并保存。
2. 收藏该菜谱，搜索「甜椒」，进入详情编辑后再次保存。
3. 在私人菜单新建一顿晚饭，选中烤甜椒。
4. 冰箱添加甜椒 100 克。
5. 打开菜单的「看缺料」，应显示甜椒 200 克。
6. 将自动项目改为甜椒 2 个，勾选，再尝试移除与恢复自动清单。
7. 手动添加厨房纸 1 包，修改、勾选和删除。
8. 记录酸奶 150 克，每 100 克填热量 100 千卡、蛋白质 4 克、碳水 8 克、脂肪 3 克。
9. 当天应增加 150 千卡、蛋白质 6 克、碳水 12 克、脂肪 4.5 克。
10. 导出 CSV，在 iPhone 分享菜单选择「存储到文件」并打开检查。
11. 完全关闭 Expo Go 后重新打开项目，检查所有保存的数据。

## 检查命令

```sh
npm run check
npm run check:deps
npm run doctor
```

- npm run check 依次执行 TypeScript、Lint、24 项业务与 SQLite 测试，以及 20 项原生页面组件测试。
- npm run check:deps 检查 Expo SDK 依赖版本。
- npm run doctor 执行 Expo 官方项目诊断。
- iOS 生产 JavaScript / Hermes 包可通过下列命令构建。

```sh
npx expo export --platform ios
```

Hermes bundle 构建和组件测试已经通过。iPhone 实际显示、键盘交互、系统分享与重启验收仍需在真实设备上完成。

## 使用约定

食材按名称匹配，名称会统一全半角、大小写和多余空格。克与公斤、毫升与升可换算。其他单位按输入匹配，库存数量未知或单位不同的项目会提示核对。

菜谱用量表示这道菜录入的一次制作量。多个菜谱的同种食材先合并，再统一扣除库存。购物勾选记录采购状态。实际库存通过冰箱页面维护。

营养数据来自你填写的包装标签或其他资料。计算使用每条记录保存的营养含量和实际重量。记录日期使用设备当地日期。

SQLite 文件位于 iPhone 的 App 数据目录。卸载 Expo Go 或删除 App 可能移除这些数据。营养记录可通过 CSV 保存到你选择的位置。

## Git 与 GitHub

本地 main 分支已按模块提交代码。.gitignore 覆盖环境文件、密钥、签名文件、SQLite 数据库和 CSV 导出文件。

GitHub 仓库为 Private。[yolandatai49-sudo/NutriKitchen](https://github.com/yolandatai49-sudo/NutriKitchen)

更详细的实现说明见 [中文开发说明](开发说明.md)。
