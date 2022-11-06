import React, { createElement } from 'react'
import { Terminal } from 'xterm'

export interface XtermConsoleRef {
  term: Terminal
  ws: WebSocket
  pid: string
  onRemove: () => void
}
export class Subscribe {
  private terminals: Map<string, XtermConsoleRef> = new Map([])
  registerId = (terminal: XtermConsoleRef, name?: string) => {
    if (name) {
      this.terminals[name] = terminal
    }
  }
  removeId = (id?: string) => {
    if (id) {
      delete this.terminals[id]
    }
  }
  getTerminal(id: string) {
    return this.terminals.get(id)
  }
  get subTerminal() {
    return this.terminals
  }
}

export const useSubscribe = (sub?: Subscribe) => {
  const subRef = React.useRef<Subscribe>()
  if (sub) {
    subRef.current = sub
  } else {
    subRef.current = new Subscribe()
  }
  return [subRef.current]
}

/** 保存所有数据 */
const SubscribeTerminalContext = React.createContext<Subscribe>(new Subscribe())

/**注册*/
export const useSubscribeReginsterId = ({
  terminal,
  subscribe,
  id,
}: {
  terminal: XtermConsoleRef
  subscribe: Subscribe
  id?: string
}) => {
  if (id) {
    subscribe.registerId(terminal, id)
  }
  // 卸载删除
  React.useEffect(() => {
    return () => subscribe.removeId(id)
  }, [])
}
/**获取*/
export const useSubscribeTerminals = () =>
  React.useContext(SubscribeTerminalContext)

/**外层包裹*/
export const SubscribeTerminalProvider = (props: {
  children: React.ReactNode
}) => {
  const [subscribe] = useSubscribe()
  return createElement(SubscribeTerminalContext.Provider, {
    value: subscribe,
    children: props.children,
  })
}