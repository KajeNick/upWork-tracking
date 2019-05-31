$(document).ready(function () {
    let countUnread = 0;

    chrome.storage.local.get(['UWTrackingWorks'], function (result) {
        if (result.UWTrackingWorks.length === 0) {
            $('.content_head').html('You see all job posts');
        } else {
            result.UWTrackingWorks.sort((a, b) => (new Date(a.publishedOn) < new Date(b.publishedOn)) ? 1 : ((new Date(b.publishedOn) < new Date(a.publishedOn)) ? -1 : 0));

            countUnread = result.UWTrackingWorks.length;
            $('.content_head').html('You have (<b class="countUnread">' + countUnread + '</b> unread works)');
            let htmlBody = '';
            for (let i = 0; i < result.UWTrackingWorks.length; i++) {
                if (result.UWTrackingWorks[i].isShowed) {
                    continue;
                }

                htmlBody += '<div class="work_block unread" data-recno="' + result.UWTrackingWorks[i].recno + '" >' +
                    '           <div class="title">' +
                    '               <a href="https://www.upwork.com/jobs/_' + result.UWTrackingWorks[i].ciphertext + '" target="_blank">'
                    + result.UWTrackingWorks[i].title + '</a></div>' +
                    '           <div class="time">' + result.UWTrackingWorks[i].publishedOn + '</div>' +
                    '           <div class="description">' + result.UWTrackingWorks[i].description + '</div>' +
                    '        </div>';
            }
            $('.content_body').html(htmlBody);
        }
    });

    $('body').on('mouseenter', '.unread', function () {
        UWTracking.MarkAsRead($(this).data('recno'));
        $('.countUnread').html(countUnread - 1);
        $(this).removeClass('unread');
    });
});