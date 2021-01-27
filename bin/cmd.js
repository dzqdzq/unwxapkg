#!/usr/bin/env node

var Wxapkg = require('../');

const fs = require('fs')
const path = require('path');
const mkdirp = require('../mkdirp')
const util = require('../util')

let fileName = process.argv[2];
if(!fileName){
  new Error(`参数不正确`);
}

if(fs.existsSync(fileName)){
  new Error(`${fileName} 不存在`);
}

function getFiles(filePath){
  let r = [];
  util.fileDisplay(filePath, r);
  return r;
}

let isDecode = fileName.indexOf('.wxapkg')>0;
if(isDecode){// 解码
  let file = fs.readFileSync(fileName);

  let destination = process.argv[3]? process.argv[3] : 'wxapkg.unpack';
  let wxapkg = new Wxapkg(file);
  let files = wxapkg.decode();
  files.forEach((f)=>{
      let filePath = __dirname + '/./' + destination + f.name;
      let dir = path.dirname(filePath);
      mkdirp(dir, function (err) {
          if (err) return cb(err);
  
          console.log(filePath)
          fs.writeFileSync(filePath, f.chunk, 'binary')
      });
  })
}else{// 压缩
  fileName = path.resolve(fileName);
  let wxapkgFileName = fileName + '.wxapkg';
  let list = getFiles(fileName);
  list.forEach((info)=>{
    info.simName = info.file.replace(fileName, '');
  });
  let wxapkg = new Wxapkg();
  wxapkg.encode(list, wxapkgFileName);
  // console.log(path.relative(fileName, list[0].file));
  // console.log(list)
}
