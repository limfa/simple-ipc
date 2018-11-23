const { IPC } = require('node-ipc')
const { EventEmitter } = require('events')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')

exports.setIpcConfig = function(ipc) {
  ipc.config.retry = 1000
  ipc.config.maxRetries = 3
  ipc.config.socketRoot = path.join(os.tmpdir(), '.sockets')
  if (process.env.NODE_ENV !== 'development') {
    ipc.config.silent = true
  }
  if (exports.defaultConfig) {
    Object.assign(ipc.config, exports.defaultConfig)
  }
}

exports.defaultConfig = {}

exports.Server = class {
  constructor(name, methods, setIpcConfig = exports.setIpcConfig) {
    this.methods = methods
    this.ipc = new IPC()
    setIpcConfig(this.ipc)
    this.ipc.config.id = name
    this.options = {
      name,
      timeout: this.ipc.config.retry * (this.ipc.config.maxRetries + 1)
    }
  }
  async listen() {
    await fs.ensureDir(this.ipc.config.socketRoot)
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        reject(new Error(`IPC linsten "${this.options.name}" time out`))
      }, this.options.timeout)
      this.ipc.serve(async () => {
        this.ipc.server.on('message', async (data, socket) => {
          const { id, method, params } = data
          if (!this.methods[method]) return
          const result = await this.methods[method].apply(null, params)
          this.ipc.server.emit(socket, 'message', { id, method, result })
        })
        clearTimeout(t)
        resolve()
      })
      this.ipc.server.start()
    })
  }
  async close() {
    this.ipc.server.stop()
  }
  async getConnections() {
    return new Promise((resolve, reject) => {
      this.ipc.server.server.getConnections((error, count) => {
        if (error) reject(error)
        else resolve(count)
      })
    })
  }
}

exports.Client = class {
  constructor(name, setIpcConfig = exports.setIpcConfig) {
    this._setIpcConfig = setIpcConfig
    this.options = { name }
    this._receiveList = new Set()
    this.init()
  }
  async init() {
    if (!this._init) {
      this.ipc = new IPC()
      this._setIpcConfig(this.ipc)
      this.options.timeout =
        this.ipc.config.retry * (this.ipc.config.maxRetries + 1)

      const { name } = this.options
      this._init = new Promise((resolve, reject) => {
        const t = setTimeout(() => {
          reject(new Error(`IPC connect to "${name}" time out`))
          this._init = null
        }, this.options.timeout)
        this.ipc.connectTo(name, () => {
          this.ipc.of[name].on('message', data => {
            for (let cb of this._receiveList) cb(data)
          })
          clearTimeout(t)
          resolve()
        })
      })
    }
    return this._init
  }
  async call(method, ...params) {
    await this.init()
    const id = Math.random().toString()
    const p = new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this._receiveList.delete(cb)
        reject(new Error(`IPC call "${method}(${params})" time out`))
        this._init = null
      }, this.options.timeout)
      const cb = ({ id: _id, method: _method, result }) => {
        if (id !== _id || method !== _method) return
        this._receiveList.delete(cb)
        clearTimeout(t)
        resolve(result)
      }
      this._receiveList.add(cb)
    })
    this.ipc.of[this.options.name].emit('message', { id, method, params })
    return p
  }
  async close() {
    this._init = null
    if (!this.ipc.of[this.options.name]) return
    return new Promise(resolve => {
      this.ipc.of[this.options.name].once('disconnect', resolve)
      this.ipc.disconnect(this.options.name)
    })
  }
}
