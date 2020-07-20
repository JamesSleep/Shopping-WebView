import React, { useRef, useState, useEffect } from 'react';
import { View, StatusBar, StyleSheet, TouchableOpacity,
  ToastAndroid, BackHandler, Alert, Platform, Linking, KeyboardAvoidingView } from 'react-native';
import { WebView } from 'react-native-webview';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import Icon from 'react-native-vector-icons/FontAwesome';
import SplashScreen from 'react-native-splash-screen';

const SITE_URL = "https://3456shop.com/";

const App = () => {
  const [urls, seTurls] = useState(SITE_URL);
  const webViews = useRef();
  useEffect(()=>{
    setTimeout(() => {
      SplashScreen.hide();
    }, 500);
  },[])
  const page_goBack = () => webViews.current.goBack();
  const page_home = () => webViews.current.injectJavaScript("window.location.href = '/';");
  const page_goForward = () => webViews.current.goForward();
  const category = () => webViews.current.injectJavaScript(`document.getElementById('quick_menu').click();`);
  const onShouldStartLoadWithRequest = (e) => {
    let wurl = e.url;
    let rs = true;
    var SendIntentAndroid = require('react-native-send-intent');
    if (!wurl.startsWith("http://")&& !wurl.startsWith("https://")&& !wurl.startsWith("javascript:")){
      if(Platform.OS=="android"){
        webViews.current.stopLoading();
        SendIntentAndroid.openChromeIntent(wurl)
            .then(isOpened => {
            if(!isOpened){ToastAndroid.show('어플을 설치해주세요.', ToastAndroid.SHORT);}
        });      
      } else {
        const supported = Linking.canOpenURL(wurl);
        if(supported){
            Linking.openURL(wurl);
        }else{
            alert("어플을 설치해주세요");
        }
      }
      rs = false; 
    }
    return rs;
  }
  const onNavigationStateChange = (webViewState)=>{
    seTurls(webViewState.url);
    BackHandler.addEventListener('hardwareBackPress', handleBackButton);
  }
  const handleBackButton = () => {
    if(urls === SITE_URL){
      Alert.alert(
        '어플을 종료할까요?','',
        [   
          {text: '네', onPress: () =>  BackHandler.exitApp()},
          {text: '아니요'}
        ]
      );
    }else {
      webViews.current.goBack(); 
    }
    return true;
  }
  const alertHandler = () => {
    webViews.current.injectJavaScript(
      `
      setTimeout(() => {
        window.alert = function (message) { 
          window.ReactNativeWebView.postMessage(message);
        }
      }, 100);
      `
    );
  }
  
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white"/>
      <View style={styles.container}>
        <View style={styles.webView}>
          <KeyboardAvoidingView
            enabled={Platform.OS === "android"}
            behavior="padding"
            style={{ flex: 1 }}
          >
            <WebView 
              source={{ uri: SITE_URL}}
              ref={webViews}
              onMessage={(event)=> {
                if(Platform.OS === "android") ToastAndroid.show(event.nativeEvent.data, ToastAndroid.SHORT);
                else Alert.alert(event.nativeEvent.data);
              }}
              onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
              onNavigationStateChange={onNavigationStateChange}
              javaScriptEnabledAndroid={true}
              allowFileAccess={true}
              renderLoading={true}
              mediaPlaybackRequiresUserAction={false}
              setJavaScriptEnabled = {false}
              scalesPageToFit={false}
              originWhitelist={['*']}
              onLoadEnd={alertHandler}
            />
          </KeyboardAvoidingView>
        </View>
        { Platform.OS === 'android'?
          null :
          <View style={styles.nav}>
          <TouchableOpacity style={styles.nav_bnt} onPress={page_goBack}>
            <Icon style={styles.fonts} name="angle-left"/>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nav_bnt} onPress={page_home}>
            <Icon style={styles.fonts} name="home"/>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nav_bnt} onPress={page_goForward}>
            <Icon style={styles.fonts} name="angle-right"/>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nav_bnt} onPress={category}>
            <Icon style={styles.fonts} name="align-justify"/>
          </TouchableOpacity>
        </View> }  
      </View>
    </>
  );
};

const marginH = getStatusBarHeight(true);
const styles = StyleSheet.create({
  container: {
    borderTopWidth:1,
    borderColor:"#eee",
    marginTop:marginH,
    flex: 1,
    backgroundColor: 'white',
  },
  webView: {
    flex: 12,
  },
  nav: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'row'
  },
  nav_bnt: {
    width:"25%",
    height:"100%",
    backgroundColor: '#eee',
    textAlign:'center',
    justifyContent: 'center',
    alignItems:'center',
    lineHeight:50,
  },
  fonts:{
      fontSize:25,
  }
});

export default App;