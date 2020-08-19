import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, KeyboardAvoidingView, BackHandler, AsyncStorage, Linking, Alert } from "react-native";
import WebView from "react-native-webview";
import { connect } from "react-redux";
import ActionCreators from "../redux/action";
import { getStatusBarHeight } from 'react-native-status-bar-height';
import axios from 'axios';

let SITE_URL = "https://3456shop.com/";

function WebViews( props, context ) {
  console.log("WebView props:", props);
  const [urls, seTurls] = useState(SITE_URL);
  useEffect(() => {
    if(props.url !== "" || props.url !== SITE_URL) {
      let getURL = "";
      getURL = props.url;
      webViews.current.injectJavaScript(`window.location.href = '/${getURL.substr(21,getURL.length-1)}';`)
    }
  }, [props.url]);
  const webViews = useRef();
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
    console.log("stateURL :", webViewState.url);
    seTurls(webViewState.url);
    BackHandler.addEventListener('hardwareBackPress', handleBackButton);
  }
  const handleBackButton = () => {
    console.log("setURL :", urls);
    webViews.current.goBack();
    /* if(urls === SITE_URL){
      Alert.alert(
        '어플을 종료할까요?','',
        [   
          {text: '네', onPress: () =>  BackHandler.exitApp()},
          {text: '아니요'}
        ]
      );
    }else {
      webViews.current.goBack(); 
    } */
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
  const injectedJavascript = '(function() { window.postMessage = function(data) {window.ReactNativeWebView.postMessage(data);};})()';
  
  const urlHandler = async () => {
    await AsyncStorage.getItem("FCM_URL")
    .then(response => {
      const data = JSON.parse(response);
      console.log("storage :", data.url);
      seTurls(data.url);
    });
  }

  const onWebViewMessage = async event => {
    console.log("Message received from webview");
    console.log(event.nativeEvent.data);
    const data = JSON.stringify(event.nativeEvent.data);
    if(data.toString().indexOf("user") === -1) {
      if(Platform.OS === "android") ToastAndroid.show(event.nativeEvent.data, ToastAndroid.SHORT);
      else Alert.alert(event.nativeEvent.data);
    } else {
      const user_index = data.substring(14, data.length - 1);
      const form = new FormData();
      const token = await AsyncStorage.getItem('token');
      form.append("fb_key", token);   
      form.append("index_no", user_index);    
      const url = "https://3456shop.com/api/app.php";
      axios.post(url,form)
      .then(res => {
        console.log(res);
      })
    }
  }

  return (
    <View style={styles.webView}>
      <KeyboardAvoidingView
        enabled
        style={{ flex: 1 }}
      >
        <WebView 
          source={{ uri: urls}}
          ref={webViews}
          onMessage={(event)=>onWebViewMessage(event)}
          injectedJavaScript={injectedJavascript}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onNavigationStateChange={onNavigationStateChange}
          javaScriptEnabledAndroid={true}
          allowFileAccess={true}
          renderLoading={true}
          mediaPlaybackRequiresUserAction={false}
          setJavaScriptEnabled = {false}
          sharedCookiesEnabled={true}
          allowsInlineMediaPlayback="true"
          scalesPageToFit={false}
          originWhitelist={['*']}
          onLoadEnd={alertHandler}
        />
      </KeyboardAvoidingView>
    </View>
  )
}

const mapStateToProps = state => {
  return {
    url: state.url
  };
}
const mapDispatchToProps = dispatch => {
  return {
    UrlUpdate: (url) => {
      dispatch(ActionCreators.UrlUpdate(url));
    },
  }
}

const marginH = getStatusBarHeight(true);

const styles = StyleSheet.create({
  container: {
    borderTopWidth:1,
    borderColor:"#eee",
    flex: 1,
    backgroundColor: 'white',
    marginTop: marginH,
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
  },
});
//export default WebViews;
export default connect(mapStateToProps, mapDispatchToProps)(WebViews);