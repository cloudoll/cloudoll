# cloudoll

cloudoll 是微服务的依赖类库，籍由此项目，可以迅速创建微服务，并且提供了许多现成的工具解决实际项目中的各种问题。

使用方法：


```
npm i cloudoll --save
```

以下是一篇完整使用 cloudoll 编写微服务的文章。


<!--
## 目录

* [从 0 开始创建微服务](#from0)

* [更多的链接](#category)

* [贡献者](#contributors)
-->

<!--

## 故事背景

从前有一群很懒的程序猿，生活在不为人知的云之暗面。

因为他们很懒，所以不愿意多写一个代码。

因为他们还有点良知，所以又不愿意糊弄，那些高并发啊，分布式啊，都要考虑进来。

他们又造了几个轮子：**cloudark 套件**

在这个轮子上，他们希望不用再写那些写了一辈子的重复代码了，

也不用再去关心程序性能问题了。【好吧，我要保证我不会在函数里写死循环！！】

-->

<a name="from0"/>

## 从 0 开始创建一个微服务

### 0 示例中的角色定义

本文章中一套完整的分布式微服务有如下三种角色：

* 微服务提供者：hello_word 及其所有的克隆体

* 微服务的注册中心：cloudeer-server-rest

* 消费者：wow


### 1. 使用 cloudoll 创建 web 应用

创建一个目录：hello_world，cd 进去之后输入命令行 npm init。

引入 cloudoll 包

```
npm i cloudoll --save
```


在项目根目录下创建一个入口文件 /index.js，代码内容如下：

```
require('cloudoll').KoaApplication();
```


创建文件 /api/open/hello.js

```
module.exports = {
  world: function *() {
    this.echo("你好世界。form port: " + process.env.port );
  }
};

```

现在启动服务：

```
node index.js
```

现在访问一下试试

http://localhost:3000/open/hello/world



### 2. 运行注册服务 cloudoll-server-rest

**这部分可以使用 cloudoll-server 项目，相应的配置文件的节点更换成 tcp**
 
从 git 上 下载源码：

```
git clone https://github.com/cloudoll/cloudoll-server-rest
```

进入到目录，进行 node 前戏工作 。

```
npm install
```

手工创建一个 /data 的目录用来存储数据。

运行：

```
node index.js
```

访问 http://localhost:8801/view

无需改动 cloudeer 任何代码。

打完收工!


### 3. 分布式的微服务 hello_world

好了，接下来，我们把第一步中写的程序变成可以被分布部署的微服务。

创建一个文件： /config/development.js

注意：在第一步创建的那个项目下哦，嫑搞错位置了。

内容如下：

```javascript
module.exports = {
  app_name      : "hello_world",
  my_host       : "127.0.0.1",
  debug         : true,
  port          : 3000,
  cloudeer      :{
    type    : 'rest', //支持 'rest', 'tcp'
    host    : '127.0.0.1', //这个是注册中心的地址
    port    : 8801
  },
};
```

其中 cloudeer 节点的配置会将这个应用变成分布式的微服务。

my_host 可以不用指定，他会寻找当前机器的内网地址。


现在重启一下咯。

现在访问注册中心看看：

http://localhost:8801/view

和

http://localhost:8801/methods

这个时候注册中心应该列出了微服务实例和方法的列表。


好像很简单呀！

万里长征才走完第一步。

如果感兴趣请继续。


### 4. 创建另一个微服务（wow）并调用 hello_world 微服务

现在创建另一个微服务，步骤和前面的 hello_world 一样。

你可以直接拷贝过来。但需要改一些关键的地方。

修改配置文件： /config/development.js：

将 app_name 改成另一个， 现在改成 wow， 这样他才会变成另一个微服务。

修改端口 port 为 3002。


```javascript
module.exports = {
  app_name      : "hello_world",
  my_host       : "127.0.0.1",
  debug         : true,
  port          : 3002,
  cloudeer      :{
    type    : 'rest', //支持 'rest', 'tcp'
    host    : '127.0.0.1',
    port    : 8801
  },
};
```


修改 /api/open/hello.js 让消费端能区分是哪个微服务实例提供的服务。

```
module.exports = {
  world: function *() {
    var res   = yield this.getCloudeer("hello_world", "/open/hello/world");
    this.echo("来自远方的问候: " + res);
  }
};
```

启动服务:

```
node index.js
```

看看控制台的输出 http 端口，类似下面的输出。

```
Koa Application 正在启动，尝试端口：3002
Koa Application 启动成功！端口： 3002
```

并在浏览器里看看 http://localhost:3002/open/hello/world


### 5. 分布部署 hello_world

多次拷贝 hello_world 项目，更换 port 的值。注意 port 不要重复。

如果你有多个机器，可以使用多机部署，但需要调整正确的 ip 地址。

然后分别执行：

```
node index.js
```

<!--
不要担心端口问题，他会自动寻找合适的端口。**(这个不对了，现在的版本不支持自动更换端口)**
-->


### 6. 证明一下

现在你可以去并发执行 wow 的 /open/hello/world 了。

在浏览器中不断的刷新 http://localhost:3002/open/hello/world 就可以看到结果。

例子中用端口表示了他是从哪个微服务上访问过来的。



<a name='category' />

# cloudoll has more...

[请访问 cloudoc 项目阅读](https://github.com/cloudoll/cloudoc)

