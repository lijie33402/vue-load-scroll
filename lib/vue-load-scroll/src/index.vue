<template>
  <div class="scroll-container" ref="container">
    <div
      ref="pullDownHeader"
      class="pull-down-header"
      :style="{ height: pullDown.height + 'px', transition: withAnimation ? 'height .2s ease' : '' }"
    >
      <div class="pull-down-content" :style="pullDownContentStyle">
        <i class="pull-down-content--icon" :class="iconClass"></i>
        <span class="pull-down-content--label">{{ label }}</span>
      </div>
    </div>
    <slot></slot>
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
const LABELS = ["数据异常", "下拉刷新数据", "松开刷新数据", "数据刷新中...", "刷新完成"];
const ANIMATION = "height .2s ease";

export default {
  name: "vue-load-scroll",
  props: {
    enablePullDown: {
      type: Boolean,
      default: true
    },
    onRefresh: {
      type: Function,
    },
    config: {
      type: Object,
      default: function () {
        return {};
      },
    },
  },
  data() {
    return {
      pullDown: {
        status: 0,
        height: 0,
        msg: "",
      },
      canPull: false,
      withAnimation: false, // 下拉框高度恢复到0时候的缓冲动画
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
      var el = this.$el;
      var pullDownHeader = el.querySelector(".pull-down-header");
      var icon = pullDownHeader.querySelector(".pull-down-content--icon");
      /**
       * reset the status of pull down
       * @param {Object} pullDown the pull down
       * @param {Boolean} withAnimation whether add animation when pull up
       */
      let resetPullDown = (pullDown, withAnimation) => {
        if (withAnimation) {
          pullDownHeader.style.transition = ANIMATION;
        }
        pullDown.height = 0;
        pullDown.status = STATUS_START;
      };
      // store of touch position, include start position and distance
      var touchPosition = {
        start: 0,
        distance: 0,
      };

      // bind touchstart event to store start position of touch
      el.addEventListener("touchstart", (e) => {
        console.log('touchstart', el.scrollTop);
        if (el.scrollTop === 0) {
          this.canPull = true;
        } else {
          this.canPull = false;
        }
        touchPosition.start = e.touches.item(0).pageY;
      });

      /**
       * bind touchmove event, do the following:
       * first, update the height of pull down
       * finally, update the status of pull down based on the distance
       */
      el.addEventListener("touchmove", (e) => {
        if (!this.canPull) {
          return;
        }

        var distance = e.touches.item(0).pageY - touchPosition.start;
        // limit the height of pull down to 180
        distance = distance > 180 ? 180 : distance;
        // prevent native scroll
        if (distance > 0) {
          el.style.overflow = "hidden";
        }
        // update touchPosition and the height of pull down
        touchPosition.distance = distance;
        this.pullDown.height = distance;
        /**
         * if distance is bigger than the height of pull down
         * set the status of pull down to STATUS_READY
         */
        if (distance > this.pullDownHeight) {
          this.pullDown.status = STATUS_READY;
          icon.style.transform = "rotate(180deg)";
        } else {
          /**
           * else set the status of pull down to STATUS_START
           * and rotate the icon based on distance
           */
          this.pullDown.status = STATUS_START;
          icon.style.transform =
            "rotate(" + (distance / this.pullDownHeight) * 180 + "deg)";
        }
      });

      // bind touchend event
      el.addEventListener("touchend", () => {
        console.log('touchend', el.scrollTop, this.pullDownHeight);
        this.canPull = false;
        el.style.overflowY = "auto";
        pullDownHeader.style.transition = ANIMATION;
        // reset icon rotate
        icon.style.transform = "";
        // if distance is bigger than 60
        if (touchPosition.distance - el.scrollTop > this.pullDownHeight) {
          el.scrollTop = 0;
          this.pullDown.height = this.pullDownHeight;
          this.pullDown.status = STATUS_REFRESH;
          // trigger refresh callback
          if (this.onRefresh && typeof this.onRefresh === "function") {
            var res = this.onRefresh();
            // if onRefresh return promise
            if (res && res.then && typeof res.then === "function") {
              res.then(
                () => {
                  // success show finish status
                  this.pullDown.status = STATUS_SUCCESS;
                  setTimeout(() => {
                    resetPullDown(this.pullDown, true);
                  }, 1000);
                },
                (error) => {
                  // show error and hide the pull down after 1 second
                  if (typeof error !== "string") {
                    error = false;
                  }
                  this.pullDown.msg = error || this.customLabels[0];
                  this.pullDown.status = STATUS_ERROR;
                  setTimeout(() => {
                    resetPullDown(this.pullDown, true);
                  }, 1000);
                }
              );
            } else {
              resetPullDown(this.pullDown);
            }
          } else {
            resetPullDown(this.pullDown);
            console.warn("please use :on-refresh to pass onRefresh callback");
          }
        } else {
          resetPullDown(this.pullDown);
        }
        // reset touchPosition
        touchPosition.distance = 0;
        touchPosition.start = 0;
      });
      // remove transition when transitionend
      pullDownHeader.addEventListener("transitionend", () => {
        pullDownHeader.style.transition = "";
      });
      pullDownHeader.addEventListener("webkitTransitionEnd", () => {
        pullDownHeader.style.transition = "";
      });
    });
  },
  methods: {
    // initPullDown() {
    //   if (!this.enablePullDown) return
    //   const touchPosition = {
    //     start: 0,
    //     distance: 0,
    //   };
    //   const el = this.$el
    //   // touchstart判断当前容器是否有滚动值，如果有滚动值则不触发touchmove
    //   el.addEventListener("touchstart", (e) => {
    //     if (el.scrollTop === 0) {
    //       this.canPull = true;
    //     } else {
    //       this.canPull = false;
    //     }
    //     touchPosition.start = e.touches.item(0).pageY;
    //   });

    //   /**
    //    * touchmove更新下拉框高度
    //    * 更新图标动画样式
    //    * 更新下拉状态
    //    */
    //   el.addEventListener("touchmove", (e) => {
    //     // 这边需要再加个标志
    //     if (!this.canPull) {
    //       return;
    //     }

    //     var distance = e.touches.item(0).pageY - touchPosition.start;
    //     // limit the height of pull down to 180
    //     distance = distance > 180 ? 180 : distance;
    //     // prevent native scroll
    //     if (distance > 0) {
    //       el.style.overflow = "hidden";
    //     }
    //     // update touchPosition and the height of pull down
    //     touchPosition.distance = distance;
    //     this.pullDown.height = distance;
    //     /**
    //      * if distance is bigger than the height of pull down
    //      * set the status of pull down to STATUS_READY
    //      */
    //     if (distance > this.pullDownHeight) {
    //       this.pullDown.status = STATUS_READY;
    //       icon.style.transform = "rotate(180deg)";
    //     } else {
    //       /**
    //        * else set the status of pull down to STATUS_START
    //        * and rotate the icon based on distance
    //        */
    //       this.pullDown.status = STATUS_START;
    //       icon.style.transform =
    //         "rotate(" + (distance / this.pullDownHeight) * 180 + "deg)";
    //     }
    //   });

    //   // bind touchend event
    //   el.addEventListener("touchend", () => {
    //     console.log('touchend', el.scrollTop, this.pullDownHeight);
    //     this.canPull = false;
    //     el.style.overflowY = "auto";
    //     pullDownHeader.style.transition = ANIMATION;
    //     // reset icon rotate
    //     icon.style.transform = "";
    //     // if distance is bigger than 60
    //     if (touchPosition.distance - el.scrollTop > this.pullDownHeight) {
    //       el.scrollTop = 0;
    //       this.pullDown.height = this.pullDownHeight;
    //       this.pullDown.status = STATUS_REFRESH;
    //       // trigger refresh callback
    //       if (this.onRefresh && typeof this.onRefresh === "function") {
    //         var res = this.onRefresh();
    //         // if onRefresh return promise
    //         if (res && res.then && typeof res.then === "function") {
    //           res.then(
    //             () => {
    //               // success show finish status
    //               this.pullDown.status = STATUS_SUCCESS;
    //               setTimeout(() => {
    //                 resetPullDown(this.pullDown, true);
    //               }, 1000);
    //             },
    //             (error) => {
    //               // show error and hide the pull down after 1 second
    //               if (typeof error !== "string") {
    //                 error = false;
    //               }
    //               this.pullDown.msg = error || this.customLabels[0];
    //               this.pullDown.status = STATUS_ERROR;
    //               setTimeout(() => {
    //                 resetPullDown(this.pullDown, true);
    //               }, 1000);
    //             }
    //           );
    //         } else {
    //           resetPullDown(this.pullDown);
    //         }
    //       } else {
    //         resetPullDown(this.pullDown);
    //         console.warn("please use :on-refresh to pass onRefresh callback");
    //       }
    //     } else {
    //       resetPullDown(this.pullDown);
    //     }
    //     // reset touchPosition
    //     touchPosition.distance = 0;
    //     touchPosition.start = 0;
    //   });
    //   // remove transition when transitionend
    //   pullDownHeader.addEventListener("transitionend", () => {
    //     pullDownHeader.style.transition = "";
    //   });
    //   pullDownHeader.addEventListener("webkitTransitionEnd", () => {
    //     pullDownHeader.style.transition = "";
    //   });
    // }
  }
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
