# LittleLedger
自用”单记式“账本应用

<img src="https://github.com/gps949/LittleLedger/raw/main/IMG_3429.PNG" width="25%" /> 

## 什么是“单记式”？
目前大多数账本应用，会有各种让人眼花缭乱的功能，也许财会类的专业人员会比较喜欢，但普通人（至少对我而言）对其中绝大多数功能的需求或许是没有，或许是每个月每个季度甚至每年才有偶尔有个一次两次。   
人们常说“心智负担”，有的人是愿意在记账上花费心智的，但未必每个人都愿意。最大的心智负担来源自哪里？应当是在纷繁的功能、名词、按钮、菜单中穿梭寻觅吧。   
记一次账，还需要打开应用、看闪屏、点到我的账本标签、选择账本、选择记一笔。其实本身流程也许只比本项目的多一点点，但是在这一路上，你会遇到各种概念和围绕着的各种功能，什么预算、分析图啥的。   
例如上面流程来自于“随手记”app，其显然意识到了人们需要快速简单记账的需求，所以才添加了“记一笔”功能。这本身用意是好的，但并没有把这个功能放到首位而把其他平时记账时不关注的事情“藏起来”，这就徒增了心智负担，更何况还加了社区、广告啥的。   

所以回到主题，什么是“单记式”？    
我把记账类应用中常见的功能点分成如下种类：  
- 记账
- 改账
- 预决算
- 统计分析
- 数据存储与同步
- 社群交流
- 广告
- 设置   
   
所以，所谓“单记式”，就是只进行“记账”（以及与之配套不可缺少的部分配置）。其他的不做支持。   

## 使用方法

### 通过Docker（推荐）
```bash
docker run --privileged=true -d --restart=always -p <本地服务端口>:3456 -v <持久存放账本本地路径>:/home/littleledger/ledgers gps949/littleledger:latest
```    
将其中<本地服务端口>、<持久存放账本本地路径>改成你需要的内容。   
   
【new】如果你需要在访问应用时添加验证（用户名口令），添加-e参数，如下形式：   
```bash
docker run --privileged=true -d --restart=always -e LL_USER=<你的用户名> -e LL_PWD=<你的口令> -p <本地服务端口>:3456 -v <持久存放账本本地路径>:/home/littleledger/ledgers gps949/littleledger:latest
```    

### 使用docker compose   
感谢@frankwuzp 提供的compose文件。
使用compose文件执行docker-compose命令即可。   
*注意根据自己情况修改其中的账本挂载路径及（如果需要的话）用户名口令。*   

### 直接运行Node   
```bash
git clone https://github.com/gps949/LittleLedger.git
cd LittleLedger/LittleLedger
npm install
node app.js
```   
【new】如果你需要在访问应用时添加验证（用户名口令），添加参数，如下形式：    
```bash
git clone https://github.com/gps949/LittleLedger.git
cd LittleLedger/LittleLedger
npm install
node app.js USERNAME=<你的用户名> PASSWORD=<你的口令>
```   
### 补充说明
1. 通过上面两种方法启动之后，即可通过浏览器访问3456端口进行使用。初次使用建议在设置页添加资金账户、负债账户和动账种类，也可以在之后使用过程中随时添加。
2. 每次进行设置（添加账户或动账种类）后点击左上角图标刷新页面。
3. 需要查看账本可以点击右上角下载或显示账本xlsx文件。
4. 需要改账、统计分析时，可以直接在下载下来的xlsx文件的第4个表页（Sheet）上进行，前三个Sheet不要修改。如需任何操作，可在第4表页上以前3表页通过应用记录的数据进行。
5. 手动修改过xlsx后直接上传服务端覆盖即可，但涉及账户或动账种类的修改需要点击左上角图标刷新页面。

### Fly.io部署
创建Fly.io账号、安装fly cli等步骤不进行赘述。
```bash
git clone https://github.com/gps949/LittleLedger.git
cd LittleLedger/flyio
cp ../LittleLedger ./ -r
fly launch
```

