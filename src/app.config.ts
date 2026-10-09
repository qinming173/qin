export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/record/index',
    'pages/trend/index',
    'pages/mine/index',
    'pages/water-add/index',
    'pages/plot-manage/index',
    'pages/reminder/index',
    'pages/history/index'
  ],
  tabBar: {
    color: '#86909c',
    selectedColor: '#1ca35e',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.svg',
        selectedIconPath: 'assets/tabbar/home-selected.svg'
      },
      {
        pagePath: 'pages/record/index',
        text: '记录',
        iconPath: 'assets/tabbar/droplet.svg',
        selectedIconPath: 'assets/tabbar/droplet-selected.svg'
      },
      {
        pagePath: 'pages/trend/index',
        text: '趋势',
        iconPath: 'assets/tabbar/trend.svg',
        selectedIconPath: 'assets/tabbar/trend-selected.svg'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.svg',
        selectedIconPath: 'assets/tabbar/mine-selected.svg'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1ca35e',
    navigationBarTitleText: '智灌农田',
    navigationBarTextStyle: 'white'
  }
})
