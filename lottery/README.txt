



首先 npm int

npm install --save-dev babel-cli babel-preset-es2015 rimraf


宕机的保存 ： 
1.用户的新投注() 和 
2.保存每期赢钱的数据，在重新启动的时候，发送已经赢钱的数据给服务中心，还有引出可以查看赢钱的数据


投注邏輯：
1.用戶投注
2.本服務保存投注
3.發送服務中心
4.服务中心返回，更新已经发送该数据
5.開獎,发放奖金 （giveBonus）


使用的数据库：
1.PreBonusOrder  下注订单
2.lotteryrecords 游戏开奖数据记录 （何时开奖）
3.XXXX_receive   返回记录
4.prebonusorders 中奖纪录
5.prepayorders   下注记录

发送服务器中心数据的JOSN格式:
{
	create_time:'',
	event:'',
	token:'',
	dev_key:'',
	data:{ // 放要发送的数据

	}
}



测试服务中心和本服务器的交互数据的准确性：

100个机器人，有三种彩票可投注，每个机器人都投注不同的彩票，定时每一秒投注次数为1次，定时3次，100*3*3=900？？？？
为什么会产生1600条的数据呢？？

目前游戏服务器发送数据全部能收到，这里是正常没有任何情况之下。

