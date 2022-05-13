// pages/admin/index.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';
import Dialog from '@vant/weapp/dialog/dialog';
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
    buildingOptions: [],
    buildingOptionValue: undefined,
    residences:[],
    activeTab: 'profile',
    // ---- for profile tab
    profileDropDown: {
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
    // ---- for residence tab
    residenceDropDown: {
      statusOptions: [
        { text: '有人', value: 1 },
        { text: '无人', value: 0 },
      ],
      statusOptionValue: 1,
    },
    // ----end
    // ---- for permission tab
    permissionDropDown: {
      buildingOptions: [
        { text: '全部楼栋', value: -1 }
      ],
      buildingOptionValue: -1,
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
        const user = app.globalData.loginUser;
        const buildings = user.role?.superAdmin ? result.data : user?.managed_buildings;
        const managedBuildings = buildings?.map(e => {
          return { text: e.name, value: e.id, };
        });
        const firstBuilding = managedBuildings[0];
        this.setData({
          userRole: user.role,
          'buildingOptions': managedBuildings || [],
          'buildingOptionValue': firstBuilding?.value,
        });
        this.onTabChanged(this.data.activeTab);
      },
    });
  },

  onClickChangeTab(event) {
    const value = event.detail.name;
    this.onTabChanged(value);
    this.setData({
      activeTab: value,
    })
  },

  onTabChanged(tab) {
    switch (tab) {
      case TAB_PROFILE:
        this.initProfileTabContent();
        break;
      case TAB_RESIDENCE:
        this.initResidenceTabContent();
        break;
      case TAB_COMMUNITY:
        // TODO
        break;
      case TAB_PERMISSION:
        this.initPermissionTabContent();
        break;
      default:
        break;
    }
  },

  initProfileTabContent() {
    const building = this.data.buildingOptionValue;
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

  initResidenceTabContent() {
    const building_id = this.data.buildingOptionValue;
    const status = this.data.residenceDropDown.statusOptionValue;
    if (building_id === undefined || status === undefined) {
      return;
    }

    functionTemplate.send({
      request: {
        service: 'residenceService',
        method: 'listByBuilding',
        args: { building_id, status, },
      },
      action: (result) => {
        this.setData({
          residences: result.data,
        });
      },
    })
  },

  initPermissionTabContent(searchCriteria = {}) {
    const criteria = {};
    const role = this.data.permissionDropDown.roleOptionValue;
    const roleKey = `role.${role}`;
    criteria[roleKey] = true;

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

  onBuildingChange(event) {
    const value = event.detail;
    this.setData({
      'buildingOptionValue': value,
    });
    this.onTabChanged(this.data.activeTab);
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
        const index = pendingUsers.findIndex(e => e._id === selectedUser._id);
        pendingUsers.splice(index, 1);
        this.setData({
          pendingUsers: pendingUsers,
          selectedUser: {},
          showProfilePopup: false,
        });
      },
    });
  },

  onCloseBuildingPopup() {
    this.setData({
      showBuildingPopup: false
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
        method: 'built-in',
        args: {
          building: building,
          rooms: formValues.roomList
        }
      },
      action: (result) => {
        // no-op
      },
    });
  },

  onResidenceStatusChange(event) {
    const value = event.detail;
    this.setData({
      'residenceDropDown.statusOptionValue': value,
    });
    this.initResidenceTabContent();
  },

  onClickResidenceCell(event) {
    const residence = event.currentTarget.dataset.residence;
    const message = residence.status === 1 ? '调整成无人居住' : '调整成有人居住';
    Dialog.confirm({
      showCancelButton: true,
      closeOnClickOverlay: true,
      title: '调整状态',
      message: message,
    }).then(() => {
      functionTemplate.send({
        request: {
          service: 'residenceService',
          method: 'toggle',
          args: residence
        },
        action: (result) => {
          const residences = this.data.residences;
          const index = residences.findIndex(e => e._id === result.data._id);
          console.log(index)
          residences.splice(index, 1);
          this.setData({ residences: residences });
        },
      });
    }).catch(() => {
      // on cancel
    });
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