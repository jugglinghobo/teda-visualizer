window.onload = function() {
  let visualizer = new NetworkVisualizer();
  visualizer.init('/init');

  document.getElementById('prev').addEventListener('click', function() {
    visualizer.update('/prev_step');
  });

  document.getElementById('next').addEventListener('click', function() {
    visualizer.update('/next_step');
  });
}

class NetworkVisualizer {

  constructor() {
    this.numberOfNodes;
    this.objectMap = {};
    this.canvas = document.getElementById('canvas');
    this.context = canvas.getContext('2d');
    this.context.lineJoin = "round";
    this.context.font = "12px Arial";
    this.context.lineWidth = 2;
    this.canvasCenterX = this.canvas.width/2;
    this.canvasCenterY = this.canvas.height/2;

    this.nodeRadius = 35;
    this.nodeSize = 80;
    this.nodeRingRadius = Math.min(this.canvas.height, this.canvas.width) / 4;
    this.clientSize = 30;
    this.clientRingRadius = Math.min(this.canvas.height,this.canvas.width) / 4;
    this.messageWidth = 150;
    this.messageHeight = 70;
    this.messageSpacing = 12;
  };

  init(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    let that = this;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        let json = JSON.parse(xhr.responseText);
        that.numberOfNodes = json.numberOfNodes;
      }
    }
    xhr.send();
  }

  update(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    let that = this;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        let json = JSON.parse(xhr.responseText);
        if (json.error == "next") {
          document.getElementById('next').disabled = true;
        } else if (json.error == "prev") {
          that.init('/nodes');
          document.getElementById('prev').disabled = true;
        } else {
          document.getElementById('next').disabled = false;
          document.getElementById('prev').disabled = false;
          that.updateNetworkState(JSON.parse(xhr.responseText));
        }
      }
    }
    xhr.send();
  }


  updateNetworkState(networkEvent) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.beginPath();
    this.context.fill();

    let event = networkEvent.event;
    let nodes = networkEvent.nodes;
    let links = networkEvent.links;
    let connectedClients = networkEvent.connected_clients;
    let available_clients = networkEvent.available_clients;
    let messages = networkEvent.messages;

    this.updateNodeObjectMap(nodes);
    this.updateConnectedClientObjectMap(connectedClients);


    // links, connected clients and nodes must be in this order!
    this.renderLinks(links);
    this.renderConnectedClients(connectedClients);
    this.renderNodes(nodes);

    this.renderEvent(event);
    this.renderAvailableClients(available_clients)
    this.renderMessages(messages)
  }

  updateNodeObjectMap(nodes) {
    let i = 0;
    for (var node of nodes) {
      let angle = i * ((Math.PI * 2) / this.numberOfNodes);
      let nodeX = Math.round(Math.cos(angle) * this.nodeRingRadius + this.canvasCenterX) - (this.nodeSize/2);
      let nodeY = Math.round(Math.sin(angle) * this.nodeRingRadius + this.canvasCenterY) - (this.nodeSize/2);
      this.objectMap[node] = {
        name: node,
        x: nodeX,
        y: nodeY,
        cx: nodeX + (this.nodeSize/2),
        cy: nodeY + (this.nodeSize/2),
        angle: angle
      }
      i = i + 1;
    }
  }

  updateConnectedClientObjectMap(nodesWithClients) {
    for (var connectedNode of Object.keys(nodesWithClients)) {
      var nodeInfo = this.objectMap[connectedNode];
      var clients = nodesWithClients[connectedNode];
      var step = (2/(clients.length+1));

      var i = 1;
      for (var clientInfo of clients) {
        var angle = (nodeInfo.angle - 1) + i*step;
        var clientX = Math.round(Math.cos(angle) * this.clientRingRadius + nodeInfo.x);
        var clientY = Math.round(Math.sin(angle) * this.clientRingRadius + nodeInfo.y);
        this.objectMap[clientInfo.pid] = {
          name: clientInfo.username,
          x: clientX,
          y: clientY,
          cx: clientX + (this.nodeSize/2),
          cy: clientY + (this.nodeSize/2),
          angle: angle
        };
        i += 1;
      }
    }
  }

  renderAvailableClients(nodesWithClients) {
    for (var connectedNode of Object.keys(nodesWithClients)) {
      var node = this.objectMap[connectedNode];
      var clients = nodesWithClients[connectedNode];
      this.drawAvailableClients(node, clients);
    }
  }

  drawAvailableClients(nodeInfo, clients) {
    let i = 3
    for (var availableClient of clients) {
      let clientName = availableClient.username;
      let closestNode = availableClient.via;
      let distance = availableClient.distance;

      this.context.fillText(""+clientName+": {"+closestNode+", "+distance+"}", nodeInfo.x, (nodeInfo.y + (i * 12)));
      i += 1
    }
  }

  renderEvent(event) {
    this.context.fillStyle = 'black';
    this.context.font = '16px Arial';
    this.context.fillText(event.log_string, 20, 20);
    this.context.font = '12px Arial';
  }

  renderMessages(nodesWithMessages) {
    for (var node of Object.keys(nodesWithMessages)) {
      var messages = nodesWithMessages[node];
      node = this.objectMap[node];

      var i = 0;
      for (var message of messages) {
        var messageX = node.x + 40 + i;
        var messageY = node.y + 40 - i;
        i += 10;
        this.drawMessage(message, messageX, messageY);
      }
    }
  }

  drawMessage(messageInfo, X, Y) {
    this.context.beginPath();
    this.context.rect(X, Y, this.messageWidth, this.messageHeight)
    this.context.fillStyle = "rgb(255, 255, 153)";
    this.context.fill();
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = 'black';
    this.context.fillText("from: "+messageInfo.from, X, Y+(this.messageSpacing));
    this.context.fillText("to: "+messageInfo.to, X, Y+(this.messageSpacing*2));
    this.context.fillText(messageInfo.message, X, Y+(this.messageSpacing*3));
  }

  renderConnectedClients(nodesWithClients) {
    for (var connectedNode of Object.keys(nodesWithClients)) {
      var node = this.objectMap[connectedNode];
      var clients = nodesWithClients[connectedNode];
      this.drawConnectedClients(node, clients);
    }
  }

  drawConnectedClients(nodeInfo, clients) {
    this.context.strokeStyle = 'black';
    var i = 1;
    var step = (2/(clients.length+1));
    for (var clientInfo of clients) {
      this.drawLink(nodeInfo, this.objectMap[clientInfo.pid]);
      this.drawNode(this.objectMap[clientInfo.pid], 'grey');
    }
  }

  renderLinks(links) {
    for (var link of links) {
      let node = this.objectMap[link[0]];
      let linkedNode = this.objectMap[link[1]];
      if (node && linkedNode) {
        this.drawLink(node, linkedNode);
      }
    }
  }

  renderNodes(nodes) {
    for (var node of nodes) {
      this.drawNode(this.objectMap[node], 'white');
    }
  }

  drawNode(nodeInfo, color) {
    this.context.beginPath();
    this.context.rect(nodeInfo.x, nodeInfo.y, this.nodeSize, this.nodeSize);
    this.context.fillStyle = color;
    this.context.fill();
    this.context.strokeStyle = '#003300';
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = 'black';
    this.context.fillText(nodeInfo.name, nodeInfo.x, (nodeInfo.y + 12));
  }

  drawLink(startNode, endNode) {
    this.context.beginPath();
    this.context.moveTo(startNode.cx, startNode.cy);
    this.context.lineTo(endNode.cx, endNode.cy);
    this.context.stroke();
  }
}

