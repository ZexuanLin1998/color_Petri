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