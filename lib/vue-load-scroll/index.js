import VueLoadScroll from './src/index.vue'

VueLoadScroll.install = function(Vue) {
  Vue.component(VueLoadScroll.name, VueLoadScroll)
}

export default VueLoadScroll