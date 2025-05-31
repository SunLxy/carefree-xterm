import React, { useRef } from "react";
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { AttachAddon } from '@xterm/addon-attach'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { SearchAddon } from '@xterm/addon-search'
import { SubscribeTerminals } from "./subscribe-terminals"
const theme = {
  "foreground": "#5ab37a",
  "background": "#1a1e2e",
  "cursor": "#9197a3",
  "cursorAccent": "#9197a3",
  "selectionBackground": "#e06c75",
  "selectionForeground": "#ffffff",
  "selectionInactiveBackground": "#e06c75",
  "black": "#10333e",
  "red": "#ca4238",
  "green": "#8dc485",
  "yellow": "#ae8a2c",
  "blue": "#509f97",
  "magenta": "#c24380",
  "cyan": "#4689cb",
  "white": "#ffffff",
  "brightBlack": "#2f7596",
  "brightRed": "#e54651",
  "brightGreen": "#86eb9d",
  "brightYellow": "#b89145",
  "brightBlue": "#50bbad",
  "brightMagenta": "#d96f9d",
  "brightCyan": "#499dcd",
  "brightWhite": "#ffffff"
}

export interface SocketTermProps {
  /**端口*/
  PORT?: number
  /**host地址*/
  HOST?: string
  /**唯一值id*/
  id: string
  /**执行命令目录地址*/
  cwd?: string
  /**是否自动连接*/
  isAutoLink?: boolean
}

export class SocketTerm {
  subscribeTerminals: SubscribeTerminals
  /**
   * 唯一值 ， 如果没有值，则使用时间戳
  */
  id: string;
  /**当前链接的 pid */
  pid: string;
  /**端口*/
  PORT?: number
  /**host地址*/
  HOST?: string
  /**执行命令目录地址*/
  cwd?: string
  /**是否自动连接*/
  isAutoLink?: boolean

  // =========================================================================
  /**容器*/
  containerDOM: React.MutableRefObject<HTMLDivElement> = React.createRef()
  /**ws 链接实例*/
  ws: WebSocket
  /**控制台实例*/
  terminal: Terminal

  fitAddon: FitAddon
  attachAddon: AttachAddon
  searchAddon: SearchAddon
  webLinksAddon: WebLinksAddon

  constructor(props: Partial<SocketTermProps>) {
    this.id = props.id || Date.now().toString()
    this.PORT = props.PORT || 34567
    this.HOST = props.HOST || "127.0.0.1"
    this.cwd = props.cwd
    this.isAutoLink = props.isAutoLink || false
  }

  /**创建页面渲染控制台*/
  createWebTerminal = () => {
    /**已经存在不需要再进行连接操作*/
    if (this.terminal) {
      return
    }
    if (this.containerDOM.current) {
      this.terminal = new Terminal({
        fontWeight: 400,
        fontSize: 14,
        rows: 80,
        allowProposedApi: true,
        theme: theme,
        scrollback: 10000,
      })
      this.terminal.open(this.containerDOM.current)
      this.terminal.focus()
      this.terminal.onResize(this.onResizeScreen)
      /**判断是否需要自动连接*/
      if (this.isAutoLink) {
        this.createSocketLink()
      }
    }
  }
  /**容器变化*/
  onResizeScreen = async () => {
    // 存在控制台的时候，更新控制台大小
    if (this.ws) {
      try {
        let query = ["pid=" + this.pid]
        if (this.terminal.cols) {
          query.push('cols=' + this.terminal.cols)
        }
        if (this.terminal.rows) {
          query.push('rows=' + this.terminal.rows)
        }
        return fetch(`http://${this.HOST}:${this.PORT}/terminals/size?${query.join("&")}`, { method: 'POST', }).then((res) => res.json())
      } catch (error) {
        console.log("更新控制台大小失败：", error);
      }
    }
  }

  /**创建服务端控制台*/
  createServerTerminal = async () => {
    let query = []
    if (this.cwd) {
      query.push('cwd=' + this.cwd)
    }
    if (this.terminal.cols) {
      query.push('cols=' + this.terminal.cols)
    }
    if (this.terminal.rows) {
      query.push('rows=' + this.terminal.rows)
    }
    this.terminal.rows;
    return fetch(`http://${this.HOST}:${this.PORT}/terminals?${query.join("&")}`, {
      method: 'POST',
    }).then((res) => res.json())
  }

  /**创建WebSocket链接*/
  createSocketLink = async () => {
    if (this.ws) {
      return;
    }
    try {
      this.pid = await this.createServerTerminal();
      this.ws = new WebSocket(`ws://${this.HOST}:${this.PORT}/terminals/${this.pid}`)
      this.fitAddon = new FitAddon()
      this.attachAddon = new AttachAddon(this.ws)
      this.searchAddon = new SearchAddon()
      this.webLinksAddon = new WebLinksAddon(this._onEventListenerLink)
      this.terminal.loadAddon(this.attachAddon)
      this.terminal.loadAddon(this.searchAddon)
      this.terminal.loadAddon(this.fitAddon)
      this.fitAddon.fit();
      this.terminal.loadAddon(this.webLinksAddon)
    } catch (error) {
      console.log("创建WebSocket链接报错：", error);
    }
  }

  /**关闭控制台*/
  onCloseTerminal = () => {
    //组件卸载，清除 Terminal 实例
    if (this.terminal) {
      this.terminal.dispose()
    }
    this.ws && this.ws.close()
    this.ws = undefined
    this.pid = undefined
    this.terminal = undefined
  }


  // =========================================普通方法==================================================
  /**监听uri打开窗口*/
  _onEventListenerLink = (event: MouseEvent, uri: string) => {
    if (event.metaKey && uri) {
      window.open(uri)
    }
  }

  /**清理窗口*/
  _clear = () => {
    if (this.terminal) {
      this.terminal.clear()
    }
  }

  /**监听快捷键*/
  _onEventListener = (event: KeyboardEvent) => {
    /**执行清理*/
    if (event.metaKey && ['K', 'k'].includes(event.key)) {
      this._clear()
    }
  }

  private _timer: NodeJS.Timeout;
  /**窗口变化更新*/
  _onResizeFit = () => {
    this._timer && clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      if (this.fitAddon)
        this.fitAddon.fit();
    }, 100);
  }

  /**时间监听*/
  _listener = () => {
    if (!this.containerDOM.current) {
      return;
    }
    this.containerDOM.current.addEventListener('keydown', this._onEventListener)
    window.addEventListener("resize", this._onResizeFit)
    return () => {
      if (!this.containerDOM.current) {
        return
      }
      this.containerDOM.current.removeEventListener('keydown', this._onEventListener)
      window.removeEventListener("resize", this._onResizeFit)
    }
  }
}

export const useSocketTerm = (props: SocketTermProps, instance?: SocketTerm) => {
  const socketTerm = useRef<SocketTerm>();
  if (!socketTerm.current) {
    if (instance) {
      socketTerm.current = instance
    } else {
      socketTerm.current = new SocketTerm(props)
    }
  }
  return socketTerm.current
}