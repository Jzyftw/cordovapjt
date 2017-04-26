var model = {
    db: null // objet pour manipuler la BD sqllite
};

// Initialisation du modèle : ouverture de la BD
// successCtrlCB : méthode du contrôleur appelée si BD prête
// errorCtrlCB   : méthode du contrôleur appelée si problème lors de l'ouverture
model.init = function (successCtrlCB, errorCtrlCB) {
    this.db = sqlitePlugin.openDatabase({name: "notes.db", location: 'default'},
            function () {
                var succCB = successCtrlCB; // pbm de visibilité
                var errCB = errorCtrlCB;    // pbm de visibilité
                model.db.executeSql("CREATE TABLE IF NOT EXISTS note (id integer primary key, titre text, texte text, photo text, latitude float, longitude float)", [],
                        function () {
                            succCB.call(this);
                        },
                        function () {
                            errCB.call(this);
                        });
            },
            function () {
                errorCtrlCB.call(this);
            });
};

// Fin d'utilisation du modèle : on ferme la BD
model.exit = function () {
  this.db.close();
};

// Définition de l'Entité Note
model.Note = function (id, titre, texte, photo, latitude, longitude) {
    this.id = id;
    this.titre = titre;
    this.texte = texte;
    this.photo = photo;
    this.latitude = latitude;
    this.longitude = longitude;
};

model.NoteDAO = {
// Requête pour insérer une nouvelle note en BD
// successCtrlCB : méthode du contrôleur appelée en cas de succès 
// errorCtrlCB   : méthode du contrôleur appelée en cas d'échec 
    insert: function (uneNote, successCtrlCB, errorCtrlCB) {
        var laNote = uneNote;
        model.db.executeSql(
                "INSERT INTO note (titre, texte, photo, latitude, longitude) VALUES (?,?,?,?,?)", [uneNote.titre, uneNote.texte ,uneNote.photo, uneNote.latitude, uneNote.longitude],
                function (res) { // succes
                    laNote.id = res.insertId; // on met à jour l'id de la note après insertion en BD
                    successCtrlCB.call(this);     // et on appelle la successCtrlCB en provenance du contrôleur
                },
                function (err) { // erreur
                    errorCtrlCB.call(this); // on appelle l'errorCtrlCB en provenance du contrôleur
                }
        );
    },
// Requête pour récupérer toutes les notes
// successCtrlCB recevra en paramètre le tableau de toutes les entités Note 
    findAll: function (successCtrlCB, errorCtrlCB) {
        model.db.executeSql("SELECT * FROM note", [],
                function (res) { // succes
                    var lesNotes = [];
                    for (var i = 0; i < res.rows.length; i++) {
                        var uneNote = new model.Note(res.rows.item(i).id, res.rows.item(i).titre, res.rows.item(i).texte);
                        lesNotes.push(uneNote);
                    }
                    successCtrlCB.call(this, lesNotes);
                },
                function (err) { // erreur
                    errorCtrlCB.call(this);
                }
        );
    },
// Requête pour récupérer une note selon son id
// successCtrlCB recevra en paramètre l'entité Note 
    findById: function (id, successCtrlCB, errorCtrlCB) {
        model.db.executeSql("SELECT * FROM note WHERE id = ?", [id],
                function (res) { // success
                    var uneNote = new model.Note(res.rows.item(0).id, res.rows.item(0).titre, res.rows.item(0).texte, res.rows.item(0).photo, res.rows.item(0).latitude, res.rows.item(0).longitude);
                    successCtrlCB.call(this, uneNote);
                },
                function (err) { // erreur
                    errorCtrlCB.call(this);
                }
        );
    },
// Requête pour supprimer une note selon son id
    removeById: function (id, successCtrlCB, errorCtrlCB) {
        model.db.executeSql("DELETE FROM note WHERE id = ?", [id],
                function (res) { //succes 
                    successCtrlCB.call(this);
                },
                function (err) { // erreur
                    errorCtrlCB.call(this);
                }
        );
    },

    //Prendre la photo
    takePic: function (successCB, errorCB) {
        navigator.camera.getPicture(

        function cameraSuccess(picture) {
            //On l'enregistre dans la note
            this.photo = "data:image/jpeg;base64,"+picture;
            successCB.call(this, picture);
        },

        function cameraError(){
            console.log("Photo non enregistrée");
            errorCB.call(this);
        },

        {quality: 50, destinationType: navigator.camera.DestinationType.DATA_URL});
    }
};

////////////////////////////////////////////////////////////////////////////////
// Classe Contact
////////////////////////////////////////////////////////////////////////////////
model.Contact = function (displayName, phoneNumbers) {
    this.displayName = displayName;
    this.phoneNumbers = phoneNumbers;
};
////////////////////////////////////////////////////////////////////////////////
// Méthode pour acquérir un contact du téléphone
////////////////////////////////////////////////////////////////////////////////
model.pickContact = function (successCB, errorCB) {
    navigator.contacts.pickContact(
        function (contactTel) {
            // On récupère tous les numéros de tél du contactTel
            var phoneNumbers = [];
            for (var i = 0; i < contactTel.phoneNumbers.length; i++) {
                phoneNumbers.push(contactTel.phoneNumbers[i].value);
            }
// On crée une entité Contact
            var unContact = new window.model.Contact(contactTel.displayName, phoneNumbers);
            // On appelle successCB en lui transmettant l'entité Contact
            successCB.call(this, unContact);
        },
        function (err) {
            console.log("Erreur Capture Contact : " + err.message);
            errorCB.call(this);
        }
    );
};

////////////////////////////////////////////////////////////////////////////////
// Classe Location pour réprésenter une position
////////////////////////////////////////////////////////////////////////////////
model.Location = function (latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
    // Méthode pour visualiser une position dans un navigateur web
    this.showInBrowser = function () {
        var url = "https://maps.google.com/?q=" + this.latitude + "°," + this.longitude + "°";
        window.cordova.InAppBrowser.open(url, '_blank', 'location=yes');
    };
};
////////////////////////////////////////////////////////////////////////////////
// Méthode pour acquérir la position courante du téléphone
////////////////////////////////////////////////////////////////////////////////
model.pickLocation = function (successCB, errorCB) {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            // On instantie une entité Location
            var location = new window.model.Location(position.coords.latitude, position.coords.longitude);
            // On appelle successCB en lui transmettant l'entité Location
            successCB.call(this, location);
        },
        function (err) {
            console.log("Erreur Capture GPS : " + err.message);
            errorCB.call(this);
        },
// Options : position en cache de max 3s, 10s maxi pour répondre, position GPS exacte demandée
        {maximumAge: 3000, timeout: 10000, enableHighAccuracy: true}
    );
};



