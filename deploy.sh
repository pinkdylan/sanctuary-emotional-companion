#!/bin/bash

# 心聆项目一键部署脚本
# 用于快速部署到云平台

echo "🚀 心聆项目部署助手"
echo "===================="

# 检查是否在正确的目录
if [ ! -f "亲和之心-(sanctuary)/package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "📋 部署前检查..."
echo "===================="

# 检查必要的文件
files=("亲和之心-(sanctuary)/Dockerfile" "亲和之心-(sanctuary)/package.json" "亲和之心-(sanctuary)/server.ts")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

# 检查环境变量
echo ""
echo "🔑 环境变量检查..."
if [ -f "亲和之心-(sanctuary)/.env" ]; then
    echo "✅ .env 文件存在"
    if grep -q "AI_API_KEY" "亲和之心-(sanctuary)/.env"; then
        echo "✅ AI_API_KEY 已配置"
    else
        echo "⚠️  AI_API_KEY 未配置，请在部署平台手动设置"
    fi
else
    echo "⚠️  .env 文件不存在，请在部署平台手动设置环境变量"
fi

echo ""
echo "📝 部署步骤："
echo "===================="
echo "1. 将代码推送到 GitHub 仓库"
echo "2. 访问 https://render.com 注册账户"
echo "3. 创建新 Web Service，选择 Docker 环境"
echo "4. 连接你的 GitHub 仓库"
echo "5. 设置环境变量："
echo "   - AI_API_KEY: 你的 DashScope API 密钥"
echo "   - AI_BASE_URL: https://dashscope.aliyuncs.com/compatible-mode/v1"
echo "   - AI_MODEL: qwen-turbo"
echo "   - NODE_ENV: production"
echo "6. 点击部署，等待完成"
echo ""
echo "🎉 部署完成后，你将获得一个公网可访问的 URL！"

echo ""
echo "💡 提示："
echo "- 首次部署可能需要 5-10 分钟"
echo "- 免费额度：Render 每月 750 小时"
echo "- API 调用会产生费用，请注意使用量"