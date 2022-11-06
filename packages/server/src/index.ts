/**
 * 1. 使用 express
 * 2. node-pty
 * 3. os
 * 4. express-ws
 */
import express, { Express, Request, Response } from 'express'
import expressWS, { WithWebsocketMethod } from 'express-ws'
import * as os from 'os'
import * as pty from 'node-pty'
import * as ws from 'ws'

const USE_BINARY = os.platform() !== 'win32'
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'zsh'

export interface XtermServerProps {
  PORT?: number
  env?: Record<string, string>
  cols?: number
  rows?: number
}

export interface APPType extends Express, WithWebsocketMethod {}

export type SpawnOptions = pty.IPtyForkOptions | pty.IWindowsPtyForkOptions

export class XtermServer {
  private PORT?: number = 34567
  private env?: Record<string, string> = {}
  private cols?: number = 80
  private rows?: number = 24
  private app?: APPType
  // 声明变量
  private terminals: Map<number | string, pty.IPty> = new Map([])
  constructor(props?: XtermServerProps) {
    const { PORT = 34567, env = {}, cols = 80, rows = 24 } = props || {}
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
  private restEnv() {
    const newEnv = Object.assign(process.env, this.env || {})
    newEnv['COLORTERM'] = 'truecolor'
    return newEnv
  }
  private initApp(app: APPType) {
    //解决跨域问题
    app.all('*', function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Content-Type')
      res.header('Access-Control-Allow-Methods', '*')
      next()
    })
    app.post('/terminals', this.createTerminals.bind(this))
    app.post('/terminals/size', this.setSize.bind(this))
    app.ws('/terminals/:pid', this.runTerminal.bind(this))
  }
  private create(spawnOptions?: SpawnOptions) {
    const newSpawnOptions: SpawnOptions = {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      encoding: USE_BINARY ? null : 'utf8',
      env: this.restEnv(),
      ...(spawnOptions || {}),
    }
    const term = pty.spawn(shell, ['--login'], newSpawnOptions)
    const pid = term.pid.toString()
    this.terminals.set(pid, term)
    return term
  }
  /**
   * @description: 创建命令行
   * cwd 执行目录
   */
  private createTerminals(req: Request, res: Response) {
    const query = req.query || {}
    const newCols = parseInt(`${query.cols || this.cols}`)
    const newRows = parseInt(`${query.rows || this.rows}`)
    const spawnOptions: SpawnOptions = {
      name: 'xterm-color',
      cols: newCols || 80,
      rows: newRows || 24,
      encoding: USE_BINARY ? null : 'utf8',
      env: this.restEnv(),
    }
    if (query && query.cwd) {
      spawnOptions.cwd = query.cwd as string
    }
    // 绑定当前系统 node 环境
    const term = this.create(spawnOptions)
    const pid = term.pid.toString()
    // 返回 pid 用于后面使用
    res.send(pid)
    res.end()
  }
  /**设置大小*/
  private setSize(req: Request, res: Response) {
    const query = req.query
    const pid = `${req.params.pid}`
    const newCols = parseInt(`${query.cols || this.cols}`)
    const newRows = parseInt(`${query.rows || this.rows}`)
    const term = this.terminals.get(pid)
    term.resize(newCols, newRows)
    res.end()
  }

  /**运行命令*/
  private runTerminal(ws: ws, req: Request) {
    const pid = `${req.params.pid}`
    const term = this.terminals.get(pid)
    if (term) {
      term.onData((data) => {
        ws.send(data)
      })
      ws.on('message', (data) => {
        console.log('data', data)
        term.write(data.toString())
      })
      ws.on('close', () => {
        term.kill()
        this.terminals.delete(pid)
      })
      if (req.query.command) {
        term.write(`${req.query.command}\n`)
      }
    }
  }

  private initListen() {
    const port = this.PORT || 34567
    console.log(`App listening to http://127.0.0.1:` + port)
    this.app?.listen(port, '127.0.0.1')
  }
}
export default XtermServer
