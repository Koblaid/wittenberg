jsPlumb.ready(function() {

  var instance = jsPlumb.getInstance({
    DragOptions : { cursor: 'pointer', zIndex: 2000 },
    ConnectionOverlays :  [
      [ "PlainArrow", {
        location: 1,
        length: 10,
        width: 10,
      } ]
    ],
    Container: "flowchart-demo"
  });

  var connectorPaintStyle = {
    lineWidth: 2,
    strokeStyle: "#61B7CF",
    joinstyle: "round",
    outlineColor: "white",
    outlineWidth: 2
  };
  var connectorHoverStyle = {
    lineWidth: 2,
    strokeStyle: "#216477",
    outlineWidth: 2,
    outlineColor: "white"
  };
  var endpointHoverStyle = {
    fillStyle: "#216477",
    strokeStyle: "#216477"
  };

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


  instance.bind('connection', function (info, originalEvent) {
    var connection = info.connection;
    connection.bind('contextmenu', function(connection, originalEvent) {
      jsPlumb.detach(connection);

      function cleanId(id){
        return id.substring(9, id.length);
      }

      connectionList = connectionList.filter(function(conn){
        var isRemovedConnection = conn[0] === cleanId(connection.sourceId) && conn[1] === cleanId(connection.targetId);
        return !isRemovedConnection;
      });
      safe();

      originalEvent.preventDefault();
    });
  });

  var argumentList = [];
  var connectionList = [];
  if(window.location.pathname.length > 1){
    var sid = window.location.pathname.substring(1);
    var r = new XMLHttpRequest();
    r.open('GET', '/api/discussion/'+sid);
    r.responseType = 'json';
    r.onreadystatechange = function(){
      if (r.readyState === 4){
        if(r.status === 200){
          var result = r.response;
          argumentList = result.arguments;
          connectionList = result.connections;
          instance.doWhileSuspended(renderAll);
          document.getElementById('argument-url').value = window.location.href;
        } else {
          return console.log('AJAX error', r.status, r.readyState);
        }
      }
    };
    r.send();
  } else {
    argumentList = localStorage.getItem('arguments');
    argumentList = argumentList ? JSON.parse(argumentList) : [];
    connectionList = localStorage.getItem('connections');
    connectionList = connectionList ? JSON.parse(connectionList) : [];
  }

  var safe = function(callback){
    if(window.location.pathname.length <= 1){
      return;
    }
    var sid = window.location.pathname.substring(1);

    var data = {
      arguments: argumentList,
      connections: connectionList,
    };
    var r = new XMLHttpRequest();
    r.open('PUT', '/api/discussion/'+sid);
    r.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    r.onreadystatechange = function(){
      if (r.readyState === 4) {
        if (r.status === 200) {
          callback && callback(r.responseText);
        } else {
          return console.log('AJAX error', r.status, r.readyState);
        }
      }
    };
    r.send(JSON.stringify(data));
  };


  var renderArgument = function(argument){
    var argumentId = 'argument-'+argument.id;
    var div = document.createElement('div');
    div.id = argumentId;
    div.className = 'window';
    div.innerHTML = '<div class="argument-content">'+argument.text+'</div>';
    div.style.left = argument.x+'px';
    div.style.top = argument.y+'px';
    div.addEventListener('dblclick', function(){
      var newText = prompt('Edit the text', argument.text);
      if(newText !== null){
        argument.text = newText;
        div.innerHTML = '<div class="argument-content">'+argument.text+'</div>';
        safe();
      }
    });
    div.addEventListener('contextmenu', function(e){
      e.preventDefault();
      if (confirm('Delete argument "'+argument.text+'?')) {
        argumentList = argumentList.filter(function(arg){
          return argument.id !== arg.id;
        });
        connectionList = connectionList.filter(function(conn){
          return (conn[0] !== argument.id & conn[1] !== argument.id);
        });
        safe();
        instance.removeAllEndpoints(argumentId);
        div.remove();
      }
    });

    div.addEventListener('click', function(e){
      var traverse = function(currentArgument, color, direction){
        var sourceConnIdx = direction === 'down' ? 0 : 1;
        var targetConnIdx = direction === 'down' ? 1 : 0;
        connectionList.forEach(function(connection){
          if(connection[sourceConnIdx] === currentArgument.id){
            argumentList.forEach(function(arg){
              if(arg.id === connection[targetConnIdx]){
                var lowerDiv = document.getElementById('argument-'+arg.id);
                var newColor = color === 'green' ? 'red' : 'green';
                lowerDiv.style['background-color'] = newColor;
                traverse(arg, newColor, direction);
                if(direction === 'up'){
                  traverse(arg, newColor, 'down');
                }
              }
            });
          }
        });
      };

      div.style['background-color'] = 'green';
      traverse(argument, 'green', 'down');
      traverse(argument, 'green', 'up');
    });

    document.getElementById('flowchart-demo').appendChild(div);
    instance.draggable(div, {
      grid: [20, 20],
      containment:true,
      stop: function(event){
        argument.x = event.pos[0];
        argument.y = event.pos[1];
        safe();
      },
    });
    instance.addEndpoint(argumentId, sourceEndpoint, { anchor: 'BottomCenter', uuid: argumentId+'-bottom' });
    instance.addEndpoint(argumentId, targetEndpoint, { anchor: 'TopCenter', uuid: argumentId+'-top' });
  };

  var renderAll = function(){
    argumentList.forEach(function(argument){
      renderArgument(argument);
    });

    connectionList.forEach(function(connection){
      var from = 'argument-'+connection[0]+'-bottom';
      var to = 'argument-'+connection[1]+'-top';
      instance.connect({uuids: [from, to], editable: true});
    });
  };

  var lastPosY = 0;
  document.getElementById('add-argument').addEventListener('click', function(){
    lastPosY = lastPosY > 500 ? 0 : lastPosY+75;
    var newArgument = {
      id: Math.random().toString(36).substring(8),
      x: 500,
      y: lastPosY,
      text: 'New argument',
    };
    argumentList.push(newArgument);
    safe();
    renderArgument(newArgument);
  });


  function clearAll(){
    instance.detachEveryConnection();
    instance.deleteEveryEndpoint();
    var arguments = document.querySelectorAll('.window');
    Array.prototype.forEach.call(arguments, function(argument){
      argument.remove();
    });
  }

  document.getElementById('import-export').addEventListener('click', function(){
    var currentState = {
      arguments: argumentList,
      connections: connectionList,
    };
    var newState = prompt('Import/export the current arguments', JSON.stringify(currentState));
    if(newState){
      newState = JSON.parse(newState);
      clearAll();
      argumentList = newState.arguments;
      connectionList = newState.connections;
      instance.doWhileSuspended(renderAll);
      safe();
    }
  });


  document.getElementById('clear').addEventListener('click', function(){
    var choice = confirm('Are you sure you want to remove all arguments?');
    if(choice === true){
      clearAll();
      lastPosY = 0;
      argumentList = [];
      connectionList = [];
      safe();
    }
  });


  document.getElementById('save').addEventListener('click', function(){
    safe(function(responseText){
      window.history.pushState(responseText, 'Wittenberg', '/' + r.responseText);
      document.getElementById('argument-url').value = window.location.href;
    });
  });


  instance.doWhileSuspended(function() {
    renderAll();

   instance.bind("connectionDragStop", function(connection) {
      function cleanId(id){
        return id.substring(9, id.length);
      }

      if(connection.suspendedElementId){
        connectionList = connectionList.filter(function(conn){
          var isRemovedConnection = conn[0] === cleanId(connection.sourceId) && conn[1] === cleanId(connection.suspendedElementId);
          return !isRemovedConnection;
        });
      }

      if(connection.endpoints){
        var connection = [cleanId(connection.sourceId), cleanId(connection.targetId)];
        connectionList.push(connection);
      }

      safe();
    });
  });
});
