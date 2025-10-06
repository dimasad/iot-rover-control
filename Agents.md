# GitHub Copilot Agents

This document provides guidance for GitHub Copilot agents working on this repository.

## Project Overview

This is a web-based IoT Rover Control application that allows users to control Arduino rovers via MQTT. The application is built as a static webpage with client-side processing for simplified deployment.

## Key Technologies

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Communication**: MQTT over secure WebSockets (wss://)
- **MQTT Library**: MQTT.js v5.11.1 (loaded from CDN)
- **Testing**: Jest v29.7.0
- **Deployment**: GitHub Pages via GitHub Actions

## Architecture

### Static Web Application
- No backend server required
- All processing done client-side
- Deployed as static files to GitHub Pages

### MQTT Communication
- Default broker: EMQX public broker (wss://broker.emqx.io:8084/mqtt)
- Publishes motor commands to: `mae211L/rover{N}/motors`
- Subscribes to sensor data from: `mae211L/rover{N}/sensors`
- Uses randomly generated client IDs: `client_XXXXXX`

### UI Components
1. **Top Menu Bar**: Connection status, broker selection, hamburger menu
2. **Rover Selection Modal**: Choose from Rover 1-4 on page load
3. **Joystick Control**: Canvas-based joystick for motor control
4. **Sensor Visualization**: Bars and numeric displays for ultrasonic readings
5. **Debug Console**: Collapsible console showing system events

## Development Guidelines

### When Making Changes

1. **Maintain Static Nature**: Do not introduce server-side components or build steps that change the static nature
2. **Secure Connections**: Always use `wss://` for MQTT, `https://` for resources
3. **Browser Compatibility**: Test in modern browsers (Chrome, Firefox, Safari, Edge)
4. **Mobile Responsiveness**: Ensure touch events work on mobile devices

### Testing

Tests should cover:
- MQTT connection to local Mosquitto broker
- MQTT connection to EMQX public broker
- Message publishing and subscribing
- Message format validation

Run tests with:
```bash
npm test
```

### Pull Request Screenshots

When submitting PRs that modify UI elements, include screenshots showing:
- The changed component in its default state
- Any interactive states (hover, active, etc.)
- Mobile view if responsive design is affected
- Before/after comparisons for modifications

Use tools like browser DevTools or screenshot utilities to capture clear images.

## Code Style

### JavaScript
- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use arrow functions where appropriate
- Comment complex logic, especially joystick calculations

### CSS
- Use modern CSS (Flexbox, Grid)
- Mobile-first responsive design
- Use CSS variables for consistent theming
- Group related styles together

### HTML
- Semantic HTML5 elements
- Proper ARIA labels for accessibility
- Clean, readable structure

## Common Tasks

### Adding a New Rover
1. No code changes needed - UI supports Rover 1-4
2. Rover subscribes to `mae211L/rover{N}/sensors`
3. App publishes to `mae211L/rover{N}/motors`

### Changing MQTT Broker
1. Update default value in `index.html` (broker-url input)
2. Ensure broker supports secure WebSockets (wss://)
3. Test connection with both username/password and anonymous access

### Modifying Joystick Behavior
1. Edit `Joystick.calculateMotorValues()` in `app.js`
2. Test with various joystick positions
3. Verify motor values range from -255 to 255
4. Document algorithm changes

### Adding Debug Information
1. Use `logToConsole(message, type)` function
2. Types: 'info', 'error', 'warning'
3. Keep messages concise and informative

## Deployment

### GitHub Pages
- Workflow: `.github/workflows/deploy.yml`
- Triggers on push to `main` branch
- No build step required (static files)
- Deployed to: `https://dimasad.github.io/iot-rover-control/`

### GitHub Actions Setup
- Ensure Pages is enabled in repository settings
- Set source to "GitHub Actions"
- Workflow has appropriate permissions

## Troubleshooting

### MQTT Connection Issues
- Verify broker URL uses `wss://` (secure WebSockets)
- Check browser console for connection errors
- Ensure firewall allows WebSocket connections
- Test with public EMQX broker first

### Joystick Not Responding
- Check canvas element is properly sized
- Verify touch events are bound (mobile)
- Check browser console for JavaScript errors
- Ensure rover is selected

### Tests Failing
- Verify Mosquitto is installed and running
- Check network connectivity for EMQX tests
- Increase test timeout if needed (slow networks)
- Run individual tests to isolate issues

## Resources

- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [EMQX Public Broker](https://www.emqx.com/en/mqtt/public-mqtt5-broker)
- [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
