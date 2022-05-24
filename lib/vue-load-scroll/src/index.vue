<template>
  <div @scroll.passive="handleScroll" class="scroll-container" ref="container">
    <div
      ref="pullDownHeader"
      class="pull-down-header"
      :style="{
        height: pullDown.height + 'px',
        transition: withAnimation ? 'height .2s ease' : '',
      }"
    >
      <div class="pull-down-content" :style="pullDownContentStyle">
        <i class="pull-down-content--icon" :class="iconClass"></i>
        <span class="pull-down-content--label">{{ label }}</span>
      </div>
    </div>
    <slot></slot>
    <slot name="bottom">
      <div class="loadmore-footer" v-if="enablePullupLoad" @click="onBottomErrorClick">
        <div>{{bottomText}}</div>
      </div>
    </slot>
  </div>
</template>

<script>
const PULLDOWN_STATUS = {
  start: "start", // 等待
  ready: "ready", // 下拉刷新
  refresh: "refresh", // 加载中
  success: "success", // 完成
  error: "error" // 错误
};
const PULLUP_STATUS = {
  wait: "wait", // 等待
  loading: "loading", // 正在加载
  nodata: "nodata", // 暂无数据
  error: "error" // 错误
};

export default {
  name: "vue-load-scroll",
  props: {
    // 是否开启下拉刷新
    enablePullDown: {
      type: Boolean,
      default: true,
    },
    // 下拉触发返回promise的函数
    onPulldownRefresh: {
      type: Function,
    },
    // 传入的下拉展示话术配置
    pullDownText: {
      type: Object,
      default: () => {
        return {};
      }
    },
    pullDownHeight: {
      type: Number,
      default: 60
    },
    // 是否开启上拉底部加载
    enablePullupLoad: {
      type: Boolean,
      default: true,
    },
    // 触发上拉无限滚动距离
    bottomDistance: {
      type: Number,
      default: 10
    },
    // 容器scroll事件
    eventScroll: {
      type: Function
    },
    // 上拉触发返回promise的函数
    onPullupRefresh: {
      type: Function,
    },
    // 传入的上拉显示话术配置
    pullUpText: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      pullDown: {
        status: 0,
        height: 0,
      },
      canPullDown: false,
      // 下拉框高度恢复到0时候的缓冲动画
      withAnimation: false,
      // 记录点击位置，及滑动距离
      touchPosition: {
        start: 0,
        distance: 0,
      },
      bottomStatus: PULLUP_STATUS.wait
    };
  },
  computed: {
    computedPullDownText() {
      return {
        start: this.pullDownText.start || "下拉刷新数据", // 等待
        ready: this.pullDownText.ready || "松开刷新数据", // 下拉刷新
        refresh: this.pullDownText.refresh || "数据刷新中", // 加载中
        success: this.pullDownText.success || "刷新完成", // 完成
        error: this.pullDownText.error || "数据异常" // 错误
      };
    },
    label() {
      return this.computedPullDownText[this.pullDown.status];
    },
    iconClass() {
      // icon of pull down
      if (this.pullDown.status === PULLDOWN_STATUS.refresh) {
        return "pull-down-refresh";
      } else if (this.pullDown.status === PULLDOWN_STATUS.error) {
        return "pull-down-error";
      }
      return "";
    },
    pullDownContentStyle() {
      return {
        bottom: (this.pullDownHeight - 40) / 2 + "px",
      };
    },
    computedPullUpText() {
      return {
        wait: this.pullDownText.wait || "", // 等待
        loading: this.pullDownText.loading || "正在加载更多...", // 正在加载
        nodata: this.pullDownText.nodata || "暂无更多数据", // 暂无数据
        error: this.pullDownText.error || "请求数据出错，请点击重试" // 错误
      };
    },
    bottomText() {
      return this.computedPullUpText[this.bottomStatus] || '';
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initPullDown();
    });
  },
  watch: {
    enablePullDown(val) {
      // 如果是动态的触发了下拉功能则手动初始化下拉
      if (val) {
        this.$nextTick(() => {
          this.initPullDown();
        });
      }
    },
  },
  methods: {
    initPullDown() {
      if (!this.enablePullDown) return;
      const el = this.$el;
      const pullDownHeader = this.$refs.pullDownHeader;
      const icon = el.querySelector(".pull-down-content--icon");
      // touchstart判断当前容器是否有滚动值，如果有滚动值则不触发touchmove
      el.addEventListener("touchstart", (e) => {
        this.canPullDown = el.scrollTop === 0;
        this.touchPosition.start = e.touches.item(0).pageY;
      });

      /**
       * touchmove更新下拉框高度
       * 更新图标动画样式
       * 更新下拉状态
       */
      el.addEventListener("touchmove", (e) => {
        // 这里是为了处理touchmove过程中突然放开了下拉功能
        if (this.touchPosition.start === 0) {
          this.canPullDown = el.scrollTop === 0;
          this.touchPosition.start = e.touches.item(0).pageY;
        }
        if (!this.canPullDown) return;
        let distance = e.touches.item(0).pageY - this.touchPosition.start;
        // 先限制最大下拉高度为100
        distance = distance > 100 ? 100 : distance;
        // 更新distance和下拉框的高度
        this.touchPosition.distance = distance;
        this.pullDown.height = distance;
        /**
         * 如果下拉高度大于设定的下拉框高度那么更改下拉状态为PULLDOWN_STATUS
         * 下拉图表旋转180deg
         */
        if (distance > this.pullDownHeight) {
          this.pullDown.status = PULLDOWN_STATUS;
          icon.style.transform = "rotate(180deg)";
        } else {
          /**
           * 如果还没到下拉框高度就是PULLDOWN_STATUS.ready状态
           * 按比例旋转图标
           */
          this.pullDown.status = PULLDOWN_STATUS.ready;
          icon.style.transform =
            "rotate(" + (distance / this.pullDownHeight) * 180 + "deg)";
        }
      });

      // touchend 松手后判断执行
      el.addEventListener("touchend", () => {
        this.canPullDown = false;
        // 如果下拉距离大于下拉框高度下拉框高度确定，状态更新
        if (this.touchPosition.distance > this.pullDownHeight) {
          this.pullDown.height = this.pullDownHeight;
          this.pullDown.status = PULLDOWN_STATUS.refresh;
          // 如果有传promise函数则执行
          if (
            this.onPulldownRefresh &&
            typeof this.onPulldownRefresh === "function"
          ) {
            const res = this.onPulldownRefresh();
            console.log(res);
            // 判断是否是promise返回
            if (res && res.then && typeof res.then === "function") {
              res.then(
                () => {
                  // 如果成功更新状态为PULLDOWN_STATUS.success
                  this.pullDown.status = PULLDOWN_STATUS.success;
                  // 延时1s后回复初始状态
                  setTimeout(() => {
                    this.resetPullDown(true);
                  }, 1000);
                },
                () => {
                  this.pullDown.status = PULLDOWN_STATUS.error;
                  // 延时1s后回复初始状态
                  setTimeout(() => {
                    this.resetPullDown(true);
                  }, 1000);
                }
              );
            } else {
              this.resetPullDown();
            }
          } else {
            this.resetPullDown();
            console.warn(
              "please use :on-refresh to pass onPulldownRefresh callback"
            );
          }
        }
      });
      // 监控动画恢复高度后去除动画
      pullDownHeader.addEventListener("transitionend", () => {
        this.withAnimation = false;
      });
      pullDownHeader.addEventListener("webkitTransitionEnd", () => {
        this.withAnimation = false;
      });
    },
    resetPullDown(withAnimation) {
      // 重置图标旋转
      const icon = this.$el.querySelector(".pull-down-content--icon");
      icon.style.transform = "";
      this.withAnimation = !!withAnimation;
      this.pullDown.height = 0;
      this.pullDown.status = PULLDOWN_STATUS.ready;
      // reset touchPosition
      this.touchPosition.distance = 0;
      this.touchPosition.start = 0;
      this.resetPullup()
    },
    handleScroll() {
      // 传进来的容器滚动事件
      this.eventScroll && this.eventScroll();
      // 如果禁止下拉加载，或者容器
      if (!this.enablePullupLoad || window.getComputedStyle(this.$el).overflow !== 'auto') {
        return;
      }
      if (this.bottomStatus !== PULLUP_STATUS.wait) {
        return;
      }
      let bDistance =
        this.$el.scrollHeight - this.$el.scrollTop - this.$el.clientHeight;
      if (bDistance <= this.bottomDistance) {
        this.bottomStatus = PULLUP_STATUS.loading;
        // 如果有传promise函数则执行
        if (
          this.onPullupRefresh &&
          typeof this.onPullupRefresh === "function"
        ) {
          const res = this.onPullupRefresh();
          // 判断是否是promise返回
          if (res && res.then && typeof res.then === "function") {
            res.then(
              (flag) => {
                // 如果成功更新状态如果flag为true表明没有更多数据了
                if (flag) {
                  this.bottomStatus = PULLUP_STATUS.nodata;
                } else {
                  this.bottomStatus = PULLUP_STATUS.wait;
                }
              },
              () => {
                // 如果失败更新状态为error
                this.bottomStatus = PULLUP_STATUS.error;
              }
            );
          } else {
            this.resetPullup();
          }
        } else {
          this.resetPullup();
          console.warn(
            "please use :on-refresh to pass onPullupRefresh callback"
          );
        }
      }
    },
    resetPullup() {
      this.bottomStatus = PULLUP_STATUS.wait;
    },
    // 出错时，点击重新加载数据
    onBottomErrorClick() {
      if (this.bottomStatus === PULLUP_STATUS.error) {
        this.bottomStatus = PULLUP_STATUS.loading;
        this.$emit("bottom-error-click");
      }
    },
  },
};
</script>

<style lang="less" scoped>
.scroll-container {
  .pull-down-header {
    width: 100%;
    height: 0px;
    overflow: hidden;
    position: relative;
    background-color: #2c3133;
  }
  .pull-down-content {
    position: absolute;
    max-width: 90%;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    height: 40px;
    color: #d5d5d5;
    text-align: center;
    border-left: 20px solid transparent;
    font-family: "noto-thin", "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 14px;
    &--icon {
      float: left;
      height: 20px;
      width: 20px;
      margin-top: 10px;
      margin-left: -20px;
      background: url(./down-arrow.png) no-repeat center center;
      background-size: 20px 20px;
      &.pull-down-refresh {
        background: url(./refresh-icon.png) no-repeat center center;
        background-size: 20px 20px;
        animation: rotate 2s infinite;
        animation-timing-function: linear;
      }
      &.pull-down-error {
        background: url(./error-icon.png) no-repeat center center;
        background-size: 20px 20px;
      }
    }
    &--label {
      float: left;
      height: 20px;
      line-height: 20px;
      margin-left: 10px;
      margin-top: 10px;
    }
  }
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
