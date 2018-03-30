//////
//      父级
//////

class Robot{
    constructor(pId){
        this.playerId = pId;
    }

    init(data){
        this.playerName = data.game_nick;
        this.playerType = parseInt(data.game_user_type);//1正式账号2测试账号3机器人
        this.gameGold = data.game_gold;
        this.testGold = data.test_Gold;
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