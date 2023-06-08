var svg_1, g1, link, places, transitions;
var Place_r = 20 //定义库所的半径尺寸
var trans_w = 8  //定义变迁的宽度
var trans_h = 40 //定义变迁的高度
var temp_count = 0;
var marksize = 40;
var place_json = []; var transition_json = []; var links_json = []; var simulationIsEnable = true; var delays_json = [];//定义数组变量用来保存json文件中读取的数据
var position_json = []; var distance_row = 150; var distance_col = 100; var token_v = 200;
var translate = "translate(" + (500) + "," + (500) + ")" + "scale(1)"
var nodeToFreeze = [] //保存需要固定的库所的数组
var tk_r = 3;
var currentState = [];
var delay_time = 1;


//var host_base = "http://10.8.14.125:8082"
//var host_base = "http://g281w67326.qicp.vip"
var host_base = "http://127.0.0.1:8080"

//****************************************读取位置json文件**************************************
$.getJSON("position.json", function (data) {
  position_json = data;
  console.log('position_json', position_json)
});
//****************************************读取库所赋时信息**************************************
$.getJSON("Delays.json", function (data) {
  delays_json = data;
  console.log('delays_json', delays_json)
});
//****************************************读取petri网连接信息***********************************
$.getJSON("links.json", function (data) {
  links_json = data;
  console.log('links_json', links_json)
  // nodeToFreeze_file = getDictValueExceedThreshold(countDictValueInDictArray(links_json))
  // console.log(7777, nodeToFreeze_file)
});
//****************************************读取变迁信息******************************************
$.getJSON("transitions.json", function (data) {
  transition_json = data;
  console.log('transition_json', transition_json);
});
//****************************************读取库所信息******************************************
$.getJSON("places.json", function (data) {
  place_json = data;
  console.log('place_json', place_json)
  // console.log('1111', place_json[0].mark)
});
//****************************************设置启动主函数的等待时间********************************
setTimeout(function () {
  // alert("iiii");
  main();
}, 500); //500为等待时间
//****************************************主函数*************************************************
function main() {
  nodes = place_json.concat(transition_json);
  console.log('nodes', nodes)
  num_places = place_json.length;//求变迁和库所的数量
  num_transitions = transition_json.length;
  drag = d3.drag().on("start", started).on("drag", dragged).on("end", ended);
  createSVG();//创建矢量图
  adaptlinks(links_json, nodes);//连接节点
  createLayout();//创建演化过程

  start(svg_1, transitions, link, links_json);
  update(svg_1, g1);
  nodesAssociate(places, transitions, links_json)
  get_data();
  setTimeout(stopsimulation, 3000)
  // 注册按钮的事件
  d3.select("#button1").on("click", add_transition);
  d3.select("#button").on("click", add_place);
  WebSocketTest();
}

