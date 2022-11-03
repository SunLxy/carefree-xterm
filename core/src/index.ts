/**
 * 1. 使用 express
 * 2. node-pty
 * 3. os
 * 4. express-ws
 */
import express, { Express, Request, Response } from 'express'
import expressWS, { WithWebsocketMethod } from 'express-ws'
import os from 'os'
import pty from 'node-pty'
import * as ws from 'ws'

const USE_BINARY = os.platform() !== 'win32'

export interface XtermServerProps {
  PORT?: number
  env?: Record<string, string>
  cols?: number
  rows?: number
}

interface APPType extends Express, WithWebsocketMethod {}

class XtermServer {
  private PORT?: number = 8989
  private env?: Record<string, string> = {}
  private cols?: number = 80
  private rows?: number = 24
  private app?: APPType
  // 声明变量
  private terminals = {}
  private unsentOutput = {}
  private temporaryDisposable = {}
  constructor(props: XtermServerProps) {
    const { PORT = 8989, env = {}, cols = 80, rows = 24 } = props
    this.PORT = PORT
    this.env = env
    this.cols = cols
    this.rows = rows
    this.app = express() as APPType
    // 加入 ws 服务
    expressWS(this.app)
    this.initApp(this.app)
    this.initListen()
  }
  private initApp(app: APPType) {
    app.post('/terminals', this.createTerminals.bind(this))
    app.post('/terminals', this.setSize.bind(this))
    app.ws('/terminals/:pid', this.runTerminal.bind(this))
  }
  private createTerminals(req: Request, res: Response) {
    const query = req.query
    const newEnv = Object.assign(process.env, this.env || {})
    newEnv['COLORTERM'] = 'truecolor'
    const newCols = parseInt(`${query.cols || this.cols}`)
    const newRows = parseInt(`${query.rows || this.rows}`)
    const spawnOptions: pty.IPtyForkOptions | pty.IWindowsPtyForkOptions = {
      name: 'xterm-256color',
      cols: newCols || 80,
      rows: newRows || 24,
      encoding: USE_BINARY ? null : 'utf8',
      env: newEnv,
    }
    if (query.cwd) {
      spawnOptions.cwd = query.cwd as string
    }
    const term = pty.spawn(
      process.platform === 'win32' ? 'pwsh.exe' : 'bash',
      [],
      spawnOptions,
    )
    // 存储
    this.terminals[term.pid] = term
    this.unsentOutput[term.pid] = ''
    this.temporaryDisposable[term.pid] = term.onData(function (data) {
      this.unsentOutput[term.pid] += data
    })
    // 返回pid 用于后面使用
    res.send(term.pid.toString())
    res.end()
  }

  private setSize(req: Request, res: Response) {
    const query = req.query
    const pid = parseInt(req.params.pid)
    const newCols = parseInt(`${query.cols || this.cols}`)
    const newRows = parseInt(`${query.rows || this.rows}`)
    const term = this.terminals[pid]
    term.resize(newCols, newRows)
    console.log(
      'Resized terminal ' +
        pid +
        ' to ' +
        newCols +
        ' cols and ' +
        newRows +
        ' rows.',
    )
    res.end()
  }

  private runTerminal(ws: ws, req: Request) {
    const term = this.terminals[parseInt(req.params.pid)]
    console.log('Connected to terminal ' + term.pid)
    this.temporaryDisposable[term.pid].dispose()
    delete this.temporaryDisposable[term.pid]
    ws.send(this.unsentOutput[term.pid])
    delete this.unsentOutput[term.pid]
    // unbuffered delivery after user input
    let userInput = false
    // string message buffering
    function buffer(socket: ws, timeout: number, maxSize: number) {
      let s = ''
      let sender: NodeJS.Timeout | undefined = undefined
      return (data: Buffer) => {
        s += data
        if (s.length > maxSize || userInput) {
          userInput = false
          socket.send(s)
          s = ''
          if (sender) {
            clearTimeout(sender)
            sender = undefined
          }
        } else if (!sender) {
          sender = setTimeout(() => {
            socket.send(s)
            s = ''
            sender = undefined
          }, timeout)
        }
      }
    }
    // binary message buffering
    function bufferUtf8(socket: ws, timeout: number, maxSize: number) {
      const dataBuffer = new Uint8Array(maxSize)
      let sender: NodeJS.Timeout | undefined = undefined
      let length = 0
      return (data: Buffer) => {
        function flush() {
          socket.send(Buffer.from(dataBuffer.buffer, 0, length))
          length = 0
          if (sender) {
            clearTimeout(sender)
            sender = undefined
          }
        }
        if (length + data.length > maxSize) {
          flush()
        }
        dataBuffer.set(data, length)
        length += data.length
        if (length > maxSize || userInput) {
          userInput = false
          flush()
        } else if (!sender) {
          sender = setTimeout(() => {
            sender = undefined
            flush()
          }, timeout)
        }
      }
    }
    const send = (USE_BINARY ? bufferUtf8 : buffer)(ws, 5, 262144)
    // WARNING: This is a naive implementation that will not throttle the flow of data. This means
    // it could flood the communication channel and make the terminal unresponsive. Learn more about
    // the problem and how to implement flow control at https://xtermjs.org/docs/guides/flowcontrol/
    term.onData(function (data: Buffer) {
      try {
        send(data)
      } catch (ex) {
        // The WebSocket is not open, ignore
      }
    })
    ws.on('message', function (msg) {
      term.write(msg)
      userInput = true
    })
    ws.on('close', () => {
      term.kill()
      console.log('Closed terminal ' + term.pid)
      // Clean things up
      delete this.terminals[term.pid]
    })
  }

  private initListen() {
    const port = this.PORT || 8989
    const host = os.platform() === 'win32' ? '127.0.0.1' : '0.0.0.0'
    console.log(`App listening to http://${host}:` + port)
    this.app?.listen(port, host)
  }
}
export default XtermServer
