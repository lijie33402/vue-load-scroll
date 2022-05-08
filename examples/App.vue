<template>
  <div id="app">
    <vue-load-scroll class="scroll-container" :on-pulldown-refresh="onRefresh">
      <div class="content">
        我是滚动内容
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
  methods: {
    onRefresh() {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve();
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
