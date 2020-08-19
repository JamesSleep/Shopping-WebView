//
//  NotificationService.m
//  Service
//
//  Created by dongha on 2020/08/19.
//

#import "NotificationService.h"
#import "RNFirebaseMessaging.h"
@import Firebase;

@interface NotificationService ()

@property (nonatomic, strong) void (^contentHandler)(UNNotificationContent *contentToDeliver);
@property (nonatomic, strong) UNMutableNotificationContent *bestAttemptContent;

@end

@implementation NotificationService

- (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler {
    self.contentHandler = contentHandler;
      self.bestAttemptContent = [request.content mutableCopy];

      // Modify the notification content here as you wish
      self.bestAttemptContent.title = [NSString stringWithFormat:@"%@ [modified]",
      self.bestAttemptContent.title];

    // Call FIRMessaging extension helper API.
    [[FIRMessaging extensionHelper] populateNotificationContent:self.bestAttemptContent
                                              withContentHandler:contentHandler];

}

- (void)serviceExtensionTimeWillExpire {
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
    self.contentHandler(self.bestAttemptContent);
}

@end
