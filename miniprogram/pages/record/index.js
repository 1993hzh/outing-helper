// pages/record/index.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';
import BizError from '../../utils/bizError';
import functionTemplate from '../../utils/functionTemplate';

const app = getApp();

Page({

  data: {
    userOptions:[],
    userOptionValue: -1,
    statusOptions: [
      { text: "全部状态", value: -1 },
    ],
    statusOptionValue: -1,
    checkRecords: [],
    isRefreshing: false
  },

  onLoad(options) {
    app.watchUserLogin((user) => {
      Toast.clear();
      this.loadData();
      this.initDropDown();
    });
    
    if (app.globalData.hasUser) {
      this.loadData();
      this.initDropDown();
    } else {// user not login
      Toast.loading({ message: '正在加载', forbidClick: true, });
    }
  },

  onShow() {
    this.getTabBar().onPageShow();
  },

  onShareAppMessage() {
    return {
      title: '出入记录'
    }
  },

  onScrollRefresh() {
    this.loadData()
  },

  initDropDown() {
    const defaultUserOption = [{ text: '全部住户', value: -1 }];
    const user = app.globalData.loginUser;
    functionTemplate.send({
      request: {
        service: 'userService',
        method: 'findByCertificate',
        args: user?.certificate?._id,
      },
      action: async (result) => {
        const users = result.data;
        const userOptions = users.map(u => {
          return { text: u.name, value: u._id, disabled: true };
        });
        this.setData({
          userOptions: [...defaultUserOption, ...userOptions],
        });
      },
    });
  },

  onUserChange() {
    Toast('暂不支持按住户进行筛选，仅供展示');
    this.setData({
      userOptionValue: -1,
    });
  },

  loadData() {
    const certId = app.globalData.loginUser?.certificate?._id;
    if (!certId) {
      return;
    }

    functionTemplate.send({
      message: '正在加载...',
      errorMessage: '加载失败，请联系管理员',
      request: {
        service: 'checkRecordService',
        method: 'findByCertificate',
        args: certId
      },
      action: async (result) => {
        const checkRecords = result.data;
        this.processCheckRecord(checkRecords);
        this.setData({
          checkRecords: checkRecords,
          isRefreshing: false
        });
      },
    });
  },

  processCheckRecord(records) {
    records.forEach(record => {
      const outDateTime = record.out?.checked_at;
      if (outDateTime) {
        record.out.checked_at = new Date(outDateTime).toLocaleString('zh-CN');
      }
      const inDateTime = record.in?.checked_at;
      if (inDateTime) {
        record.in.checked_at = new Date(inDateTime).toLocaleString('zh-CN');
      }
    });
    return records;
  }
})