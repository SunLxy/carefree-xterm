/*
 * @Description: 监听快捷键
 */

import { useEffect } from 'react'
import { Terminal } from 'xterm'
/**
 * 范围内进行监听快捷键
 *
 * 1. 监听清空 command + (k|K)
 *
 */

interface UseHotKeyDataType {
  term: React.MutableRefObject<Terminal>
  ws: React.MutableRefObject<WebSocket>
  pid: React.MutableRefObject<string>
}
export const useHotKeys = (
  terminal: UseHotKeyDataType,
  container?: React.MutableRefObject<HTMLDivElement>,
) => {
  /**清理窗口*/
  const clear = () => {
    if (terminal.term && terminal.term.current) {
      terminal.term.current.clear()
    }
  }

  /**监听uri打开窗口*/
  const onEventListenerLink = (event: MouseEvent, uri: string) => {
    if (event.metaKey && uri) {
      window.open(uri)
    }
  }

  /**监听快捷键*/
  const onEventListener = (event: KeyboardEvent) => {
    /**执行清理*/
    if (event.metaKey && ['K', 'k'].includes(event.key)) {
      clear()
    }
  }

  useEffect(() => {
    if (!container.current) {
      return
    }
    container.current.addEventListener('keydown', onEventListener.bind(this))
    return () => {
      if (!container.current) {
        return
      }
      container.current.removeEventListener(
        'keydown',
        onEventListener.bind(this),
      )
    }
  }, [container])
  return { onEventListenerLink }
}
