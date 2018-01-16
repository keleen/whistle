var net = require('net'); //提供异步的网络 API 接口可以创建基于流式的 tcp 或 ip 的协议的服务端或客户端
var tls = require('tls'); // TLS 模块提供了基于 OpenSSL 构建的传输层安全性和安全套接子层协议的实现
var res = require('http').OutgoingMessage.prototype; // node 文档中没有关于 outgingMessage 的描述，貌似是关于 http 消息头的处理或者描述

var ver = process.version.substring(1).split('.');  // 获取当前 NodeJS 版本号，并用 '.' 分割开来
var setHeader = res.setHeader;  //调用 http 请求中设置消息头的方法

//重写 res 中关于 setHeader 的方法
res.setHeader = function(field, val){
  try {
    return setHeader.call(this, field, val);
  } catch(e) {}
};

//兼容性处理，如有版本是 7.7 一上的，
if (ver[0] >= 7 && ver[1] >= 7) {
  var connect = net.Socket.prototype.connect;
  if (typeof connect === 'function') {
    //fix: Node v7.7.0+引入的 `"listener" argument must be a function` 问题
    net.Socket.prototype.connect = function(options, cb) {
      if (options && typeof options === 'object' && typeof cb !== 'function') {
        return connect.call(this, options, null);
      }
      return connect.apply(this, arguments);
    };
  }
}

//see: https://github.com/joyent/node/issues/9272
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; //据说百度搜索结构，此处的是为了让 nodeJS 不认证 https 的证书的，可能表达有误
if (typeof tls.checkServerIdentity == 'function') {
  var checkServerIdentity = tls.checkServerIdentity;
  tls.checkServerIdentity = function() {
    try {
      return checkServerIdentity.apply(this, arguments);
    } catch(err) {
      return err;
    }
  };
}

/**
 * 判断是否为一个字符串
 * @param {*} s 
 */
function isPipeName(s) {
  return typeof s === 'string' && toNumber(s) === false;
}
/**
 * 判断是否为一个整整数
 * @param {*} x 
 */
function toNumber(x) {
  return (x = Number(x)) >= 0 ? x : false;
}

if (!net._normalizeConnectArgs) {
  //Returns an array [options] or [options, cb]
  //It is the same as the argument of Socket.prototype.connect().
  net._normalizeConnectArgs = function (args) {
    var options = {};

    if (args[0] !== null && typeof args[0] === 'object') {
      // connect(options, [cb])
      options = args[0];
    } else if (isPipeName(args[0])) {
      // connect(path, [cb]);
      options.path = args[0];
    } else {
      // connect(port, [host], [cb])
      options.port = args[0];
      if (typeof args[1] === 'string') {
        options.host = args[1];
      }
    }

    var cb = args[args.length - 1];
    return typeof cb === 'function' ? [options, cb] : [options];
  };
}

module.exports = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  // 配置默认选项
  require('./lib/config').extend(options);
  //调用 lib 目录下面的 index 服务初始化程序和启动服务
  return require('./lib')(callback);
};
