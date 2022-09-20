const express = require('express')
const expressWs = require('express-ws')
const multer = require('multer')
const path = require("path");
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})


// https://segmentfault.com/a/1190000019806376
const storage = multer.diskStorage({
    // 用来配置文件上传的位置
    destination: (req, file, cb) => {
        // 调用 cb 即可实现上传位置的配置
        cb(null, '/Users/junjie.lin/Downloads')
    },
    // 用来配置上传文件的名称（包含后缀）
    filename: (req, file, cb) => {
        //filename 用于确定文件夹中的文件名的确定。 如果没有设置 filename，每个文件将设置为一个随机文件名，并且是没有扩展名的。
        // 获取文件的后缀
        let ext = path.extname(file.originalname)
        // 拼凑文件名
        let fileName = file.fieldname + '-' + Date.now() + ext
        cb(null, fileName)
        console.log(`receive file:${fileName}`)
        sendToController(TYPE_FILE_FROM_CLIENT, fileName)
    }
})
const upload = multer({storage: storage})

const TYPE_MSG_TO_CLIENT = "MSG_TO_CLIENT"
const TYPE_MSG_FROM_CLIENT = "MSG_FROM_CLIENT";
const TYPE_FILE_FROM_CLIENT = "FILE_FROM_CLIENT";
const TYPE_FORWARD_CMD = "FORWARD_CMD";
const TYPE_SUCCESS = "SUCCESS";
const TYPE_ERROR = "ERROR"

const controlWS = [];
let clientWS = null;
const app = express();
expressWs(app)
app.get('/', (req, res) => {
    res.send('hello!')
})

app.post('/upload', upload.any(), (req, res) => {
    res.json(req.file)
    console.log('upload ' + req.file)
})

app.ws('/transfer', (ws, req) => {
    console.log('ws: /transfer 连接')
    clientWS = ws
    ws.on('message', (msg) => {
        console.log('receive msg:' + msg)
        sendToController(TYPE_MSG_FROM_CLIENT, msg)
    })

    ws.on('close', (e) => {
        clientWS = null;
        console.log('close connection')
    })

})

app.ws('/control', (ws, req) => {
    console.log('ws: /control 连接')

    controlWS.push(ws)
    ws.on('message', (msg) => {
        console.log('receive msg:' + msg)
        let data = JSON.parse(msg)
        if (data.type === TYPE_FORWARD_CMD) {
            try {
                clientWS.send(data.data)
                sendToController(TYPE_SUCCESS, msg)
            } catch (e) {
                sendToController(TYPE_ERROR, msg)
            }
        }
    })

})

function sendToController(type, data) {
    controlWS.forEach((ws, index) => {
        try {
            ws.send(JSON.stringify({
                type: type,
                data: data
            }))
        } catch (e) {

        }
    })
}

function sendToClient(type, data) {
    try {
        clientWS.send(JSON.stringify({type: type, data: data}))
        return true
    } catch (e) {
        return false
    }
}

const server = app.listen(9090, '0.0.0.0', () => {
    console.log('server start')
})

readline.on('line', function (line) {
    switch (line.trim()) {
        case 'sendMsg':
            readline.question('请输入消息:', (answer) => {
                let success = sendToClient(TYPE_MSG_TO_CLIENT, answer)
                if (success) {
                    console.log('发送成功')
                } else {
                    console.log('发送失败')
                }
            })
            break;
        default:
            console.log('没有找到命令！');
            break;
    }
});

