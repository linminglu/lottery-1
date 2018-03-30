/*
*  启动程序文件
*/
const 	process = require('process');
let 	EventHandler = require('./event/event.js'),
		SocketClient = require('./socket/SocketClient.js'),
		SocketServer = require('./socket/SocketServer.js'),
	 	NetToken = require('./net/token.js'),
	 	AutoBet = require('./model/AutoBet.js'),
	 	LotteryMgr = require('./lottery/LotteryMgr.js'),
		GameMgr = require('./game/GameMgr.js'),
		Order = require('./model/Order.js'),
		PlayerMgr = require('./player/PlayerMgr.js');


// 进程异常处理
process.on('uncaughtException', (err) => {
  console.error(`server-uncaughtException error:${err}`);
});

// 进程退出处理
process.on('exit',(code) => {
	console.log(`server-exit error:${code} `)
	if(shareData.gameMgr && shareData.gameMgr.gameGroup){
		let gameGroup = shareData.gameMgr.gameGroup ;
		let count = 1;
		// 将剩下没有处理完的数据保存到数据库中
		for(let code of gameGroup){
			for(let gameType of gameGroup.code){
				if(gameGroup.code.gameType){
					gameGroup.code.gameType.exit().then(()=>{
						++count;
					}).catch((error) =>{
						console.log(`server-exit error:${error} `)
					}) 
				}
			}
		}		
	}
})


// 全局使用模块
global.shareData = {};
global.EVENTNAME = {}; 
global.ServerConfig = require('./config/serverConfig.js');

serverInt();

// // 启动服务器
function serverInt (){
	console.log('正在启动服务器')
	
	/*
	  1.设置全局的shareData(启动监听)
	  2.启动数据库
	  3.执行监听事件
	  4.获取token
	  5.登陆服务器
	  5.发送未发送的信息
	*/
	shareDataInt()		
		.then(MongodbInit)
		.then(eventStart)
		.then(NetTokenInit)
		.then(resolveData_PreBonusOrder)
		.then(resolveData_LotteryIssue)
		// .then(resolveData)
		.then(function(){
			console.log(`启动完成服务器 `)
		}).catch(function(err){
			console.log(`启动服务器异常。。。中断启动 原因是${err}`)
		});

}

// 初始化sharedata
function shareDataInt(){
	return new Promise((resolve, reject) => {
		console.log('1.初始化sharedata')
		EventHandler.init()

		EVENTNAME = ServerConfig.eventName;

		shareData.uid_socketId = {};
		shareData.uid_info = {};
		shareData.socketId_uid = {};
		shareData.socketId_gameplayer = {};
		shareData.socketGroup = {};
		shareData.server = {};
		shareData.lotteryIssueData = [];//接受过投注的彩种最后一期的期号
		shareData.eventHandler = EventHandler;
		shareData.dev_url = `http://${ServerConfig.serverIP}:${ServerConfig.serverPort}`;//大厅服务器地址10.73.1.120--23.97.65.238
		shareData.dev_name = 'nick';//nick1
		shareData.dev_key = '96e9d040efdae89f77980ddb303c24e9';//96e9d040efdae89f77980ddb303c24e8
		shareData.dev_bind = 1;
		shareData.dev_token = null;
		shareData.orderMgr = null;
		shareData.playerMgr = null;
		shareData.lotteryMgr = null;
		shareData.gameMgr = null;

		shareData.mongooseClient = require('./mongodb/mongodb.js');
		resolve(1)
	});	
}


// 连接mongodb数据库
function MongodbInit(){
	console.log('2.连接数据库')
	return require('./mongodb/mongodb.js').MongodbInit()
}

function* sendResolveData_PreBonusObj(PreBonusObjList){
	for(var item in PreBonusObjList){
		yield shareData.orderMgr.submitOrderItemList(PreBonusObjList[item],item)
		// yield shareData.eventHandler.emit(shareData.eventHandler.Inner.ADD_WINNING_BETITEM, 
		// 			{list:PreBonusObjList[item], date:item});
	}
}

function* sendResolveData_LotteryRecord(LotteryRecordList){
	// console.dir(LotteryRecordList)
	for(var item in LotteryRecordList){
		// console.dir(LotteryRecordList[item])
		if(LotteryRecordList[item].lotteryCode && LotteryRecordList[item].winList){
			yield  shareData.eventHandler.emit(shareData.eventHandler.Inner.BROADCAST_WININFO, 
			{code:LotteryRecordList[item].lotteryCode, win:LotteryRecordList[item].winList});
		}
		

	}
}

