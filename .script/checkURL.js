let fs = require('fs');
let http = require('https');
let fspath = require('path');

let links = fs.readFileSync(fspath.join(__dirname, '..', 'links', 'links.txt'),'utf8').trim().replace(/https:\/\/|http:\/\/|\r/g,'').split('\n');

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
    let result = {
      uri: url.host + url.path
    };
    let options = {
      method : 'HEAD',
      host : url.host,
      path: url.path
    };

    let req = http.request(options, res => {
      result.status   = res.statusCode;
      result.redirect = result.status == 302 || result.status == 301 ? '(Original link: '+res.headers.location+')' : '';
      resolve(result);
    });

    req.on('error', e => {
      result.status = '___';
      result.error = `problem with request: ${e.message}`;
      resolve(result);
    });

    req.end();

  }).then(result => {
    resCount++;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`${resCount}/${newLinks.length}\t${progressBar(resCount,newLinks.length)} ${Math.floor(resCount / newLinks.length * 100)}%`);
    return result;
  }).catch(reason => console.log(reason));
}

let getStatus = code => 
  result => result.status === code;

let returnMessage = result => `\t${result.uri} ${result.redirect}`;

let returnError = result => `\t${result.uri}\n\t\t${result.error}`;

let progressBar = (i,t) => {
  let total = 20;
  let progress = Math.floor(i / t * total);
  let remainder = total - progress;
  return `[${"#".repeat(progress)}${"-".repeat(remainder)}]`;
}

let resCount = 0;
let newLinks = links.map(splitURL);

process.stdout.write('Checking statuses...\n');

Promise.all(
  newLinks.map(getResponse)
).then(responses => {
  let file = fspath.join(__dirname, '..', 'links', 'link_results.txt');
  let d = new Date;
  let prepend = 'Checked: ' + d;

  let notFound  = responses.filter(getStatus(404));
  let success   = responses.filter(getStatus(200));
  let forbidden = responses.filter(getStatus(403));
  let redirect  = responses.filter(getStatus(301)).concat(responses.filter(getStatus(302)));
  let error     = responses.filter(getStatus('___'));

  let contents  = `${prepend}

404 NOT FOUND
${notFound.map(returnMessage).join('\n')}

403 FORBIDDEN (most likely requires login)
${forbidden.map(returnMessage).join('\n')}

ERROR
${error.map(returnError).join('\n')}

200 SUCCESS
${success.map(returnMessage).join('\n')}

301/302 REDIRECT
${redirect.map(returnMessage).join('\n')}
`;

  fs.writeFileSync(file, contents,'utf8');
  process.stdout.write('\nFile Saved. Open ' + fspath.join(__dirname, '..', 'links') + '\\' + file);
}).catch(reason => console.log(reason));