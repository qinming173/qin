export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/trend/index',
    'pages/history/index',
    'pages/mine/index',
    'pages/record/index',
    'pages/plot/index'
  ],
  tabBar: {
    color: '#999999',
    selectedColor: '#2f9e44',
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
        pagePath: 'pages/trend/index',
        text: '趋势',
        iconPath: 'assets/tabbar/trend.svg',
        selectedIconPath: 'assets/tabbar/trend-selected.svg'
      },
      {
        pagePath: 'pages/history/index',
        text: '记录',
        iconPath: 'assets/tabbar/history.svg',
        selectedIconPath: 'assets/tabbar/history-selected.svg'
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
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#2f9e44',
    navigationBarTitleText: '农田浇水助手',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f3f7f0'
  }
})
