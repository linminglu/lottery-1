const Base = require('./Base.js');

class HongHeiBattle extends Base {
    constructor(code){
        super(code, 5);
    }

    /**
     * 检测豹子
     * @param {number[]} nums 号码组
     * @returns {{front:number}} 返回值为-1，代表不是豹子，反之代表豹子的号码
     */
    static isBaozi(nums){
        let front = nums[0];
        for (let index = 1; index < 3; index++) {
            if (front != nums[index]) {
                return -1;
            }
        } 
        return front;  
    }

    static compareBaozi(front, end){
        let front_baozi = HongHeiBattle.isBaozi(front);
        let end_baozi = HongHeiBattle.isBaozi(end);
        if (front_baozi > end_baozi) {
            return [500,505];
        } else if (front_baozi < end_baozi) {
            return [501,505];
        }
        return null;
    }

    /**
     * 检测顺子
     * @param {number[]} nums 号码组
     * @returns {number} 返回值为-1，代表不是顺子；其他值代表顺子的最小号码
     */
    static isShunzi(nums){
        for (let index = 1; index < 3; index++) {
            if (nums[index] - nums[index-1] != 1) {
                return -1;
            }
        }
        return nums[0]; 
    }

    static compareShunzi(front, end){
        let front_shunzi = HongHeiBattle.isShunzi(front);
        let end_shunzi = HongHeiBattle.isShunzi(end);
        if (front_shunzi > end_shunzi) {
            return [500,504];
        }
        if (front_shunzi < end_shunzi) {
            return [501,504];
        } 
        return null;
    }

    /**
     * 检测对子
     * @param {number[]} nums 号码组
     * @returns {number[]} 那么第一个数字代表对子的号码,如果值为-1，代表不是对子;第二个数字代表剩余的数字
     */
    static isDuizi(nums){
        for (let index = 1; index < 3; index++) {
            if (nums[index] - nums[index-1] == 0) {
                //3个有序的数字中如果有2个相同的，那么不同的数字不是第1个，就是最后1个
                if (index == 1) {
                    return [nums[index],nums[2]];
                } else {
                    return [nums[index],nums[0]];
                }     
            }
        }
        return [-1]; 
    }

    static compareSanCard(front, end){
        let length = front.length;
        for (let index = length-1; index >= 0; index--) {
            if (front[index] > end[index]){
                return [500];
            }else if (front[index] < end[index]){
                return [501];
            }
        }
        return null;
    }

    static compareDuizi(front, end){
        let front_duizi = HongHeiBattle.isDuizi(front);
        let end_duizi = HongHeiBattle.isDuizi(end);
        if (front_duizi[0] == -1 && end_duizi[0] == -1) {
            return null;
        }
        let result = -1;
        if (front_duizi[0] > end_duizi[0]) {
            result = 500;
        }
        if (front_duizi[0] < end_duizi[0]) {
            result = 501;
        }
        //两个对子一样大，比较剩余的牌
        if (front_duizi[1] > end_duizi[1]) {
            result = 500;
        }
        if (front_duizi[1] < end_duizi[1]) {
            result = 501;
        }
        //如果分出了胜负，再看获胜的对子是否不小于7
        if (result == 500) {
            if (front_duizi[0] >= 7) {
                return [500,503];
            }
            return [500];
        }
        if (result == 501) {
            if (end_duizi[0] >= 7) {
                return [501,503];
            }
            return [501];
        }
        return null;
    }

    getLotteryResult(intnums){
        //从小到大的排列顺序
        let frontNums = intnums.slice(0,3).sort();
        let endNums = intnums.slice(-3).sort();
        let result = HongHeiBattle.compareBaozi(frontNums, endNums);
        if (result) {
            return result;
        }
        result = HongHeiBattle.compareShunzi(frontNums, endNums);
        if (result) {
            return result;
        }
        result = HongHeiBattle.compareDuizi(frontNums, endNums);
        if (result) {
            return result;
        }
        result = HongHeiBattle.compareSanCard(frontNums, endNums);
        if (result) {
            return result;
        }
        return null;
    }

    isBetWinning(betType, result){
        if (null == result) {
            return false;
        }
        for (let note of result) {       
            if (betType == 502 && note > 503) {
                return true;
            }else if (note == betType) {
                return true;
            }
        }
        return false;
    }
}

module.exports = HongHeiBattle;