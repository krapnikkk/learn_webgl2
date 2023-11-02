const fs = require('fs');
const path = require('path');
const list = [];
function traverseDirectory(directoryPath) {
  const files = fs.readdirSync(directoryPath); // 读取目录下的所有文件和文件夹

  files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath); // 获取文件/文件夹的状态信息

    if (stats.isDirectory()) {
    //   console.log('Directory:', filePath);
      traverseDirectory(filePath); // 递归遍历子文件夹
    } else {
        if(filePath.indexOf('.html') > -1){
            list.push(filePath.replace(/\\/g,'/').replace('../','./'))
        }
    //   console.log('File:', filePath);
    }
  });
}

traverseDirectory("../");
list.pop();
fs.writeFileSync('./list.json',JSON.stringify({list}))
