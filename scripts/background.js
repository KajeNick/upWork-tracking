function init() {
    if (UWTracking.CheckAuth()) {
        UWTracking.Init();
        UWTracking.GetWorks();
    } else {
        setTimeout(init, 120000);
    }
}

init();