const mqtt = require('mqtt');
const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');

describe('MQTT Connection Tests', () => {
  let client;
  const testTimeout = 30000;

  afterAll(async () => {
    if (client && client.connected) {
      await new Promise((resolve) => {
        client.end(false, () => resolve());
      });
    }
  });

  test('should connect to local Mosquitto broker', async () => {
    const brokerUrl = 'mqtt://localhost:1883';
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (client) {
          client.end(true);
          client = null;
        }
        reject(new Error('Connection timeout'));
      }, testTimeout);

      client = mqtt.connect(brokerUrl, {
        clientId: 'test_client_' + Math.random().toString(16).substr(2, 8),
        clean: true,
        reconnectPeriod: 0,
      });

      client.on('connect', () => {
        clearTimeout(timeout);
        expect(client.connected).toBe(true);
        client.end(true);
        client = null;
        resolve();
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        if (client) {
          client.end(true);
          client = null;
        }
        reject(error);
      });
    });
  }, testTimeout);

  test('should publish and receive messages on local broker', async () => {
    const brokerUrl = 'mqtt://localhost:1883';
    const topic = 'test/topic';
    const testMessage = JSON.stringify({ test: 'data' });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (client) {
          client.end(true);
          client = null;
        }
        reject(new Error('Message timeout'));
      }, testTimeout);

      client = mqtt.connect(brokerUrl, {
        clientId: 'test_client_' + Math.random().toString(16).substr(2, 8),
        clean: true,
        reconnectPeriod: 0,
      });

      client.on('connect', () => {
        client.subscribe(topic, (err) => {
          if (err) {
            clearTimeout(timeout);
            client.end(true);
            client = null;
            reject(err);
            return;
          }
          client.publish(topic, testMessage);
        });
      });

      client.on('message', (receivedTopic, message) => {
        clearTimeout(timeout);
        expect(receivedTopic).toBe(topic);
        expect(message.toString()).toBe(testMessage);
        client.end(true);
        client = null;
        resolve();
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        if (client) {
          client.end(true);
          client = null;
        }
        reject(error);
      });
    });
  }, testTimeout);

  test('should connect to EMQX public broker with secure websockets', async () => {
    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (client) {
          client.end(true);
          client = null;
        }
        // Skip test if network not available
        console.log('Skipping EMQX test - network may not be available');
        resolve();
      }, 5000); // Shorter timeout for external broker

      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let randomStr = '';
      for (let i = 0; i < 6; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const clientId = `client_${randomStr}`;

      try {
        client = mqtt.connect(brokerUrl, {
          clientId: clientId,
          clean: true,
          reconnectPeriod: 0, // Disable reconnect for tests
        });

        client.on('connect', () => {
          clearTimeout(timeout);
          expect(client.connected).toBe(true);
          expect(clientId).toMatch(/^client_[a-zA-Z0-9]{6}$/);
          client.end(true);
          client = null;
          resolve();
        });

        client.on('error', (error) => {
          clearTimeout(timeout);
          client.end(true);
          client = null;
          // Skip test if network error
          if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.log('Skipping EMQX test - network not available');
            resolve();
          } else {
            reject(error);
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        console.log('Skipping EMQX test - error connecting');
        resolve();
      }
    });
  }, testTimeout);

  test('should publish rover motor commands', async () => {
    const brokerUrl = 'mqtt://localhost:1883';
    const motorTopic = 'mae211L/rover1/motors';
    const motorCommand = { l: 255, r: -255 };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (client) {
          client.end(true);
          client = null;
        }
        reject(new Error('Publish timeout'));
      }, testTimeout);

      client = mqtt.connect(brokerUrl, {
        clientId: 'test_client_' + Math.random().toString(16).substr(2, 8),
        clean: true,
        reconnectPeriod: 0,
      });

      client.on('connect', () => {
        client.publish(motorTopic, JSON.stringify(motorCommand), { qos: 0 }, (err) => {
          clearTimeout(timeout);
          client.end(true);
          client = null;
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        if (client) {
          client.end(true);
          client = null;
        }
        reject(error);
      });
    });
  }, testTimeout);

  test('should subscribe to rover sensor topics', async () => {
    const brokerUrl = 'mqtt://localhost:1883';
    const sensorTopic = 'mae211L/rover1/sensors';

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (client) {
          client.end(true);
          client = null;
        }
        reject(new Error('Subscribe timeout'));
      }, testTimeout);

      client = mqtt.connect(brokerUrl, {
        clientId: 'test_client_' + Math.random().toString(16).substr(2, 8),
        clean: true,
        reconnectPeriod: 0,
      });

      client.on('connect', () => {
        client.subscribe(sensorTopic, (err) => {
          clearTimeout(timeout);
          client.end(true);
          client = null;
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        if (client) {
          client.end(true);
          client = null;
        }
        reject(error);
      });
    });
  }, testTimeout);

  test('should handle sensor data messages correctly', async () => {
    const brokerUrl = 'mqtt://localhost:1883';
    const sensorTopic = 'mae211L/rover1/sensors';
    const sensorData = { l: 52, r: 10 };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (client) {
          client.end(true);
          client = null;
        }
        reject(new Error('Sensor data timeout'));
      }, testTimeout);

      client = mqtt.connect(brokerUrl, {
        clientId: 'test_client_' + Math.random().toString(16).substr(2, 8),
        clean: true,
        reconnectPeriod: 0,
      });

      client.on('connect', () => {
        client.subscribe(sensorTopic, (err) => {
          if (err) {
            clearTimeout(timeout);
            client.end(true);
            client = null;
            reject(err);
            return;
          }
          // Publish test sensor data
          client.publish(sensorTopic, JSON.stringify(sensorData));
        });
      });

      client.on('message', (topic, message) => {
        clearTimeout(timeout);
        const data = JSON.parse(message.toString());
        expect(data).toEqual(sensorData);
        expect(data.l).toBe(52);
        expect(data.r).toBe(10);
        client.end(true);
        client = null;
        resolve();
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        if (client) {
          client.end(true);
          client = null;
        }
        reject(error);
      });
    });
  }, testTimeout);
});
