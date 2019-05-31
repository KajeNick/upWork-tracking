let UWTracking = function () {
};

/**
 * User authorized state
 * @type {boolean}
 */
UWTracking.IsLogin = false;

/**
 * Set is login state
 * @param state
 * @constructor
 */
UWTracking.SetIsLogin = function (state = false) {
    chrome.storage.local.set({'UWIsLogin': state});
    UWTracking.IsLogin = state;
};

/**
 * Check if user authorized to UpWork
 * @returns {boolean|*}
 * @constructor
 */
UWTracking.CheckAuth = function () {
    $.ajax({
        url: "https://www.upwork.com/ab/account-security/login",
        type: "get",
        async: false,
        beforeSend: function (request) {
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        },
        success: function (data) {
            let $answer = $(data);
            UWTracking.SetIsLogin($answer.find('form[name="login"]').length === 0);
        },
        error: function () {
            UWTracking.SetIsLogin(false);
        }
    });

    return UWTracking.IsLogin;
};

/**
 * Last work data
 * @type {null}
 */
UWTracking.LastWork = null;

/**
 * Grab
 * @type {number}
 */
UWTracking.DelaySeconds = 60;

/**
 * Get list of works form UpWork and save in storage
 */
UWTracking.GetWorks = function () {
    let params = '';

    if (UWTracking.LastWork != null) {
        params = {
            'paging': '0;20',
            'since_id': UWTracking.LastWork.recno,
            'job_ts': UWTracking.LastWork.jobTs
        };
    }
    $.ajax({
        url: 'https://www.upwork.com/ab/find-work/api/feeds/search',
        type: 'GET',
        dataType: 'json',
        data: params,
        beforeSend: function (request) {
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        },
        success: function (data) {
            if (data.results.length === 0) {
                return;
            }

            UWTracking.LastWork = data.results[0];

            chrome.storage.local.get(['UWTrackingWorks'], function (result) {
                let works = [];
                if (result.hasOwnProperty('UWTrackingWorks') && result.UWTrackingWorks.length !== 0) {
                    for (let i = 0; i < result.UWTrackingWorks.length; i++) {
                        if (!UWTracking.CheckDuplicate(works, result.UWTrackingWorks[i].recno)) {
                            works.push(result.UWTrackingWorks[i]);
                        }
                    }
                }

                for (let i = 0; i < data.results.length; i++) {
                    Object.defineProperties(data.results[i], {
                        'isNotified': {
                            value: false,
                            writable: true
                        }
                    });
                    works.push(data.results[i]);
                }

                UWTracking.ShowWorksCount(works.length);

                chrome.storage.local.set({'UWTrackingWorks': works});
            });
        },
        error: function () {
            UWTracking.SetIsLogin(false);
        }
    });

    setTimeout(UWTracking.GetWorks, 60000);
};

/**
 * Class initialzation
 * @constructor
 */
UWTracking.Init = function () {
    this.InitListeners();
};

/**
 * Add listeners
 * @constructor
 */
UWTracking.InitListeners = function () {
    this.ChangeListener();
};

/**
 * Add listener to change storage
 * @constructor
 */
UWTracking.ChangeListener = function () {
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (var key in changes) {
            var storageChange = changes[key];
            console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);
        }
    });
};

/**
 * Find diplicates in storage works data
 * @param arr
 * @param recno
 * @returns {boolean}
 * @constructor
 */
UWTracking.CheckDuplicate = function (arr, recno) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].recno === recno) {
            return true;
        }
    }

    return false;
};

/**
 * Display count of works in extension icon
 * @param count
 * @constructor
 */
UWTracking.ShowWorksCount = function (count) {
    if (count > 20) {
        count = '20+';
    }
    chrome.browserAction.setBadgeBackgroundColor({color: '#CB3F69'});
    chrome.browserAction.setBadgeText({text: '' + count});
};

UWTracking.MarkAsRead = function (recno) {
    chrome.storage.local.get(['UWTrackingWorks'], function (result) {
        if (!result.hasOwnProperty('UWTrackingWorks')
            || result.UWTrackingWorks.length === 0) {
            return;
        }

        let unreadWorks = result.UWTrackingWorks;

        recno = parseInt(recno);
        for (let i = 0; i < unreadWorks.length; i++) {
            console.log(unreadWorks[i].recno + ' === ' + recno);
            if (unreadWorks[i].recno === recno) {
                if (unreadWorks.length === 1) {
                    unreadWorks = [];
                } else {
                    unreadWorks.splice(i, 1);
                }
                UWTracking.ShowWorksCount(unreadWorks.length);
                chrome.storage.local.set({'UWTrackingWorks': unreadWorks});
                return;
            }
        }
    });
};