// 解決未發送出去的新頭單
function resolveData_PreBonusOrder(){
	console.log('5.处理未处理完的数据')
	return new Promise((resolve, reject) => {
		shareData.mongooseClient.getNoSendData_preBonusOrder().then(function(res){
			// console.log(`resolveData: => getNoSendData_preBonusOrder`)
			// console.dir(`${res}`)
			if(res){
				let PreBonusObjList = {}
				for(let item of res){
					if(res.item.betTimeStamp){
						if(!PreBonusObjList[res.item.betTimeStamp]){
							PreBonusObjList[res.item.betTimeStamp] = []
						}
						PreBonusObjList[res.item.betTimeStamp].push(res.item);
					}
				}
				// key : betTimeStamp value: winlist
				let  goRun = sendResolveData_PreBonusObj(PreBonusObjList)
				// 分批发送给服务中心
				for(let sendCount =0 ; sendCount < PreBonusObjList.length ; sendCount++){
					goRun.next();
				}
			}
			resolve(1);
		// 发送广播中奖信息
		}).catch( (err)=>{
			reject(err);
		})
	});
}

function resolveData_LotteryIssue(){
	return new Promise((resolve, reject) => {
		shareData.mongooseClient.getNoSendData_lotteryIssue().then( (res)=>{
			console.log(`resolveData: => getNoSendData_lotteryIssue`)
			if(res){
				let goRun = sendResolveData_LotteryRecord(res);
				// 分批发送给服务中心
				for(let sendCount =0 ; sendCount < res.length ; sendCount++){
					goRun.next();
				}
			}	
			resolve(1);
		}).catch( (err)=>{
			reject(err)
		});
	});
}

// 启动监听
function eventStart(){
	return new Promise((resolve, reject) => {
		console.log('3.事件监听')
		/**
		 * 获取到token后与数据中心建立websocket连接
		 */
		EventHandler.on(EVENTNAME.inner_event_token_ready, (data) => {
			
			console.log(`server-EventHandler-inner_event_token_ready ==>>`);
			if (shareData.socketClient) {
				shareData.socketClient.reconnect();
			} else {
				shareData.socketClient = new SocketClient();

				shareData.orderMgr = new Order();
				shareData.playerMgr = new PlayerMgr();
				shareData.lotteryMgr = new LotteryMgr();
				shareData.gameMgr = new GameMgr();
				shareData.autoBet = new AutoBet();
				shareData.autoBet.init().then( ()=>{
					openAllEvent()
					// new GameMgr();
					shareData.gameMgr = new GameMgr();
					
				}).catch( (error)=>{
					// reject(error)
					console.log(`server-EventHandler-inner_event_token_ready error:${error}`)
				} )
				
			}
		});
		resolve(1)
	});
}

function openAllEvent(){
	console.log('启动所有的监听事件')
	/**
	 * 与数据中心连接成功后开始监听游戏客户端事件
	 */
	EventHandler.on(EVENTNAME.inner_event_server_connect, () => {
		console.log(`server-EventHandler-inner_event_server_connect ==>>`);
		shareData.socketServer = new SocketServer();
		openSocketServerEvent()
	});


	EventHandler.on(EVENTNAME.inner_event_server_reconnect, () => {
		console.log(`server-EventHandler-inner_event_server_reconnect ==>>`);
		NetToken()
			.then( (data) =>{console.log('server-EventHandler-inner_event_server_reconnect ==>> suc')})
			.catch( (error) =>{ console.log('server-EventHandler-inner_event_server_reconnect error: ${error}') });
	} );

    EventHandler.on(EVENTNAME.inner_event_lotteryhistory_init, (data) => {
    	console.log(`server-EventHandler-inner_event_lotteryhistory_init ==>>`);
    	shareData.gameMgr.eventHistoryLottery(data)
    } );
    EventHandler.on(EVENTNAME.inner_event_lotteryhistory_update, (data) =>  {
    	console.log(`server-EventHandler-inner_event_lotteryhistory_update ==>>`);
    	shareData.gameMgr.eventNewLottery(data)
    } );

    EventHandler.on(shareData.eventHandler.Inner.SUMBIT_BETITEM, (data) => {
    	console.log(`server-EventHandler-SUMBIT_BETITEM ==>>`);
    	shareData.orderMgr.addOrderItem(data);
    } );
    EventHandler.on(shareData.eventHandler.Inner.ADD_WINNING_BETITEM, (data) => {
    	console.log(`server-EventHandler-ADD_WINNING_BETITEM ==>>`);
    	shareData.orderMgr.addWinOrderItem(data)
    } );

    EventHandler.on(shareData.eventHandler.Inner.VERIFIED_BETITEM, (data)=> {
    	console.log(`server-EventHandler-VERIFIED_BETITEM ==>>`);
    	shareData.orderMgr.handleValidOrder(data)
    } );
	/**
	 * 处理服务器返回接收成功数据 ( )
	 *  key :BROADCAST_WININFO 中奖信息 code 做为标识更新数据库
	 *  key :ADD_WINNING_BETITEM 预中奖订单数据 date 作为标识处理更新数据库
	 */
	EventHandler.on(EVENTNAME.inner_event_server_receive, (data) => {
		console.log(`server-EventHandler-inner_event_server_receive ==>>`);
		if( data && typeof data == 'Object'){	
			shareData.mongooseClient.updateSendData_lotteryIssue(data.BROADCAST_WININFO)
				.then(shareData.mongooseClient.updateSendData_preBonusOrder(data.ADD_WINNING_BETITEM))
				.then( (doc)=>{
					console.log(`server-EventHandler-inner_event_server_receive ==>> suc`);
					// console.log(`处理服务器返回接收成功数据`)
				}).catch( (err) =>{
					console.log(`server-EventHandler-inner_event_server_receive error：${err}`)
				})
		}
	});

	/**
	 *	自动机器人
	 **/
	// EventHandler.on(shareData.eventHandler.Inner.START_AUTOBET, (data) => {
	// 	console.log(`server-EventHandler-START_AUTOBET ==>>`);
	// 	// shareData.autoBet.startAutoBetting(data)
	// 	shareData.autoBet.autoBeting()
	// } );


	EventHandler.on(shareData.eventHandler.Inner.START_AUTOBET, shareData.autoBet.startAutoBetting);
    EventHandler.on(shareData.eventHandler.Inner.STOP_AUTOBET, 	shareData.autoBet.stopAutoBetting);
}

