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
    this.context.textAlign = "center";
    this.context.font = "12px Arial";
    this.canvasCenterX = this.canvas.width/2;
    this.canvasCenterY = this.canvas.height/2;

    this.nodeRadius = 35;
    this.nodeRingRadius = Math.min(this.canvas.height, this.canvas.width) / 4;
    this.clientSize = 30;
    // this.clientRingRadius = Math.min(this.canvas.height, this.canvas.width) / 3;
    this.clientRingRadius = Math.min(this.canvas.height,this.canvas.width) / 6;
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

    var nodes = networkEvent.nodes;
    var links = networkEvent.links;
    var connectedClients = networkEvent.connected_clients;
    var messages = networkEvent.messages;

    this.renderNodes(nodes);
    this.renderLinks(links);
    if (connectedClients) {
      this.renderConnectedClients(connectedClients);
    }
    if (messages) {
      this.renderMessages(messages)
    }
  }

  renderMessages(nodesWithMessages) {
    for (var node of Object.keys(nodesWithMessages)) {
      var messages = nodesWithMessages[node];
      node = this.objectMap[node];

      var i = 0;
      for (var message of messages) {
        var messageX = node.X + 90 + i;
        var messageY = node.Y - 50 - i;
        i += 10;
        this.drawMessage(message, messageX, messageY);
      }
    }
  }

  drawMessage(messageInfo, X, Y) {
    console.log("messagePos: ("+X+", "+Y+")");
    this.context.beginPath();
    this.context.rect(X - (this.messageWidth/2), Y - (this.messageHeight/2), this.messageWidth, this.messageHeight)
    this.context.fillStyle = "rgb(255, 255, 153)";
    this.context.fill();
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = 'black';
    this.context.fillText("from: "+messageInfo.from, X, Y-(this.messageHeight/2)+(this.messageSpacing*2));
    this.context.fillText("to: "+messageInfo.to, X, Y-(this.messageHeight/2)+(this.messageSpacing*3));
    this.context.fillText(messageInfo.message, X, Y-(this.messageHeight/2)+(this.messageSpacing*4));
  }

  renderConnectedClients(nodesWithClients) {
    for (var connectedNode of Object.keys(nodesWithClients)) {
      var node = this.objectMap[connectedNode];
      var clients = nodesWithClients[connectedNode];
      this.drawConnectedClients(node, clients);
    }
  }

  drawConnectedClients(node, clients) {
    this.context.fillStyle = 'lightgrey';
    this.context.strokeStyle = 'black';
    var i = 1;
    var step = (2/(clients.length+1));
    for (var clientInfo of clients) {
      var angle = (node.Angle - 1) + i*step;
      i += 1;
      var clientX = Math.cos(angle) * this.clientRingRadius + node.X;
      var clientY = Math.sin(angle) * this.clientRingRadius + node.Y;
      this.objectMap[clientInfo.pid] = {X: clientX, Y: clientY, Angle: angle}

      this.drawNode(clientInfo.username, clientX, clientY, 'grey');

      this.drawLink(node, this.objectMap[clientInfo.pid]);
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
    let radius = this.nodeRingRadius;

    let i = 0
    for (var node of nodes) {
      if (this.objectMap[node]) {
        var nodeX = this.objectMap[node].X
        var nodeY = this.objectMap[node].Y
        var angle = this.objectMap[node].Angle
      } else {
        var angle = i * ((Math.PI * 2) / this.numberOfNodes);
        var nodeX = Math.cos(angle) * radius + this.canvasCenterX;
        var nodeY = Math.sin(angle) * radius + this.canvasCenterY;
        this.objectMap[node] = {X: nodeX, Y: nodeY, Angle: angle};
      }
      i = i + 1;
      this.drawNode(node, nodeX, nodeY, 'white');
    }
  }

  drawNode(label, X, Y, color) {
    this.context.beginPath();
    this.context.arc(X, Y, this.nodeRadius, 0, 2*Math.PI, false);
    this.context.fillStyle = color;
    this.context.fill();
    this.context.lineWidth = 3;
    this.context.strokeStyle = '#003300';
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = 'black';
    this.context.fillText(label, X, Y);
  }

  drawLink(startNode, endNode) {
    console.log("from: ("+startNode.X+", "+startNode.Y+")");
    console.log("to: ("+endNode.X+", "+endNode.Y+")");
    let distX = endNode.X - startNode.X;
    let distY = endNode.Y - startNode.Y;
    let radAngle = Math.atan2(distY, distX);
    let degAngle = radAngle * 180 / Math.PI
    console.log("distX: "+distX+", distY: "+distY+", degAngle: "+degAngle);
    let startBorderX = startNode.X + (this.nodeRadius * Math.cos(radAngle))
    let startBorderY = startNode.Y + (this.nodeRadius * Math.sin(radAngle))
    let endBorderX = endNode.X - (this.nodeRadius * Math.cos(radAngle))
    let endBorderY = endNode.Y - (this.nodeRadius * Math.sin(radAngle))

    this.context.beginPath();
    this.context.moveTo(startBorderX, startBorderY);
    this.context.lineTo(endBorderX, endBorderY);
    this.context.stroke();
  }
}