//****************************************寻找新增的节点******************************************
function findAddedNode(nodes, nodeId) {
  for (i = 0; i < nodes.length; i++) {
    if (nodes[i].id == nodeId) {
      return nodeId
    }
  }
  return false
};
//****************************************创建可缩放矢量图****************************************
function createSVG() {
  var width_1 = 3000; //创建画布，画布的宽度和高度
  var height_1 = 1500;
  svg_1 = d3.select("body").append("svg")
    .attr("width", width_1)
    .attr("height", height_1);
  svg_1.call(d3.zoom()
    .scaleExtent([0.1, 10]) //设置缩放比例
    .on("zoom", zoomed));
  //svg_2 = d3.select("body").append("svg")
  //  .attr("width", width_1)
  //  .attr("height", height_1);
  defs = svg_1.append("defs");
  createdefs(defs);
  function createdefs(defs) {
    arrowMarker = defs.append("marker") //这个表示指的是箭头
      .attr("id", "arrow") //标识的id号
      .attr("markerUnits", "strokeWidth") //	标识大小的基准，有两个值：strokeWidth（线的宽度）和userSpaceOnUse（图形最前端的大小）
      .attr("markerWidth", "40") //标识的大小  设置箭头的大小
      .attr("markerHeight", "40") //标识的大小
      .attr("viewBox", "0 0 12 12") //坐标系的区域
      .attr("refX", "6") //在 viewBox 内的基准点，绘制时此点在直线端点上（要注意大小写）
      .attr("refY", "5")
      .attr("orient", "auto"); //绘制方向，可设定为：auto（自动确认方向）和 角度值
    arrowMarker_green = defs.append("marker") //下面是不同颜色的箭头
      .attr("id", "arrow_green")
      .attr("markerUnits", "strokeWidth")
      .attr("markerWidth", "40")
      .attr("markerHeight", "40")
      .attr("viewBox", "0 0 12 12")
      .attr("refX", "6")
      .attr("refY", "5")
      .attr("orient", "auto");
    arrowMarker_red = defs.append("marker")
      .attr("id", "arrow_red")
      .attr("markerUnits", "strokeWidth")
      .attr("markerWidth", "40")
      .attr("markerHeight", "40")
      .attr("viewBox", "0 0 12 12")
      .attr("refX", "6")
      .attr("refY", "5")
      .attr("orient", "auto");
    var arrow_path = "M2,2 L10,5 L2,8 L6,5 L2,2"; //定义箭头形状
    arrowMarker.append("path")
      .attr("d", arrow_path)
      .attr("fill", "black");
    arrowMarker_green.append("path")
      .attr("d", arrow_path)
      .attr("fill", "green");
    arrowMarker_red.append("path")
      .attr("d", arrow_path)
      .attr("fill", "red");
  }
}
//****************************************创建网页布局，演化激发规则*******************************
function createLayout(){
  var low_op=1;//设置透明度  低
  var high_op=1;//设置透明度  高
  simulation=d3.forceSimulation(nodes);
  //console.log("i get ")
  simulation.force("charge", d3.forceManyBody().strength(-500)) //充电
    .force("link", d3.forceLink().links(links_json).id(function (d) { return d.id }).distance(200))
    .force("collide", d3.forceCollide(50))
    //.force(""
    .on("tick", tick);
  //var zoom=d3.zoom().scaleExtent([0.1,10])
  //.on("zoom",function(d){d3.select(this).attr("transform","translate(" + d3.event.translate +")"+"scale("+d3.event.scale+")")})
  //************设置画布，线条等部分的属性***** */
  g1 = svg_1.append("g")
    .attr("transform", translate);

  link = g1.selectAll("line").data(links_json).enter().append("line") //设置连接线的属性
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("sour", function (d, i) { return d.sour })
    .attr("end", function (d, i) { return d.end }).attr("marker-end", "url(#arrow)")
    .style("opacity",1)
    .on("mouseover", function(){
      d3.select(this).style("opacity",low_op);
    })
    .on("mouseout", function(){
      d3.select(this).style("opacity",high_op);
    });
  places = g1.selectAll("circle").data(place_json).enter().append("circle") //设置库所属性
    .attr("class", "circle")
    .attr("id", function (d) { return d.id })
    .attr("r", Place_r)
    .attr("fill", "white")
    .attr("stroke-width", 1.5)
    .attr("mark", function (d, i) { return d.mark })
    .attr("stroke", "black")
    .call(drag)
    .on("mouseover", function(d){
      var id = d3.select(this).attr("id");
      d3.selectAll("line").filter(function(d){return d.sour==id||d.end==id}).style("opacity",1);
      d3.select("#meaning_of_place").text(d.meaning);
    })
    .on("mouseout", function(){
      var id = d3.select(this).attr("id");
      d3.selectAll("line").filter(function(d){return d.sour==id||d.end==id}).style("opacity",low_op);
    })
    ;
;
  //console.log(places);
  transitions = g1.selectAll("rect").data(transition_json).enter().append("rect") //设置变迁属性
    .attr("id", function (d) { return d.id })
    .attr("fill", "white")
    .attr("stroke-width", 1.5)
    .attr("stroke", "black")
    .attr("width", trans_w)
    .attr("height", trans_h)
    .call(drag)
    .on("mouseover", function(){
      var id = d3.select(this).attr("id");
      d3.selectAll("line").filter(function(d){return d.sour==id||d.end==id}).style("opacity",1);
    })
    .on("mouseout", function(){
      var id = d3.select(this).attr("id");
      d3.selectAll("line").filter(function(d){return d.sour==id||d.end==id}).style("opacity",low_op);
    })
    ;
  txt = g1.selectAll("text").data(nodes).enter().append("text") //设置属性名的文本属性
    .attr("x", function (d) { return d.x })
    .attr("y", function (d) { return d.y + 20 }).text(function (d) { return d.id })
  //点击开始演化
  transitions.on("click", evolution_function) //点击变迁激发函数
  //transitions.on("mousemove",function(){console.log("来了宝贝")});
  start(svg_1, transitions, link, links_json); //激发过程的动画演示
  /******为了完善箭头做的努力*****/
  node = place_json.concat(transition_json)
  adaptlinks(links_json, nodes); //连接节点
  for (var i = 0; i < links_json.length; i++) { //判断end是不是变迁，有没有激发的能力
    for (var j = 0; j < transition_json.length; j++) {
      if (links_json[i].end == transition_json[j].id) {
        links_json[i].isEnabled_transition = true;
        break;
      }
    }
    if (links_json[i].isEnabled_transition != true)
      links_json[i].isEnabled_transition = false;
  }
  /**************************/
  // 设置d3缩放的初始值与svg中g1的缩放初始值同步
  zoomParameter = translate.split(/[(),]/)
  zoom_x = parseFloat(zoomParameter[1])
  zoom_y = parseFloat(zoomParameter[2])
  zoom_k = parseFloat(zoomParameter[4])
  svg_1.call(d3.zoom().transform, d3.zoomIdentity.translate(zoom_x,zoom_y).scale(zoom_k))
}
function evolution_function(d) {
  console.log("click");           //console.log()用于输出普通信息
  var cursorId = d3.select(this).attr("id");        //cursorId是游标
  var xymid = [];//变迁当前的位置用于token移动
  xymid.push({
    "cx": d3.select(this).attr("x"),
    "cy": d3.select(this).attr("y")
  });   //变迁的位置，用xy轴表示

  console.log(cursorId)
  var input_places = links_json.filter((item, index) => {
    return item.end == cursorId //终点为此变迁的为input_place
  }).map(item => item.sour, this);
  console.log(input_places, 'input_place')
  var ouput_places = links_json.filter((item, index) => {
    return item.sour == cursorId
  }).map(item => item.end, this);
  console.log(ouput_places, '输出库所')

  var d3_input_places_set = d3.selectAll("circle").filter(function (node, index) {
    // d3会将有token的库所单独生成一个circle，这种circle没id，要过滤掉 —— liuwei
    for (i in  input_places){
        if (node.id == input_places[i]){
          return d3.select(this).attr("id") === node.id
        }     
    } 
  })  
  // console.log('d3上的input_place集',d3_input_places_set)
  var no_token_input_places = d3_input_places_set.filter(function (node, index) {    
    // console.log("无标识",d3.select(this).attr("mark"))
    return parseInt(d3.select(this).attr("mark")) < 1 // node的mark不更新，所以只能再次select
  })["_groups"][0]
  console.log(no_token_input_places, '无标识输出库所')

  // console.log("waiting")
  //delays(3000)
  // console.log('waited')
  if (no_token_input_places.length < 1) {//变迁是否激发
    TK_Move(input_places, xymid, ouput_places, svg_1, g1, places); //计算托肯移动位置
    console.log("激发+1")

    fire_transition(input_places, ouput_places) //对激发的变迁前后库所进行处理



    // 更改线颜色
    var temp_link = g1.selectAll("line").filter(function (d, i) {
      return d3.select(this).attr("sour") == cursorId
    })
    temp_link.attr("stroke", "red")
      .attr("marker-end", "url(#arrow_red)");
    // 颜色恢复
    var go_normal = function (temp_link) {
      temp_link.attr("stroke", "black")
        .attr("marker-end", "url(#arrow)");
    }
    setTimeout(go_normal, delay_time, temp_link);
    start(svg_1, transitions, link, links_json);
    update(svg_1, g1);
  }
  setTimeout(function(){    
     start(svg_1, transitions, link, links_json);
    update(svg_1, g1); }, token_v*2);
  //setTimeout(start,delay_time,svg_1,transitions,link,links_json);//与动画同步，延迟两s执行start
  //setTimeout(update,delay_time,svg_1,g1)
  // else {
  //   console.log('无可激发变迁')
  // }
}
function delays(_ms) {
  var start = (new Date()).getTime();
  while((new Date()).getTime() - start < _ms) {
      continue;
  }
}
function fire_transition(input_places, ouput_places) {
  // 本函数将改变DOM树
  for (w = 0; w < input_places.length; w++) {
    //若激发，则每个终点是this的connection的起点对应的库所mark值减一
    var markerToChangeNode = svg_1.selectAll("circle").filter(function (d, i) {
      return d3.select(this).attr("id") == input_places[w]
    })
    markerToChangeNode.attr("mark", parseInt(markerToChangeNode.attr("mark")) - 1)
  }
  setTimeout(function(){  
     for (w1 = 0; w1 < ouput_places.length; w1++) {
    //若激发，则每个connection的终点库所对应的mark加一
    var markerToChangeNode = svg_1.selectAll("circle").filter(function (d, i) {
      return d3.select(this).attr("id") == ouput_places[w1]
    })
    markerToChangeNode.attr("mark",  parseInt(markerToChangeNode.attr("mark")) + 1)
  } }, token_v * 2);
}
//****************************************记录并开始拖拽******************************************
function started(d) {
  console.log("开始拖拽")
  if (simulationIsEnable) {
    simulation.alphaTarget(.2).restart()
  }
  d.fx = d.x
  // fx fy 表示下次节点被固定的位置
  // 每次tick结束node.x都会被设置为node.fx，node.vx设置为0
  d.fy = d.y
}
//****************************************拖拽过程************************************************
function dragged(d) {
  if (simulationIsEnable) {
    d.fx = d3.event.x
    d.fy = d3.event.y
  }
  else {
    d.x = d3.event.x
    d.y = d3.event.y
    tick();
  }
}
//****************************************拖拽结束************************************************
function ended(d) {
  if (!d3.event.active) {
    // 设置为0直接停止，如果大于alphaMin则会逐渐停止
    simulation.alphaTarget(0)
  }
  d.fx = null
  d.fy = null
}
//****************************************连接节点************************************************
function adaptlinks(links_json, nodes) {
  for (i = 0; i < links_json.length; i++) {
    temp_s = links_json[i].sour; temp_t = links_json[i].end;
    // console.log(temp_s)
    for (j = 0; j < nodes.length; j++) { //判断相同的节点连接起来
      if (temp_s == nodes[j].id) {
        links_json[i].source = nodes[j]
      }
      if (temp_t == nodes[j].id) {
        links_json[i].target = nodes[j] //给links_json文件中的source和target赋值
      }
    }
  }
}
//****************************************固定热点库所********************************************
function freezeNode(position_json){
  for (i = 0; i < position_json.length; i ++) {//读取要固定的库所的个数和信息

    // console.log(position_json[i].id)
    svg_1.selectAll("circle")
      .filter(function (d) {
        return d3.select(this).attr("id") == position_json[i].id
      })
      .each(function (d) {
        d.fx = position_json[i].x * distance_col, d.fy = position_json[i].y * distance_row
      })
  }
  for (i = 0; i < position_json.length; i ++) {//读取要固定的变迁的个数和信息
    // console.log(position_json[i].id)
    svg_1.selectAll("rect")
      .filter(function (d) {
        return d3.select(this).attr("id") == position_json[i].id
      })
      .each(function (d) {
        d.fx = position_json[i].x * distance_col, d.fy = position_json[i].y * distance_row
      })
  }
}
function tick() {

  freezeNode(position_json)

  // nodeToFreeze = Object.keys(nodeToFreeze_file[0])
  // 固定几个热点库所
  // for (i = 0; i < nodeToFreeze.length; i ++) {//读取要固定的库所的个数和信息
  //   console.log(nodeToFreeze[i].id)
  //   svg_1.selectAll("circle")
  //     .filter(function (d) {
  //       return d3.select(this).attr("id") == nodeToFreeze[i]
  //     })
  //     .each(function (d) {
  //       d.fx = -200 * i, d.fy = 200
  //     })
  // }
  m_tick(svg_1, g1, link, transitions, places, txt);
}
//****************************************计算库所属性和画图细节***********************************
function m_tick(svg_1, g1, link, transitions, places, txt) {
  var remo = svg_1.selectAll("circle").filter(function (d, i) {
    return d3.select(this).attr("class") == "node"
  });
  //remo.remove();
  token = [];
  var node = [];
  var nodesNum = 0;//每个库所内的托肯个数
  txt.attr("x", function (d) { return d.x - 10 })
    .attr("y", function (d) { return d.y - 30 }).style("font-size", "200%");
  link.attr("x1", function (d, i) {
    //var sita=Math.atan((d.target.y-d.source.y)/(d.target.x-d.source.x))
    //if(d.target.x>d.source.x)
    //{return d.source.x+13*Math.cos(sita)}
    //else{return d.source.x-13*Math.cos(sita)}}
    return d.source.x;
  }
  )
    .attr("y1", function (d, i) {
      //var sita=Math.atan((d.target.y-d.source.y)/(d.target.x-d.source.x))
      //if(d.target.x>d.source.x)
      // {
      //  return d.source.y+13*Math.sin(sita)
      // }
      // else
      // {
      //  return d.source.y-13*Math.sin(sita)\}
      return d.source.y;
    })
    .attr("x2", function (d, i) {
      var sita = Math.atan((d.target.y - d.source.y) / (d.target.x - d.source.x))
      if (d.target.x > d.source.x) {
        if (d.isEnabled_transition == false)
          return d.target.x - 30 * Math.cos(sita)
        else if (d.isEnabled_transition == true && (sita > Math.atan(2) || sita < Math.atan(-2)))
          return d.target.x - 30 * Math.cos(sita)
        else
          return d.target.x - 14
      }
      else {
        if (d.isEnabled_transition == true && (sita > Math.atan(2) || sita < Math.atan(-2)))
          return d.target.x + 30 * Math.cos(sita)
        else if (d.isEnabled_transition == false)
          return d.target.x + 30 * Math.cos(sita)
        else
          return d.target.x + 14
      }
    })
    .attr("y2", function (d, i) {
      var sita = Math.atan((d.target.y - d.source.y) / (d.target.x - d.source.x))
      if (d.target.x > d.source.x) {
        if (d.isEnabled_transition == true && sita > Math.atan(2))
          return d.target.y - 30;
        else if (d.isEnabled_transition == true && sita < Math.atan(-2))
          return d.target.y + 30;
        else
          return d.target.y - 30 * Math.sin(sita)
      }
      else {
        if (d.isEnabled_transition == true && sita > Math.atan(2))
          return d.target.y + 30;
        else if (d.isEnabled_transition == true && sita < Math.atan(-2))
          return d.target.y - 30;
        else
          return d.target.y + 30 * Math.sin(sita)
      }
    })
  places.attr("cx", function (d) { return d.x }) //库所的位置
    .attr("cy", function (d) { return d.y });
  places.each(function (d, i) {
    nodesNum = Number(d3.select(this).attr("mark"));
    if (nodesNum > 0) {
      var pp = 0;
      for (i = 0; i < d3.select(this).attr("mark"); i++) {
        var cx1 = Number(d3.select(this).attr("cx")) + 5 * Math.cos(pp * 2 * Math.PI / nodesNum)
        var cy1 = Number(d3.select(this).attr("cy")) + 5 * Math.sin(pp * 2 * Math.PI / nodesNum)
        pp++;
        if (Number(d3.select(this).attr("mark")) > 1) {
          token.push({ cx: cx1, cy: cy1, r: 3 })
        }
        if (Number(d3.select(this).attr("mark")) == 1) {
          token.push({
            cx: Number(d3.select(this).attr("cx")), cy: Number(d3.select(this).attr("cy")), r: 3
          })
        }
      }
    }
  });
  remo.data(token) //托肯的位置
    .attr("class", "node")
    .attr("cx", function (d) { return d.cx; })
    .attr("cy", function (d) { return d.cy; })
    .attr("r", function (d) { return d.r; })
    //.style("visibility","hidden")
    ;
  transitions.attr("x", function (d, i) { return d.x - 4 }) //变迁的位置
    .attr("y", function (d) { return d.y - 20 })//herherherherherherherhehrehrehrherhe
  //transitions.attr("x",function(d,i){return locationoftransitions[2*i]-2}).attr("y",function(d,i){return locationoftransitions[2*i+1]-10})
  /*transitions.each(function(d,i){ 
    var theId=d3.select(this).attr("id")
       var a=0;var b=0;
       a=Number (d3.select(this).attr("x"))+2;
       b=Number(d3.select(this).attr("y"))+10;
      var angle=slope(theId);
// var angle=slope(theId)
//console.log(slope(theId))
     d3.select(this).attr("transform","rotate("+angle+","+a+","+b+")")
     })*/
}
//****************************************计算箭头连接线的倾斜角度*********************************
function slope(transition_Name) {
  var ki = [];//保存正弦值的数组
  g1.selectAll("line")
    .filter(function (d, i) { return d3.select(this).attr("sour") == transition_Name })//起点为变迁的连接线
    .each(function (d, i) {
      var x1 = d3.select(this).attr("x1");
      var x2 = d3.select(this).attr("x2");
      var y1 = d3.select(this).attr("y1");
      var y2 = d3.select(this).attr("y2");
      var k = (y1 - y2) / (x1 - x2);//计算正弦值
      ki.push(k)
    })
  g1.selectAll("line")
    .filter(function (d, i) { return d3.select(this).attr("end") == transition_Name })//终点为变迁的连接线
    .each(function (d, i) {
      var x1 = d3.select(this).attr("x1");
      var x2 = d3.select(this).attr("x2");
      var y1 = d3.select(this).attr("y1");
      var y2 = d3.select(this).attr("y2");
      var k = (y1 - y2) / (x1 - x2);//计算正弦值
      ki.push(k)
    })
  var k_transition = 0;
  for (i = 0; i < ki.length; i++) {
    k_transition = k_transition + Math.atan(Number(ki[i])) * 180 / Math.PI;//Number() 函数将对象参数转换为表示对象值的数字，将正弦值转化成角度
  }
  k_transition = k_transition / ki.length;//计算平均角度
  return k_transition;
}
//****************变迁的事件监听器*********产生随机数，50%概率为1***********************************
function rand01() {
  // 掷硬币函数，50%的概率返回0，50%的概率返回1
  var a = Math.floor(10 * Math.random());//Math.floor()是下舍取整函数
  var b = (a > 5) ? 0 : 1;
  return b;
};
function update(svg_1, g1) {
  var token = [];
  var nodesNum = 0;
  var remo = svg_1.selectAll("circle").filter(function (d, i) {
    return d3.select(this).attr("class") == "node" //this代表当前变量，选择有属性node的变量
  });
  remo.remove();
  // console.log(g1)
  g1.selectAll("circle").filter(function (d, i) {
      return d3.select(this).attr("r") >= 2
  }).each(function (d, i) {
    nodesNum = Number(d3.select(this).attr("mark"));
    //console.log(d3.select(this).attr("id")+""+d3.select(this).attr("cx"))
    // 计算托肯的半径，以便绘制在库所中
    if (nodesNum > 0) {
      var pp = 0;
      for (i = 0; i < d3.select(this).attr("mark"); i++) {
        pp++;
        var cx1 = Number(d3.select(this).attr("cx")) + 5 * Math.cos(pp * 2 * Math.PI / nodesNum)
        var cy1 = Number(d3.select(this).attr("cy")) + 5 * Math.sin(pp * 2 * Math.PI / nodesNum)
        if (Number(d3.select(this).attr("mark")) > 1) {
          token.push({ cx: cx1, cy: cy1, r: tk_r })
        }
        if (Number(d3.select(this).attr("mark")) == 1) {
          token.push({
            cx: Number(d3.select(this).attr("cx")), cy: Number(d3.select(this).attr("cy")), r: tk_r
          })
        }
      }
    }
  });
  //console.log(token)
  g1. selectAll("#node").data(token)
    .enter().append("circle")
    .attr("class", "node")
    .attr("cx", function (d) { return d.cx; })
    .attr("cy", function (d) { return d.cy; })
    .attr("r", tk_r);
  g1.selectAll("#node").data(token).exit().remove();
  var marks = new Array;
  places.each(function (d, i) { marks.push(d3.select(this).attr("mark")) });
  currentState.push(marks)
  //console.log(currentState)
}
//****************************************更新变迁状态********************************************
function update_transition() {
  simulation.nodes(nodes);
  simulation.force("link", d3.forceLink().links(links_json).id(function (d) { return d.id }).distance(20))
  simulation.alpha(1).restart();
  /* console.log(nodes)
console.log(place_json)
console.log(transition_json) */
  link = g1.selectAll("line").data(links_json).enter().append("line")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("sour", function (d, i) { return d.sour })
    .attr("end", function (d, i) { return d.end }).merge(link);
  places = g1.selectAll("circle").data(place_json).enter().append("circle")
    .attr("id", function (d) { return d.id })
    .attr("r", Place_r)
    .attr("fill", "white")
    .attr("stroke-width", 1.5)
    .attr("stroke", "black").merge(places).call(drag)
    .attr("class", d => {
      if (d.category == "fixed") {
        return "fixedNode";
      } else {
        return "unfixedNode"
      }
    })
    ;
  transitions.remove();
  transitions = g1.selectAll("rect").data(transition_json).enter().append("rect")
    .attr("id", function (d) { return d.id })
    .attr("fill", "white")
    .attr("stroke-width", 1)
    .attr("stroke", "black")
    .attr("width", trans_w)
    .attr("height", trans_h)
    .merge(transitions)
    .on("click", function (d) {
      console.log("点击+1")
      var cursorId = d3.select(this).attr("id");
      var v = 0;
      var temp = [];//连接this变迁的input_place的id
      var temp_1 = [];
      var c = 0;
      //var m=[];//找出所有终点为cursorId的箭头
      var n = 0;
      for (u = 0; u < links_json.length; u++) {
        if (links_json[u].end == cursorId) {
          temp[v] = links_json[u].sour;
          //alert("nothing");
          //console.log(d3.selectAll("circle").filter(function(d,i){return d.id=temp[v]}).attr("mark")+temp[v])
          if (d3.selectAll("circle").filter(function (d, i) {
            return d3.select(this).attr("id") == temp[v]
          })
            .attr("mark") >= 1) {//判断是否输入变迁的库所mart都大于等于1
            n++;
          }
          v++;
        }
        if (links_json[u].sour == cursorId) {
          temp_1[c] = links_json[u].end;//temp_1中为this变迁输出指向的所有库所的id
          c++;
        }
      }
      var o = rand01();
      if (n == v) {//变迁是否激发
        console.log("激发+1")

        fire_transition(temp, temp_1)

        console.log(cursorId)
        var temp_link = g1.selectAll("line").filter(function (d, i) {
          return d3.select(this).attr("sour") == cursorId
        })
        temp_link.transition().duration(100)
          .attr("stroke", "red").transition().duration(4000)
          .attr("stroke", "black");
        temp_link.transition().duration(100)
          .attr("stroke-width", 10)
          .transition().duration(1500)
          .attr("stroke-width", 1);
        //temp_link.attr("stroke-width","1").transition().duratin(1000).attr("stroke-width","4").transition().duration(1000).attr("stroke-width","1")
        //temp_link.style("stroke","black").transition().duration(1000).style("stroke","red").transition().duration(1000).style("stroke","black")
        //temp_link.style("stroke-width","1").transition().duration(1000).style("stroke-width","4").transition().duration(1000).style("stroke-width","1")
        //console.log(d3.select("#p8").attr("mark"))
      }
      start(svg_1, transitions, link, links_json);
      update(svg_1, g1);
    })
    .call(drag);
  txt = g1.selectAll("text").data(nodes).enter().append("text")
    .attr("x", function (d) { return d.x + 5 })
    .attr("y", function (d) { return d.y - 5 })
    .text(function (d) { return d.id })
    .merge(txt);
  start(svg_1, transitions, link, links_json);
  //start(svg_2, transition2, link2, links_json)
}
//****************************************更新库所状态********************************************
function update_place() {
  simulation.nodes(nodes);
  simulation.force("link", d3.forceLink().links(links_json).id(function (d) { return d.id }).distance(20))
  simulation.alpha(1).restart();
  /* console.log(nodes)
console.log(place_json)
console.log(transition_json) */
  link = g1.selectAll("line").data(links_json).enter().append("line")
    .attr("stroke", "black")
    .attr("stroke-width", 1).merge(link);
  //places.remove();
  places = places.data(place_json).enter().append("circle")
    .attr("id", function (d) { return d.id })
    .attr("r", 10)
    .attr("fill", "white")
    .attr("stroke-width", 1.5)
    .attr("mark", function (d, i) { return d.mark })
    .attr("stroke", "black").merge(places).call(drag);
  /* var ppp=(place_json[22])
console.log(ppp)
g1.insert("circle",".node")
.data(ppp)
.attr("id",function(d){return d.name})
.attr("r",10).attr("fill","yellow").attr("stroke-width",1.5)
.attr("stroke","yellow").call(drag);
*/
  txt.remove();
  txt = g1.selectAll("text").data(nodes).enter().append("text")
    .attr("x", function (d) { return d.x + 5 })
    .attr("y", function (d) { return d.y - 5 })
    .text(function (d) { return d.id })
    .merge(txt);
  start(svg_1, transitions, link, links_json);
  console.log(links_json)
}
//****************************************petri网的缩放*******************************************
function zoomed() {
  // 无法获得缩放后的translate值
  // console.log(d3.event.transform)
  g1.attr("transform", d3.event.transform);
}
//****************************************激发过程动画演示*****************************************
function start(svg_1, transitions, link, links_json) {
  svg_1.selectAll("rect").each(function (d, i) {
    var nowId = d3.select(this).attr("id");
    var temp_2 = []; var a = 0; var b = 0;
    for (u = 0; u < links_json.length; u++) {
      if (links_json[u].end == nowId) {
        temp_2[a] = links_json[u].sour;
        a++;
      }
    }
    for (w = 0; w < a; w++) {
      if (svg_1.selectAll("circle").filter(function (d, i) {
        return d3.select(this).attr("id") == temp_2[w]
      })
        .attr("mark") >= 1) {
        b++;
      }
      // console.log(temp_2[w])
    }
    if (a == b) {
      d3.select(this).attr("mark", "1");
      // d3.select(this).attr("mark_copy", "1");
      // console.log(d3.select(this).attr("mark")+"这个"+this.id);
    }
    else {
      // console.log(d.mark);
      d3.select(this).attr("mark", "0");
      // console.log(d.mark+"这个"+this.id);
    }
  })
  //console.log(transitions.filter(function(d,i){return d3.select(this).attr(mark)==1}).attr("id"))
  enable_transition = transitions.filter(function (d, i) {
    return d3.select(this).attr("mark") == 1
  })
    .attr("fill", "green")
    .attr("stroke", "green")
    .each(item => {
      //console.log(item)
      var cursorId = item.id
      //console.log(11111111)
      try{
      link.filter(function (d) { return d.end == cursorId })
        .attr("stroke", "green")
        .attr("marker-end", "url(#arrow_green)")
        .attr("end");
      }
      catch(e){
         console.log(item,e)
      }
    }
    );
  disable_transition = transitions.filter(function (d, i) {
    return d3.select(this).attr("mark") == 0
  })
    .attr("fill", "white")
    .attr("stroke", "black").each(function () {
      cursorId = d3.select(this).attr("id");
      link.filter(function (d) { return d.end == cursorId })
        .attr("stroke", "black")
        .attr("marker-end", "url(#arrow)");
    });
  //setTimeout(place_ToGreen,delay_time);
  place_ToGreen();
  d3.selectAll("circle").filter(function (d) {
    return d3.select(this).attr("mark") == 0
  })
    .attr("fill", "white")
    .attr("stroke", "black");
}
//****************************************给不同库所赋颜色*****************************************
function place_ToGreen() {
  d3.selectAll("circle").filter(function (d, i) {
    return d3.select(this).attr("mark") >= 1 && delays_json[i] == 0
  })
    .attr("fill", "green")
    .attr("stroke", "green")
  d3.selectAll("circle").filter(function (d, i) {
    //var delay_to_green=function(){d3.selectAll("circle").filter(function(d,i){return d3.select(this).attr("mark")>=1&&delays_json[i]!=0}).attr("fill","green").attr("stroke","green")};
    // setTimeout(delay_to_green,delays_json[i]*1000)
    return d3.select(this).attr("mark") >= 1 && delays_json[i] != 0
  })
    .attr("fill", "red")
    .attr("stroke", "red")//赋时库所变为红色
}
//****************************************变迁演化************************************************
function play() {
  start(svg_1, transitions, link, links_json);
  update(svg_1, g1);
  var temp_transition = [];
  var temp_transitions = [];//可激发便签id
  g1.selectAll("rect").filter(function (d, i) {
    return d3.select(this).attr("mark") == 1
  })
    .each(function (d, i) {
      temp_transitions.push(d3.select(this).attr("id"))
    })
  var cursorId = temp_transitions[Math.round(Math.random() * (temp_transitions.length - 1))];//随机选择一个id
  //已删除
  //play_2(svg_2,g2,place2,transition2,link2,cursorId,oplinks);
  d3.select("#en_transition").text(cursorId)
  // console.log(cursorId)
  var xymid = [];//变迁当前的位置用于token移动
  xymid.push({
    "cx": g1.selectAll("rect").filter(function (d) { return d.id == cursorId }).attr("x"),
    "cy": g1.selectAll("rect").filter(function (d) { return d.id == cursorId }).attr("y")
  });
  console.log(cursorId)
  var input_places = links_json.filter((item, index) => {
    return item.end == cursorId
  }).map(item => item.sour, this);
  console.log(input_places, 'input_place')
  var ouput_places = links_json.filter((item, index) => {
    return item.sour == cursorId
  }).map(item => item.end, this);
  console.log(ouput_places, '输出库所')
  var d3_input_places_set = d3.selectAll("circle").filter(function (node, index) {
    return d3.select(this).attr("id") == input_places[index]
  })
  var no_token_input_places = d3_input_places_set.filter(function (node, index) {
    // console.log(node)
    return parseInt(node.mark) < 1
  })["_groups"][0]

  if (no_token_input_places.length < 1) {//变迁是否激发
    TK_Move(input_places, xymid, ouput_places, svg_1, g1, places);
    console.log("激发+1")
    fire_transition(input_places, ouput_places)
    var temp_link = g1.selectAll("line").filter(function (d, i) {
      return d3.select(this).attr("sour") == cursorId
    })
    temp_link.transition().duration(1000)
      .attr("stroke", "red")
      .attr("marker-end", "url(#arrow_red)")
      .transition().duration(2500)
      .attr("stroke", "black")
      .attr("marker-end", "url(#arrow)");
    //temp_link.transition().duration(100).attr("stroke-width",10).transition().duration(1500).attr("stroke-width",1)
    //temp_link.attr("stroke-width","1").transition().duration(1000).attr("stroke-width","4").transition().duration(1000).attr("stroke-width","1")
    //temp_link.style("stroke","black").transition().duration(1000).style("stroke","red").transition().duration(1000).style("stroke","black")
    //temp_link.style("stroke-width","1").transition().duration(1000).style("stroke-width","4").transition().duration(1000).style("stroke-width","1")
    temp_transition = g1.selectAll("rect").filter(function (d) { return d.id == cursorId });
  }
  //setTimeout(start,2000,svg_1,transitions,link,links_json);//与动画同步，延迟两s执行start
  start(svg_1, transitions, link, links_json);
  update(svg_1, g1);
  //setTimeout(update,2000,svg_1,g1)
  if (temp_transition.length != 0) {
    temp_transition.transition().duration(token_v)
      .attr("fill", "red") //可激发变迁的颜色
      .attr("stroke", "red")
      .transition().duration(100)
      .attr("fill", function (d, i) {
        if (d3.select(this).attr("mark") == 1)
          return "green"
        else return "white"
      })
      .attr("stroke", function (d, i) {
        if (d3.select(this).attr("mark") == 1)
          return "green"
        else return "black"
      });
  }
  timer = setTimeout(play, token_v*2)
}
//****************************************托肯的位置计算和移动*************************************
function TK_Move(temp, xymid, temp_1, svg_1, g1, places) {
  var temp_x = 0; var temp_y = 0;
  var temp_Tk = []; var nothing = []; var xyend = [];
  for (i = 0; i < temp.length; i++) {
    temp_x = places.filter(function () {
      return d3.select(this).attr("id") == temp[i]
    })
      .attr("cx");
    temp_y = places.filter(function () {
      return d3.select(this).attr("id") == temp[i]
    })
      .attr("cy");
    temp_Tk.push({ "cx": temp_x, "cy": temp_y })
  };
  for (i = 0; i < temp_1.length; i++) {
    temp_x = places.filter(function () {
      return d3.select(this).attr("id") == temp_1[i]
    })
      .attr("cx");
    temp_y = places.filter(function () {
      return d3.select(this).attr("id") == temp_1[i]
    })
      .attr("cy");
    xyend.push({ "cx": temp_x, "cy": temp_y })
  }
  tempTK = g1.selectAll("#noting").data(temp_Tk).enter().append("circle")
    .attr("cx", function (d) { return d.cx; })
    .attr("cy", function (d) { return d.cy; })
    .attr("r", 6);
  tempTK.each(function () {
    d3.select(this).transition().duration(token_v) //前半段托肯移动delays
      .attr("cx", Number(xymid[0].cx) + 2)
      .attr("cy", Number(xymid[0].cy) + 20).remove();
  })
  setTimeout(function(){  
    tempTK1 = g1.selectAll("#noting").data(xyend).enter().append("circle")
    .attr("cx", Number(xymid[0].cx) + 2)
    .attr("cy", Number(xymid[0].cy) + 20)
    //.attr("endcx",function(){})
    .attr("r", 6);
  tempTK1.each(function () {
    d3.select(this).transition().delay(token_v*0).duration(token_v) //变迁激发delays和后半段托肯移动delays
      .attr("cx", function (d) { return d.cx })
      .attr("cy", function (d) { return d.cy }).remove();
  }) }, token_v);
}
//****************************************更新变迁*************************************************
function update_py(the_transition) {
  if (svg_1.selectAll("rect").filter(function (d) { return d.id == the_transition }).attr("mark") == 1) {
    var cursorId = the_transition;
    d3.select("#en_transition").text(cursorId)
    var xymid = [];//变迁当前的位置用于token移动
    xymid.push({
      "cx": svg_1.selectAll("rect").filter(function (d) { return d.id == the_transition }).attr("x"),
      "cy": svg_1.selectAll("rect").filter(function (d) { return d.id == the_transition }).attr("y")
    });
    var v = 0;
    var temp = [];//连接this变迁的input_place的id
    var temp_1 = [];
    var c = 0;
    //var m=[];//找出所有终点为cursorId的箭头
    var n = 0;
    for (u = 0; u < links_json.length; u++) {
      if (links_json[u].end == cursorId) {
        temp[v] = links_json[u].sour;
        //alert("nothing");
        //console.log(d3.selectAll("circle").filter(function(d,i){return d.id=temp[v]}).attr("mark")+temp[v])
        if (svg_1.selectAll("circle").filter(function (d, i) {
          return d3.select(this).attr("id") == temp[v]
        })
          .attr("mark") >= 1) {
          //判断是否输入变迁的库所mart都大于等于1
          n++;
        }
        v++;
      }
      if (links_json[u].sour == cursorId) {
        temp_1[c] = links_json[u].end;//temp_1中为this变迁输出指向的所有库所的id
        c++;
      }
    }
    TK_Move(temp, xymid, temp_1, svg_1, g1, places);
    console.log("激发+1")
    for (w = 0; w < v; w++) {//若激发，则每个终点是this的connection的起点对应的库所mark值减一
      var markDowm = svg_1.selectAll("circle").filter(function (d, i) {
        return d3.select(this).attr("id") == temp[w]
      })
        .attr("mark");
      markDowm--;
      svg_1.selectAll("circle").filter(function (d, i) {
        return d3.select(this).attr("id") == temp[w]
      })
        .attr("mark", markDowm)
    }
    for (w1 = 0; w1 < c; w1++) {
      var markUp = svg_1.selectAll("circle").filter(function (d, i) {
        return d3.select(this).attr("id") == temp_1[w1]
      })
        .attr("mark");
      markUp++;
      svg_1.selectAll("circle").filter(function (d, i) {
        return d3.select(this).attr("id") == temp_1[w1]
      })
        .attr("mark", markUp);
    }
    var temp_link = g1.selectAll("line").filter(function (d, i) {
      return d3.select(this).attr("sour") == cursorId
    })
    temp_link.attr("stroke", "red")
      .attr("marker-end", "url(#arrow_red)");
    var go_normal = function (temp_link) {
      temp_link.attr("stroke", "black")
        .attr("marker-end", "url(#arrow)");
    }
    //setTimeout(go_normal,8000,temp_link);
    go_normal(temp_link)
    start(svg_1, transitions, link, links_json);//与动画同步，延迟两s执行start
    update(svg_1, g1);
    var temp_transition = g1.selectAll("rect").filter(function (d) { return d.id == cursorId });
    temp_transition.transition().duration(1500)
      .attr("fill", "red")
      .attr("stroke", "red")
      .transition().duration(100)
      .attr("fill", function (d, i) {
        if (d3.select(this).attr("mark") == 1)
          return "green"
        else return "white"
      })
      .attr("stroke", function (d, i) {
        if (d3.select(this).attr("mark") == 1)
          return "green"
        else return "black"
      });
  }
  else {
    alert("变迁不可激发，出现错误请检查程序")
  }
}
var ws
function getuserinfo(){
  $.ajax({
    method:'GET',
    url:"http:127.0.0.1:8080/",
    success:function(res){
      console.log(res)
    }
  })
};
function WebSocketTest()
{
  if ("WebSocket" in window)
  {
    // 打开一个 web socket
    // ws = new WebSocket("ws://169.254.192.79:5501");
    //ws = new WebSocket("ws://192.168.1.209:5501");
    ws = new WebSocket("ws://127.0.0.1:8080");
    console.log("Try  Web Socket")
    // 连接建立后的回调函数
    ws.onopen = function()
    {
      console.log("Web Socket 已连接上")
      // Web Socket 已连接上，使用 send() 方法发送数据
      ws.send("admin:123456");
      // alert("正在发送：admin:123456");
    };
    // 接收到服务器消息后的回调函数
    // var iii=25;
    ws.onmessage = function (evt) 
    {
      ws.send("next")
      //var received_msg = evt.data;
      //if (received_msg.indexOf("sorry") == -1) {
	     // if (received_msg.length>=5){
	     // console.log(received_msg)
	     // setTimeout(function(){ws.send("hillow c++ ,i am browser")},1000);
	     // }
      //  else{
      //    console.log(received_msg)
      //    update_py(received_msg)
      //    //setTimeout(function(){ws.send("hillow c++ ,i am browser")},1000);
      //    ws.send("next")
      //  }
      //}else{
      //  console.log("shenemshia");
      //}
      // 连接关闭后的回调函数

    }

    ws.onclose = function()
    { 
      console.log("connection has benn closed")
    };
  }
}

