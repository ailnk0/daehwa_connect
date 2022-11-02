class Firebase {
    static app = null;
    static db = null;
    static auth = null;
    static storage = null;
    static currentUser = {
        auth_data: null,
        custom_data: null,
    };
}

function errorMessage(error) {
    alert(error);
}

function initIndex() {
    if ($("#post-carousel").length <= 0) {
        return;
    }

    Firebase.db.collection('write-post').get().then((result) => {
        result.forEach((doc) => {

            // let storageRef = Firebase.storage.ref();
            // storageRef.child(doc.data().imagePath).getDownloadURL().then((url) => {
            //     console.log(url);
            // });

            let template = `
                <div class="post">
                    <div class="post-header">
                        <div class="profile"></div>
                        <span class="profile-name">${doc.data().name}</span>
                        <button class="btn btn-light" style="float:right;" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="edit.html?id=${doc.id}">편집</a></li>
                            <li><a class="dropdown-item" href="delete.html?id=${doc.id}">삭제</a></li>
                        </ul>
                    </div>
                    <div class="post-body" style="background-image: url('${doc.data().image}');"></div>
                    <div class="post-content">
                        <div class="post-content-header">
                            <p class="like">좋아요 43개</p>
                            <p class="date">${doc.data().date.toDate().toLocaleString()}</p>
                        </div>
                        <div id="post-comment-${doc.id}" class="post-comment mb-3">
                        </div>
                        <div class="input-group mb-3">
                            <input id="input-comment-${doc.id}" type="text" class="form-control form-control-sm" placeholder="댓글 달기..." aria-label="댓글 달기..." aria-describedby="button-comment">
                            <button class="btn btn-sm btn-outline-secondary" type="button" id="button-comment-${doc.id}">게시</button>
                        </div>
                    </div>
                </div>
                `;
            $('#post-carousel').append(template);

            Firebase.db.collection('write-post').doc(doc.id).collection('comments').orderBy('date').onSnapshot((result) => {
                $(`#post-comment-${doc.id}`).html('');
                result.forEach((comment) => {
                    let commentTemplate = `
                        <div class="mb-1">
                            <strong>${comment.data().userName}</strong> ${comment.data().content}
                        </div>
                    `;
                    $(`#post-comment-${doc.id}`).append(commentTemplate);
                })
            });

            $(`#button-comment-${doc.id}`).click(function() {
                if (Firebase.currentUser.auth_data == null) {
                    window.location.href = 'sign_in.html';
                    return;
                }

                let comment = $(`#input-comment-${doc.id}`).val();
                if (!comment) {
                    return;
                }

                let commentData = {
                    content : comment,
                    date : new Date(),
                    uid : Firebase.currentUser.auth_data.uid,
                    userName : Firebase.currentUser.custom_data.name,
                }
                
                Firebase.db.collection('write-post').doc(doc.id).collection('comments').add(commentData);
                $(`#input-comment-${doc.id}`).val('');
            });

        })
    });
}

function initComment() {
    
}

function initEdit() {
    if ($("#edit-title").length <= 0) {
        return;
    }

    let queryString = new URLSearchParams(window.location.search);
    let postId = queryString.get('id');

    Firebase.db.collection('write-post').doc(postId).get().then((result) => {
        detail = result.data();

        $('#edit-title').val(result.data().title);
        $('#edit-content').html(result.data().content);
    });
}

function initDelete() {
    if ($("#delete-post").length <= 0) {
        return;
    }

    let queryString = new URLSearchParams(window.location.search);
    let postId = queryString.get('id');

    Firebase.db.collection('write-post').doc(postId).get()
        .then((result) => {
            if (result.data().imagePath) {
                const storageRef = Firebase.storage.ref();
                var desertRef = storageRef.child(result.data().imagePath);
                desertRef.delete()
                    .then(() => {
                    })
                    .catch((error) => {
                        assert(error);
                    });
            }

            Firebase.db.collection("write-post").doc(postId).delete()
                .then(() => {
                    alert("게시물이 삭제되었습니다!");
                    window.location.href = 'index.html';
                }).catch((error) => {
                    alert("게시물을 삭제할 수 없습니다!\n" + error);
                    window.location.href = 'index.html';
                });
        });

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

    $('#write-post').click(function () {
        writePost();
    });

    $('#edit-post').click(function () {
        editPost();
    });

    Firebase.auth.onAuthStateChanged(function (user) {
        if (user) {
            Firebase.db
                .collection("user")
                .doc(user.uid)
                .get()
                .then((result) => {
                    Firebase.currentUser.auth_data = user;
                    Firebase.currentUser.custom_data = result.data();

                    $('#userName').html(result.data().name);
                    $('#userEmail').html(user.email);

                    $('#usermenu-signedout').addClass('d-none');
                    $('#usermenu-signedin').removeClass('d-none');
                });
        } else {
            Firebase.currentUser.auth_data = null;
            Firebase.currentUser.custom_data = null;

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
            alert(error);
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
            alert(error);
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

function editPost() {
    if (Firebase.currentUser.auth_data == null) {
        return;
    }

    let queryString = new URLSearchParams(window.location.search);
    let postId = queryString.get('id');

    Firebase.db.collection('write-post').doc(postId).update({
        title: $('#edit-title').val(),
        content: $('#edit-content').val(),
        date: new Date(),
    }).then((result) => {
        window.location.href = "index.html";
    }).catch((err) => {
        alert(err);
    });
}

function writePost() {
    if (Firebase.currentUser.auth_data == null) {
        return;
    }

    let file = $('#write-image').prop('files')[0];
    let fileId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    const storageRef = Firebase.storage.ref();
    const uploadTask = storageRef.child('write-image/' + fileId).put(file);

    uploadTask.on('state_changed',
        // 변화시 동작하는 함수 
        null,
        // 에러시 동작하는 함수
        (error) => {
            alert(error);
        },
        // 성공시 동작하는 함수
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then((url) => {
                Firebase.db.collection('write-post').add({
                    title: $('#write-title').val(),
                    content: $('#write-content').val(),
                    image: url,
                    imagePath: 'write-image/' + fileId,
                    date: new Date(),
                    uid: Firebase.currentUser.auth_data.uid,
                    name: Firebase.currentUser.custom_data.name,
                }).then((result) => {
                    window.location.href = "index.html";
                }).catch((err) => {
                    alert(err);
                });
            });
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

        initIndex();
        initEdit();
        initDelete();

    } catch (e) {
        console.error(e);
    }
});
