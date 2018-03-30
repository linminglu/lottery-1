const   events = require('events');
let 	emitter = new events.EventEmitter(),  // 事件处理
		SocketClient = require('../socket/SocketClient.js'),
		SocketServer = require('../socket/SocketServer.js'),
		NetToken = require('../net/token.js'),
		LotteryMgr = require('../lottery/LotteryMgr.js'),
		GameMgr = require('../game/GameMgr.js'),
		Order = require('../model/Order.js'),
		PlayerMgr = require('../player/PlayerMgr.js');

class Event {
	constructor(args) {
	    this.emit = Event.emit.bind(this);
	    this.on   = Event.on.bind(this);
	}
	static on (eventName, callback) {
	    console.log(`event-on ==>> ${eventName}`)
	    emitter.on(eventName, callback);
	}
	static emit (eventName, args) {
	    console.log(`event-emit ==>> ${eventName}`)
	    emitter.emit(eventName, args);
	}
	static init () {
    	console.log('event-init ==>> ')
    	Event.Inner = {
	        ADD_BETITEM:'Inner_Event_Add_BetItem',
	        SUMBIT_BETITEM:'Inner_Event_Add_AutoBetItem',
	        ADD_WINNING_BETITEM:'Inner_Event_Handle_BetItem',
	        ADD_CORRECT_BETITEM:'Inner_Event_Correct_BetItem',
	        VERIFIED_BETITEM:'Inner_Event_Verified_BetItem',
	        EXITGAME:'Inner_Event_ExitGame',
	        BROADCAST_WININFO:'Inner_Event_Broadcast_WinInfo',
	        BROADCAST_BETRANK:'Inner_Event_Broadcast_BetRank',
	        BROADCAST_BONUSRANK:'Inner_Event_Broadcast_BonusRank',
	        BROADCAST_BET:'Inner_Event_Broadcast_Bet',
	        START_AUTOBET:'Inner_Event_Start_AutoBet',
	        STOP_AUTOBET:'Inner_Event_Stop_AutoBet',
	        UPDATE_USERMONEY:'Inner_Event_Update_UserMoney',
	        BET_FAILED:'Inner_Event_BetFailed',
	    }
    }
}


module.exports = Event;
