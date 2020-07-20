import React, { useEffect } from 'react';
import { Platform, Alert, AsyncStorage } from 'react-native';
import firebase from 'react-native-firebase';
import DeviceInfo from 'react-native-device-info';
import Axios from 'axios';

const FCMContainer = ({ children, onNotificationOpened }) => {
  const CHANNEL_ID = 'io.github.dev.yakuza.poma';
  const APP_NAME = 'POMA';
  const DESCRIPTION = 'POMA channel';

  let _onTokenRefreshListener = undefined;
  let _notificationDisplayedListener = undefined;
  let _notificationListener = undefined;
  let _notificationOpenedListener = undefined;

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

      firebase.notifications().displayNotification(notification);
    });
    _notificationDisplayedListener = firebase.notifications().onNotificationDisplayed(() => {});
    _notificationOpenedListener = firebase
      .notifications()
      .onNotificationOpened((notificationOpen) => {
        if (onNotificationOpened && typeof onNotificationOpened === 'function') {
          onNotificationOpened(notificationOpen.notification.data);
        }
      });
  };

  const _registerToken = async (fcmToken) => {
    console.log(fcmToken);
    // try {
    //   const deviceUniqueId = DeviceInfo.getUniqueId();
    //   const token = await AsyncStorage.getItem('token');
    //   await Axios.post(
    //     `URL`,
    //     {
    //       token: fcmToken,
    //       device_unique_id,
    //     },
    //     {
    //       headers: { Authorization: 'Bearer ' + token },
    //     },
    //   );
    // } catch (error) {
    //   console.log('ERROR: _registerToken');
    //   console.log(error.response.data);
    // }
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
      Alert.alert("you can't handle push notification");
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

export default FCMContainer;