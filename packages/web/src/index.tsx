/**
 * 这个组件用于创建控制台
 * 操作控制台
 * 连接服务
 * 执行命令
*/
import React from "react"
import { XtermConsoleRef } from "./store"
import { useSocketTerm } from "./hooks"
import "xterm/css/xterm.css"
export * from "./store"

export interface XtermConsoleProps {
  PORT?: number
  HOST?: string
  id: string
  cwd?: string
}

const XtermConsole = (props: XtermConsoleProps, ref: React.Ref<XtermConsoleRef>) => {
  const { PORT = 34567, HOST = "127.0.0.1", id, cwd } = props
  const { container, ...rest } = useSocketTerm({ PORT, HOST, id, cwd })
  React.useImperativeHandle(ref, () => ({ ...rest }))
  return <div ref={container} ></div>
}

export default React.forwardRef(XtermConsole)