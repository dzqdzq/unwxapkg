# unwxapkg
支持wxapkg格式的解压和压缩
安装：
```sh
npm i https://github.com/dzqdzq/unwxapkg.git -g
```

压缩命令：unwxapkg dir   
默认生成文件：dir.wxapkg

解压命令： unwxapkg file
默认生成目录： file/

<font color=#A52A2A size=4 >
说明： 如果参数是目录，那么将对这个目录压缩，默认排除点开头的文件。 如果是文件名， 那么默认执行解压， 目前支持的文件格式有'.wxapkg', '.wxvpkg', '.wx'。
</>