function success(stream) {
  //兼容webkit核心浏览器
  // let CompatibleURL = window.URL || window.webkitURL;
  //将视频流设置为video元素的源
  console.log(stream);
  //video.src = CompatibleURL.createObjectURL(stream);
  video.srcObject = stream;
  video.play();
}
function error(error) {
  console.log(`访问用户媒体设备失败${error.name}, ${error.message}`);
}


//****************************************重新演变*************************************************
function restartlayout() {
  places.each(function (d, i) {
    d3.select(this).attr("mark", function (d, i) { return d.mark })
  })
  currentState.splice(0);
  start(svg_1, transitions, link, links_json);
  update(svg_1, g1);
}
//****************************************petri网结构关系******************************************
function nodesAssociate(places, transitions, links_json) {
  // places.attr("parents",function(d,i){return arr=[]}).attr("kids",function(d,i){return arr=[]})
  // transitions.attr("parents",function(d,i){return arr=[]}).attr("kids",function(d,i){return arr=[]})
  for (var i = 0; i < links_json.length; i++) {
    var parent = links_json[i].sour;
    var kid = links_json[i].end;
    if (parent[0] == "p") {
      places.filter(function (d, i) { return d.id == parent })
        .attr("kids", function () {
          var arr = []
          arr.push(kid)
          if (d3.select(this).attr("kids") != null)
            arr.push(d3.select(this).attr("kids"))
          // console.log(arr)
          return arr;
        })
      transitions.filter(function (d, i) { return d.id == kid })
        .attr("parents", function () {
          var arr = []
          arr.push(parent)
          if (d3.select(this).attr("parents") != null)
            arr.push(d3.select(this).attr("parents"))
          //console.log(arr)
          return arr;
        })
    }
    else {
      transitions.filter(function (d, i) { return d.id == parent })
        .attr("kids", function () {
          var arr = []
          arr.push(kid)
          if (d3.select(this).attr("kids") != null)
            arr.push(d3.select(this).attr("kids"))
          // console.log(arr)
          return arr;
        })
      places.filter(function (d, i) { return d.id == kid })
        .attr("parents", function () {
          var arr = []
          arr.push(parent)
          if (d3.select(this).attr("parents") != null)
            arr.push(d3.select(this).attr("parents"))
          //console.log(arr)
          return arr;
        })
    }
  }
}
//****************************************保存数据按钮函数******************************************
function save_data() {
  // console.log(d3.selectAll('rect')["_groups"][0])

  const output_json = save_json()
  console.log(output_json)
  $.support.cors=true

  //result = $.post("http://10.8.14.125:8082/api/tutorials",JSON.stringify(output_json),res => {
  result = $.ajax({
    type:'POST',
    headers:{'Content-Type':'application/json;charset=utf8'},
    url:"/",
    //url:"http://10.8.14.125:8082" +"/api/tutorials",
    data:JSON.stringify(output_json),
    success:res => {
	console.log(res)
    }
  })
  
  //saveJSON(output_json, "position.json")
}
function save_json(){
  input_places = d3.selectAll('circle')["_groups"][0]
  formatting_places = Array.apply(null, input_places)
    .map(node => node.__data__)
    .filter( item => item.id ) // 过滤掉没id的临时合成节点
    .map(node => { return { id: node.id, cx: node.x, cy: node.y, mark: node.mark  } })

  transitions = d3.selectAll('rect')["_groups"][0]
  formatting_transitions = Array.apply(null, transitions)
    .map(node => node.__data__)
    .filter( item => item.id ) // 过滤掉没id的临时合成节点
    .map(node => { return { id: node.id, cx: node.x, cy: node.y } })

  arcs = d3.selectAll('line')["_groups"][0]
  formatting_arcs = Array.apply(null, arcs)
    .map(node => node.__data__)
    .map(node => { return { from: node.sour, to: node.end, index: node.index, isEnabled_transition:node.isEnabled_transition } })
  console.log('formatting_arcs',formatting_arcs)

  places_loction = position_json

  var name_of_pn = $("#input_petriName_tosave").val() || "petri"
  const translate = $('g')[0].attributes.transform.value

  //const output_json = [
  //  {
  //    type: "places",
  //    positions: formatting_places
  //  },
  //  {
  //    type: "transitions",
  //    positions: formatting_transitions
  //  }
  //]
  
  //更改了jsono格式
  const output_json =  {
    "title": name_of_pn,
    "description":"Ocrding bro jun",
    "keyword": "fixed_position",
    "timestamp": (new Date()).valueOf(),
    "places": formatting_places,
    "transitions": formatting_transitions,
    "links": formatting_arcs,
    "fixed_positions": places_loction,
    "parameters": {
      token_v,
      distance_row,
      distance_col,
      translate,
    }
  }
  return output_json
}

