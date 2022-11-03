/**
 * 这个组件用于创建控制台
 * 操作控制台
 * 连接服务
 * 执行命令
*/
import { Terminal } from 'xterm';
import React, { useEffect } from "react"
import { FitAddon } from 'xterm-addon-fit';

let term = new Terminal({
  // cursorStyle: 'underline', //光标样式
  cursorBlink: true, // 光标闪烁
  convertEol: true, //启用时，光标将设置为下一行的开头
  disableStdin: false, //是否应禁用输入。
  scrollback: 800,
  rows: 70,
  cols: 80,
  theme: {
    foreground: 'aqua', //字体
    background: '#181E29', //背景色
  }
});
const fitAddon = new FitAddon();

const XtermConsole = () => {
  useEffect(() => {
    //让xterm的窗口适应外层的style
    term.loadAddon(fitAddon);
    // fitAddon.fit();
    //显示xterm窗口
    term.open(document.getElementById('terminal'));
    //初始化之前
    term.writeln('Connecting...');
  }, [])
  return <div id="terminal" ></div>
}

export default XtermConsole