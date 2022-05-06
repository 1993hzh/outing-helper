const app = getApp();

Component({
  data: {
    active: 'certificate',
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
        icon: "notes-o",
        info: 5,
        text: "出行记录",
        hide: false
      },
      {
        name: 'check',
        url: "/pages/check/index",
        icon: "eye-o",
        text: "出行检查",
        hide: false
      }
    ]
  },

  attached() {
    // noop
  },

  methods: {
    onChange(event) {
      wx.switchTab({
        url: this.data.list[event.detail].url
      })
      // this.setData({
      //   active: event.detail
      // });
    },

    init() {
      const page = getCurrentPages().pop();
      this.setData({
        active: this.data.list.findIndex(item => item.url === `/${page.route}`)
      });
    }
  }
})