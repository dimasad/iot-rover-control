// IoT Rover Control Application

// State
let selectedRover = null;
let mqttClient = null;
let isConnected = false;
let joystickActive = false;
let currentMotors = { left: 0, right: 0 };

// Generate random client ID
function generateClientId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomStr = '';
    for (let i = 0; i < 6; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `client_${randomStr}`;
}

// Debug Console
function logToConsole(message, type = 'info') {
    const consoleMessages = document.getElementById('console-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `console-message ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    messageDiv.innerHTML = `<span class="timestamp">[${timestamp}]</span>${message}`;
    
    consoleMessages.appendChild(messageDiv);
    consoleMessages.scrollTop = consoleMessages.scrollHeight;
    
    // Keep only last 100 messages
    while (consoleMessages.children.length > 100) {
        consoleMessages.removeChild(consoleMessages.firstChild);
    }
}

// MQTT Connection
function connectToMQTT() {
    const brokerUrl = document.getElementById('broker-url').value;
    const username = document.getElementById('broker-username').value;
    const password = document.getElementById('broker-password').value;
    
    logToConsole(`Connecting to ${brokerUrl}...`);
    
    const options = {
        clientId: generateClientId(),
        clean: true,
        reconnectPeriod: 5000,
    };
    
    if (username) {
        options.username = username;
    }
    if (password) {
        options.password = password;
    }
    
    try {
        mqttClient = mqtt.connect(brokerUrl, options);
        
        mqttClient.on('connect', () => {
            isConnected = true;
            updateConnectionStatus(true);
            logToConsole('Connected to MQTT broker', 'info');
            
            if (selectedRover) {
                subscribeToRover();
            }
        });
        
        mqttClient.on('error', (error) => {
            logToConsole(`MQTT Error: ${error.message}`, 'error');
        });
        
        mqttClient.on('close', () => {
            isConnected = false;
            updateConnectionStatus(false);
            logToConsole('Disconnected from MQTT broker', 'warning');
        });
        
        mqttClient.on('message', (topic, message) => {
            handleIncomingMessage(topic, message.toString());
        });
    } catch (error) {
        logToConsole(`Connection failed: ${error.message}`, 'error');
    }
}

function disconnectFromMQTT() {
    if (mqttClient) {
        mqttClient.end();
        mqttClient = null;
        isConnected = false;
        updateConnectionStatus(false);
        logToConsole('Disconnected from MQTT broker');
    }
}

function subscribeToRover() {
    if (!mqttClient || !isConnected || !selectedRover) return;
    
    const sensorTopic = `mae211L/rover${selectedRover}/sensors`;
    
    mqttClient.subscribe(sensorTopic, (err) => {
        if (err) {
            logToConsole(`Failed to subscribe to ${sensorTopic}`, 'error');
        } else {
            logToConsole(`Subscribed to ${sensorTopic}`);
        }
    });
}

function publishMotorCommand(left, right) {
    if (!mqttClient || !isConnected || !selectedRover) return;
    
    const motorTopic = `mae211L/rover${selectedRover}/motors`;
    const message = JSON.stringify({ l: left, r: right });
    
    mqttClient.publish(motorTopic, message, { qos: 0 }, (err) => {
        if (err) {
            logToConsole(`Failed to publish to ${motorTopic}`, 'error');
        }
    });
}

function handleIncomingMessage(topic, message) {
    try {
        const data = JSON.parse(message);
        logToConsole(`Received from ${topic}: ${message}`);
        
        if (topic.includes('/sensors')) {
            updateSensorDisplay(data);
        }
    } catch (error) {
        logToConsole(`Failed to parse message: ${error.message}`, 'error');
    }
}

// UI Updates
function updateConnectionStatus(connected) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    if (connected) {
        statusIndicator.classList.remove('disconnected');
        statusIndicator.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        statusIndicator.classList.remove('connected');
        statusIndicator.classList.add('disconnected');
        statusText.textContent = 'Disconnected';
    }
}

function updateSensorDisplay(data) {
    const leftValue = document.getElementById('left-sensor-value');
    const rightValue = document.getElementById('right-sensor-value');
    const leftBar = document.getElementById('left-sensor-bar');
    const rightBar = document.getElementById('right-sensor-bar');
    
    if (data.l !== undefined) {
        leftValue.textContent = `${data.l} cm`;
        // Scale bar to max 100cm
        const leftPercent = Math.min((data.l / 100) * 100, 100);
        leftBar.style.width = `${leftPercent}%`;
    }
    
    if (data.r !== undefined) {
        rightValue.textContent = `${data.r} cm`;
        const rightPercent = Math.min((data.r / 100) * 100, 100);
        rightBar.style.width = `${rightPercent}%`;
    }
}

function updateMotorDisplay(left, right) {
    document.getElementById('left-motor-value').textContent = left;
    document.getElementById('right-motor-value').textContent = right;
}

// Joystick Implementation
class Joystick {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        this.radius = 120;
        this.stickRadius = 40;
        this.stickX = this.centerX;
        this.stickY = this.centerY;
        this.isDragging = false;
        
