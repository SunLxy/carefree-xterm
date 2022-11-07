import React, { createElement } from 'react'
import { Terminal } from 'xterm'

export interface XtermWebRef {
  term: React.MutableRefObject<Terminal>
  ws: React.MutableRefObject<WebSocket>
  pid: React.MutableRefObject<string>
  onCloseLink: () => void
  createSocketLink: () => Promise<void>
  createTerm: (isAutoLink?: boolean) => void
}
export class Subscribe {
  private terminals: Map<string, XtermWebRef> = new Map([])
  registerId = (terminal: XtermWebRef, name?: string) => {
    if (name) {
      this.terminals.set(name, terminal)
    }
  }
  removeId = (id?: string) => {
    if (id) {
      this.terminals.delete(id)
    }
  }
  getTerminal = (id: string) => {
    return this.terminals.get(id)
  }
  get subTerminals() {
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
  terminal: XtermWebRef
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
  subscribe?: Subscribe
}) => {
  const { subscribe, children } = props
  const [newSubscribe] = useSubscribe(subscribe)
  return createElement(SubscribeTerminalContext.Provider, {
    value: newSubscribe,
    children: children,
  })
}
