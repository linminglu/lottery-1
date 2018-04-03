const bet = require('../model/Bet.js');
const request = require('request');
const errResult = require('../socket/errResult.js')

let  generateBettingItem = (data) => {    
    console.log(`betting-generateBettingItem ==>>`)
    let gameInfo = bet.getGameInfo(data.gameType);
    if (null == gameInfo) {
        console.log('gametype error');
        return null;
    }
    let betnoteInfo = bet.getBetNoteInfo(data.betType);
    if (null == betnoteInfo) {
        console.log('bettype error');
        return null;
    }
    data.betGain = betnoteInfo.gain;
    return data;
}

let net_msg_betting =  (server) => {
    server.reg( EVENTNAME.net_msg_betting, (params) => {
        console.log(`betting-net_msg_betting-net_msg_betting ==>> `)
        let player = shareData.playerMgr.getPlayerBySocketId(server.socket.id);
        if (null == player) {
            console.log('用户不存在');
            return;
        }
        let isEnd = shareData.lotteryMgr.isEnd(player.lotteryCode);
        //判断投注是否已经截至
        if (isEnd) {
            // server.sendError( EVENTNAME.net_msg_betting_result, '本期投注已截至');
            server.sendError( EVENTNAME.net_msg_betting_result, errResult.bet_stop_err);
            return;
        }

        let length = params.list.length;
        if (length < 1) {
            // server.sendError( EVENTNAME.net_msg_betting_result, '未选择投注类型');
            server.sendError( EVENTNAME.net_msg_betting_result, errResult.bet_type_err);
            return;
        } 

        let serverIssue = shareData.lotteryMgr.getLotteryInfo(player.lotteryCode).nowIssue;
        let bettingList = [];   
        let timestamp = Math.floor(Date.now()*0.001);
        let betTotalMoney = 0;
        let item;
        //判断投注信息的数据是否合法
        for (let index = 0; index < length; index++) {
            item = generateBettingItem(params.list[index]);
            if (null == item) {
                // server.sendError( EVENTNAME.net_msg_betting_result, '投注的数据不合法');
                server.sendError( EVENTNAME.net_msg_betting_result, errResult.bet_data_err);
                return;
            }
            //期号(20171230001)|彩源|投注类型(LD)|玩家ID|投注金额
            item.playerId = player.playerId;
            item.issueId = serverIssue;
            item.lotteryCode = player.lotteryCode;
            item.timestamp = timestamp;  
            item.playerType = player.playerType;
            item.moneyType = player.usedGold; 
            betTotalMoney += item.betMoney;
            bettingList.push(item);
        }
        if (!shareData.playerMgr.moneyIsEnough(player.playerId, betTotalMoney)) {
            // server.sendError( EVENTNAME.net_msg_betting_result, '资金不足');
            server.sendError( EVENTNAME.net_msg_betting_result, errResult.bet_data_no_ength_money);
            return;
        }
        shareData.gameMgr.addPreBetItem(bettingList, player.lotteryCode, player.gameType).then((itemListA) => {
            // 發送服務中心
           shareData.orderMgr.submitOrderItemList(itemListA,nowtime)

        }).catch(function(err){
            console.log(`betting-net_msg_betting error：${err}`)
        })

    });
    server.reg( EVENTNAME.net_msg_enable_auto_betting,  (params) => {
        console.log(`betting-net_msg_betting-net_msg_enable_auto_betting ==>>`)
        let player = shareData.playerMgr.getPlayerBySocketId(server.socket.id);
        if (null == player) {
            console.log('用户不存在');
            return;
        }

        let serverIssue = shareData.lotteryMgr.getLotteryInfo(player.lotteryCode).nowIssue;
        let key = `${player.playerId}_${player.lotteryCode}_${player.gameType}`;
        if (player.hasAuto || player.autoBetList) {
            // server.sendError( EVENTNAME.server_error_msg, '挂机失败,不能重复挂机');
            server.sendError( EVENTNAME.server_error_msg, errResult.auto_rebetting_err);
            return;
        }
        
        shareData.mongooseClient.findBetItemFromPlayer(player, serverIssue, (err, res)=>{
            if (err) {
                return;
            }
            if (res.length < 1) {
                // server.sendError( EVENTNAME.server_error_msg, '挂机失败,本期未投注');
                server.sendError( EVENTNAME.server_error_msg, errResult.auto_betting_no_bet_err);
                return;
            }
            let sendDataArr = [];
            res.forEach(bet => {
                sendDataArr.push({playerId:bet.playerId, gameType:bet.gameType, betType:bet.betType, betMoney:bet.betMoney, lotteryCode:bet.lotteryCode});
            });
            shareData.mongooseClient.addAutoBetOrder(sendDataArr, (state)=>{
                if (state) {
                    player.setAutoData(sendDataArr);
                    // server.send( EVENTNAME.net_msg_auto_betlist, sendData);
                    server.sendClient( EVENTNAME.net_msg_auto_betlist, {betlist:sendData}, );
                    // server.send( EVENTNAME.net_msg_enable_auto, '挂机成功');
                    sendData = {
                        suc:errResult.suc,
                        err:''
                    }
                    server.sendClient( EVENTNAME.net_msg_enable_auto,,);
                    
                }
            });
        });    
    });

    // 取消自动挂机
    server.reg( EVENTNAME.net_msg_cancel_auto_betting, function (params) {
        console.log(`betting-net_msg_betting-net_msg_cancel_auto_betting ==>>`)
        let player = shareData.playerMgr.getPlayerBySocketId(server.socket.id);
        if (null == player) {
            console.log('用户不存在');
            // server.sendError( EVENTNAME.net_msg_cancel_auto, '取消失败,用户不存在');
            server.sendError( EVENTNAME.net_msg_cancel_auto, errResult.cancel_auto_betting_player_no_exist_err);
            return;
        }
        if (!player.hasAuto) {
            // server.sendError( EVENTNAME.net_msg_cancel_auto, '取消失败,没有挂机状态');
            server.sendError( EVENTNAME.net_msg_cancel_auto, errResult.cancel_auto_err);
            return;
        }
        shareData.mongooseClient.delAutoBetOrder(player.playerId, player.lotteryCode, player.gameType, (state)=>{
            if (state) {
                // server.send( EVENTNAME.net_msg_cancel_auto, '取消挂机成功');
                // server.send( EVENTNAME.net_msg_cancel_auto, errResult.suc);
                player.cancelAutoData();
                let sendData = {
                    suc:errResult.suc,
                    err:''
                }
                server.sendClient( EVENTNAME.net_msg_cancel_auto_betting_result , sendData )
            }
        });
    });
};

module.exports = net_msg_betting;