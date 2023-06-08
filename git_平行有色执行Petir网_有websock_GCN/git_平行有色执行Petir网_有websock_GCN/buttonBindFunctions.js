function add_transition() {
  //!! add_place 和 add_transition 函数有bug，增加了之后变迁的长方形会消失。后续改正
  var input1 = d3.select("#input1").property("value")
  var input2 = d3.select("#input2").property("value")
  var input3 = d3.select("#input3").property("value")
  //找到指向新增对象的库所
  var s1 = findAddedNode(nodes, input1);
  var s2 = findAddedNode(nodes, input2);
  console.assert(s1 != false)
  console.assert(s2 != false)
  var ind_places = num_places + 1;
  nodes.splice(num_places, 0, { id: "p" + ind_places, mark: Number(input3) });
  place_json.push({ id: "p" + ind_places, mark: Number(input3) });
  if (input1 != "") { links_json.push({ source: s1, target: nodes[num_places], sour: input1, end: "p" + ind_places }); }
  if (input2 != "") { links_json.push({ source: nodes[num_places], target: s2, sour: "p" + ind_places, end: input2 }); }
  num_places++;
  for (i = 0; i < nodes.length; i++) {
    if (i < num_places) {
      place_json[i] = nodes[i];
    } else {
      transition_json[i - num_places] = nodes[i];
    }
  }
  update_place();
}
function add_place() {
  var input1 = d3.select("#input1").property("value")
  var input2 = d3.select("#input2").property("value")
  console.log(input1)
  if (input1 == "") {
    alert("请输入正确起始或终止位置")
  }
  else {
    //找到指向新增对象的库所
    var s1 = findAddedNode(nodes, input1);
    var s2 = findAddedNode(nodes, input2);
    console.assert(s1 != false)
    console.assert(s2 != false)
    var ind_transitions = num_transitions + 1;
    nodes.push({ id: "t" + ind_transitions });
    transition_json.push({ id: "t" + ind_transitions });
    links_json.push({ source: s1, target: nodes[nodes.length - 1], sour: input1, end: "t" + ind_transitions });
    links_json.push({ source: nodes[nodes.length - 1], target: s2, sour: "t" + ind_transitions, end: input2 });
    num_transitions++;
    for (i = 0; i < nodes.length; i++) {
      if (i < num_places) {
        place_json[i] = nodes[i];
      } else {
        transition_json[i - num_places] = nodes[i];
      }
    }
    update_transition();
  }
}
function look_up_json(){
  const output_json = save_json()
  console.log(output_json)
}
function 下载json(){
  const output_json = save_json()
  saveJSON(output_json, "position.json")
}
function stopsimulation(){
  if(simulationIsEnable)
  { //simulation.stop();
    simulationIsEnable=false;
  }
  else
    //alert("simulation has been stoped");
    console.log("simulation has been stoped");
}
function restartsimulation(){
  simulation.alphaTarget(.2).restart();
  simulationIsEnable=true;
}
function backToLastStep(){
  if(currentState.length-1!=0)
  {
    currentState.pop();
    var laststep=currentState.pop();
    //console.log(laststep)
    places.each(function(d,i){
      d3.select(this).attr("mark",function(d){return Number (laststep[i])})    
    })
    start(svg_1,transitions,link,links);
    update(svg_1,g1);
  }
  else
    console.log("this node is root")
}
function close_c(){
// 关闭C++程序
  ws.send("close");
  console.log("close");
}
function stop_play(){
  // 停止演化
  clearTimeout(timer)
  setTimeout(function(){    
    start(svg_1, transitions, link, links_json);
   update(svg_1, g1); }, token_v*2);
}

//****************************************修改distance_row按钮函数**************************************
function Modify_distance_of_rows() {
  var input4 = d3.select("#input4").property("value")
  console.log(input4)
  if (input4 == "") {
    alert("请输入正确的distance_row")
  }
  else {
    distance_row = input4;
    update_transition()
    update_place()
  }
}
//****************************************修改distance_col按钮函数**************************************
function Modify_distance_of_cols() {
  var input5 = d3.select("#input5").property("value")
  console.log(input5)
  if (input5 == "") {
    alert("请输入正确的distance_col")
  }
  else {
    distance_col = input5;
    update_transition()
    update_place()
  }
}
//****************************************修改token_v按钮函数************************************
function Modify_token_v() {
  var input6 = d3.select("#input6").property("value")
  console.log(input6)
  if (input6 == "") {
    alert("请输入正确的速度")
  }
  else {
    token_v = 1 / (input6 / 100000);
  }
}

function hide_popups(){
  $(".on_changes").hide();
}
