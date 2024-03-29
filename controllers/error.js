/**
    Hanldes GET request to 404 page
*/
exports.get404 = ((req, res, next) => {
    res.status(404).render('404', 
        {
            pageTitle: "404 Page",
            path: '/404',
    });
});

/**
    Hanldes GET request to 500 page
*/
exports.get500 = ((req, res, next) => {
    res.status(500).render('500', 
        {
            pageTitle: "Internal Server Error",
            path: '/500',
    });
});