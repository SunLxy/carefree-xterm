import { SocketTerm } from "./socket-term"
import React, { createElement } from 'react'

export class SubscribeTerminals {
  private terminals: Map<string, SocketTerm> = new Map()
  registerId = (terminal: SocketTerm) => {
    if (terminal.id)
      this.terminals.set(terminal.id, terminal);
    return () => {
      if (terminal.id)
        this.terminals.delete(terminal.id);
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

export const useSubscribeTerminals = (sub?: SubscribeTerminals) => {
  const subRef = React.useRef<SubscribeTerminals>()
  if (!subRef.current) {
    if (sub) {
      subRef.current = sub
    } else {
      subRef.current = new SubscribeTerminals()
    }
  }
  return subRef.current
}

/** 保存所有数据 */
const SubscribeTerminalsContext = React.createContext<SubscribeTerminals>(new SubscribeTerminals())

/**获取*/
export const useSubscribeTerminalsInstance = () =>
  React.useContext(SubscribeTerminalsContext)

/**外层包裹*/
export const SubscribeTerminalsProvider = (props: {
  children: React.ReactNode
  subscribe?: SubscribeTerminals
}) => {
  const { subscribe, children } = props
  const newSubscribe = useSubscribeTerminals(subscribe)
  return createElement(SubscribeTerminalsContext.Provider, {
    value: newSubscribe,
    children: children,
  })
}

/**注册*/
export const useReginsterSocketTerm = ({ socketTerm, subscribe }: { socketTerm: SocketTerm, subscribe: SubscribeTerminals }) => {
  React.useEffect(() => {
    const onMount = subscribe.registerId(socketTerm);
    return onMount;
  }, [])
}
