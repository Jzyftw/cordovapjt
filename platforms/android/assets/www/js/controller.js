var controller = {};

controller.session = {
    photo:""
}
////////////////////////////////////////////////////////////////////////////////
// Controleurs : 1 contrôleur par page, qui porte le nom de la page 
////////////////////////////////////////////////////////////////////////////////

controller.init = function () { // Méthode init appelée au lancement de l'app.
  // Ouverture de la BD. et création si besoin des tables
  model.init(
    function () { // successCB : Si BD prête, on va à la page d'accueil
      // On duplique Header et Footer sur chaque page (sauf la première !)
      $('div[data-role="page"]').each(function (i) {
        if (i)
          $(this).html($('#Header').html() + $(this).html() + $('#Footer').html());
      });
      // On afficher la page d'accueil
      $.mobile.changePage("#accueil");
    },
    function () { // errorCB : Si problème, on quitte l'application
      plugins.toast.showLongCenter("Application Indisponible");
      controller.exit();
    });
};

controller.exit = function () { // appelée quand on quitte l'application
  model.exit();
  navigator.app.exitApp();
};
////////////////////////////////////////////////////////////////////////////////
// Contrôleur de la vue accueil
////////////////////////////////////////////////////////////////////////////////
$(document).on("swipeleft", "#accueil", function () {
  $.mobile.changePage("#addNote");
});
$(document).on("swiperight", "#accueil", function () {
  $.mobile.changePage("#listNote");
});
////////////////////////////////////////////////////////////////////////////////
// Contrôleur de la vue addNote
////////////////////////////////////////////////////////////////////////////////
controller.addNote = {
  save: function () {
    // "validation" du formulaire
    var titre = $("#addNoteTitre").val();
    var texte = $("#addNoteTexte").val();
    var photo = $("#cameraImage").attr("src");
    var latitude = $("#locationLatitude").val();
    var longitude = $("#locationLongitude").val();

    if (titre === "") {
      plugins.toast.showShortCenter("Entrez un Titre SVP");
      return;
    }
    if (texte === "") {
      plugins.toast.showShortCenter("Entrez un Texte svp");
      return;
    }
    // Interaction avec le modèle
    var newNote = new model.Note(0, titre, texte, photo, latitude, longitude); // on crée une entité
    model.NoteDAO.insert(newNote, // puis on essaye de la sauver en BD
      function () { // successCB
        plugins.toast.showShortCenter('Note ' + newNote.id + ' Enregistrée');
        $("#addNoteTitre").val("");
        $("#addNoteTexte").val("");
        $("#cameraImage").attr("src","");
        $.mobile.changePage("#listNote");
      },
      function (error) { // errorCB
        plugins.toast.showShortCenter("Erreur : note non enregistrée");
      }
    );
  }
};
$(document).on("swipeleft", "#addNote", function () {
  $.mobile.changePage("#listNote");
});
$(document).on("swiperight", "#addNote", function () {
  $.mobile.changePage("#accueil");
});
////////////////////////////////////////////////////////////////////////////////
// Contrôleur de la vue listNote
////////////////////////////////////////////////////////////////////////////////
controller.listNote = {
  // Définit le contenu de la listView
  updateView: function () {
    model.NoteDAO.findAll(
      function (lesNotes) { // successCB
        $("#listNoteContenu").empty();
        for (var i = 0; i < lesNotes.length; i++) {
          var liElement = $("<li></li>").data("noteId", lesNotes[i].id);
          var aElement = $("<a></a>")
            .data("noteId", lesNotes[i].id)
            .text(lesNotes[i].id + ". " + lesNotes[i].titre);
          // un click sur une note permet d'en afficher le détail
          liElement.on("click", function () {
            controller.listNote.goToDetailNote($(this));
          });
          // un swipe sur une note permet de la supprimer
          liElement.on("taphold", function () {
            controller.listNote.removeNote($(this));
          });
          $("#listNoteContenu").append(liElement.append(aElement));
        }
        $("#listNoteContenu").listview("refresh");
      },
      function () { // errorCB
        plugins.toast.showShortCenter("Notes Inacessibles");
        $.mobile.changePage("#accueil");
      });
  },
  // Définit le contenu de la vue detailNote en fonction de la note cliquée
  goToDetailNote: function (listViewElement) {
    var noteId = listViewElement.data("noteId"); // on récupère l'id de la note
    $("#detailNote").data("noteId", noteId);      // et on le stocke sur noteDetail
    $.mobile.changePage("#detailNote");          // avant d'aller sur cette page
  },
  // Supprime la note balayée et met à jour la listView
  removeNote: function (listViewElement) {
    var noteId = listViewElement.data("noteId");
    model.NoteDAO.removeById(noteId,
      function () { // successCB
        plugins.toast.showShortCenter("Note " + noteId + " supprimée");
        listViewElement.remove();
      },
      function () { // errorCB
        plugins.toast.showShortCenter("Note " + noteId + " non supprimée");
      }
    );
  }
};
// Pour initialiser la listView quand on arrive sur la vue
$(document).on("pagebeforeshow", "#listNote", function () {
  controller.listNote.updateView();
});
$(document).on("swipeleft", "#listNote", function () {
  $.mobile.changePage("#accueil");
});
$(document).on("swiperight", "#listNote", function () {
  $.mobile.changePage("#addNote");
});

