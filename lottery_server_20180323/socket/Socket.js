const SocketServer =  require('./SocketServer');

class Socket  {
	constructor(agrs) {
		// code
		this.io = agrs.io;
        this.socket = agrs.socket;
        this.shareData = agrs.shareData;
        this.log = agrs.dy_echolog;
        this.debug = agrs.dy_echodebug;
        this.info = agrs.dy_echoinfo;
        this.tool = agrs.tools;
	}

	init(){

	}

	// methods
	bind_sid_player(sid, player){
        shareData.socketId_gameplayer[sid] = player;
        shareData.uid_socketId[player.uid] = sid;
    }


    reg  (cmdStr, cmdCallFun) {
        socket.on(cmdStr, this.callFun(recvDataJson));
    }

    callFun(recvDataJson){
    	//dy_echolog('c2s>>' + sUid() + '>>' + cmdStr + '>>' + recvData);
        try {
            var recvData = SocketServer.encodeMsg(recvDataJson,cmdStr);
            cmdCallFun(recvData);
        } catch (error) {
            if (cmdStr != "disconnect") {
                this.sendError( EVENTNAME.net_msg_error, "你发送了错误的数据");
                SocketServer.dy_echolog(cmdStr, '|', recvDataJson, '|', error.stack);
                console.log(cmdStr, '|', recvDataJson, '|', error.stack);
            }
        }
    }

    send  (cmdStr, sendData){
        let Data = {
            State: 1,
            ServerTime: Date.now(),
            Result: sendData
        }
        sEmit('s2c>>', cmdStr, Data);
    }

    sendClient (cmdStr, sendData =null, errNumber =''){
        let Data = {
            err:errNumber,
            suc:errNumber?'':'ok'
        }
        if(sendData){
             for(let key in sendData){
                Data[key] = sendData[key]
            }
        }
       
        this.send(cmdStr)
    }

    sendError   (cmdStr, sendData, state)  {
        let Data = {
            State: state ? state : 2,
            ServerTime: Date.now(),
            Result: sendData
        }
        sEmit('s2c>>', cmdStr, Data);
    }
    //发送消息给指点用户socketid
    sendErrorTo (sId, cmdStr, sendData, state)  {
        let Data = {
            State: state ? state : 2,
            ServerTime: Date.now(),
            Result: sendData
        }
        let strData = SocketServer.decodeMsg(Data, cmdStr);
        io.sockets.in(sId).emit(cmdStr, strData);
    }

    sendTo   (sId, cmdStr, sendData) {
        let Data = {
            State: 1,
            ServerTime: Date.now(),
            Result: sendData
        }
        let strData = SocketServer.decodeMsg(Data, cmdStr);
        //dy_echolog('s2c>>' + sUid(sId) + '>>' + cmdStr + '>>' + strData);
        io.sockets.in(sId).emit(cmdStr, strData);
    }
}

module.exports = Socket;