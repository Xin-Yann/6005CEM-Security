const https = require('https');
const fs = require('fs');
const express = require('express');
const path = require('path');
const app = express();

const options = {
  key: fs.readFileSync('localhost.key'),
  cert: fs.readFileSync('localhost.crt'),
};

app.use('/html', express.static(path.join(__dirname, 'html')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/image', express.static(path.join(__dirname, 'image')));
app.use('/js', express.static(path.join(__dirname, 'js')));

https.createServer(options, app).listen(8081, () => {
  console.log('Server running on https://localhost:8081');
});
