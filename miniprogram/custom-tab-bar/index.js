import * as logger from '../utils/log';
import Toast from '@vant/weapp/toast/toast';

const app = getApp();

Component({
  data: {
    active: 'certificate',
    list: [
      {
        name: 'certificate',
        url: "/pages/certificate/index",
        icon: "home-o",
        text: "出入证",
        placeholder: true,
        hide: false
      },
      {
        name: 'record',
        url: "/pages/record/index",
        icon: "records",
        info: 0,
        text: "出入记录",
        placeholder: true,
        hide: false
      },
      {
        name: 'check',
        url: "/pages/check/index",
        icon: "eye-o",
        text: "出入检查",
        placeholder: true,
        hide: true
      },
      {
        name: 'profile',
        url: "/pages/profile/index",
        icon: "user-o",
        text: "出入信息",
        placeholder: true,
        hide: false
      },
      {
        name: 'admin',
        url: "/pages/admin/index",
        icon: "sign",
        text: "出入管理",
        placeholder: true,
        hide: true
      }
    ]
  },

  pageLifetimes: {
    show() {
      // not working for tab bar
    },
  },

  lifetimes: {
    attached() {
    },

    // invoke only once
    ready() {
      if (app.globalData.hasUser) {
        this.adjustBarByUser();
      } else {
        app.watchUserLogin((user) => {
          this.adjustBarByUser();
        });
      }
    },
  },

  methods: {
    onChange(event) {
      const name = event.detail;
      const bar = this.data.list.find(item => item.name === name);
      wx.switchTab({
        url: bar.url
      })
    },

    onPageShow() {
      // find active bar
      const page = getCurrentPages().pop();
      const activeBar = this.data.list.find(item => item.url === `/${page.route}`);
      const loginUser = app.globalData.loginUser;
      this.setData({
        active: activeBar.name,
        'list[1].info': loginUser?.certificate?.outing_count,
      });
    },

    adjustBarByUser() {
      // check user role
      const loginUser = app.globalData.loginUser;
      this.setData({
        'list[1].info': loginUser?.certificate?.outing_count,
        'list[2].hide': !loginUser?.role?.checker,
        'list[3].dot': !loginUser?.role?.resident || loginUser?.status === 10,
        'list[4].hide': !loginUser?.role?.admin && !loginUser?.role?.superAdmin,
      });
    },
  }
})