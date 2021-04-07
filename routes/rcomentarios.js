module.exports = function(app, swig, gestorBD){
    app.post("/comentarios/:cancion_id", function(req, res){

        let id = req.params_id;
        let criterio = {
            "_id": gestorBD.mongo.ObjectID(id)
        };

        let cancion = null;

        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null){
                res.send(respuesta);
            }else {
                cancion = canciones[0];
            }
        });

        if (req.session.usuario != null) {
            comentario = {
                autor: req.session.usuario,
                texto: req.body.texto,
                cancion_id: gestorBD.mongo.ObjectID(id)
            }

            //Insertar un comentario
            gestorBD.insertarComentario(comentario, function (id) {
                if (id == null) {
                    res.send("Error al insertar comentario ");
                }
            });
        }else{
            res.send("El usuario no ha iniciado sesión");
        }
    });

}