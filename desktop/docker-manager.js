const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class DockerManager {
  constructor() {
    this.containers = {
      influxdb: {
        name: 'solarautopilot-influxdb',
        image: 'influxdb:1.8',
        ports: ['8087:8086'],
        env: [
          'INFLUXDB_DB=solarautopilot',
          'INFLUXDB_HTTP_AUTH_ENABLED=false',
          'INFLUXDB_ADMIN_USER=admin',
          'INFLUXDB_ADMIN_PASSWORD=admin123'
        ],
        volumes: ['solarautopilot-influxdb-data:/var/lib/influxdb']
      },
      grafana: {
        name: 'solarautopilot-grafana',
        image: 'grafana/grafana:latest',
        ports: ['3001:3000'],
        env: [
          'GF_SECURITY_ADMIN_PASSWORD=admin',
          'GF_SECURITY_ALLOW_EMBEDDING=true'
        ],
        volumes: ['solarautopilot-grafana-data:/var/lib/grafana']
      }
    };
  }

  async checkDockerInstalled() {
    try {
      await execAsync('docker --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  async isContainerRunning(containerName) {
    try {
      const { stdout } = await execAsync(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`);
      return stdout.trim() === containerName;
    } catch (error) {
      return false;
    }
  }

  async startContainer(service) {
    const config = this.containers[service];
    const isRunning = await this.isContainerRunning(config.name);
    
    if (isRunning) {
      console.log(`✅ ${service} container already running`);
      return true;
    }

    try {
      // Check if container exists but stopped
      const { stdout } = await execAsync(`docker ps -a --filter "name=${config.name}" --format "{{.Names}}"`);
      
      if (stdout.trim() === config.name) {
        // Container exists, just start it
        await execAsync(`docker start ${config.name}`);
        console.log(`✅ Started existing ${service} container`);
      } else {
        // Create new container
        const envFlags = config.env.map(e => `-e ${e}`).join(' ');
        const portFlags = config.ports.map(p => `-p ${p}`).join(' ');
        const volumeFlags = config.volumes.map(v => `-v ${v}`).join(' ');
        
        const cmd = `docker run -d --name ${config.name} ${portFlags} ${envFlags} ${volumeFlags} --restart unless-stopped --network bridge ${config.image}`;
        await execAsync(cmd);
        console.log(`✅ Created and started ${service} container`);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to start ${service}:`, error.message);
      return false;
    }
  }

  async stopContainer(containerName) {
    try {
      await execAsync(`docker stop ${containerName}`);
      console.log(`✅ Stopped ${containerName}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to stop ${containerName}:`, error.message);
      return false;
    }
  }

  async startAll() {
    console.log('🐳 Starting Docker containers...');
    
    const dockerInstalled = await this.checkDockerInstalled();
    if (!dockerInstalled) {
      console.error('❌ Docker is not installed');
      return { success: false, error: 'Docker not installed' };
    }

    const influxStarted = await this.startContainer('influxdb');
    const grafanaStarted = await this.startContainer('grafana');

    if (influxStarted && grafanaStarted) {
      console.log('✅ All containers started successfully');
      return { success: true };
    } else {
      return { 
        success: false, 
        error: 'Failed to start some containers',
        influxdb: influxStarted,
        grafana: grafanaStarted
      };
    }
  }

  async stopAll() {
    await this.stopContainer(this.containers.influxdb.name);
    await this.stopContainer(this.containers.grafana.name);
  }

  async initializeInfluxDB() {
    try {
      // Wait and retry logic for InfluxDB to be ready
      const maxRetries = 10;
      const retryDelay = 2000;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          // Try localhost on port 8087 (mapped from container's 8086)
          const testCmd = `curl -f -m 5 http://127.0.0.1:8087/ping`;
          await execAsync(testCmd);
          console.log('✅ InfluxDB accessible on 127.0.0.1:8087');
          
          // Create database
          const createDbCommand = `curl -XPOST "http://127.0.0.1:8087/query" --data-urlencode "q=CREATE DATABASE solarautopilot"`;
          await execAsync(createDbCommand);
          console.log('✅ InfluxDB database "solarautopilot" created');
          return true;
        } catch (error) {
          if (i < maxRetries - 1) {
            console.log(`⏳ Waiting for InfluxDB to be ready... (attempt ${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize InfluxDB database:', error.message);
      console.log('💡 Try: docker restart solarautopilot-influxdb');
      return false;
    }
  }

  async getStatus() {
    const influxRunning = await this.isContainerRunning(this.containers.influxdb.name);
    const grafanaRunning = await this.isContainerRunning(this.containers.grafana.name);
    
    return {
      dockerInstalled: await this.checkDockerInstalled(),
      influxdb: influxRunning,
      grafana: grafanaRunning,
      allRunning: influxRunning && grafanaRunning
    };
  }
}

module.exports = new DockerManager();
