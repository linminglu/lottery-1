const WebSocket  = require('ws');
let tools = require('../util/Tools.js'),
    ServerTool = require('./Socket.js');
    // net_msg_login = require('../net/login.js'),
    // net_msg_betting = require('../net/betting.js');

/*
    客户端
*/

class SocketServer {
    constructor(){
        SocketServer.isConnect = false;
        this.init()
        SocketServer.dy_echoinfo = SocketServer.dy_echodebug = SocketServer.dy_echolog;
    }

    init(){
        //启动服务器存入数据
        server.bufferData =  () => {
        };
        server.listen(8888,  () => {
            console.log('彩票服务开启，端口8888');
            // server.bufferData();
            SocketServer.isConnect = true;   
            SocketServer.enabledServer();  
        });
    }


    //发送消息给指定用户uid
    sendByUid(uid, cmdStr, sendData, state){
        let Data = {
            State: state ? state : 1,
            ServerTime: Date.now(),
            Result: sendData
        }
        let sId = shareData.playerMgr.getSocketIdByPlayerId(uid);
        if (sId) {
            let strData = SocketServer.decodeMsg(Data, cmdStr);
            //dy_echolog('s2c>>' + sUid(sId) + '>>' + cmdStr + '>>' + strData);
            io.sockets.in(sId).emit(cmdStr, strData)
        }
    }
    //发送消息给指定用户组,包括自己
    sendToGroup (groupId, cmdStr, sendData) {
        let Data = {
            State: 1,
            ServerTime: Date.now(),
            Result: sendData
        }
        let strData = SocketServer.decodeMsg(Data, cmdStr);
        io.sockets.in(groupId).emit(cmdStr, strData);
    }
    //发送消息给所有客户端
    sendToAllClient (cmdStr, sendData) {
        let Data = {
            State: 1,
            ServerTime: Date.now(),
            Result: sendData
        }
        let strData = SocketServer.decodeMsg(Data, cmdStr);
        io.sockets.emit(cmdStr, strData);
    }

    sendTo_AllClient(cmdStr, sendData ,errNumber){
        let Data = {
            err:errNumber,
            suc:errNumber?'':'ok'
        }
        if(sendData){
             for(let key in sendData){
                Data[key] = sendData[key]
            }
        }
       this.sendToAllClient(cmdStr,Data)
    }


    //等待服务器准备就绪后，再开始监听socket事件
    static enabledServer () {
        io.sockets.on('connection',  (socket) => {
            console.log(`SocketServer-enabledServer ==>> `)            
            let ServerToolObj = {
                io: io,
                socket: socket,
                shareData: shareData,
                log:  SocketServer.dy_echolog,
                debug: dy_echodebug,
                info: dy_echoinfo,
                tool: tools
            };
            let singleServerTool = new ServerTool(ServerToolObj)
            
            net_msg_login(singleServerTool);
            net_msg_betting(singleServerTool);
        
            //断线
            socket.on('disconnect', () =>{
                console.log('disconnect:' + socket.id);
                try {
                    // ServerTool.disconnect();
                    // clearLinkData();
                    let sId = socket.id;
                    let player_uid = shareData.socketId_uid[sId];
                    if (player_uid) {
                        shareData.uid_socketId[player_uid] = null;
                        shareData.socketId_uid[sId] = null;
                        shareData.socketId_gameplayer[sId] = null;
                        shareData.uid_info[player_uid] = null;
                    }
                } catch (error) {
                    SocketServer.dy_echolog('disconnect', '|', error.stack);
                    console.log('disconnect', '|', error.stack);
                }
            });
        
            console.log('新连接:' + socket.id);
            // sEmit('s2c>>', EVENTNAME.net_msg_connection, { hello: '请继续..' });
        });
    }

    static decodeMsg  (sendData,islog) {
        sendData = JSON.stringify(sendData);
        sendData = new Buffer(sendData).toString('base64');
        return sendData;
    }

    static encodeMsg  (recvData,islog)  {
        recvData = new Buffer(recvData, 'base64').toString();
        recvData = JSON.parse(recvData);
        return recvData;
    }

    static dy_echolog   ()  {
        let args = arguments,
            numargs = arguments.length,
            msgStr = new Date().toLocaleTimeString() + '|',
            temp = null;

        for (i = 0; i < numargs; i++) {
            temp = args[i];
            if (i < numargs - 1) {
                msgStr += (temp + ' ');
            } else {
                msgStr += (temp + '\n');
            }
        }
        writeFile('log/bet_echolog.txt', msgStr);
        //console.log(msgStr);
    };
}

module.exports = SocketServer;