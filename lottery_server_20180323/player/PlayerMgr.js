const   Player = require('./Player.js'),
        Robot = require('./Robot.js');

class PlayerMgr{
    constructor(){
        this.orderId = 0;
        this.orderExt = Math.floor(Date.now()*0.001).toString(36);
        this.robotCount = 0;   // 机器人的数量
        this.uid_info = {};
        this.uid_socketId = {};
        this.socketId_uid = {};
    }

    static sendBetFailedMessage  (pId) {
        shareData.sendByUid(pId, EVENTNAME.net_msg_betting_result, "资金不足", 2);
    }   

    addPlayer(sId, pId, code, gameType){
        var player = new Player(pId, code, gameType);
        this.uid_info[pId] = player;
        this.uid_socketId[pId] = sId;
        this.socketId_uid[sId] = pId;
        return player;
    }

    addRobot(data){
        var player = new Robot(data.id);
        player.init(data);
        this.uid_info[data.id] = player;
        ++ this.robotCount;
        return player;
    }

    initPlayerInfo(data){
        this.uid_info[data.id].init(data);
        return this.uid_info[data.id];
    }

    delPlayer(pId){
        var sId = uid_socketId[pId];
        if (sId) {
            delete this.socketId_uid[sId]; 
        }
        delete this.uid_socketId[pId];  
        delete this.uid_info[pId];
    }

    getPlayerBySocketId(sId){
        var pId = this.socketId_uid[sId];
        if (pId) {
            return this.uid_info[pId];
        }
        return null;
    }

    getPlayerById(pId){
        return this.uid_info[pId];
    }

    getSocketIdByPlayerId(pId){
        return this.uid_socketId[pId];
    }

    getAllPlayer(){
        return this.uid_info;
    }

    updatePlayerMoney(userList){
        let player;
        for (let user of userList) {
            player = this.uid_info[user.id];
            if (null == player) {
                continue;
            }
            player.updateMoney(user.final_balance, user.money_type);
            if (player.playerType == 1) {
                 shareData.eventHandler.emit( shareData.eventHandler.Inner.UPDATE_USERMONEY,
                 {playerId:user.id, moneyType:user.money_type, leftMoney:user.final_balance});
            }
        }
    }

    moneyIsEnough(pId, money){
        let player = this.uid_info[pId];
        if (null == player) {
            return false;
        }
        return player.moneyIsEnough(money);
    }
}

module.exports = PlayerMgr; 