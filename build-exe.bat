@echo off

rem 检查 Node.js 和 npm 是否已安装
where node >nul 2>nul
if errorlevel 1 (
    echo 需要安装 Node.js，请访问 https://nodejs.org/ 安装。
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo 需要安装 npm，请在 Node.js 安装时勾选安装 npm。
    exit /b 1
)

echo 正在安装依赖...
npm install
if errorlevel 1 (
    echo 依赖安装失败。
    exit /b 1
)

echo 正在安装 Electron 包...
npm install electron --save-dev
if errorlevel 1 (
    echo Electron 包安装失败。
    exit /b 1
)

echo 正在构建 React 应用...
npm run build
if errorlevel 1 (
    echo React 应用构建失败。
    exit /b 1
)

echo 正在将应用打包为 EXE 文件...
npm run dist
if errorlevel 1 (
    echo EXE 打包失败。
    exit /b 1
)

echo 构建和打包完成！