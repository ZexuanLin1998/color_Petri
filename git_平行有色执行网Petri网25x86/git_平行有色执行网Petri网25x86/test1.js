var svg, g1, links, places, transitions;
var transition_id = []; var place_id = [];
var place_json = []; var transition_json = []; var link_json = []; var temp_s = []; var temp_t = [];
var currentState = [];
var colors;
var Place_r = 20;
var tk_r = 3;
var translate = "translate(" + (500) + "," + (500) + ")" + "scale(1)";
var trans_w = 8;
var trans_h = 40;
var width = 2000;
var height = 1000;
var token_v = 400;
var delay_time = 1;
var marksize = 40;
var simulation;
const simulationIsEnable = true;
var allplace_color;


$.getJSON("colored_pn.json", function (data) {
  var temp = data.transitions;
  transition_id = Object.keys(temp)
  transition_json = Object.values(temp)
  //console.log("transition_id", transition_id)
  //console.log("transition_attr", transition_attr)
  for (i = 0; i < transition_json.length; i++) {
    transition_json[i].id = transition_id[i]
  }
  console.log('transition_json', transition_json);
});

$.getJSON("colored_pn.json", function (data) {
  var temp1 = data.places;
  place_id = Object.keys(temp1)
  place_json = Object.values(temp1)
  allplace_color = data.p_colors
  for (i = 0; i < place_json.length; i++) {
    place_json[i].id = place_id[i]
  }
  console.log("allplace_color", allplace_color)
  //console.log("place_id", place_id)
  console.log('place_json', place_json)
});

$.getJSON("c_links.json", function (data) {
  link_json = data.links;
  console.log('link_json', link_json)
});


setTimeout(function () {
  // alert("iiii");
  main();
}, 500); //500为等待时间
// var name1=d3.selectAll("circle").text(function(d,i) {return (place_json[i].name) })
// console.log(name1)

function main() {

  colors = d3.scaleOrdinal()//所有可能出现的颜色
    .domain(allplace_color)
    .range(d3.schemeCategory10);
  //console.log(place_json[0].pre_arcs.t1.red)
  //console.log(place_json[0]["mark"]["red"]+place_json[0]["mark"]["yellow"])
  nodes = place_json.concat(transition_json);
  console.log('nodes', nodes);
  drag = d3.drag().on("start", started).on("drag", dragged).on("end", ended);
  createSVG();//创建矢量图
  createLayout();//创建演化过程
  //ticked(svg, links, transitions, places, txt);
  start(svg, transitions, links, link_json);
  update(svg, g1);
}

function createSVG() {
  svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
  g1 = svg.append("g")
    .attr("transform", translate);
  svg.call(d3.zoom()
    .scaleExtent([0.1, 10]) //设置缩放比例
    .on("zoom", zoomed));

  function zoomed() {
    // 无法获得缩放后的translate值
    g1.attr("transform", d3.event.transform);
  }
  //创建箭头
  defs = svg.append('defs')
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

    var arrow_path = "M2,2 L10,5 L2,8 L6,5 L2,2"; //定义箭头形状
    arrowMarker.append("path")
      .attr("d", arrow_path)
      .attr("fill", "black");
  }
}

