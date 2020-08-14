(function(ctx) {
  // 定义发布者
  function Dep() {
    // 订阅者列表
    this.subs = [];
  }
  Dep.prototype.notify = function() {
    if (this.subs) {
      this.subs.forEach(item => {
        console.log(item);
        item.update();
      })
    }
  }

  // 定义订阅者（观察者）
  function Watch(vm, node, name) {
    // 这个全局变量的作用，在watch.get的时候通过defineReactive中的Dep把this(订阅者)挂在了get/set方法的scope作用域里面。使得订阅者和data的get/set方法关联起来
    Dep.global = this;
    this.vm = vm;
    this.node = node;
    this.name = name;
    this.update();
    Dep.global = null;
  }

  Watch.prototype.update = function() {
    this.get();
    switch (this.node.nodeType) {
      case 1:
        this.node.value = this.value;
        break;
      case 3:
        this.node.nodeValue = this.value;
        break;
      default: break;
    }
  }

  Watch.prototype.get = function() {
    // 触发data的defineProperty中的get方法，在get方法中把Watch和get/set关联起来
    this.value = this.vm[this.name];
  }


  function defineReactive (obj, key, value){
    let dep = new Dep();
    Object.defineProperty(obj, key, {
      get: function(){
        console.log("get了值"+value);
        console.log("Dep.global: " + Dep.global);
        if (Dep.global) {
          dep.subs.push(Dep.global);
        }
        return value;//获取到了值
      },
      set: function(newValue){
        if(newValue === value){
          return;//如果值没变化，不用触发新值改变
        }
        value = newValue;//改变了值
        console.log("set了最新值"+value);
        dep.notify();
      }
    })
  }
  function nodeContainer(node, vm, flag) {
    flag = flag || document.createDocumentFragment();
    let child;
    if (!node) return flag;
    while (child = node.firstChild) {
      complie(child, vm);
      // 把child节点从页面的node节点下转移到了虚拟节点flag
      flag.appendChild(child);
      if (child.firstChild) {
        nodeContainer(child, vm, flag);
      }
    }
    return flag;
  }

  function complie(node, vm) {
    let reg = /\{\{(.*)\}\}/g;
    if (node.nodeType === 1) { // 元素节点
      let attrs = node.attributes;
      attrs = Array.prototype.slice.call(attrs);
      attrs.forEach(attr => {
        if (attr.nodeName === 'v-model') {
          let attrName = attr.nodeValue;
          
          node.addEventListener('input', e => {
            console.log(vm[attrName]);
            let newValue = e.target.value;
            vm[attrName] = newValue;
          })
          node.value = vm[attrName];
          // 在这里添加观察者模式
          new Watch(vm, node, attrName);
        }
      })
    }
    if (node.nodeType === 3) { // 文本节点
      if (reg.test(node.nodeValue)) {
        let attrName = RegExp.$1.trim();
        node.nodeValue = vm.data[attrName];
        // 在这里添加观察者模式
        new Watch(vm, node, attrName);
      }
    }
  }
  function observe (obj, vm) {
    let keys = Object.keys(obj);
    keys.forEach(key => {
      defineReactive(vm, key, obj[key]);
    })
  }
  function Vue(opt){
    opt = opt || {};
    this.data = opt.data;
    /* 处理data属性的响应式 */
    observe(this.data, this);

    if (opt.el) {
      let id = opt.el;
      let $el = document.querySelector(opt.el);
      let vdom = nodeContainer($el, this);
      $el.appendChild(vdom);
    }
  
  }
  ctx.Vue = Vue;
})(window)
// let obj = { };

// defineReactive(obj, 'myName', obj.myName);
// document.getElementById('myName').addEventListener('input', function(e) {
//   let newValue = e.target.value;
//   obj.myName = newValue;
// })