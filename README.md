simple package [node-ipc](https://github.com/RIAEvangelist/node-ipc)


## intro

simple package node-ipc


feature:

* promise support
* timeout error


## usage

start server

```js
const Ipc = require('ipc-promise')
// ipc socket directory
Ipc.defaultConfig.socketRoot = './.socket'

const namespace = 'test'
let ipcServer = new Ipc.Server(namespace, {
  /* 
  events: object<{
    [eventName: string]: (params: any): any =>{};
  }>
  */
  eventName: async (params) => {
    // get request params from client
    console.log(params)
    // response content to client
    return response
  }
})
// start server
await ipcServer.listen()

// stop server
await ipcServer.close()
```

send message

```js
const Ipc = require('ipc-promise')
// ipc socket directory
Ipc.defaultConfig.socketRoot = './.socket'

const namespace = 'test'
const client = new Ipc.Client(namespace)

// send message to server
const response = await client.call('eventName', message)
// get response
console.log(response)

// stop client
await client.close()
```