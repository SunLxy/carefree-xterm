/**
 * 这个组件用于创建控制台
 * 操作控制台
 * 连接服务
 * 执行命令
*/
import React from "react"
import { XtermWebRef } from "./store"
import { useSocketTerm, UseSocketTermProps } from "./hooks"
import "xterm/css/xterm.css"
export * from "./store"

export interface XtermWebProps extends UseSocketTermProps {

}

const XtermWeb = (props: XtermWebProps, ref: React.Ref<XtermWebRef>) => {
  const { PORT = 34567, HOST = "127.0.0.1", id, cwd, isAutoLink } = props
  const { container, ...rest } = useSocketTerm({ PORT, HOST, id, cwd, isAutoLink })
  React.useImperativeHandle(ref, () => ({ ...rest }))
  return <div ref={container} ></div>
}

export default React.forwardRef(XtermWeb)