const request = require('request');
const errResult = require('../socket/errResult.js')

let net_msg_login =  (server) => {
    server.reg( EVENTNAME.net_msg_login, (params) => {
        console.log("playerId=" + params.playerId + "彩种代码=" + params.lotteryCode + '游戏类型=' + params.gameType);
        let playerId = params.playerId;
        let gameType = params.gameType;
        let lotteryCode = params.lotteryCode;
        //检查是否已经登陆过
        if (server.shareData.uid_socketId[playerId]) {
            // server.sendError(EVENTNAME.server_error_msg, '已经在游戏中，不能重复登陆!');
            server.sendError(EVENTNAME.server_error_msg, errResult.relogin_err);
            return;
        }
        shareData.playerMgr.addPlayer(server.socket.id, playerId, lotteryCode, gameType);
        shareData.socketClient.getUserInfo(playerId);
    });

    shareData.eventHandler.on(EVENTNAME.inner_event_userinfo,  (data) =>{
        let player = server.shareData.playerMgr.initPlayerInfo(data);
        server.send( EVENTNAME.net_msg_login_result, data);        
        server.socket.join(player.roomId);//加入同一个彩源、同一个游戏的用户组
        server.socket.join(player.lotteryCode);//加入同一个彩源的用户组
        server.socket.join(player.gameType);//加入同一个游戏的用户组
    });

    server.reg(EVENTNAME.net_msg_select_lottery_record,  (params) => {
        let player = shareData.playerMgr.getPlayerBySocketId(server.socket.id);
        if (null == player) {
            console.error('用户不存在');
            return;
        }
        let lotterylist = server.shareData.lotteryMgr.getHistoryLottery(player.lotteryCode);
        if (null == lotterylist) {
            return;
        }
        if (lotterylist.length > 0) {
            server.send(EVENTNAME.net_msg_lotteryrecord, lotterylist); 
        }
    });

    server.reg(EVENTNAME.net_msg_select_auto_betting,  (params) => {
        let player = shareData.playerMgr.getPlayerBySocketId(server.socket.id);
        if (null == player) {
            console.error('用户不存在');
            return;
        }
        if (player.autoInfo && player.autoBetList) {
            server.send(EVENTNAME.net_msg_auto_betlist, player.autoBetList);
        }
    });

    server.reg( EVENTNAME.net_msg_select_betting_record,  (params) => {
        let player = shareData.playerMgr.getPlayerBySocketId(server.socket.id);
        if (!player) {
            console.log('用户不存在');
            return;
        }
        
        let player_race = shareData.gameMgr.getGameByPlayer(player);
        if (!player_race) {
            return;
        }

        if (player_race.bettingList.length > 0) {
            server.send( EVENTNAME.net_msg_betrecord, player_race.bettingList);
        }
        let pd;
        //发送投注榜和中奖榜数据
        let betRank = player_race.getBetRankList();
        if (betRank.length > 0) {
            let list_player_bet = [];
            
            betRank.forEach(bet => {
                pd = shareData.playerMgr.getPlayerById(bet.playerId);
                if (pd) {
                    list_player_bet.push({playerId:pd.playerId, name:pd.playerName, money:bet.money});
                }
            });
            server.send( EVENTNAME.net_msg_bet_ranklist, list_player_bet);
        }
        let bonusRank = player_race.getBonusRankList();
        if (bonusRank.length > 0) {
            let list_player_bonus = [];
            bonusRank.forEach(bet => {
                pd = shareData.playerMgr.getPlayerById(bet.playerId);
                if (pd) {
                    list_player_bonus.push({playerId:pd.playerId, name:pd.playerName, money:bet.bonus});
                }
            });
            server.send( EVENTNAME.net_msg_bonus_ranklist, list_player_bonus);
        } 
    });

    server.reg( EVENTNAME.net_msg_select_online_player,  (params) => {
        let player = shareData.playerMgr.getPlayerBySocketId(server.socket.id);
        if (!player) {
            console.error('用户不存在');
            return;
        }
        let onlineList = [];
        let allplayer = shareData.playerMgr.getAllPlayer();;
        for (let key in allplayer) {
            if (allplayer.hasOwnProperty(key)) {
                let element = allplayer[key];
                onlineList.push(element);
            }
        }
        if (onlineList.length < 1) {
            return;
        }
        server.send( EVENTNAME.net_msg_online_player, onlineList);
    });
    //退出账号
    server.reg( EVENTNAME.net_msg_logout, (params) => {
        console.log('logout:' + server.socket.id);
        let player = shareData.playerMgr.getPlayerBySocketId(server.socket.id);
        if (!player) {
            console.log('用户不存在');
            return;
        }
        shareData.socketClient.exitGame(player.playerId);
    });

    shareData.eventHandler.on( EVENTNAME.inner_event_exitgame,  (data) => {
        let player = shareData.playerMgr.getPlayerById(data.id);
        if (!player) {
            console.log('用户不存在');
            return;
        }
        //退出用户组
        server.socket.leave(player.roomId);
        server.socket.leave(player.lotteryCode);
        server.socket.leave(player.gameType);

        shareData.playerMgr.delPlayer(data.id);
        // server.send( EVENTNAME.net_msg_logout, "退出成功！");
        server.send( EVENTNAME.net_msg_logout, errResult.suc);
        server.socket.disconnect();
    });
};

module.exports = net_msg_login;