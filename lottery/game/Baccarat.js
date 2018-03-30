const Base = require('./Base.js');


class Baccarat extends Base {
    constructor(code){
        super(code, 2);
    }
    /**
     * 
     * @param {number[]} intnums 开奖号码组
     */
    getLotteryResult(intnums){
        let result = [];
        //计算庄、闲、和
        let zhuang = (intnums[0] + intnums[1])%10;
        let xian = (intnums[3] + intnums[4])%10;
        if (zhuang > xian) {
            result.push(200);
        } else if(zhuang < xian){
            result.push(201);
        } else {
            result.push(202);
        }
        //检查庄对
        if (intnums[0] == intnums[1]) {
            result.push(203);
        }
        //检查闲对
        if (intnums[3] == intnums[4]) {
            result.push(204);
        }
        return result;
    }

    isBetWinning(betType, result){
        for (let note of result) {
            if (note == betType) {
                return true;
            }
        }
        return false;
    }
}

module.exports = Baccarat;