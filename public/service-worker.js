'use strict';

importScripts('/scripts/indexdbwrapper.js');

var KEY_VALUE_STORE_NAME = 'systextil-push';

var idb;

function getIdb() {
  if (!idb) {
    idb = new IndexDBWrapper('systextil-push', 1, function(db) {
      db.createObjectStore(KEY_VALUE_STORE_NAME);
    });
  }
  return idb;
}

function showNotification(title, body, icon, data) {
  var notificationOptions = {
    body: body,
    icon: icon ? icon : 'images/touch/chrome-touch-icon-192x192.png',
    tag: 'systextil-push-demo-notification',
    data: data
  };
  if (self.registration.showNotification) {
    return self.registration.showNotification(title, notificationOptions);
  } else {
    new Notification(title, notificationOptions);
  }
}

self.addEventListener('push', function(e) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    console.error('notificação não suportada');
    return;
  }

  Promise.resolve(getIdb().get('systextil-push','name')).then(function(name){
    fetch("/notifications/"+name).then(function(response) {  
      if (response.status !== 200) {  
        console.log('Houston. Status Code: ' + response.status);  
        throw new Error();  
      }

      return response.json().then(function(data) {
        console.log(data);
        var title = data[0].title;
        var message = data[0].message;

        return self.registration.showNotification(title, {  
          body: message
        });  
      });  
    });
  });
});

self.addEventListener('notificationclick', function(event) {
  var url = event.notification.data.url;
  event.notification.close();
  event.waitUntil(clients.openWindow(url));
});
