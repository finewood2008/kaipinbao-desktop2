#!/bin/bash
# build-exe.sh - KaiPinBao EXE 构建脚本 (macOS/Linux)

echo "=========================================="
echo "KaiPinBao - Electron EXE 构建脚本"
echo "=========================================="
echo ""

# 检查 Node.js 和 npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 版本: "+"$(node -v)"
echo "✅ npm 版本: "+"$(npm -v)"
echo ""

# 步骤 1: 安装依赖
echo "📦 步骤 1: 安装依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi
echo "✅ 依赖安装成功"
echo ""

# 步骤 2: 安装 Electron 相关包
echo "📦 步骤 2: 安装 Electron 相关包..."
npm install --save-dev electron electron-builder electron-is-dev concurrently wait-on
if [ $? -ne 0 ]; then
    echo "❌ Electron 相关包安装失败"
    exit 1
fi
echo "✅ Electron 相关包安装成功"
echo ""

# 步骤 3: 构建 React 应用
echo "🔨 步骤 3: 构建 React 应用..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ React 应用构建失败"
    exit 1
fi
echo "✅ React 应用构建成功"
echo ""

# 步骤 4: 打包 EXE
echo "📦 步骤 4: 打包 EXE 文件..."
npm run dist
if [ $? -ne 0 ]; then
    echo "❌ EXE 打包失败"
    exit 1
fi
echo "✅ EXE 打包成功"
echo ""
echo "=========================================="
echo "🎉 构建完成！"
echo "=========================================="
echo ""
echo "📂 输出文件位置: ./dist/"
echo ""
echo "可用的 EXE 文件:"
ls -lh dist/*.exe 2>/dev/null || echo "未找到 EXE 文件"
echo ""
echo "✨ 你可以将这些文件发送给他人使用！"