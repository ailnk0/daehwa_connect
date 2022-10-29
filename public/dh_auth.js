class Firebase {
    static app;
    static db;
    static auth;
    static storage;
}

function errorMessage(error) {
    alert(error);
}

function registerEvent() {
    $('#signup-submit').click(function () {
        signUp();
    });

    $('#signin-submit').click(function () {
        signIn();
    });

    $('#usermenuitem-signout').click(function () {
        Firebase.auth.signOut();
        window.location.href = "index.html";
    });

    Firebase.auth.onAuthStateChanged(function (user) {
        if (user) {
            Firebase.db
                .collection("user")
                .doc(user.uid)
                .get()
                .then((result) => {
                    $('#userName').html(result.data().name);
                    $('#userEmail').html(user.email);

                    $('#usermenu-signedout').addClass('d-none');
                    $('#usermenu-signedin').removeClass('d-none');
                });
        } else {
            $('#userName').html('');
            $('#userEmail').html('');

            $('#usermenu-signedout').removeClass('d-none');
            $('#usermenu-signedin').addClass('d-none');
        }
    });
}

function signIn() {
    let email = $('#signin-email').val();
    let password = $('#signin-password').val();

    Firebase.auth.signInWithEmailAndPassword(email, password)
        .then(function (response) {
            window.location.href = "index.html";
        })
        .catch(function (error) {
            errorMessage(error);
        });
}

function signUp() {
    let email = $('#signup-email').val();
    let password = $('#signup-password').val();

    Firebase.auth.createUserWithEmailAndPassword(email, password)
        .then(function (response) {
            updateUserData(response.user);
        })
        .catch(function (error) {
            errorMessage(error);
        });

}

function updateUserData(user) {
    let name = $('#signup-name').val();
    let birthDay = $('#signup-birthDay').val();
    let phoneNumber = $('#signup-phoneNumber').val();

    Firebase.db
        .collection("user")
        .doc(user.uid)
        .set({
            'name': name,
            'birthDay': birthDay,
            'phoneNumber': phoneNumber,
        })
        .then(function (response) {
            window.location.href = "index.html";
        });
}

document.addEventListener('DOMContentLoaded', function () {
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
    // // The Firebase SDK is initialized and available here!
    //
    // firebase.auth().onAuthStateChanged(user => { });
    // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
    // firebase.firestore().doc('/foo/bar').get().then(() => { });
    // firebase.functions().httpsCallable('yourFunction')().then(() => { });
    // firebase.messaging().requestPermission().then(() => { });
    // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
    // firebase.analytics(); // call to activate
    // firebase.analytics().logEvent('tutorial_completed');
    // firebase.performance(); // call to activate
    //
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

    try {
        Firebase.app = firebase.app();
        Firebase.db = firebase.firestore();
        Firebase.auth = firebase.auth();
        Firebase.storage = firebase.storage();

        registerEvent();

    } catch (e) {
        console.error(e);
    }
});
