import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text,
  StatusBar, 
  StyleSheet, 
  Platform,  
  SafeAreaView,
  Linking,
  Modal,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import SplashScreen from 'react-native-splash-screen';
import FCMContainer from './src/components/FCMContainer';
import { createStore } from "redux";
import { Provider, connect } from "react-redux";
import reducer from "./src/redux/reducer";
import WebViews from './src/components/WebViews';
import VersionCheck from 'react-native-version-check';

const App = () => {
  const [modalVisible, setModalVisible] = useState(false);
  useEffect(()=>{
    setTimeout(() => {
      SplashScreen.hide();
      cheackUpdate();
    }, 500);
    
  },[]);

  const cheackUpdate = async () => {
    const currentVersion = VersionCheck.getCurrentVersion();
    const lastVersion = await VersionCheck.getLatestVersion();
    if(currentVersion >= lastVersion) {
      console.log("don`t need update");
    } else {
      // go to store
      console.log("need update");
      if(Platform.OS === "android") {
        setModalVisible(true);
      }
    }
  }
  const navigateStore = async () => {
    setModalVisible(false);
    VersionCheck.needUpdate()
    .then(async res=> {
      console.log(res.isNeeded);
      const iosURL = await VersionCheck.getAppStoreUrl({appID: "1525194888"});
      if(1) {
        if(Platform.OS === "ios") {
          Linking.openURL(iosURL);
        } else {
          Linking.openURL(res.storeUrl);
        }
      }
    });
  }
  
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
            <Modal transparent visible={modalVisible}>
              <View 
                style={{ 
                  flex: 1, 
                  justifyContent: "center", 
                  alignItems: "center", 
                  backgroundColor: "rgba(0,0,0,0.4)"
                }}
              >
                <View 
                  style={{ 
                    width: Dimensions.get("window").width * 0.86, 
                    height: Dimensions.get("window").width * 0.5, 
                    backgroundColor: "white",
                    borderRadius: 10,
                    paddingHorizontal: 20,
                    paddingVertical: 30
                  }}
                >
                  <Text style={{ flex: 1, fontWeight: "bold", fontSize: 20, }}>
                    업데이트 알림
                  </Text>
                  <Text style={{ flex: 1, fontSize: 15, marginTop: 5 }}>
                    열심히 만들어서 새버전을 업데이트 했어요. 더 편리해진 3456#를 이용해 보세요.
                  </Text>
                  <TouchableOpacity 
                    style={{ 
                      flex: 1,
                      backgroundColor: "#7EBD42",
                      width: "100%",
                      height: "30%",
                      borderRadius: 5,
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 10
                    }}
                    onPress={()=>navigateStore()}
                  >
                    <Text style={{ fontSize: 14, color: "white" }}>
                      업데이트
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
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