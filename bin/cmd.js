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

if (fileName=== '*'){
  let paths = fs.readdirSync('.');
  console.log(paths);
  
  paths.forEach(fileName=>{
    fileName = path.resolve(fileName);
    var extname=path.extname(fileName);
    if(['.wxapkg', '.wx'].includes(extname)){
      processOne(fileName)
    }
  })
}else{
  processOne(fileName);
}

function processOne(fileName){
  if(fs.existsSync(fileName)){
    new Error(`${fileName} 不存在`);
  }
  
  function getFiles(filePath){
    let r = [];
    util.fileDisplay(filePath, r);
    return r;
  }
  
  fileName = path.resolve(fileName);
  var extname=path.extname(fileName);
  let isDecode = ['.wxapkg', '.wx'].includes(extname);
  
  if(isDecode){// 解码
    let file = fs.readFileSync(fileName);
    let writePath = fileName.replace(extname, '/');
    let wxapkg = new Wxapkg(file);
    let files = wxapkg.decode();
    files.forEach((f)=>{
        let filePath = path.join(writePath, f.name);
        let dir = path.dirname(filePath);
        mkdirp(dir, function (err) {
            if (err) return cb(err);
    
            console.log(filePath)
            fs.writeFileSync(filePath, f.chunk, 'binary')
        });
    })
  }else{// 压缩
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
  
}
