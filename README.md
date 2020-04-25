# Misaka-on-bilibili
爬取bilibili.com上所有名为“御坂{i}号”的用户昵称

## 运行

```bash
git clone https://github.com/AntaresQAQ/Misaka-on-bilibili.git
cd Misaka-on-bilibili
yarn
node run.js
```
## 查看结果

程序结束后会生成三个文件

`used.txt`为已经存在的id

`unused.txt`为没有注册的id

`error.txt`为查询出错的id