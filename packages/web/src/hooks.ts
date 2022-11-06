/**
 * 这个组件用于创建控制台
 * 操作控制台
 * 连接服务
 * 执行命令
 */
import { Terminal } from 'xterm'
import { useEffect, useRef } from 'react'
import { FitAddon } from 'xterm-addon-fit'
import { AttachAddon } from 'xterm-addon-attach'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { SearchAddon } from 'xterm-addon-search'
import { useSubscribe, Subscribe, useSubscribeReginsterId } from './store'

export const useSocketTerm = (props: {
  PORT?: number
  HOST?: string
  subscribe?: Subscribe
  id: string
  cwd?: string
}) => {
  const { PORT = 34567, HOST = '127.0.0.1', subscribe, cwd } = props
  const container = useRef<HTMLDivElement>(null)
  const [newSub] = useSubscribe(subscribe)

  const wsRef = useRef<WebSocket>()
  const isSetTermRef = useRef(false)
  const pid = useRef<string>()

  const termRef = useRef(
    new Terminal({
      fontWeight: 400,
      fontSize: 14,
      rows: 200,
      allowProposedApi: true,
    }),
  )

  // 获取远程的pid
  const getPid = async () => {
    let query = ''
    if (cwd) {
      query += 'cwd=' + cwd
    }
    return fetch(`http://${HOST}:${PORT}/terminals?${query}`, {
      method: 'POST',
    }).then((res) => res.json())
  }

  /**创建Socket*/
  const createSocket = async () => {
    try {
      pid.current = await getPid()
      wsRef.current = new WebSocket(
        `ws://${HOST}:${PORT}/terminals/${pid.current}`,
      )
      termRef.current.loadAddon(new AttachAddon(wsRef.current))
      termRef.current.loadAddon(new SearchAddon())
      termRef.current.loadAddon(new FitAddon())
      termRef.current.loadAddon(new WebLinksAddon())
    } catch (err) {
      console.log(err)
    }
  }

  const onRemove = () => {
    //组件卸载，清除 Terminal 实例
    if (termRef.current) {
      termRef.current.dispose()
    }
    isSetTermRef.current = false
    wsRef.current && wsRef.current.close()
  }

  useEffect(() => {
    if (container.current && !isSetTermRef.current) {
      termRef.current.open(container.current)
      termRef.current.focus()
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

  const currentTerminal = {
    term: termRef.current,
    ws: wsRef.current,
    pid: pid.current,
    onRemove,
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