function createLayout() {

  // function edistance(link) {
  //   //console.log(link)
  //   return Math.random() * 100 + 50
  // }

  const ticked = function () {
    var remo = svg.selectAll("circle").filter(function (d, i) {
      return d3.select(this).attr("class") == "node"//
    });
    var nodesNum = 0;
    var token = [];

    for (var i = 0; i < link_json.length; i++) { //判断end是不是变迁，有没有激发的能力
      for (var j = 0; j < transition_json.length; j++) {
        if (link_json[i].target.id == transition_json[j].id) {
          link_json[i].isEnabled_transition = true;
          break;
        }
      }
      if (link_json[i].isEnabled_transition != true)
        link_json[i].isEnabled_transition = false;
    }
    links.attr("x1", function (d) { return d.source.x; })
      .attr("y1", function (d) { return d.source.y; })
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
    // .attr("x2", function (d) { return d.target.x; })
    // .attr("y2", function (d) { return d.target.y; });
    places.attr("cx", (d, i) => { return d.x })
      .attr("cy", (d, i) => { return d.y });
    places.each(function (d, i) {//为库所托肯确定位置
      nodesNum = d3.sum(d3.select(this).attr("token_color_num").split(','))
      if (nodesNum > 0) {
        if (nodesNum == 1) {
          for (i = 0; i < d3.select(this).attr("token_color").split(',').length; i++) {
            if (d3.select(this).attr("token_color_num").split(',')[i] != 0) {
              token.push({
                cx: Number(d3.select(this).attr("cx")), cy: Number(d3.select(this).attr("cy")), r: tk_r, tk_color: d3.select(this).attr("token_color").split(',')[i]
              })
            }
          }
        }
        if (nodesNum > 1) {
          var pp = 0;
          for (m = 0; m < d3.select(this).attr("token_color").split(',').length; m++) {
            var num = d3.select(this).attr("token_color_num").split(',')[m]
            if (num > 0) {
              for (n = 0; n < num; n++) {
                pp++;
                var cx1 = Number(d3.select(this).attr("cx")) + 5 * Math.cos(pp * 2 * Math.PI / nodesNum)//
                var cy1 = Number(d3.select(this).attr("cy")) + 5 * Math.sin(pp * 2 * Math.PI / nodesNum)
                token.push({
                  cx: cx1, cy: cy1, r: tk_r, tk_color: d3.select(this).attr("token_color").split(',')[m]
                })
              }
            }
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

    transitions.attr("x", function (d, i) { return d.x - 4 }) //变迁的位置
      .attr("y", function (d, i) { return d.y - 20 });

    txt.attr("x", function (d) { return d.x - 10 })
      .attr("y", function (d) { return d.y - 30 }).style("font-size", "200%");
  }


  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(link_json).id(function (d, i) { return d.id }).strength(0.1).distance(50))
    .force("charge", d3.forceManyBody().strength(-200))
    //.force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(50))
    .on("tick", ticked)

  links = g1.selectAll("line").data(link_json).enter().append("line") //设置连接线的属性
    .attr("stroke", "black")
    .attr("stroke-width", 1)//
    .attr("source", function (d, i) { return d.source })
    .attr("target", function (d, i) { return d.target })
    .attr("marker-end", "url(#arrow)")


  //const changeColor = (event) => { d3.select(event.currentTarget).attr('fill', d3.interpolateRainbow(Math.random())) };
  // var c_places = [["c1m1", "c1m2", "c1m5"]]
  // var colors = d3.scaleOrdinal()
  //   .domain(c_places)
  //   .range(["#5E4FA2", "#3288BD", "#66C2A5"]);
  // function p_color(){
  //   var tk_color=d3.select(".token").attr("fill")
  //   return tk_color;
  // }

  places = g1.selectAll("circle").data(place_json).enter().append("circle") //设置库所属性
    .attr("class", "circle")
    .attr("id", function (d, i) { return place_id[i] })
    .attr("r", Place_r)
    .attr("fill", "white")
    .attr("stroke-width", 1.5)
    .attr("stroke", "black")//cx cy
    .attr("token_color", function (d, i) { return d3.keys(place_json[i].token) })
    .attr("token_color_num", function (d, i) { return d3.values(place_json[i].token) })
    .attr("token",function(d,i){return place_json[i].token})
    .call(drag);



  transitions = g1.selectAll("rect").data(transition_json).enter().append("rect") //设置变迁属性
    .attr("class", "rect")
    .attr("id", function (d, i) { return transition_id[i] })
    .attr("fill", "white")
    .attr("stroke-width", 1.5)
    .attr("stroke", "black")
    .attr("width", trans_w)
    .attr("height", trans_h)
    .call(drag)

  txt = g1.selectAll("text").data(nodes).enter().append("text") //设置属性名的文本属性//
    // .attr("x", function (d) { return d.x })
    // .attr("y", function (d) { return d.y + 20 })
    .text(function (d) { return d.id })

  transitions.on("click", evolution_function)
  start(svg, transitions, links, link_json);

}


function started(d) {
  console.log("开始拖拽")
  if (simulationIsEnable) {
    simulation.alphaTarget(0.2).restart()
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

//点击变迁，执行函数
function evolution_function(d) {
  console.log("click");           //console.log()用于输出普通信息
  var cursorId = d3.select(this).attr("id");
  console.log(cursorId)

  var c = 0;
  var xymid = [];//变迁当前的位置用于token移动
  xymid.push({
    "cx": d3.select(this).attr("x"),
    "cy": d3.select(this).attr("y")
  });   //变迁的位置，用xy轴表示

  var input_places = link_json.filter((item, index) => {
    return item.target.id == cursorId
  }).map(item => item.source.id, this)
  console.log(input_places, '输入库所')

  var output_places = link_json.filter((item, index) => {
    return item.source.id == cursorId
  }).map(item => item.target.id, this)
  console.log(output_places, '输出库所')
  // TK_Move(input_places, xymid, output_places, g1, places); //计算托肯移动位置

  // var d3_input_places_set = d3.selectAll("circle").filter(function (node, index) {
  //   // d3会将有token的库所单独生成一个circle，这种circle没id，要过滤掉 —— liuwei in
  //   for (i in input_places) {
  //     if (node.id == input_places[i]) {
  //       return d3.select(this).attr("id") === node.id
  //     }
  //   }
  // })
  // var m = d3_input_places_set["_groups"]["0"]
  // console.log(d3.select(m[0]).attr("token_color"))
  function trans_towhite() {//
    d3.selectAll("rect").filter(function (d, i) {
      return d3.select(this).attr("id") == cursorId
    }).attr("fill", "white")
  }
  //通过输入库所来判断
  // p_post_arcs=place_json.filter((item, index) => {
  //   return item.id == input_places
  // }).map(item => item.id, this)
  // console.log(p_post_arcs)
  // for(i=0;i<m.length;i++){
  //   if(d3.select(m[i]).attr("token_color").split(",").length==0){
  //     console.log("该变迁不可激发")
  //   }
  //   for(j=0;j<d3.select(m[i]).attr("token_color").split(",").length;j++){
  //     if(d3.select(m[i]).attr("token_color_num").split(",")[j]!=0)
  //     var temp=d3.select(m[i]).attr("token_color").split(",")[j]
  //     getValue()
  //   }

  // }
  //通过变迁来判断
  var t_colors = transition_json.filter((item, index) => {//变迁所有可能出现颜色
    return item.id == cursorId
  }).map(item => item.colors, this)
  console.log(t_colors)
  console.log(t_colors[0])

  t_pre_arcs_keys = transition_json.filter((item, index) => {//变迁前向弧键
    return item.id == cursorId
  }).map(item => d3.keys(item.pre_arcs), this)

  t_pre_arcs_values = transition_json.filter((item, index) => {//变迁前向弧值
    return item.id == cursorId
  }).map(item => d3.values(item.pre_arcs), this)

  t_post_arcs_values = transition_json.filter((item, index) => {//变迁后向弧值
    return item.id == cursorId
  }).map(item => d3.values(item.post_arcs), this)
  console.log(t_pre_arcs_keys[0])
  console.log(t_pre_arcs_values[0])
  console.log(t_post_arcs_values[0])

  for (m = 0; m < output_places.length; m++) {//输出库所是否有托肯  
    var d = 0;
    var output_token_color_num = d3.selectAll("circle").filter(function (d, i) {
      return d3.select(this).attr("id") == output_places[m]
    }).attr("token_color_num")//.split(",")   
    var output_places_capacity = place_json.filter((item, index) => {//变迁后向弧值
      return item.id == output_places[m]
    }).map(item => item.capacity, this)
    console.log(output_token_color_num)
    console.log(output_places_capacity)
    if (!output_token_color_num.includes(1)) {
      c++
    }
    if (!output_places_capacity.includes(0)) {
      d++
    }
  }
  console.log(c)
  console.log(d)



  var getKey = (object, value) => {//由值找键
    return Object.keys(object).find(key => object[key] == value);
  }
  var getValue = (object, key) => {//由键找值
    return Object.values(object).find(value => object[value] == key);
  }

  for (i = 0; i < t_colors[0].length; i++) {
    for (j = 0; j < t_pre_arcs_values[0].length; j++) {
      // var b=0;
      var temp = getKey(t_pre_arcs_values[0][j], t_colors[0][i])
      console.log(temp)
      var need_token = []; var b = 0;
      need_token.push(temp)//需要从前向库所获取托肯颜色     
      console.log(need_token)
      var temp1 = d3.selectAll("circle").filter(function (d, i) { //判断前向库所是否含有该颜色托肯
        return d3.select(this).attr("id") == t_pre_arcs_keys[0][j]
      }).attr("token_color")
      // console.log(temp1)
      // console.log(temp1.length)
      if (temp1.includes(need_token[j])) {
        b++;
      }
    }
    console.log(b)
    console.log(c)
    console.log(d)
    var temp2 = []
    if (b == input_places.length && c == output_places.length && d == output_places.length) {//容量为1且输出库所托肯为0
      console.log(t_colors[0][i], "颜色可激发")
      temp2.push(t_colors[0][i])
    }
    if (b == input_places.length && d != output_places.length) {
      console.log(t_colors[0][i], "颜色可激发")
      temp2.push(t_colors[0][i])
    }
    else { console.log("该颜色变迁不可激发",) }

  }
  console.log(temp2)
  if (temp2.length == 0) {
    console.log("该变迁不可激发")
  }
  else {
    var select_color = temp2[Math.round(Math.random() * (temp2.length - 1))]//随机选择变迁颜色进行激发
    console.log(select_color)
    // for (j in input_places) {
    //   var temp3 = []
    //   temp3 = place_json.filter((item, index) => { return item.id == input_places[j] })
    // }
    // console.log(temp3)
    // var trans_color = temp3[0]["post_arcs"][cursorId][select_color]//
    var trans_color = colors(select_color)
    console.log(trans_color)
    d3.select(this).attr("fill", trans_color)
    setTimeout(trans_towhite, token_v * 2)
    TK_Move(input_places, xymid, output_places, g1, places, trans_color); //计算托肯移动位置


    激发变迁_前后库所_标识处理(input_places, output_places)
    function 激发变迁_前后库所_标识处理(input_places, output_places) {//
      // 本函数将改变DOM树
      function IndexOf(arr, item) {
        return arr.indexOf(item)
      }
      for (w = 0; w < input_places.length; w++) {
        //若激发，则每个终点是this的connection的起点对应的库所mark值减一
        var input_token_color = d3.selectAll("circle").filter(function (d, i) {
          return d3.select(this).attr("id") == input_places[w]
        }).attr("token_color").split(",")

        var a = IndexOf(input_token_color, need_token[w])//选择变迁颜色在数组中的位置
        var markerToChangeNode = svg.selectAll("circle").filter(function (d, i) {
          return d3.select(this).attr("id") == input_places[w]
        })
        // console.log(markerToChangeNode)
        // console.log(markerToChangeNode.attr("token_color_num").split(',').map(i => parseInt(i, 0)))
        var temp3 = markerToChangeNode.attr("token_color_num").split(',').map(i => parseInt(i, 0))
        console.log(temp3)
        // console.log(temp2.length)
        temp3[a] = temp3[a] - 1
        for (p = 0; p < temp3.length; p++) {//
          if (temp3[p] == 0) {
            input_token_color.splice(p)
            temp3.splice(p)
          }
        }
        markerToChangeNode.attr("token_color_num", temp3)
        //console.log(temp2)
        console.log(markerToChangeNode.attr("token_color_num"))
      }

      //   markerToChangeNode.attr("mark"/, parseInt(markerToChangeNode.attr("mark")) - 1)   
      setTimeout(function () {

        for (k = 0; k < output_places.length; k++) {
          // var temp5 = []
          // temp5.push(getValue(t_post_arcs_values[0][k], select_color))
          // console.log(temp5)
          var markerToChangeNode = d3.selectAll("circle").filter(function (d, i) {
            return d3.select(this).attr("id") == output_places[k]
          })
          console.log(markerToChangeNode)
          var temp4 = markerToChangeNode.attr("token_color_num")//.split(',').map(i => parseInt(i, 0))
          console.log(temp4)
          console.log(temp4.length)
          var markerToChangeNode_num=[]

          var output_token_color = d3.selectAll("circle").filter(function (d, i) {
            return d3.select(this).attr("id") == output_places[k]
          }).attr("token_color")
          console.log(output_token_color)
          console.log(output_token_color.length)
          if (output_token_color.length == 0) {
            output_token_color = (temp5)
            
            markerToChangeNode_num.push(1)
          }
          else {
            var temp6 = [];
            output_token_color.split(",")
            temp6.push(output_token_color)
          
            console.log(temp6)
            if (!temp6.includes(temp5[0])) {
              temp6.push(temp5[0])
              output_token_color = temp6;
            }
            else{

            }
            
          }
          console.log(temp6)
          console.log(output_token_color)
          // for (w1 = 0; w1 < output_places.length; w1++) {
          //若激发，则每个connection的终点库所对应的mark加一
          //选择变迁颜色在数组中的位置
         
          if (temp4.length == 0) {
            temp4 = []
            temp4.push(1)
          }
          else{
            var temp7=[]
            for(i=0;i<temp4.length;i++){
              temp7.push(temp4[i])
            }            
            console.log(temp7)
          }
          console.log(temp4)
          // console.log(temp3.length)
          //temp4[k] = temp4[k] + 1
          //console.log(temp3)
          markerToChangeNode.attr("token_color", output_token_color)
          markerToChangeNode.attr("token_color_num", temp4)
          console.log(markerToChangeNode.attr("token_color"))
          console.log(markerToChangeNode.attr("token_color_num"));
          //}
        }
      }, token_v * 2)
    }
  }
  start(svg, transitions, links, link_json);
  update(svg, g1);
  setTimeout(function () {
    start(svg, transitions, links, link_json);
    update(svg, g1);
  }, token_v * 2);
}
//setTimeout(start,delay_time,svg_1,transitions,link,links_json);//与动画同步，延迟两s执行start
//setTimeout(update,delay_time,svg_1,g1)


function update(svg, g1) {//更新标识，计算标识位置
  var token = [];
  var nodesNum = 0;
  var remo = svg.selectAll("circle").filter(function (d, i) {
    return d3.select(this).attr("class") == "node" //this代表当前变量，选择有属性node的变量//
  });
  console.log(remo);
  remo.remove();
  g1.selectAll("circle").filter(function (d, i) {
    return d3.select(this).attr("r") >= 6//
  })
    .each(function (d, i) {//判断库所标识个数，计算标识位置
      //console.log(d3.select(this).attr("id")+""+d3.select(this).attr("cx"))
      // 计算托肯的半径，以便绘制在库所中 
      //console.log(this)
      nodesNum = d3.sum(d3.select(this).attr("token_color_num").split(','))
      //console.log(nodesNum)
      //console.log(d3.select(this).attr("token_color").split(','))
      //console.log(d3.select(this).attr("token_color"))
      if (nodesNum > 0) {
        if (nodesNum == 1) {
          for (i = 0; i < d3.select(this).attr("token_color").split(',').length; i++) {
            if (d3.select(this).attr("token_color_num").split(',')[i] != 0) {
              token.push({
                cx: Number(d3.select(this).attr("cx")), cy: Number(d3.select(this).attr("cy")), r: tk_r, tk_color: d3.select(this).attr("token_color").split(',')[i]
              })
            }
          }
        }
        console.log(token)
        if (nodesNum > 1) {
          var pp = 0;
          for (m = 0; m < d3.select(this).attr("token_color").split(',').length; m++) {
            var num = d3.select(this).attr("token_color_num").split(',')[m]
            if (num > 0) {
              for (n = 0; n < num; n++) {
                pp++;
                var cx1 = Number(d3.select(this).attr("cx")) + 5 * Math.cos(pp * 2 * Math.PI / nodesNum)//
                var cy1 = Number(d3.select(this).attr("cy")) + 5 * Math.sin(pp * 2 * Math.PI / nodesNum)
                token.push({
                  cx: cx1, cy: cy1, r: tk_r, tk_color: d3.select(this).attr("token_color").split(',')[m]
                })
              }
            }
          }
        }
      }
    })

  g1.selectAll("#node").data(token)//标识为node类
    .enter().append("circle")
    .attr("class", "node")
    .attr("cx", function (d) { return d.cx; })
    .attr("cy", function (d) { return d.cy; })
    .attr("r", tk_r)
    .attr("fill", (d, i) => colors(d.tk_color))
  //console.log(color[link_json[0]["mark"]])
  g1.selectAll("#node").data(token).exit().remove();//
  var marks = new Array;
  places.each(function (d, i) { marks.push({ "token_color_num": d3.select(this).attr("token_color_num").split(',') }) });
  currentState.push(marks)//更新当前状态标识
  console.log(currentState)
}

function start(svg) {//判断所有可激发变迁，
  var temp_3 = [];
  svg.selectAll("rect").each(function (d, i) {
    var nowId = d3.select(this).attr("id")
    //console.log(nowId)
    var temp_2 = []; var a = 0; var b = 0;
    for (let u = 0; u < link_json.length; u++) {
      if (link_json[u].target.id == nowId) {
        temp_2[a] = link_json[u].source.id;
        a++;//a变迁输入库所个数
      }
    }
    //console.log(temp_2)
    // console.log(a)

    for (let i = 0; i < allplace_color.length; i++) {
      b = 0;
      for (let w = 0; w < a; w++) {
        if (svg.selectAll("circle").filter(function (d, i) {
          return d3.select(this).attr("id") == temp_2[w]
        })
          .attr("token_color_num").split(',')[i] >= 1) {
          b++
        }
        // console.log("内循环+1")
      }
      //console.log(b)
      if (a == b) {
        temp_3.push([nowId, allplace_color[i]])
        //console.log("当前可激发变迁", nowId, place_color[i])
      }
      //console.log("外循环+1")
    }
  })
  firable_transition = temp_3;
  console.log(temp_3)


  // enable_transition = d3.selectAll("rect").filter(function (d, i) {
  //   return d3.select(this).attr("red_mark") == 1 || d3.select(this).attr("green_mark") == 1
  // });
  // //console.log(enable_transition)


  // disable_transition = transitions.filter(function (d, i) {//不可激发变迁设置颜色及指向该变迁线的颜色
  //   return d3.select(this).attr("red_mark") == 0 && d3.select(this).attr("green_mark") == 0
  // })
}

function play() {//auto play
  start(svg, transitions, links, link_json);
  update(svg, g1);
  var temp = [];
  var temp_transition = [];
  var temp_transitions = [];//可激发便签id
  temp_transitions = firable_transition
  console.log(temp_transitions)
  temp = temp_transitions[Math.round(Math.random() * (temp_transitions.length - 1))]
  console.log(temp)
  var cursorId = temp[0];//随机选择一个id
  var cursorId_color = temp[1];
  console.log(cursorId)
  console.log(cursorId_color)
  //已删除
  //play_2(svg_2,g2,place2,transition2,link2,cursorId,oplinks);
  //d3.select("#en_transition").text(cursorId)//
  // console.log(cursorId)
  var xymid = [];//变迁当前的位置用于token移动
  xymid.push({
    "cx": g1.selectAll("rect").filter(function (d) { return d.id == cursorId }).attr("x"),
    "cy": g1.selectAll("rect").filter(function (d) { return d.id == cursorId }).attr("y")
  });

  var input_places = link_json.filter((item, index) => {
    return item.target.id == cursorId
  }).map(item => item.source.id, this);
  console.log(input_places, '输入库所')
  var output_places = link_json.filter((item, index) => {
    return item.source.id == cursorId
  }).map(item => item.target.id, this);
  console.log(output_places, '输出库所')

  for (i in input_places) {
    var temp = []
    temp = place_json.filter((item, index) => { return item.id == input_places[i] })
  }
  //console.log(temp)
  var trans_color = temp[0]["post_arcs"][cursorId][cursorId_color]
  console.log(trans_color)
  TK_Move(input_places, xymid, output_places, g1, places, trans_color); //计算托肯移动位置
  setTimeout(changeColor, token_v)
  function changeColor() {
    g1.selectAll("rect").filter(function (d, i) {
      return d3.select(this).attr("id") == cursorId
    }).attr("fill", colors(trans_color))
    console.log("变迁颜色变化")
  }

  setTimeout(trans_towhite, token_v * 2)
  function trans_towhite() {//
    g1.selectAll("rect").filter(function (d, i) {
      return d3.select(this).attr("id") == cursorId
    }).attr("fill", "white")
  }
  激发变迁_前后库所_标识处理(input_places, output_places)
  function 激发变迁_前后库所_标识处理(input_places, output_places) {//
    // 本函数将改变DOM树
    function IndexOf(arr, item) {
      return arr.indexOf(item)
    }
    var a = IndexOf(allplace_color, cursorId_color)//选择变迁颜色在数组中的位置
    for (w = 0; w < input_places.length; w++) {
      //若激发，则每个终点是this的connection的起点对应的库所mark值减一
      var markerToChangeNode = svg.selectAll("circle").filter(function (d, i) {
        return d3.select(this).attr("id") == input_places[w]
      })
      //console.log(markerToChangeNode)
      //console.log(markerToChangeNode.attr("token_color_num").split(',').map(i => parseInt(i, 0)))
      var temp2 = markerToChangeNode.attr("token_color_num").split(',').map(i => parseInt(i, 0))
      // console.log(temp2)
      // console.log(temp2.length)
      temp2[a] = temp2[a] - 1
      markerToChangeNode.attr("token_color_num", temp2)
      //console.log(temp2)
      //console.log(markerToChangeNode.attr("token_color_num"))
    }
    //   markerToChangeNode.attr("mark"/, parseInt(markerToChangeNode.attr("mark")) - 1)   
    setTimeout(function () {
      for (w1 = 0; w1 < output_places.length; w1++) {
        //若激发，则每个connection的终点库所对应的mark加一
        var markerToChangeNode = svg.selectAll("circle").filter(function (d, i) {
          return d3.select(this).attr("id") == output_places[w1]
        })
        //console.log(markerToChangeNode)
        var temp3 = markerToChangeNode.attr("token_color_num").split(',').map(i => parseInt(i, 0))
        // console.log(temp3)
        // console.log(temp3.length)
        temp3[a] = temp3[a] + 1
        //console.log(temp3)
        markerToChangeNode.attr("token_color_num", temp3)
        //console.log(markerToChangeNode.attr("token_color_num"));
      }
    }, token_v * 2)
  }

  //temp_transition = g1.selectAll("rect").filter(function (d) { return d.id == cursorId });//所有激发的变迁
  temp_transition.push(cursorId);
  console.log(temp_transition);
  start(svg, transitions, links, link_json);
  update(svg, g1);
  timer = setTimeout(play, token_v * 2)//自动激发变迁定时器
}

function stop_play() {
  // 停止演化
  clearTimeout(timer)
  setTimeout(function () {
    start(svg, transitions, links, link_json);
    update(svg, g1);

  }, token_v * 2);
}



//托肯移动
function TK_Move(temp, xymid, temp_1, g1, places, trans_color) {
  var temp_x = 0; var temp_y = 0;
  var temp_Tk = []; var nothing = []; var xyend = [];
  for (m = 0; m < temp.length; m++) {
    temp_x = places.filter(function () {
      return d3.select(this).attr("id") == temp[m]
    })
      .attr("cx");
    temp_y = places.filter(function () {
      return d3.select(this).attr("id") == temp[m]
    })
      .attr("cy");
    temp_Tk.push({ "cx": temp_x, "cy": temp_y })//输入库所托肯所在位置
  };
  for (n = 0; n < temp_1.length; n++) {
    //nodesNum = d3.sum(places.filter(function(){return d3.select(this)}.attr("token_color_num").split(',')))
    //   var a = Number(places.filter(function () {
    //     return d3.select(this).attr("id") == temp_1[i]
    //   }).attr("r_mark"))
    //   var b = Number(places.filter(function () {
    //     return d3.select(this).attr("id") == temp_1[i]
    //   }).attr("y_mark"))
    //   var c = a + b
    //   if (c > 0) {
    //     var cx1 = Number(places.filter(function () {
    //       return d3.select(this).attr("id") == temp_1[i]
    //     }).attr("cx")) + 5 * Math.cos((c + 1) * 2 * Math.PI / (c + 1))//
    //     var cy1 = Number(places.filter(function () {
    //       return d3.select(this).attr("id") == temp_1[i]
    //     }).attr("cy")) + 5 * Math.sin((c + 1) * 2 * Math.PI / (c + 1))
    //     xyend.push({ "cx": cx1, "cy": cy1 })
    //   }
    //   else {
    temp_x = places.filter(function () {
      return d3.select(this).attr("id") == temp_1[n]
    })
      .attr("cx");
    temp_y = places.filter(function () {
      return d3.select(this).attr("id") == temp_1[n]
    })
      .attr("cy");
    xyend.push({ "cx": temp_x, "cy": temp_y })//输出库所所在位置，即托肯移动终点

  }
  tempTK = g1.selectAll("#nothing").data(temp_Tk).enter().append("circle")
    .attr("cx", function (d) { return d.cx; })
    .attr("cy", function (d) { return d.cy; })
    .attr("r", 3)
    .attr("fill", trans_color)
  tempTK.each(function () {
    d3.select(this).transition().duration(token_v) //前半段托肯移动delays
      .attr("cx", Number(xymid[0].cx) + 2)
      .attr("cy", Number(xymid[0].cy) + 20).remove();
  })
  console.log("托肯移动前半段")
  setTimeout(function () {
    tempTK1 = g1.selectAll("#nothing").data(xyend).enter().append("circle")
      .attr("cx", Number(xymid[0].cx) + 2)
      .attr("cy", Number(xymid[0].cy) + 20)
      //.attr("endcx",function(){})
      .attr("r", 3)
      .attr("fill", trans_color)

    tempTK1.each(function () {
      d3.select(this).transition().delay(token_v * 0).duration(token_v) //变迁激发delays和后半段托肯移动delays
        .attr("cx", function (d) { return d.cx })
        .attr("cy", function (d) { return d.cy }).remove();//
    })
  }, token_v);
  console.log("托肯移动后半段")
}

