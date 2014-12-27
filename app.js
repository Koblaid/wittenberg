jsPlumb.ready(function() {

  var instance = jsPlumb.getInstance({
    // default drag options
    DragOptions : { cursor: 'pointer', zIndex: 2000 },
    // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
    // case it returns the 'labelText' member that we set on each connection in the 'init' method below.
    ConnectionOverlays :  [
      [ "PlainArrow", {
        location: 1,
        length: 10,
        width: 10,
      } ]
    ],
    Container: "flowchart-demo"
  });

  // this is the paint style for the connecting lines..
  var connectorPaintStyle = {
    lineWidth: 2,
    strokeStyle: "#61B7CF",
    joinstyle: "round",
    outlineColor: "white",
    outlineWidth: 2
  };
  // .. and this is the hover style.
  var connectorHoverStyle = {
    lineWidth: 2,
    strokeStyle: "#216477",
    outlineWidth: 2,
    outlineColor: "white"
  };
  var endpointHoverStyle = {
    fillStyle: "#216477",
    strokeStyle: "#216477"
  }
  // the definition of source endpoints (the small blue ones)
  var sourceEndpoint = {
    endpoint: "Dot",
    paintStyle: {
      strokeStyle: "#7AB02C",
      fillStyle: "transparent",
      radius: 3,
      lineWidth: 1,
    },
    maxConnections: -1,
    isSource: true,
    connector: [ "Flowchart", { stub: 20, gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ],
    connectorStyle: connectorPaintStyle,
    hoverPaintStyle: endpointHoverStyle,
    connectorHoverStyle: connectorHoverStyle,
    dragOptions: {},
  };
  // the definition of target endpoints (will appear when the user drags a connection)
  var targetEndpoint = {
    endpoint: "Dot",
    paintStyle: {
      fillStyle: "#7AB02C",
      radius: 3
    },
    hoverPaintStyle: endpointHoverStyle,
    maxConnections: -1,
    dropOptions: { hoverClass: "hover", activeClass: "active" },
    isTarget: true,
  };


  var argumentList = localStorage.getItem('arguments');
  argumentList = argumentList ? JSON.parse(argumentList) : [];
  var connectionList = localStorage.getItem('connections');
  connectionList = connectionList ? JSON.parse(connectionList) : [];

  var renderArgument = function(argument){
    var argumentId = 'argument'+argument.id;
    var div = document.createElement('div');
    div.id = argumentId;
    div.className = 'window';
    div.innerHTML = '<strong>'+argument.text+'</strong>';
    div.style.left = argument.x+'px';
    div.style.top = argument.y+'px';
    div.addEventListener('dblclick', function(){
      argument.text = prompt('Edit the text', argument.text);
      div.innerHTML = '<strong>'+argument.text+'</strong>';
      localStorage.setItem('arguments', JSON.stringify(argumentList));
    });
    document.getElementById('flowchart-demo').appendChild(div);
    instance.draggable(div, {
      grid: [20, 20],
      containment:true,
      stop: function(event){
        argument.x = event.pos[0];
        argument.y = event.pos[1];
        localStorage.setItem('arguments', JSON.stringify(argumentList));
      },
    });
    instance.addEndpoint(argumentId, sourceEndpoint, { anchor: 'BottomCenter', uuid: argumentId+'bottom' });
    instance.addEndpoint(argumentId, targetEndpoint, { anchor: 'TopCenter', uuid: argumentId+'top' });
  };

  document.getElementById('add-argument').addEventListener('click', function(){
    var newArgument = {
      id: Math.random().toString(36).substring(7),
      x: 10,
      y: 10,
      text: 'New argument',
    };
    argumentList.push(newArgument);
    localStorage.setItem('arguments', JSON.stringify(argumentList));
    renderArgument(newArgument);
  });


  instance.doWhileSuspended(function() {
    argumentList.forEach(function(argument){
      renderArgument(argument);
    });

    connectionList.forEach(function(connection){
      var from = 'argument'+connection[0]+'bottom';
      var to = 'argument'+connection[1]+'top';
      instance.connect({uuids: [from, to], editable: true});
    });

   instance.bind("connectionDragStop", function(connection) {
      function cleanId(id){
        return id.substring(8, id.length);
      }

      if(connection.suspendedElementId){
        var index;
        connectionList.forEach(function(oldConnection, idx){
          if(oldConnection[0] === cleanId(connection.sourceId) && oldConnection[1] === cleanId(connection.suspendedElementId)){
            index = idx;
          }
        });
        connectionList.splice(index, 1);
      }

      if(connection.endpoints){
        var connection = [cleanId(connection.sourceId), cleanId(connection.targetId)];
        connectionList.push(connection);
      }

      localStorage.setItem('connections', JSON.stringify(connectionList));
    });
  });

  jsPlumb.fire("jsPlumbDemoLoaded", instance);

});
