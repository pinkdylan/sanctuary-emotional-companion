# 软件安装包（离线可运行目录包）

如果你不方便提交 Docker 镜像，也可以提交本目录生成的离线包：包含构建产物 `dist/` 与运行脚本，评审机解压后一条命令启动。

## 生成安装包

在项目根目录执行：

```bash
bash "作品提交区域/软件安装包/scripts/make-offline-dist.sh"
```

输出：`作品提交区域/软件安装包/releases/xinling-sanctuary-offline-YYYYMMDD-HHMMSS.tar.gz`

## 运行（评审机）

```bash
tar -xzf xinling-sanctuary-offline-*.tar.gz
cd xinling-sanctuary-offline-*/
bash run.sh
```

浏览器访问：`http://localhost:3000`

## 说明

- 该包优先复用仓库内已构建的 `dist/`（避免离线环境缺少 `vite` 导致无法构建）。
- 首次运行 `run.sh` 会执行 `npm ci` 安装生产依赖（需要可访问 npm registry；若完全离线，请在本机先 `npm ci --omit=dev` 后再打包，使压缩包内含完整 `node_modules`）。
- 服务端入口使用 `node --experimental-strip-types server.ts`，建议使用 **Node.js 22+**。
- 真实密钥请通过环境变量注入，不要把 `.env` 明文打进压缩包。
