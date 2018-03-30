const WebSocket  = require('ws');
let express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    tools = require('../util/Tools.js'),
    net_msg_login = require('../net/login.js'),
    net_msg_betting = require('../net/betting.js');

let dy_echolog =  () => {
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

let dy_echoinfo = dy_echodebug = dy_echolog;

let decodeMsg = (sendData,islog) => {
    sendData = JSON.stringify(sendData);
    sendData = new Buffer(sendData).toString('base64');
    return sendData;
}

let encodeMsg = (recvData,islog) => {
    recvData = new Buffer(recvData, 'base64').toString();
    recvData = JSON.parse(recvData);
    return recvData;
}


class SocketServer {
    constructor(){
        SocketServer.isConnect = false;
        this.init()
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
            let strData = decodeMsg(Data, cmdStr);
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
        let strData = decodeMsg(Data, cmdStr);
        io.sockets.in(groupId).emit(cmdStr, strData);
    }
    //发送消息给所有客户端
    sendToAllClient (cmdStr, sendData) {
        let Data = {
            State: 1,
            ServerTime: Date.now(),
            Result: sendData
        }
        let strData = decodeMsg(Data, cmdStr);
        io.sockets.emit(cmdStr, strData);
    }

    //等待服务器准备就绪后，再开始监听socket事件
    static enabledServer () {
        io.sockets.on('connection',  (socket) => {
            let sEmit =  (type, cmdStr, Data) => {
                let strData = decodeMsg(Data, cmdStr);
                //dy_echolog(type + sUid() + '>>' + cmdStr + '>>' + strData);
                socket.emit(cmdStr, strData);
            }
            
            let sUid =  (sId) => {
                let uid = shareData.socketId_uid[sId];
                return uid ? uid : sId;
            }
            
            let ServerTool = {
                io: io,
                socket: socket,
                shareData: shareData,
                log: dy_echolog,
                debug: dy_echodebug,
                info: dy_echoinfo,
                tool: tools
            };
        
            ServerTool.bind_sid_player =  (sid, player) => {
                shareData.socketId_gameplayer[sid] = player;
                shareData.uid_socketId[player.uid] = sid;
            }
        
            ServerTool.reg =  (cmdStr, cmdCallFun) => {
                let callFun =  (recvDataJson) => {
                    //dy_echolog('c2s>>' + sUid() + '>>' + cmdStr + '>>' + recvData);
                    try {
                        var recvData = encodeMsg(recvDataJson,cmdStr);
                        cmdCallFun(recvData);
                    } catch (error) {
                        if (cmdStr != "disconnect") {
                            ServerTool.sendError( EVENTNAME.net_msg_error, "你发送了错误的数据");
                            dy_echolog(cmdStr, '|', recvDataJson, '|', error.stack);
                            console.log(cmdStr, '|', recvDataJson, '|', error.stack);
                        }
                    }
                }
                socket.on(cmdStr, callFun);
            };
        
            ServerTool.send =  (cmdStr, sendData) => {
                let Data = {
                    State: 1,
                    ServerTime: Date.now(),
                    Result: sendData
                }
                sEmit('s2c>>', cmdStr, Data);
            };
        
            ServerTool.sendError =  (cmdStr, sendData, state) => {
                let Data = {
                    State: state ? state : 2,
                    ServerTime: Date.now(),
                    Result: sendData
                }
                sEmit('s2c>>', cmdStr, Data);
            };
            //发送消息给指点用户socketid
            ServerTool.sendErrorTo =  (sId, cmdStr, sendData, state) => {
                let Data = {
                    State: state ? state : 2,
                    ServerTime: Date.now(),
                    Result: sendData
                }
                let strData = decodeMsg(Data, cmdStr);
                io.sockets.in(sId).emit(cmdStr, strData);
            };
            ServerTool.sendTo =  (sId, cmdStr, sendData) => {
                let Data = {
                    State: 1,
                    ServerTime: Date.now(),
                    Result: sendData
                }
                let strData = decodeMsg(Data, cmdStr);
                //dy_echolog('s2c>>' + sUid(sId) + '>>' + cmdStr + '>>' + strData);
                io.sockets.in(sId).emit(cmdStr, strData);
            };
        
            let clearLinkData = () => {
                let sId = socket.id;
                let player_uid = shareData.socketId_uid[sId];
                if (player_uid) {
                    shareData.uid_socketId[player_uid] = null;
                    shareData.socketId_uid[sId] = null;
                    shareData.socketId_gameplayer[sId] = null;
                    shareData.uid_info[player_uid] = null;
                }
            }
        
            net_msg_login(ServerTool);
            net_msg_betting(ServerTool);
        
            //断线
            socket.on('disconnect', () =>{
                console.log('disconnect:' + socket.id);
                try {
                    // ServerTool.disconnect();
                    clearLinkData();
                } catch (error) {
                    dy_echolog('disconnect', '|', error.stack);
                    console.log('disconnect', '|', error.stack);
                }
            });
        
            console.log('新连接:' + socket.id);
            sEmit('s2c>>', EVENTNAME.net_msg_connection, { hello: '请继续..' });
        });
    }

}

module.exports = SocketServer;