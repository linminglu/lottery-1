const   config = require('../config/gameConfig.js'),
        tools = require('../util/Tools.js'),
        model_bet = require('./Bet.js'),
        request = require('request');

/**
 * 机器人，定时投注
 */
class AutoBet  {

    constructor(){
        AutoBet.pIdList = [];
        AutoBet.gameList = {};//游戏列表
        AutoBet.timerList = {};//ding
        AutoBet.timerAutoBet = null; // 定时投注
        AutoBet.lotteryList = {};//彩源列表

        AutoBet.noSucBetItemObj = {
        }; //未成功投注的列表
        AutoBet.testCount = 3;
    }
   init(){
        return new Promise((resolve, reject) => {
            console.log(`AutoBet-init ==>>`)
            this.initGameList();
            this.initRobotPlayerList(shareData.dev_url, shareData.dev_token, shareData.dev_key, 100).then((res)=>{
                console.log(`AutoBet-init ==> suc.`)
                resolve(1);
            }).catch( (error)=>{
                reject(error);
                console.log(`AutoBet-init error:${error}`)
            });
        });
       
    }

    initGameList  () {
        for (let note of config.betnoteList) {
            if (null == AutoBet.gameList[note.gameType]) {
                AutoBet.gameList[note.gameType] = [];
            }
            AutoBet.gameList[note.gameType].push(note);
        }
    }

     static randomBetNote  (gameType)  {
        let noteNum = AutoBet.gameList[gameType].length;
        let index = tools.randomNum1(noteNum);
        return AutoBet.gameList[gameType][index];
    }

    static autoBeting(){
        // if(this.autoBetCount<0){
        //     AutoBet.timerAutoBet = null;
        //     return;
        // }
        // --this.autoBetCount;
        console.log("AutoBet-autoBeting ==>>：")
        //如果彩源列表为空，不执行投注操作
        if (Object.keys(AutoBet.lotteryList).length < 1) {
            console.log("AutoBet-autoBeting 彩源表为空")
            return;
        }
        let nowtime = Math.floor(Date.now()*0.001);
        // let nowtime = new Date().getTime();
        console.log('robot autobet,time=', nowtime, "--------------------------");
        let startIndex = tools.randomNum1(AutoBet.pIdList.length-10);
        //键为彩源，值为期号
        let playerCount = AutoBet.pIdList.length;
        let itemList,pId,noteInfo,issue,gamelist;
        console.dir(AutoBet.lotteryList)
        for (let code in AutoBet.lotteryList) {       
            if (!AutoBet.lotteryList.hasOwnProperty(code)) {
                console.log("no hasOwnProperty")
                continue;
            }
            if (shareData.lotteryMgr.isEnd(code)) {
                console.log(`code is end${code}`)
                continue;
            }
            issue = shareData.lotteryMgr.getLotteryIssue(code);
            gamelist = AutoBet.lotteryList[code];
            for (let gameType of gamelist) {
                itemList = [];
                // 根据机器人的数量投注
                for (let index = 0; index < shareData.playerMgr.robotCount; index++) {
                    pId = AutoBet.pIdList[index];
                    noteInfo = AutoBet.randomBetNote(gameType);
                    itemList.push(  {playerId:pId,
                                    issueId:issue,
                                    gameType:noteInfo.gameType, 
                                    betType:noteInfo.type, 
                                    betMoney:10,
                                    lotteryCode:code, 
                                    betGain:noteInfo.gain,
                                    playerType:3,
                                    moneyType:1,
                                    sendStatus:0,           //  发送给服务器的状态 1 发送 0 未发送
                                    timestamp:nowtime});

                }

                shareData.gameMgr.addPreBetItem(itemList, code, gameType, this).then((itemListA) => {
                    console.log(`AutoBet-autoBet-addPreBetItem ==>>`)
                    // 發送服務中心
                    shareData.orderMgr.submitOrderItemList(itemListA,nowtime)
                }).catch(function(err){
                    console.log(`AutoBet-autoBet error：${err}`)
                })
                
            }         
        }
    }


    startAutoBetting(data) {
        console.log(`AutoBet-startAutoBetting ==>>`)
        // console.dir(data)
        // console.dir(shareData.autoBet)
        if (null == data) {
            return;
        }
        // console.log(null == this.lotteryList[data.lotterycode])
        if (null == AutoBet.lotteryList[data.lotterycode]) {
            AutoBet.lotteryList[data.lotterycode] = [];
        }
        AutoBet.lotteryList[data.lotterycode].push(data.game);
        // console.log('======================')
        // console.log(this.timerAutoBet, this.timerAutoBet == null)
        // console.log('======================')
        if (AutoBet.timerAutoBet == null) {  
            AutoBet.timerAutoBet = setInterval( () =>{
                console.log('AutoBet-startAutoBetting-timerAutoBet ==>>');
                if(AutoBet.testCount < 0){
                    return;
                }
                --AutoBet.testCount;
                AutoBet.autoBeting();
            }, 10000);
            console.log(`AutoBet-autoBet-startAutoBetting ==>> 启动自动投注 lotterycode: ${ data.lotterycode} `);
        }
    }

    stopAutoBetting  (code) {
         console.log('AutoBet-autoBet-stopAutoBetting ==>> 停止 code: ${code} ');
        if (null == code) {
            return;
        }
        delete AutoBet.lotteryList[code];
    }
    
   

    initRobotPlayerList (url, token, dev_key, count) {
        return new Promise((resolve, reject) => {
             console.log(`AutoBet-initRobotPlayerList ==>>:${url},token:${token},dev_key:${dev_key},count:${count}`)
            if (null == url || null == token || null == dev_key || null == count) {
                console.error('请求机器人数据的参数有误');
                reject();
                return;
            }
            let link = `${url}/Game/TestGameUser/getTestGameUser?token=${token}&dev_key=${dev_key}&count=${count}`;
            // console.log('请求机器人数据,链接=', link);
            request.get(link,  (error, response, body) => {
                if (error || response.statusCode != 200) {
                    console.error('机器人列表获取失败',error);
                    reject();
                    return;
                }
                
                let result = JSON.parse(body);                
                if (result.status == "SUCCESS") {
                    let userlist = result.msg;
                    console.log(`AutoBet-initRobotPlayerList ==>> ${userlist.length}`);
                    let player;
                    // 测试
                    // player = shareData.playerMgr.addRobot(userlist[0]);
                    // AutoBet.pIdList.push(userlist[0].id);

                    // // 保存机器人数量
                    for(let user of userlist){
                        player = shareData.playerMgr.addRobot(user);
                        AutoBet.pIdList.push(user.id);
                    }
                }  
                resolve();       
            });
        });
    }

}

module.exports = AutoBet;