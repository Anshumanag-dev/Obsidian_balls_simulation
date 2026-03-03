window.onload = () => {
  console.log("script is running");

  const canvas = document.getElementById("nodeCanvas");
  const ctx = canvas.getContext("2d");
  const spawnButton = document.getElementById("spawnNode");
  const springSlider = document.getElementById("springSlider");
  const stringLengthSlider = document.getElementById("stringLengthSlider");
  const boundarySlider = document.getElementById("boundarySlider");
  const wallRangeSlider = document.getElementById("wallRangeSlider");
  const nodeRepulsionSlider = document.getElementById("nodeRepulsionSlider");
  const frictionSlider = document.getElementById("frictionSlider");

  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let nodes = [];
  let links = [];
  let draggingNode = null;
  let linkingSelected = null;
  let dragStart = null;
  let dragged = false;

  
  let springStiffness = parseFloat(springSlider.value);
  let restLength = parseFloat(stringLengthSlider.value);
  let boundaryRepulsion = parseFloat(boundarySlider.value);
  let wallRange = parseFloat(wallRangeSlider.value);
  let nodeRepulsionConstant = parseFloat(nodeRepulsionSlider.value);
  let friction = parseFloat(frictionSlider.value);

  
  springSlider.addEventListener("input", (e) => {
    springStiffness = parseFloat(e.target.value);
    console.log("Spring Stiffness:", springStiffness);
  });
  stringLengthSlider.addEventListener("input", (e) => {
    restLength = parseFloat(e.target.value);
    console.log("Rest Length:", restLength);
  });
  boundarySlider.addEventListener("input", (e) => {
    boundaryRepulsion = parseFloat(e.target.value);
    console.log("Boundary Repulsion:", boundaryRepulsion);
  });
  wallRangeSlider.addEventListener("input", (e) => {
    wallRange = parseFloat(e.target.value);
    console.log("Wall Repulsion Range:", wallRange);
  });
  nodeRepulsionSlider.addEventListener("input", (e) => {
    nodeRepulsionConstant = parseFloat(e.target.value);
    console.log("Node Repulsion Constant:", nodeRepulsionConstant);
  });
  frictionSlider.addEventListener("input", (e) => {
    friction = parseFloat(e.target.value);
    console.log("Friction:", friction);
  });

  class Node {
    constructor(x, y, color = "grey") {
      this.x = x;
      this.y = y;
      this.radius = 10;
      this.vx = 0;
      this.vy = 0;
      this.color = color;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.strokeStyle = "grey";
      ctx.stroke();
    }

    update() {
      if (draggingNode !== this) {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= friction;
        this.vy *= friction;
      }
    }

    isMouseOver(mx, my) {
      const dx = this.x - mx;
      const dy = this.y - my;
      return Math.sqrt(dx * dx + dy * dy) < this.radius;
    }
  }

  
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  
  canvas.addEventListener("mousedown", (e) => {
    const { x, y } = getMousePos(e);
    for (let node of nodes) {
      if (node.isMouseOver(x, y)) {
        draggingNode = node;
        dragStart = { x, y };
        dragged = false;
        return;
      }
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (draggingNode) {
      const { x, y } = getMousePos(e);
      if (!dragged && dragStart) {
        const dx = x - dragStart.x;
        const dy = y - dragStart.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
          dragged = true;
        }
      }
      draggingNode.vx = x - draggingNode.x;
      draggingNode.vy = y - draggingNode.y;
      draggingNode.x = x;
      draggingNode.y = y;
    }
  });

  canvas.addEventListener("mouseup", (e) => {
    if (draggingNode) {
      if (!dragged) {
        if (linkingSelected === null) {
          linkingSelected = draggingNode;
        } else if (linkingSelected !== draggingNode) {
          links.push({ from: linkingSelected, to: draggingNode });
          linkingSelected = null;
        } else {
          linkingSelected = null;
        }
      }
    }
    draggingNode = null;
    dragStart = null;
    dragged = false;
  });

  canvas.addEventListener("mouseleave", () => {
    draggingNode = null;
    dragStart = null;
    dragged = false;
  });

  
  spawnButton.addEventListener("click", () => {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    nodes.push(new Node(x, y));
    console.log("Node spawned at:", x, y);
  });

  
  function drawLinks() {
    for (let link of links) {
      ctx.beginPath();
      ctx.moveTo(link.from.x, link.from.y);
      ctx.lineTo(link.to.x, link.to.y);
      ctx.strokeStyle = "white";
      ctx.stroke();
    }
  }

  
  function applySpringForces() {
    links.forEach(link => {
      let nodeA = link.from;
      let nodeB = link.to;
      let dx = nodeB.x - nodeA.x;
      let dy = nodeB.y - nodeA.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;
      let force = (dist - restLength) * springStiffness;
      let fx = (dx / dist) * force;
      let fy = (dy / dist) * force;
      nodeA.vx += fx;
      nodeA.vy += fy;
      nodeB.vx -= fx;
      nodeB.vy -= fy;
    });
  }

  
  function applyBoundaryForces() {
    nodes.forEach(node => {
      
      if (node.x < wallRange) {
        node.vx += boundaryRepulsion * (wallRange - node.x);
      }
      
      if (node.x > canvas.width - wallRange) {
        node.vx -= boundaryRepulsion * (node.x - (canvas.width - wallRange));
      }
     
      if (node.y < wallRange) {
        node.vy += boundaryRepulsion * (wallRange - node.y);
      }
      
      if (node.y > canvas.height - wallRange) {
        node.vy -= boundaryRepulsion * (node.y - (canvas.height - wallRange));
      }
    });
  }

  
  function applyNodeRepulsion() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let nodeA = nodes[i];
        let nodeB = nodes[j];
        let dx = nodeB.x - nodeA.x;
        let dy = nodeB.y - nodeA.y;
        let distSq = dx * dx + dy * dy;
        let dist = Math.sqrt(distSq);
        if (dist === 0) continue;
        let force = nodeRepulsionConstant / distSq;
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;
        nodeA.vx -= fx;
        nodeA.vy -= fy;
        nodeB.vx += fx;
        nodeB.vy += fy;
      }
    }
  }

  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLinks();
    applySpringForces();
    applyBoundaryForces();
    applyNodeRepulsion();
    nodes.forEach((node) => {
      node.update();
      node.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
};
