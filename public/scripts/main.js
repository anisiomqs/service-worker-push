'use strict';

var API_KEY = 'AIzaSyCBd1A0TXrPJYhIaHvmwcLvazSsEy7N5qc';
var PUSH_SERVER_URL = 'https://systextilpushdemo.appspot.com';

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

function onPushSubscription(pushSubscription) {
  window.PushDemo.ui.showGCMPushOptions(true);
  window.PushDemo.ui.setPushSwitchDisabled(false);

  console.log('pushSubscription: ', pushSubscription);

  var sendPushViaXHRButton = document.querySelector('.js-xhr-button');
  sendPushViaXHRButton.addEventListener('click', function(e) {
    var subscriptionId = null;
    if (pushSubscription.subscriptionId) {
      subscriptionId = pushSubscription.subscriptionId;
    } else {
      var endpointSections = pushSubscription.endpoint.split('/');
      subscriptionId = endpointSections[endpointSections.length - 1];
    }
    
    var data = {};
    data.name = document.querySelector('#name').value;
    data.subId = subscriptionId;

    getIdb().put(KEY_VALUE_STORE_NAME, "name", data.name);
					
    $.post("/user",{
    	data: JSON.stringify(data),
    	contentType: 'application/json',
    	success: function(data) {
        console.log('success');
        console.log(JSON.stringify(data));
      }
    });
  });
}

function subscribeDevice() {
  window.PushDemo.ui.setPushSwitchDisabled(true);

  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    serviceWorkerRegistration.pushManager.subscribe({ userVisibleOnly: true })
      .then(onPushSubscription)
      .catch(function(e) {
        if ('permissions' in navigator) {
          navigator.permissions.query({name: 'push', userVisibleOnly: true})
            .then(function(permissionState) {
              console.log('subscribe() Erro: permission state', permissionState);
              window.PushDemo.ui.setPushChecked(false);
              if (permissionState.state === 'denied') {
                window.PushDemo.ui.showError('Ooops');
              } else if (permissionState.state === 'prompt') {
                window.PushDemo.ui.setPushSwitchDisabled(false);
                return;
              } else {
                window.PushDemo.ui.showError('Ooops Não conseguiu registrar',
                  '<p>Não conseguimos obter o ID de resposta do GCM.</p>' +
                  '<p>Mensagem: ' +
                  e.message +
                  '</p>');
                window.PushDemo.ui.setPushSwitchDisabled(false);
                window.PushDemo.ui.setPushChecked(false);
              }
            }).catch(function(err) {
                window.PushDemo.ui.showError('Ooops Não conseguiu registrar',
                  '<p>Não conseguimos obter o ID de resposta do GCM.</p>' +
                  '<p>Mensagem: ' +
                  e.message +
                  '</p>');

              window.PushDemo.ui.setPushSwitchDisabled(false);
              window.PushDemo.ui.setPushChecked(false);
            });
        } else {
          if (Notification.permission === 'denied') {
            window.PushDemo.ui.showError('Ooops Notificações bloqueadas');
            window.PushDemo.ui.setPushSwitchDisabled(true);
          } else {
              window.PushDemo.ui.showError('Ooops Não conseguiu registrar',
                  '<p>Não conseguimos obter o ID de resposta do GCM.</p>' +
                  '<p>Mensagem: ' +
                  e.message +
                  '</p>');
              window.PushDemo.ui.setPushSwitchDisabled(false);
          }
          window.PushDemo.ui.setPushChecked(false);
        }
      });
  });
}

function unsubscribeDevice() {
  window.PushDemo.ui.setPushSwitchDisabled(true);

  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    serviceWorkerRegistration.pushManager.getSubscription().then(
      function(pushSubscription) {
        if (!pushSubscription) {
          window.PushDemo.ui.setPushSwitchDisabled(false);

          window.PushDemo.ui.setPushChecked(false);

          window.PushDemo.ui.showGCMPushOptions(false);
          return;
        }

        pushSubscription.unsubscribe().then(function(successful) {
          console.log('descadastrar: ', successful);
          if (!successful) {

            console.error('Não deu pra cancelar o registro');
          }

          window.PushDemo.ui.setPushSwitchDisabled(false);
          window.PushDemo.ui.showGCMPushOptions(false);
        }).catch(function(e) {
          console.log('descadastrar: ', e);
          window.PushDemo.ui.setPushSwitchDisabled(false);
          window.PushDemo.ui.showGCMPushOptions(true);

          window.PushDemo.ui.setPushChecked(true);
        });
      }.bind(this)).catch(function(e) {
        console.error('erro', e);
      });
  });
}

function permissionStateChange(permissionState) {
  console.log('permissionStateChange = ', permissionState);
  switch (permissionState.state) {
    case 'denied':
      window.PushDemo.ui.showError('Ooops Notificações bloqueadas');
      window.PushDemo.ui.setPushChecked(false);
      window.PushDemo.ui.setPushSwitchDisabled(true);
      break;
    case 'granted':
      window.PushDemo.ui.setPushSwitchDisabled(false);
      break;
    case 'prompt':
      window.PushDemo.ui.setPushChecked(false);
      window.PushDemo.ui.setPushSwitchDisabled(false);
      break;
  }
}

function setUpPushPermission() {
  navigator.permissions.query({name: 'push', userVisibleOnly: true})
    .then(function(permissionState) {
      permissionStateChange(permissionState);

      permissionState.onchange = function() {
        permissionStateChange(this);
      };

      navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.getSubscription()
          .then(function(subscription) {
            if (!subscription) {
              console.log('sem inscrição');
              return;
            }

            window.PushDemo.ui.setPushChecked(true);

            onPushSubscription(subscription);
          })
          .catch(function(e) {
            console.log('erro getSubscription()', e);
          });
      });
    }).catch(function(err) {
      console.error(err);
      window.PushDemo.ui.showError('Ooops problema ao checar permissão');
    });
}

function setUpNotificationPermission() {
  // If the notification permission is denied, it's a permanent block
  if (Notification.permission === 'denied') {
    window.PushDemo.ui.showError('Ooops notificações bloqueadas');
    return;
  } else if (Notification.permission === 'default') {
    window.PushDemo.ui.setPushChecked(false);
    window.PushDemo.ui.setPushSwitchDisabled(false);
    return;
  }

  // Check if push is supported and what the current state is
  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    // Let's see if we have a subscription already
    serviceWorkerRegistration.pushManager.getSubscription()
      .then(function(subscription) {
        if (!subscription) {
          window.PushDemo.ui.setPushChecked(false);
          window.PushDemo.ui.setPushSwitchDisabled(false);
          return;
        }

        window.PushDemo.ui.setPushChecked(true);

        onPushSubscription(subscription);
      })
      .catch(function(e) {
        console.log('erro getSubscription()', e);
      });
  });
}

function initialiseState() {
  if (!('PushManager' in window)) {
      window.PushDemo.ui.showError('Ooops Push não suportado');
      return;
  }

  if ('permissions' in navigator) {
    setUpPushPermission();
    return;
  } else {
    setUpNotificationPermission();
  }
}

window.addEventListener('UIReady', function() {
  var enablePushSwitch = document.querySelector('.js-enable-push');
  enablePushSwitch.addEventListener('change', function(e) {
    if (e.target.checked) {
      subscribeDevice();
    } else {
      unsubscribeDevice();
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js', {
      scope: './'
    })
    .then(initialiseState);
  } else {
      window.PushDemo.ui.showError('Ooops Service Workers não suportados');
      window.PushDemo.ui.showOnlyError();
  }
});
