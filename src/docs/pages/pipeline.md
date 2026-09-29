## 接入方式

「管道日志」通过 WebSocket 连接本机服务，读取终端的标准输入。本仓库提供 `public/cli/logdog` Python 脚本，默认端口为 8005，连接地址为 `ws://127.0.0.1:8005/ws`。

它与「文件日志」不同：数据由本地进程持续提供。使用前需要准备 Python 3 以及 fastapi、uvicorn、websockets 依赖。

## 从仓库运行

在仓库根目录创建独立 Python 环境并安装依赖：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install fastapi uvicorn websockets
```

把已有文件的后续输出传入脚本：

```bash
tail -f /path/to/application.log | python public/cli/logdog
```

以上命令面向 bash / zsh。启动后保持终端运行，再在前端选择「管道日志」。浏览器访问本机连接时可能要求本地网络权限。

## Android Logcat

准备好 Android platform-tools，并确认 `adb devices` 能识别且已授权目标设备，然后运行：

```bash
adb logcat | python public/cli/logdog
```

如果已自行安装 `dog` 或 `logdog` 命令，也可使用原有入口：

```bash
adb logcat | dog
```

命令未安装时请使用仓库脚本运行方式。部署前可以检查仓库中的安装脚本，不必依赖远程一键安装。

## 连接范围与结束会话

当前脚本监听 `0.0.0.0:8005`，并允许跨域连接，因此它不只绑定本机回环地址。在受控网络中运行，避免把该端口暴露到公网；如只需本机访问，可在自己的部署中限制监听地址和网络访问。

结束分析时，在终端按 Ctrl+C 停止服务。连接失败时检查端口是否被占用、终端是否仍在运行、浏览器是否限制了本地 WebSocket。日志文件方式不依赖此服务。
