let Base = require('./Base.js');
const NiuNiu = require('./NiuNiu.js')

class NiuniuBattle extends Base {
    constructor(code){
        super(code, 4);
    }

    getLotteryResult(intnums){
        let front = 0, frontType = 0, end = 0, endTyle = 0;
        intnums.forEach((num,index) => {
            if (index < 5) {
                front += num;
            } else {
                end += num;
            }
        });
        frontType = NiuNiu.getNiuNumber(intnums.slice(0,5), front%10);
        endTyle = NiuNiu.getNiuNumber(intnums.slice(5), end%10);
        if (frontType == endTyle) {
            return [401];
        }
        if (frontType > endTyle) {
            return [400];
        } else {
            return [402];
        }
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

module.exports = NiuniuBattle;