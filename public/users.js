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

document.onreadystatechange = function () {
  var sendPushViaXHRButton = document.querySelector('#send-notif-button');
  sendPushViaXHRButton.addEventListener('click', function(e) {
	  var title = $('#title').val();
	  var message = $('#msg').val();
	  var destination = $('#destination').val();
	  Promise.resolve(getIdb().get('systextil-push','name')).then(function(name){
		  var data = {};
		  data.endpoint ='https://android.googleapis.com/gcm/send';
		  data.destination = destination;
		  data.payload = {title: title, message: message};
		  data.name = name;

		  $.post("/send_push",{
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(data) {
				console.log('success');
			}
		  });
	  });
  });
};
