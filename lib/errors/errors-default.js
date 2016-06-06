module.exports = {
  CUSTOM               : {errno: -1, errText: "%s"},
  SYSTEM_ERROR         : {errno: -10, errText: "系统错误"},
  BAD_REQUEST          : {errno: -400, errText: "错误的 http 请求"},
  NOT_FOUND            : {errno: -404, errText: "您请求的 http 资源没有找到"},
  INTERNAL_SERVER_ERROR: {errno: -500, errText: "内部服务器错误"},

  WHAT_REQUIRE           : {errno: -1001, errText: "缺少参数 %s"},
  WHAT_WRONG_RANGE       : {errno: -1002, errText: "%s 的取值范围错误。最小 %s，最大 %s"},
  WHAT_WRONG_FORMAT      : {errno: -1003, errText: "%s 格式不正确。"},
  WHAT_NOT_SAME          : {errno: -1004, errText: "输入的 %s 值不一致。"},
  WHAT_NOT_EXISTS        : {errno: -1005, errText: "%s 不存在。"},
  WHAT_TOO_MUCH          : {errno: -1006, errText: "%s 太多了。"},
  WHAT_TOO_LITTLE        : {errno: -1007, errText: "%s 太少了。"},
  WHAT_NOT_BELONGS_TO_YOU: {errno: -1008, errText: "%s 不属于你。"},
  WHAT_TOO_LONG          : {errno: -1009, errText: "%s 太长了，请不要超过 %s。"},
  WHAT_TOO_SHORT         : {errno: -1010, errText: "%s 太短了，请不要少于 %s。"},
  WHAT_EXISTED           : {errno: -1011, errText: "%s 已经存在。"},
  WHAT_OCCUPIED          : {errno: -1012, errText: "%s 被占用。"},
  WHAT_TIMEOUT           : {errno: -1013, errText: "%s 已超时。"},
  WHAT_EXPIRED           : {errno: -1014, errText: "%s 已过期。"},
  WHAT_ILLEGAL           : {errno: -1015, errText: "%s 不合法。"},
  WHAT_NOT_FOUND         : {errno: -1016, errText: "%s 没找到。"},
  WHAT_WRONG_LENGTH_RANGE: {errno: -1017, errText: "%s 的长度错误，最短是 %s，最长 %s。"},
  WHAT_WRONG_TYPE        : {errno: -1018, errText: "%s 的类型错误"},


  ACCESS_TOKEN_NOT_FOUND: {errno: -2001, errText: "access_token 不存在。"},
  ACCESS_TOKEN_EXPIRED  : {errno: -2002, errText: "access_token 已经过期。"},

  TICKET_EXPIRED      : {errno: -2050, errText: "票据已经过期，请重新获取。"},
  TICKET_VERIFY_FAILED: {errno: -2051, errText: "票据校验失败。篡改登录信息是违法行为！"},
  TICKET_ILLEGAL      : {errno: -2052, errText: "非法票据。篡改登录信息是违法行为！"},
  SIGN_VERIFY_FAILED  : {errno: -2053, errText: "签名验证失败。"},

  PASSWORD_NOT_STRONG  : {errno: -3001, errText: "密码太简单。%s"},
  CHINA_MOBILE_ILLEGAL : {errno: -3002, errText: "不正确的手机号码。"},
  EMAIL_ILLEGAL        : {errno: -3003, errText: "不正确的Email。"},
  CAPTCHA_VALIDATE_FAIL: {errno: -3004, errText: "验证码校验失败。"},
  PASSPORT_ILLEGAL     : {errno: -3005, errText: "不正确的登录凭据，必须是手机或者 Email。"},
  MEMBER_ONLY          : {errno: -3006, errText: "您还没有登录，请登录。"},
  NO_RIGHTS            : {errno: -3007, errText: "您没有权限。"},

  LOGIN_ERROR                  : {errno: -3050, errText: '登录失败'},
  LOGIN_ERROR_BECAUSE          : {errno: -3051, errText: "登录失败。%s"},
  MEMBER_NOT_EXISTS            : {errno: -3052, errText: "用户不存在。"},
  MEMBER_NOT_APPROVED          : {errno: -3053, errText: "尚未审批通过，请耐心等待。"},
  MEMBER_FORBIDDEN             : {errno: -3054, errText: "您已经被系统禁止。"},
  MEMBER_LOGIN_TOO_MUCH_FAILURE: {errno: -3055, errText: "您登录失败的次数太多。暂时被系统锁定"},
  IP_LOGIN_TOO_MUCH            : {errno: -3056, errText: "您登录失败的次数太多。暴力破解他人密码是违法行为！"},


};