function openSocketServerEvent(){
	console.log(`server-openSocketServerEvent ==>>`);
	 EventHandler.on( EVENTNAME.inner_event_new_lottery,  (sendData) => {
	 	console.log(`server-EventHandler-inner_event_new_lottery ==>>`);
		shareData.socketServer.sendToGroup(sendData.lotterycode, EVENTNAME.net_msg_newcode, sendData);
	});

	EventHandler.on(shareData.eventHandler.Inner.BROADCAST_WININFO,  (sendData) => {
        console.log(`server-EventHandler-BROADCAST_WININFO ==>>`);
        let winlist = [];
        let data = sendData.win;
        for (let pId in data) {
            if (data.hasOwnProperty(pId)) {
                let bonus = data[pId];
                if (bonus < 500000) {
                    //奖金小于50元的忽略
                    continue;
                }
                let player = shareData.playerMgr.getPlayerById(pId);
                if (player) {
                    winlist.push([pId, player.playerName, sendData.code, bonus]);
                }    
            }
        }
		shareData.socketServer.sendToAllClient( EVENTNAME.net_msg_bet_winning, winlist);
	});

	EventHandler.on(shareData.eventHandler.Inner.BROADCAST_BET,  (params) => {
		console.log(`server-EventHandler-BROADCAST_BET ==>>`);
		shareData.socketServer.sendToGroup(params.gounpId, EVENTNAME.net_msg_race_betting, params.list);
	});
	//游戏内广播投注榜
	EventHandler.on(shareData.eventHandler.Inner.BROADCAST_BETRANK,  (params) => {
        console.log(`server-EventHandler-BROADCAST_BETRANK ==>>`);
		let list_player_bet = [];
		if (params.list.length > 0) {
            params.list.forEach(bet => {
                let pd = shareData.playerMgr.getPlayerById(bet.playerId);
                if (pd) {
                    list_player_bet.push({playerId:pd.playerId, name:pd.playerName, money:bet.money});
                }
            });		
		}
		shareData.socketServer.sendToGroup(params.gounpId, EVENTNAME.net_msg_bet_ranklist, list_player_bet);
	});
	//游戏内广播中奖榜
	EventHandler.on(shareData.eventHandler.Inner.BROADCAST_BONUSRANK,  (params) => {	
		console.log(`server-EventHandler-BROADCAST_BONUSRANK ==>>`);
		if (params.list.length < 1) {
            return;
        }
        let list_player_bonus = [];
        const lotterycode = params.gounpId;
        params.list.forEach(bet => {
            let pd = shareData.playerMgr.getPlayerById(bet.playerId);
            if (pd) {
                list_player_bonus.push({playerId:pd.playerId, name:pd.playerName, code:lotterycode, money:bet.bonus});
            }
        });		
		shareData.socketServer.sendToGroup(lotterycode, EVENTNAME.net_msg_bonus_ranklist, list_player_bonus);
    })
    //更新用户资金
	EventHandler.on(shareData.eventHandler.Inner.UPDATE_USERMONEY,  (eventData) =>{	
		console.log(`server-EventHandler-UPDATE_USERMONEY ==>>`);	
         // console.dir(eventData)
        let pId = eventData.playerId;
        delete eventData.playerId;
        socketServer.socketServer.sendByUid(pId, EVENTNAME.net_msg_update_money, eventData)
    })
    //投注失败
	EventHandler.on(shareData.eventHandler.Inner.BET_FAILED,  (pId) => {
		console.log(`server-EventHandler-BET_FAILED ==>>`);	
        shareData.socketServer.sendByUid(pId, EVENTNAME.net_msg_betting_result,"资金不足", 2);
    })
}


// 获取token
function NetTokenInit(){
	console.log('4.获取token')
	return NetToken();
}
