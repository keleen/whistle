var colors = require('colors/safe');

/*eslint no-console: "off"*/
// 启动程序
require('./index')(function() {
  console.log(colors.green('whistle is listening on ' + this.address().port + '.'));
});
