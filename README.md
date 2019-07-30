# cloudoll

cloudoll is a web framework for building microservices rapidly.

cloudoll 是微服务的依赖类库，籍由此项目，可以迅速创建可伸缩的微服务，

cloudoll 同时提供了许多现成的工具解决实际项目中的各种问题。

使用方法：


```
npm i cloudoll --save
```

以下是一篇完整使用 cloudoll 编写微服务的入门文章。


### 1.0.1

增强了开发模式。

在开发模式下，下面的目录的文件修改了，应用会重启。

- app/
- config/




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

### 0. 角色定义

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


修改 /api/open/hello.js 输出远程的调用结果。

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





----
# viewloader 页面资源加载器

这个插件的目的是为了将页面资源部署到远方。并且可以方便代理到本地。



## 启用插件 

在文件 plugin.js 里增加

```
viewloader: {
  enable: true,
  package:"eve-viewloader"
}
```

## 配置插件

在 config.${env}.js 里增加 viewloader 节点

配置实例如下：

```js
viewloader = {
  cache: true,
  excludes:['/api'],
  policies: [
    {
      route: /^\/lcp\/(.*)$/,
      remote: "http://g.alicdn.com/cn/wuliuyun-lcp-frontend/$REFRESH_KEY/$1",
      handle: function (ctx, result, config) {
        if (result.type == "text/css") {
          return `.aa{padding: 0} ${result.content}`;
        } else if (result.type == "text/html") {
          return `<h1>这里是标题</h1> ${result.content}`;
        }
        return result.content;
      },
      refreshKey: {
        type: "diamond",
        dataId: 'cn-prize.viewloader.cache.version',
        group: 'eve',
      }
    },
    {
      route: "/abc",
      remote: "http://g.alicdn.com/evil-genius/pigeon-docs/0.0.7/tpl/atom-one-dark.css",
      handle: function (ctx, result, config) {
        return `.body{padding:0}${result.content}`;
      }
    },
    {
      route: /^\/local\/(.*)$/,
      remote: "/Users/xiezhengwei/Documents/MyMD/$1",
      cache: false
    }
  ]
}
```



## 配置指南

### cache 

是否启用缓存（内存缓存），开启后，仅第一次会从远程地址下载内容。

### excludes

- 可以排除掉某些路径，让这些路径不经过 viewloader 插件。
- excludes 规则是左匹配的。
- excludes 规则大于下面的 policies 规则， excludes 满足之后，将不再执行 policies 规则。


### policies 

路由匹配策略， 可配置多条，从先到后，执行匹配到的第一个规则。

#### route, remote

- route 是本地路由地址（或其匹配规则），remote 是远程地址。
- route 可以为一个确定的字符串，也可以是一个正则表达式， remote 是一个字符串。
- 当 route 为字符串的时候，会直接下载 remote 的地址内容。
- 当 route 为正则表达式，则会在 `yourBaseUrl.replace(route, remote)` 之后下载远程内容。
- 你还可以指定 remote 为一个本地路径，这样他可以是一个静态文件服务器。


#### refreshKey 

你可以指定一个配置项，用于从远程 diamond 获取一个配置值，当此值改变的时候，会刷新缓存。

这个值可以用 `$REFRESH_KEY` 表示在 remote 的路径中。


> 警告：当你的远程目标中含有大文件的时候，建议不要使用此插件，
> 本地路径或禁止缓存比较好。

#### cache

策略项中的 cache 配置将会覆盖全局的 cache。

#### handle

handle 是一个函数，用于再次加工远程的下载的内容，插件会传出三个参数。

```
function (ctx, result, config)
```

- ctx: 就是 web 的 context，可以拿到当前项目的上下文
- result：传出的内容，是一个json 对象，由下面的参数组成：
  * type: 远程地址访问 response 出来的 content-type 
  * content: 远程地址的内容 
  * route: 本地的实际路由 
  * remote: 实际的远程地址
- config: 当前路由策略节点

