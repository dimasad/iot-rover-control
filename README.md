# IoT Rover Control

A web-based application for controlling a two-wheel Arduino rover via MQTT. The rover connects to an MQTT broker and responds to motor commands while publishing ultrasonic sensor readings.

## Features

- **Joystick Control**: Intuitive joystick interface for controlling rover movement
  - Distance from center determines motor intensity (0-100%)
  - Top half moves forward, bottom half moves backward
  - Horizontal movement enables turning left/right
- **Real-time Sensor Visualization**: Visual bars and numeric displays for ultrasonic sensor readings
- **Multiple Rover Support**: Select from Rover 1-4
- **MQTT Communication**: Connect to EMQX public broker or custom MQTT brokers
- **Debug Console**: Monitor connection events, messages, and system activity
- **Responsive Design**: Works on desktop and mobile devices

## Live Demo

The application is deployed at: [https://dimasad.github.io/iot-rover-control/](https://dimasad.github.io/iot-rover-control/)

## Setup

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dimasad/iot-rover-control.git
cd iot-rover-control
```

2. Install dependencies:
```bash
npm ci
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:8080`

## Testing

The project includes tests for MQTT communication using both a local Mosquitto broker and the EMQX public broker.

### Setup for Testing

1. Install Mosquitto MQTT broker:
```bash
sudo apt-get update
sudo apt-get install -y mosquitto mosquitto-clients
sudo systemctl start mosquitto
```

2. Run tests:
```bash
npm test
```

## GitHub Pages Setup

To deploy this application to GitHub Pages:

1. Go to your repository settings
2. Navigate to **Pages** in the left sidebar
3. Under **Build and deployment**:
   - Set **Source** to "GitHub Actions"
4. Push to the `main` branch to trigger automatic deployment

The workflow will:
- Install Node.js dependencies with `npm ci`
- Deploy the static files to GitHub Pages

## MQTT Communication

### Default Broker

The application defaults to the EMQX public broker: `wss://broker.emqx.io:8084/mqtt`

### Topics

**Motor Commands (Publish)**
- Topic: `mae211L/rover{N}/motors` (where N is 1-4)
- Format: `{"l": -255, "r": 255}`
- Values: -255 (full reverse) to 255 (full forward)

**Sensor Readings (Subscribe)**
- Topic: `mae211L/rover{N}/sensors` (where N is 1-4)
- Format: `{"l": 52, "r": 10}`
- Values: Distance in centimeters

### Security

- All connections use secure WebSockets (wss://)
- Client IDs are randomly generated: `client_XXXXXX` (6 random alphanumeric characters)

## Development

### Project Structure

```
iot-rover-control/
├── index.html          # Main HTML file
├── styles.css          # Application styles
├── app.js             # JavaScript application logic
├── tests/             # Test files
│   └── mqtt.test.js   # MQTT communication tests
├── .github/
│   └── workflows/
│       ├── deploy.yml              # GitHub Pages deployment
│       └── copilot-setup-steps.yml # Development environment setup
├── package.json       # Node.js dependencies and scripts
└── README.md         # This file
```

### Scripts

- `npm start` - Start local development server
- `npm test` - Run tests

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

Dimas Abreu Archanjo Dutra