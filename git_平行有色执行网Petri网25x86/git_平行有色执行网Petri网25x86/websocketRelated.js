// var ws
// function getuserinfo(){
//   $.ajax({
//     method:'GET',
//     url:"http:127.0.0.1:8080/",
//     success:function(res){
//       console.log(res)
//     }
//   })
// };
// function WebSocketTest()
// {
//   if ("WebSocket" in window)
//   {
//     // 打开一个 web socket
//     // ws = new WebSocket("ws://169.254.192.79:5501");
//     //ws = new WebSocket("ws://192.168.1.209:5501");
//     ws = new WebSocket("ws://127.0.0.1:5502");
//     console.log("Try  Web Socket")
//     // 连接建立后的回调函数
//     ws.onopen = function()
//     {
//       console.log("Web Socket 已连接上")
//       // Web Socket 已连接上，使用 send() 方法发送数据
//       ws.send("admin:123456");
//       // alert("正在发送：admin:123456");
//     };
//     // 接收到服务器消息后的回调函数
//     // var iii=25;
//     ws.onmessage = function (evt) 
//     { 
//       var received_msg = evt.data;
//       if (received_msg.indexOf("sorry") == -1) {
// 	/*  $.getJSON("Place_1.json",function(data){
// 	    Place_=data ; 
// 	    ws.send(0)
// 	    console.log("there is a new file")
// 	    console.log(Place_) */
// 	if (received_msg.length>=4){
// 	  console.log(received_msg)
// 	  setTimeout(function(){ws.send("hillow c++ ,i am browser")},1000);
// 	}
// 	else{
// 	  console.log(received_msg)
// 	  updata_py(received_msg)
// 	  ws.send("next")
// 	  //  updata_py(received_msg,svg_2,g2,ks2,link2)
// 	}
//       };
//       // 连接关闭后的回调函数
//       ws.onclose = function()
//       { 
// 	console.log("connection has benn closed")
//       };
//     }
//   }
// }

// function success(stream) {
//   //兼容webkit核心浏览器
//   // let CompatibleURL = window.URL || window.webkitURL;
//   //将视频流设置为video元素的源
//   console.log(stream);
//   //video.src = CompatibleURL.createObjectURL(stream);
//   video.srcObject = stream;
//   video.play();
// }
// function error(error) {
//   console.log(`访问用户媒体设备失败${error.name}, ${error.message}`);
// }
