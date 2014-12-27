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

  var _addEndpoints = function(toId, sourceAnchors, targetAnchors) {
    for (var i = 0; i < sourceAnchors.length; i++) {
      var sourceUUID = toId + sourceAnchors[i];
      instance.addEndpoint("flowchart" + toId, sourceEndpoint, { anchor: sourceAnchors[i], uuid: sourceUUID });
    }
    for (var j = 0; j < targetAnchors.length; j++) {
      var targetUUID = toId + targetAnchors[j];
      instance.addEndpoint("flowchart" + toId, targetEndpoint, { anchor: targetAnchors[j], uuid: targetUUID });
    }
  };

  // suspend drawing and initialise.
  instance.doWhileSuspended(function() {

    _addEndpoints("Window1", ["BottomCenter"], ["TopCenter"]);
    _addEndpoints("Window2", ["BottomCenter"], ["TopCenter"]);
    _addEndpoints("Window3", ["BottomCenter"], ["TopCenter"]);
    _addEndpoints("Window4", ["BottomCenter"], ["TopCenter"]);


    // listen for new connections; initialise them the same way we initialise the connections at startup.
    instance.bind("connection", function(connInfo, originalEvent) {
      init(connInfo.connection);
    });

    // make all the window divs draggable
    instance.draggable(jsPlumb.getSelector(".flowchart-demo .window"), { grid:  [20, 20] });
    // THIS DEMO ONLY USES getSelector FOR CONVENIENCE. Use your library's appropriate selector
    // method, or document.querySelectorAll:
    //jsPlumb.draggable(document.querySelectorAll(".window"), { grid:  [20, 20] });

    // connect a few up
    instance.connect({uuids: ["Window1BottomCenter", "Window2TopCenter"], editable: true});
    instance.connect({uuids: ["Window2BottomCenter", "Window3TopCenter"], editable: true});
    instance.connect({uuids: ["Window2BottomCenter", "Window4TopCenter"], editable: true});
    //

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
