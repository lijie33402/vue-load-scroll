<template>
  <div class="scroll-container" ref="container">
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
      <div class="garen-loadmore-footer" v-if="!enablePullupLoad" @click="onBottomErrorClick">
        <div>{{bottomText}}</div>
      </div>
    </slot>
  </div>
</template>

<script>
// status of pull down
const STATUS_ERROR = -1;
const STATUS_START = 0;
const STATUS_READY = 1;
const STATUS_REFRESH = 2;
const STATUS_SUCCESS = 3;

// labels of pull down
const LABELS = [
  "数据异常",
  "下拉刷新数据",
  "松开刷新数据",
  "数据刷新中...",
  "刷新完成",
];

const BOTTOMSTATUS = {
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
    config: {
      type: Object,
      default: function () {
        return {};
      },
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
  },
  data() {
    return {
      pullDown: {
        status: 0,
        height: 0,
        msg: "",
      },
      canPullDown: false,
      withAnimation: false, // 下拉框高度恢复到0时候的缓冲动画
      // 记录点击位置，及滑动距离
      touchPosition: {
        start: 0,
        distance: 0,
      },
      bottomStatus: BOTTOMSTATUS.wait
    };
  },
  computed: {
    pullDownHeight() {
      return this.config.pullDownHeight || 60;
    },
    label() {
      // label of pull down
      if (this.pullDown.status === STATUS_ERROR) {
        return this.pullDown.msg;
      }
      return this.customLabels[this.pullDown.status + 1];
    },
    customLabels() {
      const errorLabel =
        this.config.errorLabel !== undefined
          ? this.config.errorLabel
          : LABELS[0];
      const startLabel =
        this.config.startLabel !== undefined
          ? this.config.startLabel
          : LABELS[1];
      const readyLaebl =
        this.config.readyLabel !== undefined
          ? this.config.readyLabel
          : LABELS[2];
      const loadingLabel =
        this.config.loadingLabel !== undefined
          ? this.config.loadingLabel
          : LABELS[3];
      const successLabel =
        this.config.successLabel !== undefined
          ? this.config.successLabel
          : LABELS[4];
      return [errorLabel, startLabel, readyLaebl, loadingLabel, successLabel];
    },
    iconClass() {
      // icon of pull down
      if (this.pullDown.status === STATUS_REFRESH) {
        return "pull-down-refresh";
      } else if (this.pullDown.status === STATUS_ERROR) {
        return "pull-down-error";
      }
      return "";
    },
    pullDownContentStyle() {
      return {
        bottom: (this.pullDownHeight - 40) / 2 + "px",
      };
    },
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
        var distance = e.touches.item(0).pageY - this.touchPosition.start;
        // 先限制最大下拉高度为100
        distance = distance > 100 ? 100 : distance;
        // 更新distance和下拉框的高度
        this.touchPosition.distance = distance;
        this.pullDown.height = distance;
        /**
         * 如果下拉高度大于设定的下拉框高度那么更改下拉状态为STATUS_READY
         * 下拉图表旋转180deg
         */
        if (distance > this.pullDownHeight) {
          this.pullDown.status = STATUS_READY;
          icon.style.transform = "rotate(180deg)";
        } else {
          /**
           * 如果还没到下拉框高度就是STATUS_START状态
           * 按比例旋转图标
           */
          this.pullDown.status = STATUS_START;
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
          this.pullDown.status = STATUS_REFRESH;
          // 如果有传promise函数则执行
          if (
            this.onPulldownRefresh &&
            typeof this.onPulldownRefresh === "function"
          ) {
            var res = this.onPulldownRefresh();
            console.log(res);
            // 判断是否是promise返回
            if (res && res.then && typeof res.then === "function") {
              res.then(
                () => {
                  // 如果成功更新状态为STATUS_SUCCESS
                  this.pullDown.status = STATUS_SUCCESS;
                  // 延时1s后回复初始状态
                  setTimeout(() => {
                    this.resetPullDown(true);
                  }, 1000);
                },
                () => {
                  // 如果失败更新状态为STATUS_ERROR
                  this.pullDown.msg = this.customLabels[0];
                  this.pullDown.status = STATUS_ERROR;
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
        } else {
          this.resetPullDown();
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
      this.pullDown.status = STATUS_START;
      // reset touchPosition
      this.touchPosition.distance = 0;
      this.touchPosition.start = 0;
    },
    handleScroll() {
      // 传进来的容器滚动事件
      this.eventScroll && this.eventScroll();
      // 如果禁止下拉加载，或者容器
      if (!this.enablePullupLoad || window.getComputedStyle(this.$el).overflow !== 'auto') {
        return;
      }
      if (this.bottomStatus !== BOTTOMSTATUS.wait) {
        return;
      }
      let bDistance =
        this.$el.scrollHeight - this.$el.scrollTop - this.$el.clientHeight;
      if (bDistance <= this.bottomDistance) {
        this.bottomStatus = BOTTOMSTATUS.loading;
        this.$nextTick(() => {
          try {
            this.$el.scrollTo(0, this.$el.scrollHeight);
          } catch (e) {
            console.log(e);
          }
        });
        this.$emit('bottom-method');
      }
    },
    // 出错时，点击重新加载数据
    onBottomErrorClick() {
      if (this.bottomStatus === BOTTOMSTATUS.error) {
        this.bottomStatus = BOTTOMSTATUS.loading;
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
