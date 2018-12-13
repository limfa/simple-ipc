const Ipc = require('../')
const path = require('path')

beforeAll(async () => {
  Ipc.defaultConfig.socketRoot = path.join(__dirname, '.socket')
})

test('call', async () => {
  const namespace = 'test'

  const requestData = { message: 'message' }
  const response = { result: 'reture' }

  const error = new Error('x')

  let ipcServer = new Ipc.Server(namespace, {
    eventName: data => {
      expect(data).toMatchObject(requestData)
      return response
    },
    errorName: () => {
      throw error
    }
  })
  await ipcServer.listen()

  const client = new Ipc.Client(namespace)
  const res = await client.call('eventName', requestData)
  expect(res).toMatchObject(response)

  try {
    await client.call('errorName')
  } catch (ex) {
    expect(ex).toMatchObject(error)
  }

  expect(await ipcServer.getConnections()).toBe(1)

  await client.close()

  await new Promise(resolve => setTimeout(resolve, 2000))
  expect(await ipcServer.getConnections()).toBe(0)

  await ipcServer.close()
})

test('call and socket close', async () => {
  const namespace = 'test2'

  const requestData = { message: 'message' }
  const response = { result: 'reture' }

  let ipcServer = new Ipc.Server(namespace, {
    eventName: function(data, t) {
      expect(data).toMatchObject(requestData)
      return new Promise(resolve => {
        let timeout = setTimeout(() => {
          resolve(response)
        }, t)
        // clear follow step when socket end
        // this as net.Socket
        this.on('end', () => clearTimeout(timeout))
      })
    }
  })
  await ipcServer.listen()

  const client = new Ipc.Client(namespace)

  setTimeout(() => {
    client.close()
  }, 500)

  await expect(
    client.call('eventName', requestData, 100)
  ).resolves.toMatchObject(response)

  await expect(client.call('eventName', requestData, 600)).rejects.toThrow(
    /close/
  )

  await ipcServer.close()
})

// // todo
// test('timeoutAndError', async () => {

// })
