import * as logger from '../utils/log';

const app = getApp();

Component({
  data: {
    active: 'certificate',
    placeholder: true,
    list: [
      {
        name: 'certificate',
        url: "/pages/certificate/index",
        icon: "home-o",
        text: "出行证",
        hide: false
      },
      {
        name: 'record',
        url: "/pages/record/index",
        icon: "records",
        info: 0,
        text: "出行记录",
        hide: false
      },
      {
        name: 'check',
        url: "/pages/check/index",
        icon: "eye-o",
        text: "出行检查",
        hide: true
      },
      {
        name: 'profile',
        url: "/pages/profile/index",
        icon: "user-o",
        text: "出行信息",
        hide: false
      }
    ]
  },

  pageLifetimes: {
    show() { },
  },

  attached() { },

  methods: {
    onChange(event) {
      const name = event.detail;
      const bar = this.data.list.find(item => item.name === name);
      wx.switchTab({
        url: bar.url
      })
    },

    init() {
      // find active bar
      const page = getCurrentPages().pop();
      const activeBar = this.data.list.find(item => item.url === `/${page.route}`);
      // check user
      const loginUser = app.globalData.loginUser;
      const userNotRegistered = !loginUser?.residence?._id;
      const checker = loginUser?.check_points && Object.keys(loginUser?.check_points).length > 0;
      this.setData({
        active: activeBar.name,
        'list[1].info': loginUser?.certificate?.outing_count,
        'list[2].hide': !checker,
        'list[3].dot': userNotRegistered,
      });
    },
  }
})