function get_names(){
  var petriName = "pn.json"
  $.ajax({
    url:host_base + petriName ,
    async:false,
    type:'GET',
    success: resArray => {
      console.log("names", resArray)
    }
  })
  return resArray
}
function pop_netName(){
  // 删除，保证每次都是最新的数据
  $(".on_changes li").remove();

  var petriName = $("#input_petriName").val()
  $.ajax({
    url:host_base +  petriName ,
    async:false,
    type:'GET',
    success: resArray => {
      console.log("names", resArray)
      resArray.map( item => {
	var li = "<li onclick='get(\"" + item + "\")' onmouseover='this.style.backgroundColor=\"#ffff66\";'onmouseout='this.style.backgroundColor=\"#fff\";'>"+item+"</li>";
	$('.on_changes').append(li)
      })
      //alert(li);
      // 控制下拉框显示
      var display =$('#input_petriName');
      if(display.is(':focus')){//如果node是隐藏的则显示node元素，否则隐藏
	$(".on_changes").show();
      }else{
	$(".on_changes").hide();
      }
    }
  })
}


function get(data){
  //alert(data1);// 客户Id
  //alert(data2);// 客户名称
  console.log(data)
  $("#input_petriName").val(data);
  $(".on_changes").hide();
}

function get_data() {
  var petriName = "/pn.json"
  console.log(host_base + petriName)

  g1.remove()
  // 数据量一大就是一个危险方法
  $.ajax({
    type:'GET',
    url:host_base + petriName ,
    
    async:false,
    
    success: resArray => {
      //resArray = JSON.parse(res.responseText) 
      console.log(resArray)
      //console.log(resArray.filter(item => item.places.length != 0 ))
      console.log(resArray.length -1)
      dbjson = dbJson2jsJson(resArray)

      links_json = dbjson.links_json
      place_json = dbjson.place_json
      //if (dbjson.position_json.length > 0 ){
      //  position_json = dbjson.position_json
      //}
      //else{
      //  position_json = place_json.concat( transition_json).map(item => {return {id:item.id, x:parseInt(item.cx) / distance_row, y: parseInt(item.cy) / distance_col}})
      //}
      parameters = dbjson.parameters
      distance_row = parameters.distance_row
      distance_col = parameters.distance_col
      token_v = parameters.token_v
      translate = parameters.translate

      position_json = place_json.concat( transition_json).map(item => {return {id:item.id, x:parseInt(item.cx) / distance_col, y: parseInt(item.cy) / distance_row}})

      console.log(position_json)
      transition_json = dbjson.transition_json
      nodes = place_json.concat(transition_json);

      adaptlinks(links_json, nodes);//连接节点

      $('#petri_name')[0].innerHTML = dbjson.title
      $('#petri_time')[0].innerHTML = new Date(parseInt(dbjson.timestamp)).toLocaleString()

      
      createLayout();//创建演化过程
      start(svg_1, transitions, link, links_json);
      update(svg_1, g1);
      nodesAssociate(places, transitions, links_json)


      //update_place()
      //update_transition()
      //update_py()

    },
    //error: e => {
    //    console.log(e)
    //}

  })
}
function dbJson2jsJson(dbjson){
  console.log(dbjson)
  var position_json = dbjson.places
  links_json = dbjson.links.map(item => {
    const {index, isEnabled_transition} = item
    return { sour: item.from, end: item.to, index, isEnabled_transition}
  })
  place_json = dbjson.places
  transition_json = dbjson.transitions
  var {parameters, title, timestamp} = dbjson
  return {position_json, links_json, place_json, transition_json, parameters, title,timestamp}
}

//****************************************保存数据为JSON******************************************
function saveJSON(data, filename) {
  if (!data) {
    alert('data is null');
    return;
  }
  if (!filename) {
    filename = 'json.json'
  }
  if (typeof data === 'object') {
    data = JSON.stringify(data, undefined, 4)
  }
  var blob = new Blob([data], { type: 'text/json' });
  var e = document.createEvent('MouseEvents');
  var a = document.createElement('a');
  a.download = filename;
  a.href = window.URL.createObjectURL(blob);
  a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
  e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  a.dispatchEvent(e);
}
