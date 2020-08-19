import React, { useRef, useState, useEffect } from 'react';
import { View, StatusBar, StyleSheet, TouchableOpacity, AsyncStorage,
  ToastAndroid, BackHandler, Alert, Platform, Linking, KeyboardAvoidingView, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import SplashScreen from 'react-native-splash-screen';
import FCMContainer from './src/components/FCMContainer';
import axios from "axios";
import { createStore } from "redux";
import { Provider, connect } from "react-redux";
import reducer from "./src/redux/reducer";
import ActionCreators from './src/redux/action';
import WebViews from './src/components/WebViews';

const App = () => {
  useEffect(()=>{
    setTimeout(() => {
      SplashScreen.hide();
    }, 500);
  },[]);
  
  return (
    <Provider store={createStore(reducer)}>
      <FCMContainer>
        { Platform.OS === "ios" ? (
          <View style={{ width: "100%", height: getStatusBarHeight(true), backgroundColor: "#7EBD42" }}>
            <StatusBar />
          </View>
        ) : (
          <StatusBar 
            translucent={false}
            backgroundColor="white"
            barStyle="dark-content"
          />
        )}
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.container}>
            <WebViews />
          </View>
        </SafeAreaView>
      </FCMContainer>
    </Provider>
  );
};

const marginH = getStatusBarHeight(true);

const styles = StyleSheet.create({
  container: {
    borderTopWidth:1,
    borderColor:"#eee",
    flex: 1,
    //backgroundColor: 'white',
    //marginTop: marginH,
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

export default App;