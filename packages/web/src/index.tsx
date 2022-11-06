/**
 * 这个组件用于创建控制台
 * 操作控制台
 * 连接服务
 * 执行命令
*/
import { Terminal } from 'xterm';
import React, { useEffect, useRef } from "react"
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from "xterm-addon-attach";
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from "xterm-addon-search"
import "xterm/css/xterm.css"

const useSocketTerm = (props: { PORT?: number, HOST?: string }) => {
  const { PORT = 34567, HOST = "127.0.0.1" } = props
  const container = useRef<HTMLDivElement>(null)

  const wsRef = useRef<WebSocket>()
  const isSetTermRef = useRef(false)
  const pid = useRef<string>()

  const termRef = useRef(new Terminal({
    fontWeight: 400,
    fontSize: 14,
    rows: 200,
    allowProposedApi: true
  }))

  // 获取远程的pid
  const getPid = async () => {
    return fetch(`http://${HOST}:${PORT}/terminals`, {
      method: "POST"
    }).then(res => res.json())
  }

  /**创建Socket*/
  const createSocket = async () => {
    try {
      pid.current = await getPid()
      wsRef.current = new WebSocket(`ws://${HOST}:${PORT}/terminals/${pid.current}?command=npm run test`)
      termRef.current.loadAddon(new AttachAddon(wsRef.current));
      termRef.current.loadAddon(new SearchAddon());
      termRef.current.loadAddon(new FitAddon());
      termRef.current.loadAddon(new WebLinksAddon());
    } catch (err) {
      console.log(err)
    }
  }

  const onRemove = () => {
    //组件卸载，清除 Terminal 实例
    if (termRef.current) {
      termRef.current.dispose();
    }
    isSetTermRef.current = false
    wsRef.current && wsRef.current.close()
  }

  useEffect(() => {
    if (container.current && !isSetTermRef.current) {
      termRef.current.open(container.current);
      termRef.current.focus();
      isSetTermRef.current = true
      createSocket()
    }
  }, [container])


  // 组件卸载删除
  useEffect(() => {
    return () => {
      onRemove()
    }
  }, [])

  return {
    term: termRef.current,
    ws: wsRef.current,
    pid: pid.current,
    container,
    onRemove
  }
}

interface Ref {
  term: Terminal,
  ws: WebSocket,
  pid: string,
  onRemove: () => void
}

export interface XtermConsoleProps {
  PORT?: number
  HOST?: string
}

const XtermConsole = (props: XtermConsoleProps, ref: React.Ref<Ref>) => {
  const { PORT = 34567, HOST = "127.0.0.1" } = props
  const { container, ...rest } = useSocketTerm({ PORT, HOST })
  React.useImperativeHandle(ref, () => ({ ...rest }))
  return <div ref={container} ></div>
}

export default React.forwardRef(XtermConsole)