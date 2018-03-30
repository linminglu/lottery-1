var Base = require('./Base.js');

class Niuniu extends Base {
    constructor(code){
        super(code, 1);
    }

    getLotteryResult(code){
        return Niuniu.getNiuniuStyle(code);
    }

    isBetWinning(betType, result){
        for (const note of result) {
            if (note == betType) {
                return true;
            }
        }
        return false;
    }

    static getNiuniuStyle(intnums){
        let lave = 0;     //余数  
        intnums.forEach(num => {
            lave += num;
        });
        //lave为0，说明5个数字都是0
        if (lave === 0) {
            return [110,111,114];
        } 
        let result = [];
        lave %= 10
        let nx = Niuniu.getNiuNumber(intnums, lave);
        if (nx > 0) {
            result.push(nx);
        }

        if (result.length > 0) {
            if (result[0] <= 105) {
                result.push(112);
            } else {
                result.push(111);
            }
            if (result[0]%2 == 0) {
                result.push(114);
            } else {
                result.push(113);
            }
        } else {
            result.push(100);
        }   
        return result;
        
    }

    static getNiuNumber(nums, num){
        var length = nums.length;
        for (var i = 0; i < length - 1; i++) {
            for (var j = i+1; j < length; j++) {
                if ((nums[i] + nums[j])%10 === num) {
                    if (num === 0) {
                        return 110;
                    } else {
                        return 100+num;
                    }
                }   
            }           
        }
        return 0;
    }
}

module.exports = Niuniu;