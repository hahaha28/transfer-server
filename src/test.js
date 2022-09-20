const WebSocket = require('ws')
const ws = new WebSocket('ws://127.0.0.1:9090/control')

ws.onopen = ()=> {
    console.log('onopen')
}

ws.onmessage = (e)=>{
    console.log(e.data)
}

ws.onerror = (e) => {
    console.log('error:' + e)
}