////////////////////////////////////////////////////////////////////////////////
// Contrôleur de la vue listNote
////////////////////////////////////////////////////////////////////////////////
controller.detailNote = {
  updateView: function () {
    var noteId = $("#detailNote").data("noteId"); // on récupère l'id de la note sur la page
    model.NoteDAO.findById(noteId, // on instancie l'entité Note correspondant
      function (uneNote) { // successCB
        $("#oneNoteId").html(uneNote.id);         // et si succès, on met à jour la page
        $("#oneNoteTitre").html(uneNote.titre);
        $("#oneNoteTexte").html(uneNote.texte);
      },
      function () { // errorCB
        plugins.toast.showShortCenter("Note non disponible");
        $.mobile.changePage("#listNote");
      }
    );
  },

  removeNote: function () {
    var noteId = $("#detailNote").data("noteId");
    model.NoteDAO.removeById(noteId,
      function () { // successCB
        plugins.toast.showShortCenter("Note " + noteId + " supprimée");
        $.mobile.changePage("#listNote");
      },
      function () { // errorCB
        plugins.toast.showShortCenter("Note " + noteId + " non supprimée");
        $.mobile.changePage("#listNote");
      }
    );
  }
};
// Pour initialiser la page quand on l'affiche
$(document).on("pagebeforeshow", "#detailNote", function () {
  controller.detailNote.updateView();
});
$(document).on("swipe", "#detailNote", function () {
  $.mobile.changePage("#listNote");
});

////////////////////////////////////////////////////////////////////////////////
// Contrôleur de la vue contact
////////////////////////////////////////////////////////////////////////////////
controller.contactController = {
    pickContact: function () {
        // on réinitialise les champs nom et numero
        $("#contactDisplayName").val("");
        $("#contactPhoneNumber").val("");
        // on appelle la méthode du modèle permettant de récupérer un contact
        // en lui passant en paramètre successCB et errorCB
        model.pickContact(
            // successCB : on met à jour dans la vue les champs nom et numero avec le 1er numéro du contact récupéré
            function (unContact) {
                $("#contactDisplayName").val(unContact.displayName);
                $("#contactPhoneNumber").val(unContact.phoneNumbers[0]);
            },
            // erreurCB : on affiche la page erreur avec un message approprié
            function () {
                plugins.toast.showShortCenter("Pas de contact récupéré");
            }
        );
    }
};

////////////////////////////////////////////////////////////////////////////////
// Contrôleur de la vue maps                                                  //
////////////////////////////////////////////////////////////////////////////////

controller.locationController = {
    pickLocation: function () {
        // on réinitialise les champs latitude et longitude
        $("#locationLatitude").val("");
        $("#locationLongitude").val("");
        // on appelle la méthode du modèle pour récupérer la position
// en lui passant en paramètre successCB et errorCB
        model.pickLocation(
            // successCB : on met à jour latitude et longitude dans la vue
            function (location) {
                $("#locationLatitude").val(location.latitude);
                $("#locationLongitude").val(location.longitude);
            },
// erreurCB : on affiche un message approprié
            function () {
                plugins.toast.showShortCenter(
                    "Impossible de récupérer la position");
            }
        );
        return false;
    },
    showLocation: function () {
        var latitude = $("#locationLatitude").val();
        var longitude = $("#locationLongitude").val();
        var location = new model.Location(latitude, longitude);
        location.showInBrowser(); // Ouvre un navigateur sur google maps
        return false;
    }
};

////////////////////////////////////////////////////////////////////////////
// Contrôleur caméra
////////////////////////////////////////////////////////////////////////////

controller.cameraController = {
    takePicture: function () {
        // on appelle la méthode du modèle permettant de prendre une photo
        // en lui passant en paramètre successCB et errorCB
        window.model.NoteDAO.takePic(
            // successCB : on met à jour dans la vue le champ cameraImage
            function (picture) {
                //On l'affiche
                $("#cameraImage").attr("src","data:image/jpeg;base64," + picture);
            },
            // erreurCB : on affiche un message approprié
            function () {
                plugins.toast.showShortCenter(
                    "Impossible de prendre une photo");
            }
        );
    }
};

// Pour réinitialiser le champ cameraImage à l'affichage de la page camera
$(document).on("pagebeforeshow", "#camera",
    function () {
        $("#cameraImage").attr("src","");
    }
);