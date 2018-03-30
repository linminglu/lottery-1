const SocketClient = require('../socket/SocketClient.js');

let eventCallBack = {};

eventCallBack['/GameServer/login/login'] =  (data) => {
    //登陆数据中心后，开始发送心跳数据
    console.log(` eventCallBack >>>->>> login: `);
    console.dir(data)
    // SocketClient.enablePing();
    shareData.eventHandler.emit(EVENTNAME.inner_event_server_connect);
};

eventCallBack['/GameServer/GameUser/GetGameUser'] =  (data) => {
    console.log(` eventCallBack >>>->>> 
                        GetGameUser:`);
    shareData.eventHandler.emit(EVENTNAME.inner_event_userinfo, data);
};

eventCallBack['/GameServer/GameUser/ChangeGameUserMoney'] =  (data) => {
    console.log(` eventCallBack >>>->>>  ChangeGameUserMoney:`);
    if (data.status == 'SUCCESS') {
        // console.log(data.msg);
        data.msg.createTime = data.create_time;
        shareData.eventHandler.emit(shareData.eventHandler.Inner.VERIFIED_BETITEM, data.msg);
    }else{
        console.error(data.msg);
    }
};

eventCallBack['/GameServer/GameUser/GameUserMoneyUpdated'] =  (data) => {
    console.log(` eventCallBack >>>->>>  GameUserMoneyUpdated:`);
    console.dir(data)
    if (data.status == 'SUCCESS') {
        SocketClient.updateUserMoney(data.msg);
    } 
};

eventCallBack['/GameServer/GameUser/RewriteGameUserMoney'] =  (data) => {
    console.log(` eventCallBack >>>->>>  RewriteGameUserMoney: `);
    console.dir(data)
    if (data.status == 'SUCCESS') {
        //  shareData.eventHandler.emit( shareData.eventHandler.Inner.VERIFIED_BETITEM, data.msg);
    } 
};

eventCallBack['/GameServer/GameUser/ExitGame'] =  (data) => {
    console.log(` eventCallBack >>>->>>   ExitGame: `);
    console.dir(data)
    if (data.status == 'SUCCESS') {
         shareData.eventHandler.emit( shareData.eventHandler.Inner.EXITGAME, data.msg);
    } 
};

eventCallBack['nologin'] = function (data) {
    console.log(` eventCallBack >>>->>>  nologin: `);
    console.dir(data)
    SocketClient.disablePing( EVENTNAME.event_nologin);
};

module.exports = eventCallBack;