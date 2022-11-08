/**
 * 这个组件用于创建控制台
 * 操作控制台
 * 连接服务
 * 执行命令
 *
 * 1.手动控制连接和关闭
 */
import { Terminal } from 'xterm'
import { createElement, useEffect, useRef } from 'react'
import { FitAddon } from 'xterm-addon-fit'
import { AttachAddon } from 'xterm-addon-attach'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { SearchAddon } from 'xterm-addon-search'
import {
  useSubscribe,
  useSubscribeReginsterId,
  useSubscribeTerminals,
} from './store'
import { useHotKeys } from './useHotKeys'
export interface UseSocketTermProps {
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

export const useSocketTerm = (props: UseSocketTermProps) => {
  const sub = useSubscribeTerminals()

  const { PORT = 34567, HOST = '127.0.0.1', cwd, isAutoLink = false } = props

  const container = useRef<HTMLDivElement>(null)

  const [newSub] = useSubscribe(sub)

  const wsRef = useRef<WebSocket>()
  const pid = useRef<string>()

  const termRef = useRef<Terminal>()

  const refData = {
    term: termRef,
    ws: wsRef,
    pid: pid,
  }
  const { onEventListenerLink } = useHotKeys(refData, container)

  /**获取远程的pid*/
  const getPid = async () => {
    let query = ''
    if (cwd) {
      query += 'cwd=' + cwd
    }
    return fetch(`http://${HOST}:${PORT}/terminals?${query}`, {
      method: 'POST',
    }).then((res) => res.json())
  }

  /**创建Socket连接*/
  const createSocketLink = async () => {
    if (!termRef.current) {
      return
    }
    try {
      pid.current = await getPid()
      wsRef.current = new WebSocket(
        `ws://${HOST}:${PORT}/terminals/${pid.current}`,
      )
      termRef.current.loadAddon(new AttachAddon(wsRef.current))
      termRef.current.loadAddon(new SearchAddon())
      termRef.current.loadAddon(new FitAddon())
      termRef.current.loadAddon(new WebLinksAddon(onEventListenerLink))
    } catch (err) {
      console.log(err)
    }
  }

  /**创建 Terminal */
  const createTerm = (isAutoLink = false) => {
    /**已经存在不需要再进行连接操作*/
    if (termRef.current) {
      return
    }
    termRef.current = new Terminal({
      fontWeight: 400,
      fontSize: 14,
      rows: 80,
      allowProposedApi: true,
    })
    if (container.current) {
      termRef.current.open(container.current)
      termRef.current.focus()
      /**判断是否需要自动连接*/
      if (isAutoLink) {
        createSocketLink()
      }
    }
  }

  /**关闭连接*/
  const onCloseLink = () => {
    //组件卸载，清除 Terminal 实例
    if (termRef.current) {
      termRef.current.dispose()
    }
    wsRef.current && wsRef.current.close()
    wsRef.current = undefined
    pid.current = undefined
    termRef.current = undefined
  }

  useEffect(() => {
    createTerm(isAutoLink)
  }, [container])

  // 组件卸载删除
  useEffect(() => {
    return () => {
      onCloseLink()
    }
  }, [])

  const currentTerminal = {
    ...refData,
    onCloseLink,
    createSocketLink,
    createTerm,
  }

  useSubscribeReginsterId({
    terminal: currentTerminal,
    id: props.id,
    subscribe: newSub,
  })

  return {
    ...currentTerminal,
    container,
  }
}
