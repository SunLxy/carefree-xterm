/*
 * @Description: 监听快捷键
 */

import { useEffect } from 'react'
import { XtermWebRef } from './store'
/**
 * 范围内进行监听快捷键
 *
 * 1. 监听清空 command + (k|K)
 *
 */
export const useHotKeys = (
  terminal: XtermWebRef,
  container?: React.MutableRefObject<HTMLDivElement>,
) => {
  const clear = () => {
    if (terminal.term && terminal.term.current) {
      terminal.term.current.clear()
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
      container.current.removeEventListener(
        'keydown',
        onEventListener.bind(this),
      )
    }
  }, [container])
}
