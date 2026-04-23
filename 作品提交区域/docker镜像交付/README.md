# Docker 镜像交付（参赛作品）

本目录提供一键脚本，把 `亲和之心-(sanctuary)` 封装为可运行镜像，并导出 `xinling-team-sanctuary.tar` 供提交。

## 前置条件

- 已安装 Docker Desktop（或 Docker Engine + Compose）
- 能访问 Docker daemon（`docker ps` 正常）

## 构建并启动（推荐）

在项目根目录执行：

```bash
docker compose up --build -d
```

浏览器访问：`http://localhost:3000`

> 镜像基于 `node:22-alpine`，服务端使用 `node --experimental-strip-types server.ts` 直接运行 TypeScript（无需额外 `tsx`）。

## 导出离线镜像（提交用）

```bash
bash "作品提交区域/docker镜像交付/scripts/export-image.sh"
```

生成文件：`作品提交区域/docker镜像交付/exports/xinling-team-sanctuary.tar`

## 导入镜像（评审机）

```bash
docker load -i xinling-team-sanctuary.tar
docker run --rm -p 3000:3000 xinling-team/sanctuary:latest
```

## 环境变量说明（可选）

应用侧示例见 `亲和之心-(sanctuary)/src/.env.example`。  
如需在容器内注入密钥，推荐使用 `docker compose` 的 `environment:` 或运行时 `-e` 传入，不要把真实密钥写进镜像层。
