let fs = require('fs');
let http = require('https');

let links = fs.readFileSync('./links.txt','utf8').trim().replace(/https:\/\/|http:\/\//g,'').split('\r\n');

let splitURL = function(url) {
  let l = url.indexOf('/');
  let split = {
    host: '',
    path: ''
  };

  if (l > 0) {
    split.host = url.substr(0,l),
    split.path = url.substr(l)
  } else {
    split.host = url;
    split.path = '/';
  }
  return split;
}

let getResponse = function(url) {
  return new Promise((resolve, reject)=>{
    let result = '';
    let options = {
      method : 'HEAD',
      host : url.host,
      path: url.path
    };

    let req = http.request(options, res => {
      let status = res.statusCode;
      let s = status == 200 ? 'SUCCESS' : status == 302 || status == 301 ? 'REDIRECT' : status == 404 ? 'NOT FOUND' : status == 403 ? 'FORBIDDEN' : '';
      let r = status == 302 || status == 301 ? '(Original link: '+res.headers.location+')' : '';
      result = `${res.statusCode}\t${s}\t\t${url.host + url.path} ${r}`;
      resolve(result);
    });

    req.on('error', e => {
      result = `___\tERROR\tproblem with request: ${e.message} (${url.host+url.path})`;
      resolve(result);
    });

    req.end();

  }).then(result=>{
    return new Promise((resolve, reject) => {
      resCount++;
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(Math.floor(resCount / newLinks.length * 100) + '%');
      resolve(result);
    });
  });
}

let resCount = 0;
let newLinks = links.map(splitURL);

process.stdout.write('Checking statuses...\n');

Promise.all(
  newLinks.map(getResponse)
).then(responses => {
  let file = 'link_results.txt';
  let d = new Date;
  let prepend = 'Checked: ' + d;
  fs.writeFileSync(file, prepend + '\n\n' + responses.join('\n'),'utf8');
  process.stdout.write('\nFile Saved. Open ' + file);
});