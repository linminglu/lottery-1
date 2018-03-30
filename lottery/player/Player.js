var Robot = require('./Robot.js');
    // MongooseClient = require('../dao/mongo_command.js');

class Player extends Robot{
    constructor(pId, code, gameType){
        super(pId);
        this.lotteryCode = code;
        this.gameType = gameType;
        this.roomId = code + gameType;
        this.hasAuto = false;
    }
    /**
     * 初始化玩家信息
     * @param {string} code 彩源
     * @param {number} gametype 游戏类型 
     */
    init(data){
        super.init(data);
    }

    setAutoData(list){
        if (null == list || null == list.length) {
            return;   
        }
        this.hasAuto = true;
        this.autoBetList = list;
    }

    cancelAutoData(){
        this.hasAuto = false;
        this.autoBetList = null;
    }

    exitGame(){
        Sql.updateByKVset2('player_info', 'playerId', this.playerId, 'gameGold', this.gameGold, 'testGold', this.testGold);
    }
}


module.exports = Player;