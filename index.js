"use strict";

const _ = require("./util");
const fs = require("fs");

const DEFAULT = {
  firstMark: [0xbe],
  lastMark: [0xed],
};

function wxapkgFileInfo() {
  this.nameLen = 0;
  this.name = "";
  this.offset = 0;
  this.size = 0;
}

class Wxapkg {
  constructor(file) {
    this.initFile(file);
  }

  initFile(file){
    this.index = 0; // 解码游标
    this.buffer = new Uint8Array(file);
  }

  /**
   * 读取buffer数组的指定字节数
   * @param  {Number} length 读取长度
   * @return {Array}         读取到的数据
   */
  readBytes(length) {
    let buffer = _.readBytes(this.buffer, this.index, length);
    this.index += length;

    return buffer;
  }

  /**
   * 解码
   * @return {Array}        文件数组
   */
  _decode() {
    if (!this.buffer) {
      throw new Error("不存在待解码数据！");
    }
    this._decodeHeader(); // 解析头部信息
    return this._decodeChunkInfo(); // 解析数据块元数据
  }

  /**
   * 解码输出文件
   * @return {Void}
   */
  decode() {
    let files = [];
    let fileInfoList = this._decode();
    fileInfoList.forEach((f) => {
      let file = {};
      file.chunk = _.readBytes(this.buffer, f.offset, f.size);
      file.name = f.name;
      files.push(file);
    });
    return files;
  }

  /**
   * 编码输出文件
   * @return {Void}
   */
  encode(files, wxapkgFileName){
    let fd = fs.createWriteStream(wxapkgFileName, "binary");

    let buffer = Buffer.alloc(1024);
    let head = {
      fileInfo:0,
      indexInfoLength:0,
      bodyInfoLength:0,
      fileCount:files.length,
    }

    let fileInfos = [];
    let infoSize = this._encodeChunkInfo(files, fileInfos);
    head.indexInfoLength = infoSize+4;
    head.bodyInfoLength = this.calTotalLength(fileInfos);
    this._encodeHeader(buffer, head);
    // 更新实际写入偏移
    let firstOff = head.indexInfoLength + 0xd + 1;
    this.encodeChunkInfo(buffer, fileInfos, firstOff);
    fd.write(buffer.slice(0, this.index));
    // 写入实际内容
    files.forEach(file=>{
      let data = fs.readFileSync(file.file)
      fd.write(data);
    });
    fd.close();
  }

  calTotalLength(fileInfos){
    let {offset,size} = fileInfos[fileInfos.length-1];
    return offset+size;
  }

  /**
   * 
   * @param {Buffer} buf 
   */
  _encodeHeader(buf, head){
    let {
      fileInfo,
      indexInfoLength,
      bodyInfoLength,
      fileCount,
    } = head;
    let i= 0;
    // 计算头部数据
    buf.writeUInt8(DEFAULT.firstMark, i);i+=1;
    buf.writeUInt32BE(fileInfo, i);i+=4;
    buf.writeUInt32BE(indexInfoLength,i);i+=4;
    buf.writeUInt32BE(bodyInfoLength,i);i+=4;
    buf.writeUInt8(DEFAULT.lastMark,i);i+=1;
    buf.writeUInt32BE(fileCount,i);i+=4;
    this.index = i;
  }

  /**
   * 解码头部信息
   * @return {Void}
   */
  _decodeHeader() {
    if (this.index !== 0) {
      throw new Error("index属性指向非0！");
    }

    this.firstMark = this.readBytes(1);
    if (!_.equal(this.firstMark, DEFAULT.firstMark)) {
      throw new Error("wxpakg文件错误 - firstMark");
    }

    this.fileInfo = _.readInt32(this.readBytes(4));

    this.indexInfoLength = _.readInt32(this.readBytes(4));

    this.bodyInfoLength = _.readInt32(this.readBytes(4));

    this.lastMark = this.readBytes(1);

    if (!_.equal(this.lastMark, DEFAULT.lastMark)) {
      throw new Error("wxpakg文件错误 - lastMark");
    }

    this.fileCount = _.readInt32(this.readBytes(4));

    console.log(`fileCount = ${this.fileCount}`);
  }

  /**
   * 解析元数据
   * @return {Array} 数据块元数据数组
   */
  _decodeChunkInfo() {
    let fileList = [];
    for (let i = 0; i < this.fileCount; i++) {
      let fileInfo = new wxapkgFileInfo();
      fileInfo.nameLen = _.readInt32(this.readBytes(4));
      fileInfo.name = _.bufferToString(this.readBytes(fileInfo.nameLen));
      fileInfo.offset = _.readInt32(this.readBytes(4));
      fileInfo.size = _.readInt32(this.readBytes(4));

      console.log(`fileName - ${fileInfo.name}`);

      fileList.push(fileInfo);
    }
    return fileList;
  }

  _encodeChunkInfo(files, results) {
    let infoSize = 0;
    for (let i = 0, j=files.length; i < j; i++) {
      let {simName, stats} = files[i];
      let fileInfo = new wxapkgFileInfo();
      fileInfo.nameLen = simName.length;
      fileInfo.name = simName;
      if(results.length){
        fileInfo.offset = this.calTotalLength(results);
      }else{
        fileInfo.offset = 0;
      }
      fileInfo.size = stats.size;
      results.push(fileInfo);
      infoSize += fileInfo.nameLen+12;
    }
    return infoSize;
  }

  /**
   * 
   * @param {Buffer} buf 
   * @param {wxapkgFileInfo[]} fileInfos 
   * @param {number} firstOff 
   */
  encodeChunkInfo(buf,fileInfos, firstOff){
    for (let fileInfo of fileInfos) {
      let {
        nameLen,
        name,
        offset,
        size,
      } = fileInfo;
      let i=this.index;

      buf.writeUInt32BE(nameLen, i);i+=4;
      buf.write(name, i);i+=nameLen;
      buf.writeUInt32BE(firstOff + offset, i);i+=4;
      buf.writeUInt32BE(size, i);i+=4;
      this.index = i;
    }
  }
}

module.exports = Wxapkg;
