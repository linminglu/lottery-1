const  	WebSocket 		= require('ws'),
        eventCallBack   = require('../event/eventCallBack.js');

let server_config = require('../config/serverConfig.js'),
    WS_URL = `ws://${server_config.serverIP}:${server_config.serverPort}`;
let ws_client = null;

/*
    客户端
*/


class SocketClient{
    
    constructor(){
        console.log(`SocketClient init: dev_token= ${shareData.dev_token} ,dev_key=${shareData.dev_key}`)
        this.updateUserMoney = SocketClient.updateUserMoney;  
        this.changeUserMoney = SocketClient.changeUserMoney;   
        ws_client = null;
    }
    init(){
        console.log(`SocketClient_init ==>> `)
        return new Promise((resolve, reject) => {
            SocketClient.initWebSocket().then( (data) => {
                console.log(`SocketClient-initWebSocket ==>> 成功`)
                resolve(data)
            }).catch( (err) => {
                console.log(`SocketClient-initWebSocket err:${err}`)
                reject(err)
            });
        });
    }

    static updateUserMoney (userList) {
        if (shareData.playerMgr) {
            shareData.playerMgr.updatePlayerMoney(userList);
        }
    }

    static initWebSocket(){
        return new Promise((resolve, reject) => {
            console.log(`initwebsocket连接: ${WS_URL} `)
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
            // resolve(1)
        })
       
    }

    static disablePing (eventName)  {
        if (null == ws_client) {
            return;
        }
        ws_client = null;
        console.log(`websocket client disconnect reason:${eventName}`);
        if (SocketClient.pingTimer) {
            clearInterval(SocketClient.pingTimer);
            SocketClient.pingTimer = null;         
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
        if (SocketClient.pingTimer) {
            return;
        }  
        SocketClient.pingTimer = setInterval(() => {
            ws_client.send("");
            // ws_client.ping();
            // console.log('ping');
        },3000); 
    }

    static sendToServer (eventName, data, submitType=0)  {
        console.log(`SocketClient-sendToServer ==>>`)
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
            console.log(`SocketClient-sendToServer ==>> 使用socket发送服务器数据:${err} ,eventName:${eventName},发送数据是：正在发送`);
            if (err) {
                console.error(err);
            }else{
                 console.log(`SocketClient-sendToServer ==>> 使用socket发送服务器数据:${err} ,eventName:${eventName},发送数据是： 发送成功`);
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
        console.log(`socketClient_reconnect ==>> `)
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
        console.log(`socketClient_getUserInfo ==>>`)
        SocketClient.sendToServer(EVENTNAME.getGameUser, {id:playerId});
    }
    /**
     * 更新用户资金
     * @param {Object[]} userList
     */
    static changeUserMoney(userList, createTime, submitType){
        console.log(`socketClient_changeUserMoney ==>>`)
        SocketClient.sendToServer(EVENTNAME.changeGameUserMoney, {game_user:userList, create_time:createTime}, submitType);   
        //id玩家id、money资金变动值、type资金类型1人民币2测试金币
        // userList = [[{id:1,money:1,type:1,order:}],[{id:1,money:1,type:1}]];    
    }

    reWriteUserMoney(userList, createTime){
        console.log(`socketClient_reWriteUserMoney ==>>`)
        SocketClient.sendToServer(EVENTNAME.rewriteGameUserMoney, {game_user:userList, create_time:createTime});
    }

    exitGame(playerId){
        console.log(`socketClient_exitGame ==>> `)
        SocketClient.sendToServer(EVENTNAME.exitGame, {id:playerId});
    }
}

module.exports = SocketClient;