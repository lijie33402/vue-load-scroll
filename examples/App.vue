<template>
  <div id="app">
    <vue-load-scroll class="scroll-container" :on-pulldown-refresh="onRefresh">
      <div class="content">
        {{content}}
      </div>
    </vue-load-scroll>
    <div class="bottom">我是底部</div>
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
      content: '我是滚动内容'
    }
  },
  methods: {
    onRefresh() {
      const _this = this
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve();
          setTimeout(() => {
            _this.content = '更新滚动内容'
          }, 1000)
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
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.scroll-container {
  height: 50vh;
  overflow: auto;

}
.content {
  height: 100vh;
  background: aqua;
}
.bottom {
  height: 100px;
  background: aliceblue;
}
</style>