        this.setupEventListeners();
        this.draw();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.onStart.bind(this));
        this.canvas.addEventListener('mousemove', this.onMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onEnd.bind(this));
        this.canvas.addEventListener('mouseleave', this.onEnd.bind(this));
        
        this.canvas.addEventListener('touchstart', this.onStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onMove.bind(this));
        this.canvas.addEventListener('touchend', this.onEnd.bind(this));
    }
    
    getEventPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        let x, y;
        
        if (event.touches) {
            x = event.touches[0].clientX - rect.left;
            y = event.touches[0].clientY - rect.top;
        } else {
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        }
        
        return { x, y };
    }
    
    onStart(event) {
        event.preventDefault();
        const pos = this.getEventPosition(event);
        const dx = pos.x - this.stickX;
        const dy = pos.y - this.stickY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.stickRadius) {
            this.isDragging = true;
            joystickActive = true;
        }
    }
    
    onMove(event) {
        if (!this.isDragging) return;
        event.preventDefault();
        
        const pos = this.getEventPosition(event);
        let dx = pos.x - this.centerX;
        let dy = pos.y - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.radius) {
            const angle = Math.atan2(dy, dx);
            dx = this.radius * Math.cos(angle);
            dy = this.radius * Math.sin(angle);
        }
        
        this.stickX = this.centerX + dx;
        this.stickY = this.centerY + dy;
        
        this.draw();
        this.calculateMotorValues(dx, dy, distance);
    }
    
    onEnd(event) {
        if (!this.isDragging) return;
        event.preventDefault();
        
        this.isDragging = false;
        joystickActive = false;
        
        this.stickX = this.centerX;
        this.stickY = this.centerY;
        
        this.draw();
        this.calculateMotorValues(0, 0, 0);
    }
    
    calculateMotorValues(dx, dy, distance) {
        // Normalize distance to 0-1
        const intensity = Math.min(distance / this.radius, 1);
        
        // Calculate angle (-PI to PI)
        const angle = Math.atan2(-dy, dx); // Negative dy for screen coordinates
        
        // Convert to degrees and normalize to 0-360
        let degrees = (angle * 180 / Math.PI + 180) % 360;
        
        // Determine forward/backward based on vertical position
        // Top half (0-180 degrees) = forward, bottom half = backward
        const forward = degrees >= 0 && degrees <= 180;
        const direction = forward ? 1 : -1;
        
        // Calculate left/right bias
        // At 90 degrees (top) or 270 (bottom): straight
        // At 0/360 (right): turn right
        // At 180 (left): turn left
        let leftBias = 1;
        let rightBias = 1;
        
        if (forward) {
            // Forward motion (top half)
            // degrees: 0-90 (turn right), 90-180 (turn left)
            if (degrees < 90) {
                // Turning right
                const turnAmount = (90 - degrees) / 90;
                leftBias = 1;
                rightBias = 1 - turnAmount;
            } else {
                // Turning left
                const turnAmount = (degrees - 90) / 90;
                leftBias = 1 - turnAmount;
                rightBias = 1;
            }
        } else {
            // Backward motion (bottom half)
            // degrees: 180-270 (turn left), 270-360 (turn right)
            if (degrees < 270) {
                // Turning left
                const turnAmount = (degrees - 180) / 90;
                leftBias = 1 - turnAmount;
                rightBias = 1;
            } else {
                // Turning right
                const turnAmount = (360 - degrees) / 90;
                leftBias = 1;
                rightBias = 1 - turnAmount;
            }
        }
        
        // Calculate final motor values (-255 to 255)
        const baseValue = Math.round(intensity * 255 * direction);
        const leftMotor = Math.round(baseValue * leftBias);
        const rightMotor = Math.round(baseValue * rightBias);
        
        currentMotors.left = leftMotor;
        currentMotors.right = rightMotor;
        
        updateMotorDisplay(leftMotor, rightMotor);
        publishMotorCommand(leftMotor, rightMotor);
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw outer circle
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw center cross
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX - 10, this.centerY);
        this.ctx.lineTo(this.centerX + 10, this.centerY);
        this.ctx.moveTo(this.centerX, this.centerY - 10);
        this.ctx.lineTo(this.centerX, this.centerY + 10);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw stick
        this.ctx.beginPath();
        this.ctx.arc(this.stickX, this.stickY, this.stickRadius, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.isDragging ? '#0056b3' : '#007bff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#0056b3';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Show rover selection modal
    const roverModal = document.getElementById('rover-modal');
    
    // Rover selection
    document.querySelectorAll('.rover-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedRover = btn.dataset.rover;
            roverModal.classList.add('hidden');
            document.getElementById('main-content').classList.remove('disabled');
            logToConsole(`Selected Rover ${selectedRover}`);
            
            if (isConnected) {
                subscribeToRover();
            }
        });
    });
    
    // Initialize joystick
    const joystickCanvas = document.getElementById('joystick-canvas');
    const joystick = new Joystick(joystickCanvas);
    
    // Hamburger menu
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    
    hamburgerBtn.addEventListener('click', () => {
        hamburgerMenu.classList.add('open');
    });
    
    closeMenuBtn.addEventListener('click', () => {
        hamburgerMenu.classList.remove('open');
    });
    
    // Connect/Disconnect buttons
    document.getElementById('connect-btn').addEventListener('click', () => {
        if (!isConnected) {
            connectToMQTT();
        }
    });
    
    document.getElementById('disconnect-btn').addEventListener('click', () => {
        disconnectFromMQTT();
    });
    
    // Console expand/collapse
    const expandBtn = document.getElementById('expand-console-btn');
    const consoleContent = document.getElementById('console-content');
    const consoleHeader = document.querySelector('.console-header');
    
    consoleHeader.addEventListener('click', () => {
        consoleContent.classList.toggle('collapsed');
        consoleContent.classList.toggle('expanded');
        expandBtn.textContent = consoleContent.classList.contains('expanded') ? '▼' : '▲';
    });
    
    // Auto-connect to EMQX on page load
    logToConsole('Application started');
    connectToMQTT();
});
