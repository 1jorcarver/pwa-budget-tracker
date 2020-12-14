// db connection
let db;

// establish a connection
const request = indexedDB.open('budget_tracker', 1);

// event emits if version changes
request.onupgradeneeded = function (event) {
    const db = event.target.result;

    db.createObjectStore('new_record', { autoIncrement: true });
};

// successful request
request.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) uploadRecord();
};

// request error
request.onerror = function (event) {
    console.log(event.target.errorCode);
};

// save the record
function saveRecord(record) {
    const transaction = db.transaction(['new_record'], 'readwrite');
    const recordObjectStore = transaction.objectStore('new_record');

    recordObjectStore.add(record);

    console.log(record + 'is saving');
};

// upload the record
function uploadRecord() {
    const transaction = db.transaction(['new_record'], 'readwrite');
    const recordObjectStore = transaction.objectStore('new_record');

    const getAll = recordObjectStore.getAll();

    getAll.onsuccess = function () {
        // one item saved
        if (getAll.result.length === 1) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) throw new Error(serverResponse);

                const transaction = db.transaction(['new_record'], 'readwrite');
                const recordObjectStore = transaction.objectStore('new_record');
                recordObjectStore.clear();

                alert("Transactions have been saved and progress made.");
            })
            .catch(err => console.log(err));
        }
        // upon saving more than one item
        else if (getAll.result.length > 1) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if(serverResponse.message) throw new Error(serverResponse);

                    const transaction = db.transaction(['new_record'], 'readwrite');
                    const recordObjectStore = transaction.objectStore('new_record');
                    recordObjectStore.clear();

                    alert("Transactions have been saved and progress made.");
                })
                .catch(err => console.log(err));
        }
    }
};

window.addEventListener('online', uploadRecord);