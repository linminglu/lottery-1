const  	WebSocket 		= require('ws'),
        eventCallBack   = require('../event/eventCallBack.js');

let ws_client = null,
    server_config = require('../config/serverConfig.js'),
    WS_URL = `ws://${server_config.serverIP}:${server_config.serverPort}`;




class SocketClient{
    
    constructor(){
        console.log(`SocketClient init: dev_token= ${shareData.dev_token} ,dev_key=${shareData.dev_key}`)
        this.updateUserMoney = SocketClient.updateUserMoney;  
        this.changeUserMoney = SocketClient.changeUserMoney;   
        SocketClient.initWebSocket().then( (data) => {
            console.log(`SocketClient initWebSocket 成功`)
        }).catch( (err) => {
            console.log(`SocketClient initWebSocket err:${err}`)
        });
    }

    static updateUserMoney (userList) {
        if (shareData.playerMgr) {
            shareData.playerMgr.updatePlayerMoney(userList);
        }
    }


    static initWebSocket(){
        return new Promise((resolve, reject) => {
            console.log(`initwebsocket连接:`)
            ws_client = new WebSocket(WS_URL);
            ws_client.addEventListener('open', event => { 
                SocketClient.sendToServer(EVENTNAME.login);
                console.log('socket client opend');
                resolve();
            });
            ws_client.addEventListener('message', event => {
                let data = JSON.parse(event.data);
                console.log(`initWebSocket : data.event ${data.event}`)
                eventCallBack[data.event](data.data);
            });
            ws_client.addEventListener('error', event => {
                console.log(`initWebSocket - listen error:${event}`);
                SocketClient.disablePing( EVENTNAME.event_error);
            });
            ws_client.addEventListener('close', event => {
                console.log(`initWebSocket - listen close:${event}`);
                SocketClient.disablePing( EVENTNAME.event_close);
            });
        })
       
    }

    static disablePing (eventName)  {
        if (null == ws_client) {
            return;
        }
        ws_client = null;
        console.log(`websocket client disconnect reason:${eventName}`);
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;         
        }
        if(SocketClient.reconnectTimer){
            SocketClient.reconnectTimer = null;
        }
        SocketClient.reconnectTimer = setTimeout(()=>{
            if(SocketClient.reconnectTimer){
                clearTimeout(SocketClient.reconnectTimer);
            }        
            SocketClient.reconnectTimer = null;
            shareData.eventHandler.emit(EVENTNAME.inner_event_server_reconnect);
        },1000);
    }

    static enablePing () { 
        if (this.pingTimer) {
            return;
        }  
        this.pingTimer = setInterval(() => {
            ws_client.send("");
            // ws_client.ping();
            // console.log('ping');
        },3000); 
    }

    static sendToServer (eventName, data, submitType=0)  {
        if (null == ws_client) {
            return;
        }
        if (ws_client.readyState != WebSocket.OPEN) {
            return;
        }
        data = data ? data : {};
        let msg = SocketClient.decodeMsg(eventName, data);
        msg += "\r\n";
        ws_client.send(msg, (err)=>{
            console.log(`使用socket发送服务器数据:${err} ,eventName:${eventName},发送数据是：${msg} 正在发送`);
            if (err) {
                console.error(err);
            }else{
                 console.log(`使用socket发送服务器数据:${err} ,eventName:${eventName},发送数据是：${msg} 发送成功`);
                // // 发送修改玩家游戏的金币
                // if (eventName == EVENTNAME.changeGameUserMoney) {

                // }
            }
        });
    }

    static decodeMsg  (eventName, data)  {
        data['token'] = shareData.dev_token;
        data['dev_key'] = shareData.dev_key;
        let sendData = {
            event:eventName,
            data:data
        }; 
        return JSON.stringify(sendData);
    }

    reconnect(){
       SocketClient.initWebSocket().then( (data) => {
            console.log(`SocketClient initWebSocket 成功`)
        }).catch( (err) => {
            console.log(`SocketClient initWebSocket err:${err}`)
        });
    }

    /**
     * 获取用户信息
     * @param {number} playerId 用户id
     */
    getUserInfo(playerId){
         console.log(`getUserInfo:`)
        SocketClient.sendToServer(EVENTNAME.getGameUser, {id:playerId});
    }
    /**
     * 更新用户资金
     * @param {Object[]} userList
     */
    static changeUserMoney(userList, createTime, submitType){
        console.log(`socketClient-changeUserMoney =>>`)
        // let list = userList[0]
        // if(list.length >10){
        //     list = list.splice(0,10)
        // }
        // for(var i = 0; i < list.length ; i++){
        //     SocketClient.sendToServer(EVENTNAME.changeGameUserMoney, {game_user:[list[i]], create_time:createTime}, submitType);
        // }
        
        SocketClient.sendToServer(EVENTNAME.changeGameUserMoney, {game_user:userList, create_time:createTime}, submitType);
        
        //id玩家id、money资金变动值、type资金类型1人民币2测试金币
        // userList = [[{id:1,money:1,type:1,order:}],[{id:1,money:1,type:1}]];
        
    }

    reWriteUserMoney(userList, createTime){
         console.log(`reWriteUserMoney:`)
        SocketClient.sendToServer(EVENTNAME.rewriteGameUserMoney, {game_user:userList, create_time:createTime});
    }

    exitGame(playerId){
         console.log(`exitGame:`)
        SocketClient.sendToServer(EVENTNAME.exitGame, {id:playerId});
    }
}

module.exports = SocketClient;