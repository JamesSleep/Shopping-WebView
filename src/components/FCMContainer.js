import React, { useEffect } from 'react';
import { Platform, Alert, AsyncStorage } from 'react-native';
import firebase, { notifications } from 'react-native-firebase';
import DeviceInfo from 'react-native-device-info';
import Axios from 'axios';
import { connect } from "react-redux";
import ActionCreators from '../redux/action';


const FCMContainer = ({ children, onNotificationOpened, url, UrlUpdate }) => {
  const CHANNEL_ID = 'io.github.dev.yakuza.poma';
  const APP_NAME = '3456#';
  const DESCRIPTION = '3456# channel';

  let _onTokenRefreshListener = undefined;
  let _notificationDisplayedListener = undefined;
  let _notificationListener = undefined;
  let _notificationOpenedListener = undefined;

  const urlHandler = url => {
    console.log("fcmDATA :", url);
    UrlUpdate("");
    UrlUpdate(url);
  }

  const _registerMessageListener = () => {
    firebase
      .notifications()
      .getInitialNotification()
      .then((notificationOpen) => {
        if (
          onNotificationOpened &&
          typeof onNotificationOpened === 'function' &&
          notificationOpen &&
          notificationOpen.notification &&
          notificationOpen.notification.data &&
          notificationOpen.notification.data.notifications_id
        ) {
          onNotificationOpened(notificationOpen.notification.data);
        }
      });

    const channel = new firebase.notifications.Android.Channel(
      CHANNEL_ID,
      APP_NAME,
      firebase.notifications.Android.Importance.Max,
    ).setDescription(DESCRIPTION);
    firebase.notifications().android.createChannel(channel);

    _notificationListener = firebase.notifications().onNotification((notification) => {
      // Process your notification as required
      notification.android.setPriority(firebase.notifications.Android.Priority.Max);
      notification.android.setChannelId(CHANNEL_ID);
      notification.android.setAutoCancel(true);
      // get notification and set load url
      //urlHandler(notification.data.url);
      console.log("respone FCM :", notification);
      firebase.notifications().displayNotification(notification);
    });
    _notificationDisplayedListener = firebase.notifications().onNotificationDisplayed(() => { console.log("display") });
    _notificationOpenedListener = firebase
      .notifications()
      .onNotificationOpened((notificationOpen) => {
        urlHandler(notificationOpen.notification.data.url);
        if (onNotificationOpened && typeof onNotificationOpened === 'function') {
          onNotificationOpened(notificationOpen.notification.data);
        }
      });
  };

  const _registerToken = async (fcmToken) => {
    console.log(fcmToken);
    try {
      const deviceUniqueId = DeviceInfo.getUniqueId();
      const token = await AsyncStorage.setItem("token", fcmToken);
    } catch (error) {
      console.log('ERROR: _registerToken');
      console.log(error.response.data);
    }
  };

  const _registerTokenRefreshListener = () => {
    if (_onTokenRefreshListener) {
      _onTokenRefreshListener();
      _onTokenRefreshListener = undefined;
    }

    _onTokenRefreshListener = firebase.messaging().onTokenRefresh((fcmToken) => {
      // Process your token as required
      _registerMessageListener();
      _registerToken(fcmToken);
    });
  };
  const _updateTokenToServer = async () => {
    try {
      const fcmToken = await firebase.messaging().getToken();
      _registerMessageListener();
      _registerToken(fcmToken);
    } catch (error) {
      console.log('ERROR: _updateTokenToServer');
      console.log(error);
    }
  };

  const _requestPermission = async () => {
    try {
      // User has authorised
      await firebase.messaging().requestPermission();
      await _updateTokenToServer();
    } catch (error) {
      // User has rejected permissions
      //Alert.alert("you can't handle push notification");
    }
  };

  const _checkPermission = async () => {
    try {
      const enabled = await firebase.messaging().hasPermission();
      if (enabled) {
        // user has permissions
        _updateTokenToServer();
        _registerTokenRefreshListener();
      } else {
        // user doesn't have permission
        _requestPermission();
      }
    } catch (error) {
      console.log('ERROR: _checkPermission', error);
      console.log(error);
    }
  };

  useEffect(() => {
    _checkPermission();
    return () => {
      if (_onTokenRefreshListener) {
        _onTokenRefreshListener();
        _onTokenRefreshListener = undefined;
      }
      if (_notificationDisplayedListener) {
        _notificationDisplayedListener();
        _notificationDisplayedListener = undefined;
      }
      if (_notificationListener) {
        _notificationListener();
        _notificationListener = undefined;
      }
      if (_notificationOpenedListener) {
        _notificationOpenedListener();
        _notificationOpenedListener = undefined;
      }
    };
  }, []);

  if (Platform.OS === 'ios') {
    firebase.notifications().setBadge(0);
  }

  return children;
};

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

export default connect(mapStateToProps, mapDispatchToProps)(FCMContainer);