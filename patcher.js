/**
 * Patcher - Signal routing and modulation matrix
 * Connects audio nodes and creates modulation sources
 */

class Patcher {
    constructor() {
        this.canvas = document.getElementById('patcherCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.draggingNode = null;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.attachEventListeners();
        this.createDefaultNodes();
        this.draw();
    }
    
    setupCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    attachEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        const addNodeBtn = document.getElementById('addNodeBtn');
        if (addNodeBtn) {
            addNodeBtn.addEventListener('click', () => this.addNode());
        }
        
        const connectNodesBtn = document.getElementById('connectNodesBtn');
        if (connectNodesBtn) {
            connectNodesBtn.addEventListener('click', () => this.connectSelectedNodes());
        }
        
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.draw();
        });
    }
    
    createDefaultNodes() {
        // Input nodes
        this.addNode('Input 1', 'input', 50, 50);
        this.addNode('Input 2', 'input', 50, 150);
        
        // Processing nodes
        this.addNode('Filter', 'filter', 200, 100);
        this.addNode('Delay', 'effect', 350, 100);
        
        // Output node
        this.addNode('Output', 'output', 500, 100);
    }
    
    addNode(name = 'Node', type = 'processor', x = 100, y = 100) {
        const node = {
            id: Date.now(),
            name: name,
            type: type,
            x: x,
            y: y,
            width: 80,
            height: 50,
            inputs: this.getInputsForType(type),
            outputs: this.getOutputsForType(type),
            selected: false
        };
        
        this.nodes.push(node);
        this.draw();
        return node;
    }
    
    getInputsForType(type) {
        switch (type) {
            case 'input':
                return [];
            case 'output':
                return [{ name: 'in', type: 'audio' }];
            case 'filter':
                return [{ name: 'in', type: 'audio' }, { name: 'freq', type: 'control' }];
            case 'effect':
                return [{ name: 'in', type: 'audio' }, { name: 'wet', type: 'control' }];
            default:
                return [{ name: 'in', type: 'audio' }];
        }
    }
    
    getOutputsForType(type) {
        switch (type) {
            case 'input':
                return [{ name: 'out', type: 'audio' }];
            case 'output':
                return [];
            default:
                return [{ name: 'out', type: 'audio' }];
        }
    }
    
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking on a node
        for (let node of this.nodes) {
            if (x >= node.x && x <= node.x + node.width &&
                y >= node.y && y <= node.y + node.height) {
                
                if (e.button === 0) {
                    this.draggingNode = node;
                    this.selectedNode = node;
                    node.selected = true;
                } else if (e.button === 2) {
                    // Right click to delete
                    this.deleteNode(node.id);
                }
                this.draw();
                return;
            }
        }
        
        // Deselect all
        this.nodes.forEach(n => n.selected = false);
        this.selectedNode = null;
        this.draw();
    }
    
    onMouseMove(e) {
        if (this.draggingNode) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.draggingNode.x = x - this.draggingNode.width / 2;
            this.draggingNode.y = y - this.draggingNode.height / 2;
            
            // Keep in bounds
            this.draggingNode.x = Math.max(0, Math.min(this.canvas.width - this.draggingNode.width, this.draggingNode.x));
            this.draggingNode.y = Math.max(0, Math.min(this.canvas.height - this.draggingNode.height, this.draggingNode.y));
            
            this.draw();
        }
    }
    
    onMouseUp(e) {
        this.draggingNode = null;
    }
    
    connectSelectedNodes() {
        if (this.selectedNode && this.nodes.length > 1) {
            // Find another node to connect to
            for (let node of this.nodes) {
                if (node !== this.selectedNode) {
                    this.connectNodes(this.selectedNode.id, node.id);
                    break;
                }
            }
        }
    }
    
    connectNodes(sourceId, targetId) {
        const source = this.nodes.find(n => n.id === sourceId);
        const target = this.nodes.find(n => n.id === targetId);
        
        if (source && target && source.outputs.length > 0 && target.inputs.length > 0) {
            const connection = {
                id: Date.now(),
                sourceId: sourceId,
                targetId: targetId,
                sourceOutput: 0,
                targetInput: 0
            };
            
            this.connections.push(connection);
            this.draw();
        }
    }
    
    deleteNode(nodeId) {
        this.nodes = this.nodes.filter(n => n.id !== nodeId);
        this.connections = this.connections.filter(c => 
            c.sourceId !== nodeId && c.targetId !== nodeId
        );
        this.draw();
    }
    
    draw() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Background
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, width, height);
        
        // Grid
        this.ctx.strokeStyle = '#2a3050';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        // Draw connections
        for (let connection of this.connections) {
            this.drawConnection(connection);
        }
        
        // Draw nodes
        for (let node of this.nodes) {
            this.drawNode(node);
        }
        
        // Border
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, width, height);
    }
    
    drawNode(node) {
        // Node body
        this.ctx.fillStyle = node.selected ? '#1e90ff' : this.getNodeColor(node.type);
        this.ctx.fillRect(node.x, node.y, node.width, node.height);
        
        // Border
        this.ctx.strokeStyle = node.selected ? '#ffff00' : '#00ff88';
        this.ctx.lineWidth = node.selected ? 3 : 2;
        this.ctx.strokeRect(node.x, node.y, node.width, node.height);
        
        // Name
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.name, node.x + node.width / 2, node.y + node.height / 2 + 5);
        
        // Input/Output ports
        const portRadius = 4;
        
        // Input ports
        for (let i = 0; i < node.inputs.length; i++) {
            const portX = node.x;
            const portY = node.y + (node.height / (node.inputs.length + 1)) * (i + 1);
            
            this.ctx.fillStyle = '#ff1493';
            this.ctx.beginPath();
            this.ctx.arc(portX, portY, portRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Output ports
        for (let i = 0; i < node.outputs.length; i++) {
            const portX = node.x + node.width;
            const portY = node.y + (node.height / (node.outputs.length + 1)) * (i + 1);
            
            this.ctx.fillStyle = '#00ff88';
            this.ctx.beginPath();
            this.ctx.arc(portX, portY, portRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawConnection(connection) {
        const source = this.nodes.find(n => n.id === connection.sourceId);
        const target = this.nodes.find(n => n.id === connection.targetId);
        
        if (!source || !target) return;
        
        const sourcePort = source.y + (source.height / (source.outputs.length + 1)) * (connection.sourceOutput + 1);
        const targetPort = target.y + (target.height / (target.inputs.length + 1)) * (connection.targetInput + 1);
        
        const startX = source.x + source.width;
        const startY = sourcePort;
        const endX = target.x;
        const endY = targetPort;
        
        // Draw line with curve
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        
        const controlX = (startX + endX) / 2;
        this.ctx.bezierCurveTo(controlX, startY, controlX, endY, endX, endY);
        this.ctx.stroke();
        
        // Draw circle at start
        this.ctx.fillStyle = '#00ff88';
        this.ctx.beginPath();
        this.ctx.arc(startX, startY, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    getNodeColor(type) {
        switch (type) {
            case 'input':
                return '#1e90ff';
            case 'output':
                return '#ff1493';
            case 'filter':
                return '#00ff88';
            case 'effect':
                return '#ffaa00';
            default:
                return '#252b48';
        }
    }
    
    getNodes() {
        return this.nodes;
    }
    
    getConnections() {
        return this.connections;
    }
}

// Create global patcher instance
const patcher = new Patcher();
