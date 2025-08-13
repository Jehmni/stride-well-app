// Test script to verify localhost connectivity
// This helps diagnose why localhost:8080 isn't working

import http from 'http';

const testLocalhost = () => {
  console.log('🔍 Testing localhost:8080 connectivity...');
  
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log('✅ SUCCESS: localhost:8080 is accessible');
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Response length: ${data.length} characters`);
      if (data.length > 0) {
        console.log('First 200 chars:', data.substring(0, 200));
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ ERROR: Cannot connect to localhost:8080');
    console.error('Error details:', err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Make sure your dev server is running');
      console.log('2. Try running: npm run dev:localhost');
      console.log('3. Check if port 8080 is already in use');
      console.log('4. Try clearing cache: npm run clear-cache');
    }
  });

  req.on('timeout', () => {
    console.error('⏰ TIMEOUT: Request timed out after 5 seconds');
    req.destroy();
  });

  req.end();
};

// Also test the network IP to compare
const testNetworkIP = () => {
  console.log('\n🔍 Testing 192.168.1.178:8080 connectivity...');
  
  const options = {
    hostname: '192.168.1.178',
    port: 8080,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log('✅ SUCCESS: 192.168.1.178:8080 is accessible');
    console.log(`Status: ${res.statusCode}`);
  });

  req.on('error', (err) => {
    console.error('❌ ERROR: Cannot connect to 192.168.1.178:8080');
    console.error('Error details:', err.message);
  });

  req.end();
};

// Run tests
console.log('🚀 Starting connectivity tests...\n');
testLocalhost();
setTimeout(testNetworkIP, 1000); // Test network IP after a short delay

console.log('\n💡 If localhost fails but network IP works:');
console.log('1. The issue is likely in your Vite configuration');
console.log('2. Try running: npm run dev:localhost');
console.log('3. Check your hosts file for localhost entries');
console.log('4. Restart your development server');

