/**
 * 这个组件用于创建控制台
 * 操作控制台
 * 连接服务
 * 执行命令
*/
import React, { useEffect } from "react"
import "@xterm/xterm/css/xterm.css"
import "./style.css"
import { useSocketTerm, SocketTermProps, SocketTerm } from "./Instance/socket-term"
import { useReginsterSocketTerm, useSubscribeTerminalsInstance } from "./Instance/subscribe-terminals"
export * from "./Instance/socket-term"
export * from "./Instance/subscribe-terminals"

export interface XtermWebProps extends SocketTermProps {
  className?: string;
  style?: React.CSSProperties;
}

const XtermWeb = (props: XtermWebProps, ref: React.Ref<SocketTerm>) => {
  const { className = '', style } = props;
  const socketTerm = useSocketTerm(props);
  const subscribe = useSubscribeTerminalsInstance();
  socketTerm.subscribeTerminals = subscribe;
  React.useImperativeHandle(ref, () => socketTerm);
  useReginsterSocketTerm({ socketTerm, subscribe });
  useEffect(() => {
    socketTerm.createWebTerminal();
    return () => {
      socketTerm.onCloseTerminal();
    }
  }, [])
  useEffect(socketTerm._listener, [])
  return <div className={`carefree-xterm-web-xterm ${className}`} style={style} ref={socketTerm.containerDOM} ></div>
}
export const Xterm = React.forwardRef(XtermWeb)

export default Xterm