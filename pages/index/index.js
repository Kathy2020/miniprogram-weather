const weatherMap = {
  'sunny': '晴天',
  'cloudy': '多云',
  'overcast': '阴',
  'lightrain': '小雨',
  'heavyrain': '大雨',
  'snow': '雪'
}

const weatherColorMap = {
  'sunny': '#cbeefd',
  'cloudy': '#deeef6',
  'overcast': '#c6ced2',
  'lightrain': '#bdd5e1',
  'heavyrain': '#c5ccd0',
  'snow': '#aae1fc'
}

// 引入SDK核心类
const QQMapWX = require('../../libs/qqmap-wx-jssdk.js');

const UNPROMPTED = 0
const UNAUTHORIZED = 1
const AUTHORIZED = 2

const UNPROMPTED_TIPS = "点击获取当前位置"
const UNAUTHORIZED_TIPS = "点击开启位置权限"
const AUTHORIZED_TIPS = ""

Page({
  data: {
    nowTemp: '',
    nowWeather: '',
    nowWeatherBackground: '',
    hourlyWeather:[],
    todayDate:'',
    todayTemp:'',
    city: '深圳市',
    locationTipsText: UNPROMPTED_TIPS,
    locationAuthType: UNPROMPTED
  },

  onPullDownRefresh(){
    // console.log('onPullDownRefresh')
    this.getNow(()=>{
      wx.stopPullDownRefresh()
    })
    // console.log("refresh executed!")
  },

  onLoad(){
    // console.log('onLoad')
    this.qqmapsdk = new QQMapWX({
      key: '2K2BZ-L4S6I-H2UGO-5BYEU-66M4V-X6FGJ'
    })
    wx.getSetting({
      success: res => {
        let auth = res.authSetting['scope.userLocation']
        let locationAuthType = auth ? AUTHORIZED : (auth===false)? UNAUTHORIZED : UNPROMPTED
        let locationTipsText = auth ? AUTHORIZED_TIPS : (auth === false) ? UNAUTHORIZED_TIPS : UNPROMPTED_TIPS
        this.setData({
          locationAuthType: locationAuthType,
          locationTipsText: locationTipsText
        })
        if (auth)
          this.getCityAndWeather()
        else
          this.getNow()   //使用默认城市深圳 
      },
      fail: ()=>{
        this.getNow()   //使用默认城市深圳
      }
    })
  },

  getNow(callback){
    wx.request({
      url: 'https://test-miniprogram.com/api/weather/now',
      data: {
        city: this.data.city
      },
      success: res => {
        let result = res.data.result
        this.setNow(result)
        this.setHourlyWeather(result)
        this.setToday(result)      
      },
      complete:()=>{
        callback && callback()
      }
    })
  },

  setNow(result){
    let temp = result.now.temp
    let weather = result.now.weather

    this.setData({
      nowTemp: temp + '°',
      nowWeather: weatherMap[weather],
      nowWeatherBackground: '/images/' + weather + '-bg.png',
      // forecast: forecast,
    }),

      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: weatherColorMap[weather]
      })
  },

  setHourlyWeather(result){
    //set forecast
    let forecast = result.forecast
    let nowHour = new Date().getHours()
    let hourlyWeather = []
    for (let i = 0; i < 8; i++) {
      hourlyWeather.push({
        time: (i * 3 + nowHour) % 24 + '时',
        iconPath: '/images/' + forecast[i].weather + '-icon.png',
        temp: forecast[i].temp + '°'
      })
    }
    hourlyWeather[0].time = '现在'
    this.setData({
      hourlyWeather: hourlyWeather
    })
  },

  setToday(result){
    let date = new Date()
    this.setData({
      todayDate: `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} 今天`,
      todayTemp: `${result.today.minTemp}°- ${result.today.maxTemp}°`
    })
  },

  onTapDayWeather(){
    wx.navigateTo({
      url: '/pages/list/list?city=' + this.data.city,
    })
  },

  onTapLocation(){
      this.getCityAndWeather()
  },
  getCityAndWeather(){
    wx.getLocation({
      success: res =>{
        this.setData({
          locationAuthType: AUTHORIZED,
          locationTipsText: AUTHORIZED_TIPS
        })
        // console.log(res.latitude, res.longitude)
        this.qqmapsdk.reverseGeocoder({
          location:{
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: res=>{
            let city = res.result.address_component.city
            this.setData({
              city: city,
              // locationTipsText: ""
            })
            this.getNow()
          }
        })
      },
      fail: () => {
        this.setData({
          locationAuthType: UNAUTHORIZED,
          locationTipsText: UNAUTHORIZED_TIPS
        })
      }
    })
  }
})
