/**
 * 这个组件用于创建控制台
 * 操作控制台
 * 连接服务
 * 执行命令
*/

import { Terminal } from 'xterm';
import React, { useEffect } from "react"
import { FitAddon } from 'xterm-addon-fit';
import "xterm/css/xterm.css"

const xtermjsTheme = {
  foreground: '#F8F8F8',
  background: '#2D2E2C',
  selectionBackground: '#5DA5D533',
  black: '#1E1E1D',
  brightBlack: '#262625',
  red: '#CE5C5C',
  brightRed: '#FF7272',
  green: '#5BCC5B',
  brightGreen: '#72FF72',
  yellow: '#CCCC5B',
  brightYellow: '#FFFF72',
  blue: '#5D5DD3',
  brightBlue: '#7279FF',
  magenta: '#BC5ED1',
  brightMagenta: '#E572FF',
  cyan: '#5DA5D5',
  brightCyan: '#72F0FF',
  white: '#F8F8F8',
  brightWhite: '#FFFFFF'
};

const term = new Terminal({
  allowProposedApi: true,
  windowsMode: false,
  theme: xtermjsTheme
});

const fitAddon = new FitAddon();

const XtermConsole = () => {
  useEffect(() => {
    //让xterm的窗口适应外层的style
    term.loadAddon(fitAddon);
    fitAddon.fit();
    //显示xterm窗口
    term.open(document.getElementById('terminal'));
    //初始化之前
    term.writeln('Connecting...');
    term.writeln('Connecting...');
  }, [])
  return <div style={{ background: "#000" }} >
    <div id="terminal" ></div>
  </div>
}

export default XtermConsole