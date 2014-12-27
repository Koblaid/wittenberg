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

  var init = function(connection) {
    connection.bind("editCompleted", function(o) {
      console.log("connection edited. path is now ", o.path);
    });
  };


  var renderArgument = function(argument){
    var currentText = argument.text;
    var argumentId = 'argument'+argument.id;
    var div = document.createElement('div');
    div.id = argumentId;
    div.className = 'window';
    div.innerHTML = '<strong>'+currentText+'</strong>';
    div.style.left = argument.x+'px';
    div.style.top = argument.y+'px';
    div.addEventListener('dblclick', function(){
      currentText = prompt('Edit the text', currentText);
      div.innerHTML = '<strong>'+currentText+'</strong>';
    });
    document.getElementById('flowchart-demo').appendChild(div);
    instance.draggable(div, {grid:  [20, 20], containment:true});
    instance.addEndpoint(argumentId, sourceEndpoint, { anchor: 'BottomCenter', uuid: argumentId+'bottom' });
    instance.addEndpoint(argumentId, sourceEndpoint, { anchor: 'TopCenter', uuid: argumentId+'top' });
  };

  document.getElementById('add-argument').addEventListener('click', function(){
    var newArgument = {id: 5, x: 10, y: 10, text: 'New argument'};
    renderArgument(newArgument);
  });

  // suspend drawing and initialise.
  instance.doWhileSuspended(function() {
    var arguments = [
      {id: 1, x: 200, y:  50, text: 'Kernkraft ist gut'},
      {id: 2, x: 200, y: 150, text: 'Gefahr von Unfall ist groß'},
      {id: 3, x: 100, y: 260, text: 'Tschernobyl'},
      {id: 4, x: 300, y: 260, text: 'Fukushima'},
    ];

    var connections = [
      [1, 2],
      [2, 3],
      [2, 4]
    ];

    arguments.forEach(function(argument){
      renderArgument(argument);
    });

    connections.forEach(function(connection){
      var from = 'argument'+connection[0]+'bottom';
      var to = 'argument'+connection[1]+'top';
      instance.connect({uuids: [from, to], editable: true});
    });


    // listen for new connections; initialise them the same way we initialise the connections at startup.
    instance.bind("connection", function(connInfo, originalEvent) {
      init(connInfo.connection);
    });

    //
    // listen for clicks on connections, and offer to delete connections on click.
    //
    instance.bind("click", function(conn, originalEvent) {
      if (confirm("Delete connection from " + conn.sourceId + " to " + conn.targetId + "?"))
        jsPlumb.detach(conn);
    });

    instance.bind("connectionDrag", function(connection) {
      console.log("connection " + connection.id + " is being dragged. suspendedElement is ", connection.suspendedElement, " of type ", connection.suspendedElementType);
    });

    instance.bind("connectionDragStop", function(connection) {
      console.log("connection " + connection.id + " was dragged");
    });

    instance.bind("connectionMoved", function(params) {
      console.log("connection " + params.connection.id + " was moved");
    });
  });

  jsPlumb.fire("jsPlumbDemoLoaded", instance);

});
