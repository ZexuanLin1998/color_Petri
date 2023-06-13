var svg, g1, links, places, transitions;
var transition_id = []; var place_id = [];
var place_json = []; var transition_json = []; var link_json = []; var temp_s = []; var temp_t = [];
var currentState = [];
var temp_transitions = [];//可激发便签id
var temp_transition = []; //所有自动激发的变迁
var colors;
var Place_r = 20;
var tk_r = 3;
var translate = "translate(" + (500) + "," + (500) + ")" + "scale(1)";
var trans_w = 8;
var trans_h = 40;
var width = 2000;
var height = 1000;
var token_v = 1000;
var delay_time = 1;
var marksize = 40;
var simulation;
var simulationIsEnable = true;
var allplace_color;


$.getJSON("colored_pn.json", function (data) {
  var temp = data.transitions;
  transition_id = Object.keys(temp)
  transition_json = Object.values(temp)
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
  ticked;
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

function ticked() {
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
    //console.log(d3.select(this).property("token_color_num"))
    nodesNum = d3.sum(d3.select(this).property("token_color_num"))
    //console.log(nodesNum)
    if (nodesNum > 0) {
      if (nodesNum == 1) {
        for (i = 0; i < d3.select(this).property("token_color_num").length; i++) {
          if (d3.select(this).property("token_color_num")[i] != 0) {
            token.push({
              cx: Number(d3.select(this).attr("cx")), cy: Number(d3.select(this).attr("cy")), r: tk_r, tk_color: d3.select(this).property("token_color")[i]
            })
          }
        }
      }
      if (nodesNum > 1) {
        var pp = 0;
        for (m = 0; m < d3.select(this).property("token_color").length; m++) {
          var num = d3.select(this).property("token_color_num")[m]
          if (num > 0) {
            for (n = 0; n < num; n++) {
              pp++;
              var cx1 = Number(d3.select(this).attr("cx")) + 5 * Math.cos(pp * 2 * Math.PI / nodesNum)//
              var cy1 = Number(d3.select(this).attr("cy")) + 5 * Math.sin(pp * 2 * Math.PI / nodesNum)
              token.push({
                cx: cx1, cy: cy1, r: tk_r, tk_color: d3.select(this).property("token_color")[m]
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


function createLayout() {

  // function edistance(link) {
  //   //console.log(link)
  //   return Math.random() * 100 + 50
  // }
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

  places = g1.selectAll("circle").data(place_json).enter().append("circle") //设置库所属性
    .attr("class", "circle")
    .attr("id", function (d, i) { return place_id[i] })
    .attr("r", Place_r)
    .attr("fill", "white")
    .attr("stroke-width", 1.5)
    .attr("stroke", "black")//cx cy
    .property("token_color", function (d, i) { return d3.keys(place_json[i].token) })
    .property("token_color_num", function (d, i) { return d3.values(place_json[i].token) })
    .call(drag);

  transitions = g1.selectAll("rect").data(transition_json).enter().append("rect") //设置变迁属性
    .attr("class", "rect")
    .attr("id", function (d, i) { return transition_id[i] })
    .attr("fill", "white")
    .attr("stroke-width", 1.5)
    .attr("stroke", "black")
    .attr("width", trans_w)
    .attr("height", trans_h)
    .call(drag);

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
    ticked();
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
  var firable_color = []
  console.log("click");           //console.log()用于输出普通信息
  var cursorId = d3.select(this).attr("id");
  console.log(cursorId)
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

  function trans_towhite() {//
    d3.selectAll("rect").filter(function (d, i) {
      return d3.select(this).attr("id") == cursorId
    }).attr("fill", "white")
  }

  var t_colors = transition_json.filter((item, index) => {//变迁所有可能出现颜色
    return item.id == cursorId
  }).map(item => item.colors, this)
  console.log(t_colors[0])

  t_pre_arcs_keys = transition_json.filter((item, index) => {//变迁前向弧键
    return item.id == cursorId
  }).map(item => d3.keys(item.pre_arcs), this)

  t_pre_arcs_values = transition_json.filter((item, index) => {//变迁前向弧值
    return item.id == cursorId
  }).map(item => d3.values(item.pre_arcs), this)
  console.log(t_pre_arcs_keys[0])
  console.log(t_pre_arcs_values[0])


  for (m = 0; m < output_places.length; m++) {//输出库所是否有托肯 容量是否为1
    var c = 0; var d = 0;
    var output_token_color_num = d3.selectAll("circle").filter(function (d, i) {
      return d3.select(this).attr("id") == output_places[m]
    }).property("token_color_num")
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
  // var getKey = (object, value) => {//由值找键
  //   return Object.keys(object).find(key => object[key] == value);
  // }

  for (i = 0; i < t_colors[0].length; i++) {
    var need_token = []; var b = 0;
    for (j = 0; j < t_pre_arcs_values[0].length; j++) {
      var temp = t_pre_arcs_values[0][j][t_colors[0][i]]
      //console.log(temp)
      need_token.push(temp)//需要从前向库所获取托肯颜色     
      console.log(need_token)
      var temp1 = d3.selectAll("circle").filter(function (d, i) { //判断前向库所是否含有该颜色托肯
        return d3.select(this).attr("id") == t_pre_arcs_keys[0][j]
      }).property("token_color")
      console.log(temp1)
      if (temp1.includes(need_token[j])) {
        b++;
      }
    }
    console.log(b)
    console.log(c)
    console.log(d)

    if (b == input_places.length && c == output_places.length && d == output_places.length) {//容量为1且输出库所托肯为0
      console.log(t_colors[0][i], "颜色可激发")
      firable_color.push(t_colors[0][i])
      console.log(firable_color)
    }
    else if (b == input_places.length && d != output_places.length) {
      console.log(t_colors[0][i], "颜色可激发")
      firable_color.push(t_colors[0][i])
    }
    else { console.log("该颜色变迁不可激发",) }
  }
  console.log(need_token)//
  console.log(firable_color)
  if (firable_color.length == 0) {
    console.log("该变迁不可激发")
  }
  else {
    var select_color = firable_color[Math.round(Math.random() * (firable_color.length - 1))]//随机选择变迁颜色进行激发
    //console.log(select_color)
    var trans_color = colors(select_color)
    //console.log(trans_color)
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
        }).property("token_color")
        console.log(input_token_color)
        for (i = 0; i < need_token.length; i++) {//
          if (input_token_color.includes(need_token[i])) {
            var a = IndexOf(input_token_color, need_token[i])
          }
          console.log(a)
          var markerToChangeNode = svg.selectAll("circle").filter(function (d, i) {
            return d3.select(this).attr("id") == input_places[w]
          })
          var temp2 = markerToChangeNode.property("token_color_num")
          console.log(temp2)
          temp2[a] = temp2[a] - 1
        }
        for (p = 0; p < temp2.length; p++) {//
          if (temp2[p] == 0) {
            input_token_color.splice(p)
            temp2.splice(p)
          }
        }
        markerToChangeNode.property("token_color", input_token_color)
        markerToChangeNode.property("token_color_num", temp2)
        console.log(markerToChangeNode.property("token_color"))
        console.log(markerToChangeNode.property("token_color_num"))
      }

      var t_post_values = transition_json.filter((item, index) => {//变迁后向弧值
        return item.id == cursorId
      }).map(item => d3.values(item.post_arcs), this)
      console.log(t_post_values[0])
      //   markerToChangeNode.attr("mark"/, parseInt(markerToChangeNode.attr("mark")) - 1)   
      setTimeout(function () {
        var temp3 = [];
        for (k = 0; k < output_places.length; k++) {
          temp3.push(t_post_values[0][k][select_color])
          console.log(temp3)
          var markerToChangeNode = d3.selectAll("circle").filter(function (d, i) {
            return d3.select(this).attr("id") == output_places[k]
          })
          var temp4 = markerToChangeNode.property("token_color_num")
          console.log(temp4)
          var output_token_color = markerToChangeNode.property("token_color")

          if (temp4.length == 0) {
            output_token_color.push(temp3[k])
            temp4.push(1)
          }
          else if (temp4.length != 0) {
            if (output_token_color.includes(temp3[k])) {
              console.log(output_token_color)
              var d = IndexOf(output_token_color, temp3[k])
              temp4[d] = temp4[d] + 1
            }
            else {
              output_token_color.push(temp3[k])
              console.log(output_token_color)
              var e = IndexOf(output_token_color, temp3[k])
              temp4[e] = temp4[e] + 1
            }
          }
          markerToChangeNode.property("token_color", output_token_color)
          markerToChangeNode.property("token_color_num", temp4)
          console.log(markerToChangeNode.property("token_color"))
          console.log(markerToChangeNode.property("token_color_num"));
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
      nodesNum = d3.sum(d3.select(this).property("token_color_num"))
      // console.log(nodesNum)
      if (nodesNum > 0) {
        if (nodesNum == 1) {
          for (i = 0; i < d3.select(this).property("token_color_num").length; i++) {
            if (d3.select(this).property("token_color_num")[i] != 0) {
              token.push({
                cx: Number(d3.select(this).attr("cx")), cy: Number(d3.select(this).attr("cy")), r: tk_r, tk_color: d3.select(this).property("token_color")[i]
              })
            }
          }
        }
        if (nodesNum > 1) {
          var pp = 0;
          for (m = 0; m < d3.select(this).property("token_color").length; m++) {
            var num = d3.select(this).property("token_color_num")[m]
            if (num > 0) {
              for (n = 0; n < num; n++) {
                pp++;
                var cx1 = Number(d3.select(this).attr("cx")) + 5 * Math.cos(pp * 2 * Math.PI / nodesNum)//
                var cy1 = Number(d3.select(this).attr("cy")) + 5 * Math.sin(pp * 2 * Math.PI / nodesNum)
                token.push({
                  cx: cx1, cy: cy1, r: tk_r, tk_color: d3.select(this).property("token_color")[m]
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
  var tokens = new Array;
  places.each(function (d, i) { tokens.push({ "token_color_num": d3.select(this).property("token_color_num") }) });
  currentState.push(tokens)//更新当前状态标识
  console.log(currentState)
}

function start(svg) {//判断所有可激发变迁，
  var firable_transition = []
  svg.selectAll("rect").each(function (d, i) {
    var nowId = d3.select(this).attr("id")
    //console.log(nowId)
    var input_places = link_json.filter((item, index) => {
      return item.target.id == nowId
    }).map(item => item.source.id, this)
    //console.log(input_places, '输入库所')

    var output_places = link_json.filter((item, index) => {
      return item.source.id == nowId
    }).map(item => item.target.id, this)
    //console.log(output_places, '输出库所')

    var t_colors = transition_json.filter((item, index) => {//变迁所有可能出现颜色
      return item.id == nowId
    }).map(item => item.colors, this)
    //console.log(t_colors[0])

    t_pre_arcs_keys = transition_json.filter((item, index) => {//变迁前向弧键
      return item.id == nowId
    }).map(item => d3.keys(item.pre_arcs), this)

    t_pre_arcs_values = transition_json.filter((item, index) => {//变迁前向弧值
      return item.id == nowId
    }).map(item => d3.values(item.pre_arcs), this)


    // console.log(t_pre_arcs_keys[0])
    // console.log(t_pre_arcs_values[0])
    // console.log(t_post_arcs_values[0])

    for (m = 0; m < output_places.length; m++) {//输出库所是否有托肯  输出库所容量是否为1
      var d = 0; var c = 0;
      var output_token_color_num = d3.selectAll("circle").filter(function (d, i) {
        return d3.select(this).attr("id") == output_places[m]
      }).property("token_color_num")
      var output_places_capacity = place_json.filter((item, index) => {//变迁后向弧值
        return item.id == output_places[m]
      }).map(item => item.capacity, this)
      //console.log(output_token_color_num)
      //console.log(output_places_capacity)
      if (!output_token_color_num.includes(1)) {
        c++
      }
      if (!output_places_capacity.includes(0)) {
        d++
      }
    }
    // var getKey = (object, value) => {//由值找键
    //   return Object.keys(object).find(key => object[key] == value);
    // }
    for (i = 0; i < t_colors[0].length; i++) {//输入库所是否含有激发某个颜色变迁所需要的托肯
      var need_token = []; var b = 0;
      for (j = 0; j < t_pre_arcs_values[0].length; j++) {
        var temp = t_pre_arcs_values[0][j][t_colors[0][i]]
        //console.log(temp)
        need_token.push(temp)//需要从前向库所获取托肯颜色     
        //console.log(need_token)
        var temp1 = d3.selectAll("circle").filter(function (d, i) { //判断前向库所是否含有该颜色托肯
          return d3.select(this).attr("id") == t_pre_arcs_keys[0][j]
        }).property("token_color")
        //console.log(temp1)
        if (temp1.includes(need_token[j])) {
          b++;
        }
      }
      // console.log(b)
      // console.log(c)
      // console.log(d)

      if (b == input_places.length && c == output_places.length && d == output_places.length) {//容量为1且输出库所托肯为0
        //console.log(t_colors[0][i], "颜色可激发")
        firable_transition.push([nowId, t_colors[0][i]])
      }
      else if (b == input_places.length && d != output_places.length) {
        //console.log(t_colors[0][i], "颜色可激发")
        firable_transition.push([nowId, t_colors[0][i]])
      }
      //else { console.log(nowId, t_colors[0][i], "该颜色变迁不可激发",) }
    }
  })
  console.log(firable_transition)//当前状态下所有可激发变迁颜色
  temp_transitions = firable_transition;
  // unique1(arr);
  // function unique1(arr) {
  //   for (var i = 0; i < arr.length; i++) {
  //     if (firable_transition.indexOf(arr[i]) == -1) {
  //       firable_transition.push(arr[i]);
  //     }
  //   }
  //   return firable_transition;
  // }
  // console.log(firable_transition)
}

function play() {//auto play
  start(svg, transitions, links, link_json);
  update(svg, g1);
  var temp = [];
  console.log(temp_transitions)
  temp = temp_transitions[Math.round(Math.random() * (temp_transitions.length - 1))]
  console.log(temp)
  var cursorId = temp[0];//随机选择一个id
  var cursorId_color = temp[1];
  // console.log(cursorId)
  // console.log(cursorId_color)

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

  t_pre_arcs_values = transition_json.filter((item, index) => {//变迁前向弧值
    return item.id == cursorId
  }).map(item => d3.values(item.pre_arcs), this)

  need_token = [];
  for (j = 0; j < t_pre_arcs_values[0].length; j++) {
    var temp2 = t_pre_arcs_values[0][j][cursorId_color]
    need_token.push(temp2)//需要从前向库所获取托肯颜色       
  }
  var trans_color = colors(cursorId_color)
  console.log(trans_color)
  setTimeout(changeColor, token_v)
  function changeColor() {
    g1.selectAll("rect").filter(function (d, i) {
      return d3.select(this).attr("id") == cursorId
    }).attr("fill", trans_color)
  }
  setTimeout(trans_towhite, token_v * 2)
  function trans_towhite() {//
    g1.selectAll("rect").filter(function (d, i) {
      return d3.select(this).attr("id") == cursorId
    }).attr("fill", "white")
  }
  TK_Move(input_places, xymid, output_places, g1, places, trans_color); //计算托肯移动位置

  激发变迁_前后库所_标识处理(input_places, output_places)
  function 激发变迁_前后库所_标识处理(input_places, output_places) {//
    // 本函数将改变DOM树
    function IndexOf(arr, item) {
      return arr.indexOf(item)
    }
    for (w = 0; w < input_places.length; w++) {
      //若激发，则每个终点是this的connection的起点对应的库所mark值减一
      var markerToChangeNode = svg.selectAll("circle").filter(function (d, i) {
        return d3.select(this).attr("id") == input_places[w]
      })
      var input_token_color = markerToChangeNode.property("token_color")
      console.log(input_token_color)
      for (i = 0; i < need_token.length; i++) {//
        if (input_token_color.includes(need_token[i])) {
          var a = IndexOf(input_token_color, need_token[i])
        }
        console.log(a)
        var temp3 = markerToChangeNode.property("token_color_num")
        console.log(temp3)
        temp3[a] = temp3[a] - 1
      }
      for (p = 0; p < temp3.length; p++) {//
        if (temp3[p] == 0) {
          input_token_color.splice(p)
          temp3.splice(p)
        }
      }
      markerToChangeNode.property("token_color", input_token_color)
      markerToChangeNode.property("token_color_num", temp3)
      console.log(markerToChangeNode.property("token_color"))
      console.log(markerToChangeNode.property("token_color_num"))
    }
    t_post_values = transition_json.filter((item, index) => {//变迁后向弧值
      return item.id == cursorId
    }).map(item => d3.values(item.post_arcs), this)
    console.log(t_post_values[0][0])
    //   markerToChangeNode.attr("mark"/, parseInt(markerToChangeNode.attr("mark")) - 1)   
    setTimeout(function () {
      console.log(cursorId_color)
      var temp3 = [];
      for (k = 0; k < output_places.length; k++) {
        temp3.push(t_post_values[0][k][cursorId_color])
        console.log(temp3)
        var markerToChangeNode = d3.selectAll("circle").filter(function (d, i) {
          return d3.select(this).attr("id") == output_places[k]
        })
        var temp4 = markerToChangeNode.property("token_color_num")
        console.log(temp4)
        var output_token_color = markerToChangeNode.property("token_color")

        if (temp4.length == 0) {
          output_token_color.push(temp3[k])
          temp4.push(1)
        }
        else if (temp4.length != 0) {
          if (output_token_color.includes(temp3[k])) {
            console.log(output_token_color)
            var d = IndexOf(output_token_color, temp3[k])
            temp4[d] = temp4[d] + 1
          }
          else {
            output_token_color.push(temp3[k])
            console.log(output_token_color)
            var e = IndexOf(output_token_color, temp3[k])
            temp4[e] = temp4[e] + 1
          }
        }
        markerToChangeNode.property("token_color", output_token_color)
        markerToChangeNode.property("token_color_num", temp4)
        console.log(markerToChangeNode.property("token_color"))
        console.log(markerToChangeNode.property("token_color_num"));
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
  //console.log("托肯移动后半段")
}

