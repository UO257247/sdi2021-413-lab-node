module.exports = function (app, gestorBD) {
    app.get("/api/cancion", function (req, res) {
        gestorBD.obtenerCanciones({}, function (canciones) {
            if (canciones == null) {
                res.status(500);
                res.json({error: "se ha producido un error"})
            } else {
                res.status(200);
                res.send(JSON.stringify(canciones));
            }
        });
    })

    app.get("/api/cancion/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)}
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.status(500);
                res.json({error: "se ha producido un error"})
            } else {
                res.status(200);
                res.send(JSON.stringify(canciones[0]));
            }
        });
    })

    app.delete("/api/cancion/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)}
        let cancion_id = gestorBD.mongo.ObjectID(req.params.id);
        let usuario = res.usuario;
        userAthorOfSong(usuario, cancion_id, function (isAuthor) {
            if (isAuthor) {
                gestorBD.eliminarCancion(criterio, function (canciones) {
                    if (canciones == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else {
                        res.status(200);
                        res.send(JSON.stringify(canciones));
                    }
                });
            } else {
                res.status(400);
                res.json({
                    error: "el usuario debe ser el autor de la canción"
                })
            }
        });
    })

    app.post("/api/cancion", function (req, res) {
        let cancion = {
            nombre: req.body.nombre,
            genero: req.body.genero,
            precio: req.body.precio,
        }
        validarCancion(cancion, function (error) {
            if (error != null && error.length > 0) {
                res.status(400);
                res.json({
                    error: error
                })
            } else {
                gestorBD.insertarCancion(cancion, function (id) {
                    if (id == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else {
                        res.status(201);
                        res.json({
                            mensaje: "canción insertada",
                            _id: id
                        });
                    }
                });
            }
        });
    });

    app.put("/api/cancion/:id", function(req, res) {

        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};

        let cancion = {}; // Solo los atributos a modificar
        //validar datos

        if (req.body.nombre != null )
            cancion.nombre = req.body.nombre;
        if (req.body.genero != null)
            cancion.genero = req.body.genero;
        if (req.body.precio != null )
            cancion.precio = req.body.precio;
        let cancion_id = gestorBD.mongo.ObjectID(req.params.id);
        let usuario = res.usuario;
        var errors = new Array();
        userAthorOfSong(usuario, cancion_id, function (isAuthor) {
            if (isAuthor) {
                validarCancion(cancion,function(error) {
                    if (error != null && error.length > 0) {
                        res.status(500);
                        res.json({
                            error: error
                        })
                    }

                    gestorBD.modificarCancion(criterio, cancion, function (result) {
                        if (result == null) {
                            res.status(500);
                            res.json({
                                error: "se ha producido un error"
                            })
                        } else {
                            res.status(200);
                            res.json({
                                mensaje: "canción modificada",
                                _id: req.params.id
                            })
                        }
                    });
                });
            } else {
                res.status(401);
                res.json({
                    error: "el usuario debe ser el autor de la canción"
                });
            }
        });

    });
    app.post("/api/autenticar/", function(req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');

        let criterio = {
            email : req.body.email,
            password : seguro
        }

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if ( usuarios == null || usuarios.length == 0){
                res.status(401); // unauthorized
                res.json({
                    autenticado: false
                })
            }else {
                let token = app.get('jwt').sign(
                    {usuario: criterio.email , tiempo: Date.now()/1000},
                    "secreto");
                res.status(200);
                res.json({
                    autenticado : true,
                    token : token

                })
            }
        });
    });

    function userAthorOfSong(usuario, cancionId, callback) {
        let criterio_cancion_autor = {
            $and: [
                {"_id": cancionId},
                {"autor": usuario}
            ]
        };
        gestorBD.obtenerCanciones(criterio_cancion_autor, function (canciones) {
            if (canciones == null || canciones.length <= 0) {
                callback(false);
            } else {
                callback(true);
            }
        });
    }

    function validarCancion(cancion, funcionCallback) {
        let errors = new Array();
        if (cancion.nombre === null || typeof cancion.nombre === 'undefined' || cancion.nombre === "") errors.push("El nombre de la canción no puede  estar vacio")
        if (cancion.genero === null || typeof cancion.genero === 'undefined' || cancion.genero === "") errors.push("El género de la canción no puede  estar vacio")
        if (cancion.precio === null || typeof cancion.precio === 'undefined' || cancion.precio < 0 || cancion.precio === "") errors.push("El precio de la canción no puede ser negativo")
        if (errors.length <= 0) funcionCallback(null)
        else
            funcionCallback(errors)
    }

}
