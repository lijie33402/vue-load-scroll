<template>
  <div id="app">
    <vue-load-scroll class="scroll-container" :on-pulldown-refresh="onRefresh" :on-pullup-refresh="loadMore">
      <div class="content">
        <div>{{content}}</div>
        <div class="list-wrapper">
          <div v-for="(item, index) in list" :key="index">{{item}}</div>
        </div>
      </div>
    </vue-load-scroll>
  </div>
</template>

<script>
import Vue from "vue";
import VueLoadScroll from '../lib/vue-load-scroll'
Vue.use(VueLoadScroll)

export default {
  name: 'App',
  data() {
    return {
      content: '我是滚动内容',
      list: [1,2,3,4,5]
    }
  },
  methods: {
    onRefresh() {
      const _this = this
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve();
          _this.list = [1,2,3,4,5,6,7,8,9,10]
          setTimeout(() => {
            _this.content = '更新滚动内容'
          }, 1000)
        }, 1000);
      });
    },
    loadMore() {
      const _this = this
      return new Promise(function (resolve) {
        setTimeout(function () {
          _this.list = _this.list.concat([1,2,3,4,5])
          console.log('list:', _this.list);
          const noMore = _this.list.length >= 25
          resolve(noMore);
        }, 1000);
      });
    }
  }
}
</script>

<style>
::-webkit-scrollbar {
    width: 0;
}
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
}
.scroll-container {
  height: 100%;
  overflow: auto;

}
.content {
  background: aqua;
}
.list-wrapper > div {
  line-height: 68px;
  border-bottom: 1px solid #2c3e50;
  text-align: center;
}
.bottom {
  height: 100px;
  background: aliceblue;
}
</style>
