#!/usr/bin/env node

const dockerManager = require('./docker-manager');

async function test() {
  console.log('🧪 Testing Docker Integration\n');
  
  // Test 1: Check Docker installation
  console.log('Test 1: Checking Docker installation...');
  const dockerInstalled = await dockerManager.checkDockerInstalled();
  console.log(`  Result: ${dockerInstalled ? '✅ PASS' : '❌ FAIL'}\n`);
  
  if (!dockerInstalled) {
    console.log('❌ Docker not installed. Please install Docker Desktop.');
    process.exit(1);
  }
  
  // Test 2: Get current status
  console.log('Test 2: Getting container status...');
  const status = await dockerManager.getStatus();
  console.log(`  Docker: ${status.dockerInstalled ? '✅' : '❌'}`);
  console.log(`  InfluxDB: ${status.influxdb ? '✅ Running' : '⏸️  Stopped'}`);
  console.log(`  Grafana: ${status.grafana ? '✅ Running' : '⏸️  Stopped'}`);
  console.log(`  All Running: ${status.allRunning ? '✅ PASS' : '⚠️  Some stopped'}\n`);
  
  // Test 3: Start containers
  console.log('Test 3: Starting containers...');
  const result = await dockerManager.startAll();
  console.log(`  Result: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
  if (!result.success) {
    console.log(`  Error: ${result.error}`);
  }
  console.log('');
  
  // Test 4: Verify containers are running
  console.log('Test 4: Verifying containers are running...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  const finalStatus = await dockerManager.getStatus();
  console.log(`  InfluxDB: ${finalStatus.influxdb ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Grafana: ${finalStatus.grafana ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  // Summary
  console.log('📊 Test Summary:');
  const allPassed = dockerInstalled && result.success && finalStatus.allRunning;
  console.log(`  Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('');
  
  if (allPassed) {
    console.log('✅ Docker integration is working correctly!');
    console.log('   InfluxDB: http://localhost:8086');
    console.log('   Grafana: http://localhost:3001');
  }
  
  process.exit(allPassed ? 0 : 1);
}

test().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});
