let fs = require('fs');
let fspath = require('path');

let links = fs.readFileSync(
    fspath.join(__dirname, '..', 'links', 'link_results.txt'),'utf8')
    .trim()
    .replace(/\n/g,'\r\n');

let file = fspath.join(__dirname, '..', 'links', 'link_results.txt');

fs.writeFileSync(file, links, 'utf8');