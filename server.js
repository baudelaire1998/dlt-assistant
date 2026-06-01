const http = require('http');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HISTORY_FILE = path.join(__dirname, 'history.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function readHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
  } catch (_) {}
  return [];
}

function writeHistory(data) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API: history
  if (url.pathname === '/api/history') {
    if (req.method === 'GET') {
      const h = readHistory();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(h));
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const entry = JSON.parse(body);
          const h = readHistory();
          h.unshift({ ...entry, id: Date.now(), time: new Date().toISOString() });
          if (h.length > 100) h.length = 100;
          writeHistory(h);
          res.writeHead(200);
          return res.end(JSON.stringify({ ok: true }));
        } catch (_) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'bad json' }));
        }
      });
      return;
    }
    if (req.method === 'DELETE') {
      writeHistory([]);
      res.writeHead(200);
      return res.end(JSON.stringify({ ok: true }));
    }
    res.writeHead(405);
    return res.end();
  }

  // API: fetch real draw from sporttery.cn
  if (url.pathname === '/api/latest-draw') {
    const count = parseInt(url.searchParams.get('count')) || 1;
    const pageSize = Math.min(count, 30);
    const drawUrl = 'https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=85&provinceId=0&pageSize=' + pageSize + '&isVerify=1&pageNo=1';
    execFile('curl', ['-s', drawUrl], { timeout: 10000 }, (err, stdout) => {
      if (err) {
        res.writeHead(502);
        return res.end(JSON.stringify({ ok: false, error: '网络请求失败' }));
      }
      try {
        const json = JSON.parse(stdout);
        if (json.success && json.value && json.value.list) {
          const draws = json.value.list.map(draw => {
            const nums = draw.lotteryDrawResult.split(' ');
            return {
              period: draw.lotteryDrawNum,
              time: draw.lotteryDrawTime,
              front: nums.slice(0, 5).map(Number),
              back: nums.slice(5, 7).map(Number),
            };
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true, draws }));
        }
      } catch (_) {}
      res.writeHead(502);
      res.end(JSON.stringify({ ok: false, error: '获取开奖数据失败' }));
    });
    return;
  }

  // Static files
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.join(__dirname, 'public', filePath);

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not Found');
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`大乐透助手已启动: http://localhost:${PORT}`);
});
