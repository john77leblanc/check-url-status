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
  return new Promise((resolve,reject)=>{
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
  });
}

let newLinks = links.map(splitURL);

Promise.all(
  newLinks.map(getResponse)
).then(responses => {
  fs.writeFileSync('link_results.txt',responses.join('\n'),'utf8');
  console.log('File Saved.');
});