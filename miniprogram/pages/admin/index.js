// pages/admin/index.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';
import BizError from '../../utils/bizError';
import functionTemplate from '../../utils/functionTemplate';

const app = getApp();

const TAB_PROFILE = 'profile';
const TAB_RESIDENCE = 'residence';
const TAB_COMMUNITY = 'community';
const TAB_PERMISSION = 'permission';

Page({

  data: {
    userRole: {},
    buildings: [],
    activeTab: 'profile',
    // ---- for profile tab
    profileDropDown: {
      buildingOptions: [],
      buildingOptionValue: undefined,
      statusOptions: [
        { text: '审核中', value: 0 },
        { text: '已驳回', value: -1 },
      ],
      statusOptionValue: 0,
    },
    pendingUsers: [],
    selectedUser: {},
    showProfilePopup: false,
    // ---- end
    // ---- for permission tab
    permissionDropDown: {
      buildingOptions: [],
      buildingOptionValue: undefined,
      roleOptions: [
        { text: '信息员', value: 'admin' },
        { text: '门卫', value: 'checker' },
        { text: '超级管理员', value: 'superAdmin' },
      ],
      roleOptionValue: 'admin',
    },
    userSearchValue: '',
    permUsers: [],
    showPermissionActionSheet: false,
    permissionActions: [],
    // ---- end
    showBuildingPopup: false,
    buildingInput: {
      currentBuilding: {},
      buildings: [],
      loadBuildings: false
    },
  },

  onLoad(options) {
    app.watchUserLogin((user) => {
      Toast.clear();
      this.init();
    });

    if (!app.globalData.hasUser) {// user not login
      Toast.loading({ message: '正在登录', forbidClick: true, });
    } else {
      this.init();
    }
  },

  onReady() { },

  onShow() {
    this.getTabBar().onPageShow();
  },

  onPullDownRefresh() { },

  init() {
    const user = app.globalData.loginUser;
    if (!user.role.admin && !user.role.superAdmin) {
      // no permission, go to home
      wx.switchTab({
        url: '/pages/certificate/index',
      });
      return;
    }

    functionTemplate.send({
      request: {
        service: 'buildingService',
        method: 'list',
      },
      action: (result) => {
        this.setData({
          buildings: result.data,
        });
        this.initProfileTab();
      },
    });
  },

  onClickChangeTab(event) {
    const value = event.detail.name;
    switch (value) {
      case TAB_PROFILE:
        this.initProfileTab();
        break;
      case TAB_RESIDENCE:
        // TODO
        break;
      case TAB_COMMUNITY:
        // TODO
        break;
      case TAB_PERMISSION:
        this.initPermissionTab();
        break;
      default:
        break;
    }
  },

  initProfileTab() {
    const user = app.globalData.loginUser;
    const buildings = user.role?.superAdmin ? this.data.buildings : user?.managed_buildings;
    const managedBuildings = buildings?.map(e => {
      return {
        text: e.name,
        value: e.id,
      };
    });
    const firstBuilding = managedBuildings?.find(e => e !== undefined);
    this.setData({
      userRole: user.role,
      'profileDropDown.buildingOptions': managedBuildings || [],
      'profileDropDown.buildingOptionValue': firstBuilding?.value,
    });

    this.initProfileTabContent();
  },

  initProfileTabContent() {
    const building = this.data.profileDropDown?.buildingOptionValue;
    const status = this.data.profileDropDown?.statusOptionValue;
    if (building === undefined || status === undefined) {
      return;
    }

    functionTemplate.send({
      request: {
        service: 'userService',
        method: 'listPendingUsers',
        args: {
          building: building,
          status: status,
        }
      },
      action: (result) => {
        this.setData({
          pendingUsers: result.data,
        });
      },
    });
  },

  initPermissionTab() {
    const buildingOptions = this.data.buildings.map(e => {
      return {
        text: e.name,
        value: e.id,
      };
    });
    buildingOptions.unshift({ text: '全部楼栋', value: -1 });

    this.setData({
      'permissionDropDown.buildingOptions': buildingOptions,
      'permissionDropDown.buildingOptionValue': -1,
    });
    this.initPermissionTabContent();
  },


  initPermissionTabContent(searchCriteria = {}) {
    const buildingId = this.data.permissionDropDown.buildingOptionValue;
    const role = this.data.permissionDropDown.roleOptionValue;
    const roleKey = `role.${role}`;
    let criteria = {};
    criteria[roleKey] = true;
    if (buildingId >= 0) {
      criteria = {
        ...criteria,
        ...{ 'residence.building.id': buildingId }
      }
    }

    functionTemplate.send({
      request: {
        service: 'userService',
        method: 'findUsersByCriteria',
        args: { ...criteria, ...searchCriteria },
      },
      action: (result) => {
        this.setData({
          permUsers: result.data,
        });
      },
    })
  },

  onCloseBuildingPopup() {
    this.setData({
      showBuildingPopup: false
    });
  },

  onBuildingChange(event) {
    const value = event.detail;
    this.setData({
      'profileDropDown.buildingOptionValue': value,
    });
    this.initProfileTabContent();
  },

  onStatusChange(event) {
    const value = event.detail;
    this.setData({
      'profileDropDown.statusOptionValue': value,
    });
    this.initProfileTabContent();
  },

  onClickUserCell(event) {
    const value = event.currentTarget.dataset.user;
    const tab = event.currentTarget.dataset.tab;
    switch (tab) {
      case TAB_PROFILE:
        this.setData({
          selectedUser: value,
          showProfilePopup: true,
        });
        break;
      case TAB_PERMISSION:
        // this.setData({
        //   selectedUser: value,
        //   showPermissionActionSheet: true,
        //   permissionActions: permissionActions,
        // });
        break;
      default:
        break;
    }
  },

  onCloseProfilePopup() {
    this.setData({
      selectedUser: {},
      showProfilePopup: false,
    });
  },

  onReject() {
    const selectedUser = this.data.selectedUser;
    if (!selectedUser?._id) {
      logger.error('No user selected for rejection.');
      return;
    }

    return this.auditUserProfile({
      type: 'rejectUserProfile',
      args: {
        user: selectedUser,
        reason: '信息员驳回（此内容系统内置）'
      },
    });
  },

  onApprove() {
    const selectedUser = this.data.selectedUser;
    if (!selectedUser?._id) {
      logger.error('No user selected for rejection.');
      return;
    }

    return this.auditUserProfile({
      type: 'approveUserProfile',
      args: selectedUser,
    });
  },

  auditUserProfile({ type: type, args: args }) {
    functionTemplate.send({
      request: {
        service: 'userService',
        method: type,
        args: args
      },
      action: (result) => {
        const pendingUsers = this.data.pendingUsers;
        const selectedUser = this.data.selectedUser;
        const index = pendingUsers.find(e => e._id === selectedUser._id);
        pendingUsers.splice(index, 1);
        this.setData({
          pendingUsers: pendingUsers,
          selectedUser: {},
          showProfilePopup: false,
        });
      },
    });
  },

  onClickBuildingInput() {
    if (this.data.buildingInput.buildings?.length > 0) {
      this.setData({
        showBuildingPopup: true,
      });
      return;
    }

    this.setData({
      showBuildingPopup: true,
      'buildingInput.loadBuildings': true,
    });

    functionTemplate.send({
      request: {
        service: 'buildingService',
        method: 'list'
      },
      action: (result) => {
        this.setData({
          'buildingInput.buildings': result.data,
          'buildingInput.loadBuildings': false,
        });
      },
    });
  },

  onBuildingPickerConfirm(event) {
    const picker = event.detail;
    this.setData({
      'buildingInput.currentBuilding': picker.value,
    });
    this.onCloseBuildingPopup();
  },

  onSubmitResidences(event) {
    const formValues = event.detail.value;
    const building = this.data.buildingInput.currentBuilding;

    functionTemplate.send({
      request: {
        service: 'residenceService',
        method: 'batchCreate',
        args: {
          building: this.data.buildingInput.currentBuilding,
          rooms: formValues.roomList
        }
      },
      action: (result) => {
        // no-op
      },
    });
  },

  onPermBuildingChange(event) {
    const value = event.detail;
    this.setData({
      'permissionDropDown.buildingOptionValue': value
    });
    this.initPermissionTabContent();
  },

  onPermRoleChange(event) {
    const value = event.detail;
    this.setData({
      'permissionDropDown.roleOptionValue': value,
    });
    this.initPermissionTabContent();
  },

  onUserSearch(event) {
    const value = event.detail;
    if (!value?.trim()) {
      return;
    }

    this.initPermissionTabContent({
      name: value
    });
  },

  onUserSearchCancel() {
    this.setData({
      userSearchValue: '',
    });
  },

  onClosePermissionActionSheet() {
    this.setData({
      showPermissionActionSheet: false,
    })
  },

  onSelectPermissionAction(event) {// TODO
    const id = event.detail?.id;
  },
})