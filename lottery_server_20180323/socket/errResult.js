// socket错误的结果返回

module.exports = {

	'suc':'ok'


	"login_err":10001, // "登陆失败",
	"relogin_err":10002, // "已经在游戏中，不能重复登陆!",

	"bet_err":20001, //"投注失败",
	"bet_stop_err":20002, //"本期投注已截至",
	"bet_type_err":20003, //"未选择投注类型",
	"bet_data_err":20004, //"投注的数据不合法",
	"bet_data_no_ength_money":20005, //"资金不足",

	"auto_betting_err":30001, //"挂机失败",
	"auto_rebetting_err":30002, //"挂机失败,不能重复挂机",
	"auto_betting_no_bet_err":30003, //"挂机失败,本期未投注",

	"cancel_auto_err":40001, //"取消挂机失败",
	"cancel_auto_betting_player_no_exist_err":40002, //"取消失败,用户不存在",

	"exit_err":50001, //"退出游戏失败"
}