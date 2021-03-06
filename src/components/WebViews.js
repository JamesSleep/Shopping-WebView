import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  BackHandler, 
  Linking, 
  Alert,
  ToastAndroid,
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Platform
} from "react-native";
import WebView from "react-native-webview";
import { connect } from "react-redux";
import ActionCreators from "../redux/action";
import AsyncStorage from "@react-native-community/async-storage";
import CookieManager from "@react-native-community/cookies";
import { getStatusBarHeight } from 'react-native-status-bar-height';
import axios from 'axios';

let SITE_URL = "https://3456shop.com/";

function WebViews( props ) {
  const webViews = useRef();
  //console.log("redux url :", props.url);
  const [urls, seTurls] = useState(
    props.url !== "" ? props.url : SITE_URL
  );
  const [isLoading, setIsLoading] = useState(true);
  const [webState, setWebState] = useState({
    url: SITE_URL,
    loading: false,
    canGoBack: false,
  });
  const [cookieString, setCookieString] = useState("");
  useEffect(() => {
    //console.log("current URL:",urls);
    /* getSavedCookies()
    .then(async (savedCookies) => {
      let cookiesString = jsonCookiesToCookieString(savedCookies);
      const PHPSESSID = await AsyncStorage.getItem('PHPSESSID');
      if (PHPSESSID) {
        cookiesString += `PHPSESSID=${PHPSESSID};`;
      }
      setCookieString(cookiesString);
    })
    .catch((e) => {
      console.log("please login");
    }); */

    if(props.url !== "" && props.url !== urls) {
      const getURL = props.url
      webViews.current.injectJavaScript(`window.location.href = '/${getURL.substr(21,getURL.length-1)}';`)
      seTurls(getURL);
    }

    BackHandler.addEventListener("hardwareBackPress", handleBackButton);
    return () =>
      BackHandler.removeEventListener("hardwareBackPress", handleBackButton);
  }, [webState, props.url]);

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
    //console.log("stateURL :", webViewState.url);
    setWebState({...webState,
      url: webViewState.url,
      canGoBack: webViewState.canGoBack,
      loading: webViewState.loading
    });
  }
  const handleBackButton = () => {
    if(webState.url === SITE_URL){
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

  const jsonCookiesToCookieString = (json) => {
    let cookiesString = '';
    for (let [key, value] of Object.entries(json)) {
      cookiesString += `${key}=${value.value}; `;
    }
    return cookiesString;
  };

  const getSavedCookies = async () => {
    try {
      let value = await AsyncStorage.getItem('savedCookies');
      if (value !== null) {
        return Promise.resolve(JSON.parse(value));
      }
    } catch (error) {
      return {};
    }
  }

  const alertHandler = async () => {
    webViews.current.injectJavaScript(
      `
      setTimeout(() => {
        window.alert = function (message) { 
          window.ReactNativeWebView.postMessage(message);
        }
      }, 100);
      `
    );
    const data = await AsyncStorage.getItem('savedCookies');
    const { 
      PHPSESSID: {
        domain, httpOnly, name, secure, value, version
      }
    } = JSON.parse(data);
    const path = "/" + webState.url.substr(21,webState.url.length-1);
    const newCookie = {
      domain,
      httpOnly,
      name,
      secure,
      value,
      version,
      path
    }

    CookieManager.set(SITE_URL, newCookie, true);
  }

  const injectedJavascript = '(function() { window.postMessage = function(data) {window.ReactNativeWebView.postMessage(data);};})()';

  const onWebViewMessage = async event => {
    console.log("Message received from webview");
    console.log(event.nativeEvent.data);
    const data = JSON.stringify(event.nativeEvent.data);
    
    //console.log(data.user_index);

    if(data.toString().indexOf("user_index") > -1) {
      const user_index = data.substring(14, data.length - 1);
      const form = new FormData();
      const token = await AsyncStorage.getItem('token');
      form.append("fb_key", token);   
      form.append("index_no", user_index);    
      const url = "https://3456shop.com/api/app.php";
      axios.post(url,form)
      .then(res => {
        if (res.data.resultItem === "성공") {
          CookieManager.getAll(true).then((res) => {
            AsyncStorage.setItem('savedCookies', JSON.stringify(res));
            if (res.PHPSESSID) {
              console.log(res.PHPSESSID);
              AsyncStorage.setItem('PHPSESSID', res.PHPSESSID.value);
            }
          });       
        }
      })
    } else {
      if ((event.nativeEvent.data).toString() !== "[object Object]" &&
      (event.nativeEvent.data).toString() !== "undefined"
      ) {
        if(Platform.OS === "android") ToastAndroid.show(event.nativeEvent.data, ToastAndroid.SHORT);
        else Alert.alert(event.nativeEvent.data);
      }
    }
  }
  const loading = () => {
    return (
      <View 
        style={{
          position: "absolute",
          zIndex: 10,
          width: "100%",
          height: "100%",
          justifyContent: "center", 
          alignItems: "center",
          backgroundColor: "white"
        }}
      >
        <ActivityIndicator 
          animating = {true}
          color = '#bc2b78'
          size = "large"
          style = {{ 
            width: Dimensions.get("screen").width/3,
            height: Dimensions.get("screen").width/3
          }}
          hidesWhenStopped={true} 
        />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.webView}
      behavior={Platform.OS === "ios" && "padding"}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <WebView 
        source={{ 
          uri: urls, 
          headers: {
            Cookie: cookieString,
          } 
        }}
        ref={webViews}
        allowFileAccess={true}
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback="true"
        domStorageEnabled={true}
        injectedJavaScript={injectedJavascript}
        javaScriptEnabledAndroid={true}
        mediaPlaybackRequiresUserAction={false}
        onLoadEnd={alertHandler}
        onMessage={(event)=>onWebViewMessage(event)}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        originWhitelist={['*']}
        scalesPageToFit={true}
        setJavaScriptEnabled = {false}
        sharedCookiesEnabled={true}
        useWebKit={true}
      />
    </KeyboardAvoidingView>
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
    flex: 1,
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

export default connect(mapStateToProps, mapDispatchToProps)(WebViews);