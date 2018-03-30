var Base = require('./Base.js');

class LongHuBattle extends Base {
    constructor(code){
        super(code, 3);
    }
    /**
     * 
     * @param {number[]} intnums 开奖号码组
     */
    getLotteryResult(intnums){
        let front = intnums[intnums.length-2], end = intnums[intnums.length-1];
        if (front > end) {
            return [300];//龙
        }
        if (front < end) {
            return [302];//虎
        }
        return [301];//和
    }

    isBetWinning(betType, result){
        for (const note of result) {
            if (note == betType) {
                return true;
            }
        }
        return false;
    }
}

module.exports = LongHuBattle;