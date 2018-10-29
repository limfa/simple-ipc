const Ipc = require('../')
const path = require('path')

beforeAll(async () => {
  Ipc.defaultConfig.socketRoot = path.join(__dirname, '.socket')
})

test('call', async () => {
  const namespace = 'test'

  const requestData = { message: 'message' }
  const response = { result: 'reture' }

  let ipcServer = new Ipc.Server(namespace, {
    eventName: (data) => {
      expect(data).toMatchObject(requestData)
      return response
    }
  })
  await ipcServer.listen()

  const client = new Ipc.Client(namespace)
  const res = await client.call('eventName', requestData)
  expect(res).toMatchObject(response)

  expect(await ipcServer.getConnections()).toBe(1)

  await client.close()

  await new Promise(resolve => setTimeout(resolve, 2000))
  expect(await ipcServer.getConnections()).toBe(0)

  await ipcServer.close()
})

// // todo
// test('timeoutAndError', async () => {

// })
