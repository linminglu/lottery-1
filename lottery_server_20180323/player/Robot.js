//////
//      父级
//////

class Robot{
    constructor(pId){
        this.playerId = pId;
    }

    init(data){
        this.playerName = data.game_nick;               // 昵称
        this.playerType = parseInt(data.game_user_type);// 1正式账号2测试账号3机器人
        this.gameGold = data.game_gold;                 // 游戏金币
        this.testGold = data.test_Gold;                 // 测试金币
        this.usedGold = 1;
    }

    updateMoney(leftMoney, moneyType){ 
        switch (moneyType) {
            case 0:
                this.testGold = leftMoney;
                break;
            case 1:
                this.gameGold = leftMoney;
                break;     
            default:
                break;
        }
    }

    moneyIsEnough(payMoney){
        if (this.usedGold == 1) {
            return this.gameGold >= payMoney;
        }else if (this.usedGold == 0) {
            return this.testGold >= payMoney;
        }
        return false;
    }
}

module.exports = Robot;