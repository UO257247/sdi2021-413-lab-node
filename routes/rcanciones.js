module.exports = function(app) {
    app.get("/canciones", function(req, res) {
        res.send("ver canciones");
    });
};