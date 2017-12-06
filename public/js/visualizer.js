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
    this.nodeMap = {};
    this.canvas = document.getElementById('canvas');
    this.context = canvas.getContext('2d');
    this.context.lineJoin = "round";
    this.nodeRadius = 25;
    this.clientSize = 30;
    this.canvasCenterX = this.canvas.width/2;
    this.canvasCenterY = this.canvas.height/2;

  };

  init(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    let that = this;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        let json = JSON.parse(xhr.responseText);
        // console.log(json);
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
        // console.log(json);
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

    this.renderNodes(nodes);
    this.renderLinks(links);
    if (connectedClients) {
      this.renderConnectedClients(connectedClients);
    }
  }

  renderConnectedClients(nodesWithClients) {
    for (var connectedNode of Object.keys(nodesWithClients)) {
      var node = this.nodeMap[connectedNode];
      var clients = nodesWithClients[connectedNode];
      this.drawConnectedClients(node, clients);
    }
  }

  drawConnectedClients(node, clients) {
    let radius = Math.min(this.canvas.height,this.canvas.width) / 6;
    this.context.fillStyle = 'blue';
    this.context.strokeStyle = 'black';
    var i = 1;
    console.log("nodeAngle: "+node.Angle);
    var step = (2/(clients.length+1));
    console.log("step: "+step);
    for (var clientInfo of clients) {
      var angle = (node.Angle - 1) + i*step;
      i += 1;
      var clientX = Math.cos(angle) * radius + node.X;
      var clientY = Math.sin(angle) * radius + node.Y;
      this.context.beginPath();
      this.context.rect(clientX - (this.clientSize/2), clientY - (this.clientSize/2), this.clientSize, this.clientSize);
      this.context.fill()
      this.context.stroke();

      this.context.beginPath();
      this.context.lineWidth = 3;
      this.context.moveTo(node.X, node.Y);
      this.context.lineTo(clientX, clientY);
      this.context.stroke();
    }
  }

  renderLinks(links) {
    for (var link of links) {
      let node = this.nodeMap[link[0]];
      let linkedNode = this.nodeMap[link[1]];
      if (node && linkedNode) {
        this.drawLink(node, linkedNode);
      }
    }
  }

  renderNodes(nodes) {
    let radius = Math.min(this.canvas.height, this.canvas.width) / 4;

    let i = 0
    for (var node of nodes) {
      if (this.nodeMap[node]) {
        var nodeX = this.nodeMap[node].X
        var nodeY = this.nodeMap[node].Y
        var angle = this.nodeMap[node].Angle
      } else {
        var angle = i * ((Math.PI * 2) / this.numberOfNodes);
        var nodeX = Math.cos(angle) * radius + this.canvasCenterX;
        var nodeY = Math.sin(angle) * radius + this.canvasCenterY;
        this.nodeMap[node] = {X: nodeX, Y: nodeY, Angle: angle};
      }
      i = i + 1;
      this.drawNode(node, nodeX, nodeY);
    }
  }

  drawNode(nodeId, X, Y) {
    this.context.beginPath();
    this.context.arc(X, Y, this.nodeRadius, 0, 2*Math.PI, false);
    this.context.fillStyle = 'green';
    this.context.fill();
    this.context.lineWidth = 3;
    this.context.strokeStyle = '#003300';
    this.context.stroke();
  }

  drawLink(startNode, endNode) {
    this.context.beginPath();
    this.context.moveTo(startNode.X, startNode.Y);
    this.context.lineTo(endNode.X, endNode.Y);
    this.context.stroke();
  }
}

